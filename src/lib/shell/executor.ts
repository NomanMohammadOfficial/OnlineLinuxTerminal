import type { VFSNode, ShellEnv, ExecutionResult } from '../vfs/types';
import { addInstalledPackage, getInstalledPackages } from '../vfs/store';
import { COMMANDS_DATA } from '../../data/commandsData';

export function resolvePath(currentPwd: string, targetPath: string, env: ShellEnv): string {
  if (!targetPath || targetPath === '.') return currentPwd;
  if (targetPath === '~' || targetPath.startsWith('~/')) {
    targetPath = targetPath.replace(/^~/, env.HOME || '/home/user');
  }

  let rawParts: string[];
  if (targetPath.startsWith('/')) {
    rawParts = targetPath.split('/');
  } else {
    rawParts = (currentPwd === '/' ? '' : currentPwd).split('/').concat(targetPath.split('/'));
  }

  const stack: string[] = [];
  for (const part of rawParts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
    } else {
      stack.push(part);
    }
  }

  return '/' + stack.join('/');
}

export function getNodeAtPath(root: VFSNode, path: string): VFSNode | null {
  if (path === '/') return root;
  const parts = path.split('/').filter(Boolean);
  let current: VFSNode = root;

  for (const part of parts) {
    if (current.type !== 'directory' || !current.children) return null;
    const found = current.children.find((child) => child.name === part);
    if (!found) return null;
    current = found;
  }

  return current;
}

export function getParentNodeAndName(root: VFSNode, path: string): { parent: VFSNode | null; name: string } {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { parent: null, name: '' };
  const name = parts.pop()!;
  const parentPath = '/' + parts.join('/');
  const parent = getNodeAtPath(root, parentPath);
  return { parent, name };
}

export function ensureDirectoriesRecursive(root: VFSNode, dirPath: string, env: ShellEnv): VFSNode | null {
  const parts = dirPath.split('/').filter(Boolean);
  let current: VFSNode = root;

  for (const part of parts) {
    current.children = current.children || [];
    let child = current.children.find((c) => c.name === part);
    if (!child) {
      child = {
        id: 'dir-' + Math.random().toString(36).substr(2, 9),
        name: part,
        type: 'directory',
        permissions: 'rwxr-xr-x',
        owner: env.USER || 'user',
        group: env.USER || 'user',
        size: 4096,
        updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        children: [],
      };
      current.children.push(child);
    } else if (child.type !== 'directory') {
      return null;
    }
    current = child;
  }
  return current;
}

export async function executeCommand(
  cmdLine: string,
  rootVFS: VFSNode,
  env: ShellEnv,
  history: string[],
  stdin: string = ''
): Promise<{ result: ExecutionResult; updatedVFS: VFSNode }> {
  const trimmed = cmdLine.trim();
  if (!trimmed) {
    return { result: { output: '', exitCode: 0 }, updatedVFS: rootVFS };
  }

  // Handle Command Chaining (&&)
  if (trimmed.includes(' && ')) {
    const parts = trimmed.split(' && ');
    let currentVFS = rootVFS;
    const outputs: string[] = [];
    let finalExitCode = 0;

    for (const subCmd of parts) {
      const res = await executeCommand(subCmd.trim(), currentVFS, env, history, stdin);
      currentVFS = res.updatedVFS;
      if (res.result.output) outputs.push(res.result.output);
      finalExitCode = res.result.exitCode;
      if (res.result.exitCode !== 0) break;
    }
    return { result: { output: outputs.join('\n'), exitCode: finalExitCode }, updatedVFS: currentVFS };
  }

  // Handle Command Chaining (;)
  if (trimmed.includes(';') && !trimmed.includes('sed ') && !trimmed.includes('awk ')) {
    const parts = trimmed.split(';');
    let currentVFS = rootVFS;
    const outputs: string[] = [];
    let finalExitCode = 0;

    for (const subCmd of parts) {
      if (!subCmd.trim()) continue;
      const res = await executeCommand(subCmd.trim(), currentVFS, env, history, stdin);
      currentVFS = res.updatedVFS;
      if (res.result.output) outputs.push(res.result.output);
      finalExitCode = res.result.exitCode;
    }
    return { result: { output: outputs.join('\n'), exitCode: finalExitCode }, updatedVFS: currentVFS };
  }

  // Handle Pipe (|) chaining
  if (trimmed.includes(' | ')) {
    const pipeParts = trimmed.split(' | ');
    let currentInputText = stdin;
    let currentVFS = rootVFS;
    let finalOutput = '';
    let finalExitCode = 0;

    for (let i = 0; i < pipeParts.length; i++) {
      const subCmd = pipeParts[i].trim();
      const res = await executeCommand(subCmd, currentVFS, env, history, currentInputText);
      currentVFS = res.updatedVFS;
      currentInputText = res.result.output;
      finalExitCode = res.result.exitCode;
      if (i === pipeParts.length - 1) {
        finalOutput = currentInputText;
      }
    }
    return { result: { output: finalOutput, exitCode: finalExitCode }, updatedVFS: currentVFS };
  }

  // Handle Redirection (> and >>)
  let targetRedirection: { file: string; append: boolean } | null = null;
  let cleanCmdLine = trimmed;

  if (trimmed.includes('>>')) {
    const parts = trimmed.split('>>');
    cleanCmdLine = parts[0].trim();
    targetRedirection = { file: parts[1].trim(), append: true };
  } else if (trimmed.includes('>')) {
    const parts = trimmed.split('>');
    cleanCmdLine = parts[0].trim();
    targetRedirection = { file: parts[1].trim(), append: false };
  }

  // Tokenizer
  const tokens: string[] = [];
  const regex = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g;
  let match;
  while ((match = regex.exec(cleanCmdLine)) !== null) {
    let token = match[0];
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      token = token.slice(1, -1);
    }
    tokens.push(token);
  }

  if (tokens.length === 0) {
    return { result: { output: '', exitCode: 0 }, updatedVFS: rootVFS };
  }

  const command = tokens[0];
  const args = tokens.slice(1);
  let output = '';
  let exitCode = 0;
  let newPwd = env.PWD;
  let openEditor: { filename: string; content: string } | undefined;
  let installedPkg: string | undefined;

  const updatedVFS: VFSNode = JSON.parse(JSON.stringify(rootVFS));

  switch (command) {
    case 'pwd': {
      output = env.PWD;
      break;
    }

    case 'cd': {
      const target = args[0] || '~';
      const resolved = resolvePath(env.PWD, target, env);
      const targetNode = getNodeAtPath(updatedVFS, resolved);
      if (!targetNode) {
        output = `cd: ${target}: No such file or directory`;
        exitCode = 1;
      } else if (targetNode.type !== 'directory') {
        output = `cd: ${target}: Not a directory`;
        exitCode = 1;
      } else {
        newPwd = resolved;
      }
      break;
    }

    case 'ls': {
      const showAll = args.some((a) => a.includes('a'));
      const showLong = args.some((a) => a.includes('l'));
      const targetArg = args.find((a) => !a.startsWith('-')) || '.';
      const resolved = resolvePath(env.PWD, targetArg, env);
      const targetNode = getNodeAtPath(updatedVFS, resolved);

      if (!targetNode) {
        output = `ls: cannot access '${targetArg}': No such file or directory`;
        exitCode = 2;
      } else if (targetNode.type === 'file') {
        output = showLong ? `${targetNode.permissions}  1 ${targetNode.owner} ${targetNode.group} ${formatSize(targetNode.size)} ${targetNode.updatedAt} ${targetNode.name}` : targetNode.name;
      } else {
        const children = (targetNode.children || []).filter((child) => showAll || !child.name.startsWith('.'));
        if (showLong) {
          const totalBlocks = Math.ceil(children.reduce((acc, c) => acc + (c.size || 0), 0) / 1024);
          const lines = [`total ${totalBlocks}`];
          for (const c of children) {
            const isDir = c.type === 'directory';
            const perms = isDir ? 'd' + c.permissions : '-' + c.permissions;
            const links = isDir ? '2' : '1';
            const sizeStr = formatSize(c.size).padStart(6, ' ');
            const dateStr = c.updatedAt.slice(5, 16);
            lines.push(`${perms} ${links} ${c.owner} ${c.group} ${sizeStr} ${dateStr} ${c.name}`);
          }
          output = lines.join('\n');
        } else {
          output = children.map((c) => c.name).join('  ');
        }
      }
      break;
    }

    case 'cat': {
      if (args.length === 0) {
        output = stdin || 'cat: missing operand';
        if (!stdin) exitCode = 1;
      } else {
        const showLineNums = args.includes('-n');
        const fileArgs = args.filter((a) => !a.startsWith('-'));
        const fileOutputs: string[] = [];
        for (const arg of fileArgs) {
          const resolved = resolvePath(env.PWD, arg, env);
          const node = getNodeAtPath(updatedVFS, resolved);
          if (!node) {
            fileOutputs.push(`cat: ${arg}: No such file or directory`);
            exitCode = 1;
          } else if (node.type === 'directory') {
            fileOutputs.push(`cat: ${arg}: Is a directory`);
            exitCode = 1;
          } else {
            let content = node.content || '';
            if (showLineNums) {
              content = content
                .split('\n')
                .map((l, idx) => `     ${idx + 1}  ${l}`)
                .join('\n');
            }
            fileOutputs.push(content);
          }
        }
        output = fileOutputs.join('\n');
      }
      break;
    }

    case 'echo': {
      output = args.join(' ');
      break;
    }

    case 'mkdir': {
      const recursive = args.includes('-p');
      const targets = args.filter((a) => !a.startsWith('-'));
      if (targets.length === 0) {
        output = 'mkdir: missing operand';
        exitCode = 1;
      } else {
        for (const arg of targets) {
          const resolved = resolvePath(env.PWD, arg, env);
          if (recursive) {
            const res = ensureDirectoriesRecursive(updatedVFS, resolved, env);
            if (!res) {
              output = `mkdir: cannot create directory '${arg}': Not a directory in path`;
              exitCode = 1;
            }
          } else {
            const { parent, name } = getParentNodeAndName(updatedVFS, resolved);
            if (!parent || parent.type !== 'directory') {
              output = `mkdir: cannot create directory '${arg}': No such file or directory`;
              exitCode = 1;
            } else if (parent.children?.some((c) => c.name === name)) {
              output = `mkdir: cannot create directory '${arg}': File exists`;
              exitCode = 1;
            } else {
              parent.children = parent.children || [];
              parent.children.push({
                id: 'dir-' + Math.random().toString(36).substr(2, 9),
                name,
                type: 'directory',
                permissions: 'rwxr-xr-x',
                owner: env.USER || 'user',
                group: env.USER || 'user',
                size: 4096,
                updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
                children: [],
              });
            }
          }
        }
      }
      break;
    }

    case 'touch': {
      if (args.length === 0) {
        output = 'touch: missing file operand';
        exitCode = 1;
      } else {
        for (const arg of args.filter((a) => !a.startsWith('-'))) {
          const resolved = resolvePath(env.PWD, arg, env);
          const { parent, name } = getParentNodeAndName(updatedVFS, resolved);
          if (!parent || parent.type !== 'directory') {
            output = `touch: cannot touch '${arg}': No such file or directory`;
            exitCode = 1;
          } else {
            parent.children = parent.children || [];
            const existing = parent.children.find((c) => c.name === name);
            const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
            if (existing) {
              existing.updatedAt = now;
            } else {
              parent.children.push({
                id: 'file-' + Math.random().toString(36).substr(2, 9),
                name,
                type: 'file',
                permissions: 'rw-r--r--',
                owner: env.USER || 'user',
                group: env.USER || 'user',
                size: 0,
                updatedAt: now,
                content: '',
              });
            }
          }
        }
      }
      break;
    }

    case 'cp': {
      const recursive = args.some((a) => a.includes('r') || a.includes('R'));
      const nonFlags = args.filter((a) => !a.startsWith('-'));
      if (nonFlags.length < 2) {
        output = 'cp: missing file operand. Usage: cp [-r] <source> <dest>';
        exitCode = 1;
      } else {
        const srcPath = resolvePath(env.PWD, nonFlags[0], env);
        const destPath = resolvePath(env.PWD, nonFlags[1], env);
        const srcNode = getNodeAtPath(updatedVFS, srcPath);
        if (!srcNode) {
          output = `cp: cannot stat '${nonFlags[0]}': No such file or directory`;
          exitCode = 1;
        } else if (srcNode.type === 'directory' && !recursive) {
          output = `cp: -r not specified; omitting directory '${nonFlags[0]}'`;
          exitCode = 1;
        } else {
          const destNode = getNodeAtPath(updatedVFS, destPath);
          let targetParent: VFSNode | null = null;
          let targetName = '';

          if (destNode && destNode.type === 'directory') {
            targetParent = destNode;
            targetName = srcNode.name;
          } else {
            const p = getParentNodeAndName(updatedVFS, destPath);
            targetParent = p.parent;
            targetName = p.name;
          }

          if (!targetParent || targetParent.type !== 'directory') {
            output = `cp: cannot create '${nonFlags[1]}': No such file or directory`;
            exitCode = 1;
          } else {
            function deepCloneNode(node: VFSNode, newName: string): VFSNode {
              const clone: VFSNode = {
                id: (node.type === 'directory' ? 'dir-' : 'file-') + Math.random().toString(36).substr(2, 9),
                name: newName,
                type: node.type,
                permissions: node.permissions,
                owner: env.USER || 'user',
                group: env.USER || 'user',
                size: node.size,
                updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
                content: node.content,
              };
              if (node.children) {
                clone.children = node.children.map((c) => deepCloneNode(c, c.name));
              }
              return clone;
            }

            targetParent.children = targetParent.children || [];
            const existingIdx = targetParent.children.findIndex((c) => c.name === targetName);
            const cloned = deepCloneNode(srcNode, targetName);
            if (existingIdx !== -1) {
              targetParent.children[existingIdx] = cloned;
            } else {
              targetParent.children.push(cloned);
            }
          }
        }
      }
      break;
    }

    case 'mv': {
      const nonFlags = args.filter((a) => !a.startsWith('-'));
      if (nonFlags.length < 2) {
        output = 'mv: missing file operand. Usage: mv <source> <dest>';
        exitCode = 1;
      } else {
        const srcPath = resolvePath(env.PWD, nonFlags[0], env);
        const destPath = resolvePath(env.PWD, nonFlags[1], env);
        const srcParentInfo = getParentNodeAndName(updatedVFS, srcPath);
        const srcNode = getNodeAtPath(updatedVFS, srcPath);

        if (!srcNode || !srcParentInfo.parent || !srcParentInfo.parent.children) {
          output = `mv: cannot stat '${nonFlags[0]}': No such file or directory`;
          exitCode = 1;
        } else {
          const destNode = getNodeAtPath(updatedVFS, destPath);
          let targetParent: VFSNode | null = null;
          let targetName = '';

          if (destNode && destNode.type === 'directory') {
            targetParent = destNode;
            targetName = srcNode.name;
          } else {
            const p = getParentNodeAndName(updatedVFS, destPath);
            targetParent = p.parent;
            targetName = p.name;
          }

          if (!targetParent || targetParent.type !== 'directory') {
            output = `mv: cannot move to '${nonFlags[1]}': No such file or directory`;
            exitCode = 1;
          } else {
            const srcIdx = srcParentInfo.parent.children.findIndex((c) => c.name === srcParentInfo.name);
            if (srcIdx !== -1) {
              srcParentInfo.parent.children.splice(srcIdx, 1);
            }
            srcNode.name = targetName;
            targetParent.children = targetParent.children || [];
            const existingIdx = targetParent.children.findIndex((c) => c.name === targetName);
            if (existingIdx !== -1) {
              targetParent.children[existingIdx] = srcNode;
            } else {
              targetParent.children.push(srcNode);
            }
          }
        }
      }
      break;
    }

    case 'rm': {
      const recursive = args.some((a) => a.includes('r') || a.includes('R'));
      const force = args.some((a) => a.includes('f'));
      const targets = args.filter((a) => !a.startsWith('-'));

      if (targets.length === 0 && !force) {
        output = 'rm: missing operand';
        exitCode = 1;
      } else {
        for (const target of targets) {
          const resolved = resolvePath(env.PWD, target, env);
          const { parent, name } = getParentNodeAndName(updatedVFS, resolved);
          if (!parent || !parent.children) {
            if (!force) {
              output = `rm: cannot remove '${target}': No such file or directory`;
              exitCode = 1;
            }
            continue;
          }
          const index = parent.children.findIndex((c) => c.name === name);
          if (index === -1) {
            if (!force) {
              output = `rm: cannot remove '${target}': No such file or directory`;
              exitCode = 1;
            }
          } else {
            const nodeToRemove = parent.children[index];
            if (nodeToRemove.type === 'directory' && !recursive) {
              output = `rm: cannot remove '${target}': Is a directory`;
              exitCode = 1;
            } else {
              parent.children.splice(index, 1);
            }
          }
        }
      }
      break;
    }

    case 'grep': {
      const ignoreCase = args.includes('-i');
      const lineNumbers = args.includes('-n');
      const invertMatch = args.includes('-v');
      const countOnly = args.includes('-c');

      const nonFlags = args.filter((a) => !a.startsWith('-'));
      if (nonFlags.length < 1) {
        output = 'grep: missing pattern';
        exitCode = 2;
      } else {
        const patternStr = nonFlags[0];
        const fileArgs = nonFlags.slice(1);
        const linesToSearch: { line: string; source: string; lineNo: number }[] = [];

        if (fileArgs.length === 0) {
          if (stdin) {
            const stdinLines = stdin.split('\n');
            stdinLines.forEach((l, idx) => {
              linesToSearch.push({ line: l, source: '', lineNo: idx + 1 });
            });
          } else {
            output = 'grep: missing target file';
            exitCode = 2;
          }
        } else {
          for (const fileArg of fileArgs) {
            const resolved = resolvePath(env.PWD, fileArg, env);
            const node = getNodeAtPath(updatedVFS, resolved);
            if (!node) {
              output += `grep: ${fileArg}: No such file or directory\n`;
              exitCode = 2;
            } else if (node.type === 'directory') {
              output += `grep: ${fileArg}: Is a directory\n`;
              exitCode = 2;
            } else if (node.content) {
              const fileLines = node.content.split('\n');
              fileLines.forEach((l, idx) => {
                linesToSearch.push({ line: l, source: fileArgs.length > 1 ? `${fileArg}:` : '', lineNo: idx + 1 });
              });
            }
          }
        }

        if (linesToSearch.length > 0) {
          const matched: string[] = [];
          const flags = ignoreCase ? 'i' : '';
          const regex = new RegExp(patternStr, flags);

          for (const item of linesToSearch) {
            const isMatch = regex.test(item.line);
            if ((isMatch && !invertMatch) || (!isMatch && invertMatch)) {
              const prefix = item.source + (lineNumbers ? `${item.lineNo}:` : '');
              matched.push(`${prefix}${item.line}`);
            }
          }
          output = countOnly ? `${matched.length}` : matched.join('\n');
        }
      }
      break;
    }

    case 'sed': {
      const expr = args.find((a) => a.startsWith('s/') || a.startsWith("'s/") || a.startsWith('"s/'));
      const fileArg = args.find((a) => a !== expr && !a.startsWith('-'));

      if (!expr) {
        output = 'sed: usage: sed \'s/find/replace/g\' filename';
        exitCode = 1;
      } else {
        const cleanExpr = expr.replace(/^['"]/, '').replace(/['"]$/, '');
        const parts = cleanExpr.split('/');
        if (parts.length < 3) {
          output = 'sed: invalid expression format';
          exitCode = 1;
        } else {
          const findStr = parts[1];
          const replaceStr = parts[2];
          const global = parts[3] === 'g';
          let inputContent = stdin;

          if (fileArg) {
            const resolved = resolvePath(env.PWD, fileArg, env);
            const node = getNodeAtPath(updatedVFS, resolved);
            if (!node || node.type !== 'file') {
              output = `sed: can't read ${fileArg}: No such file or directory`;
              exitCode = 2;
              break;
            }
            inputContent = node.content || '';
          }

          const regex = new RegExp(findStr, global ? 'g' : '');
          output = inputContent.replace(regex, replaceStr);
        }
      }
      break;
    }

    case 'awk': {
      const printExpr = args.find((a) => a.includes('print'));
      const fileArg = args.find((a) => a !== printExpr && !a.startsWith('-'));
      let inputContent = stdin;

      if (fileArg) {
        const resolved = resolvePath(env.PWD, fileArg, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node || node.type !== 'file') {
          output = `awk: cannot open file ${fileArg}`;
          exitCode = 2;
          break;
        }
        inputContent = node.content || '';
      }

      if (!inputContent && !printExpr) {
        output = 'awk: usage: awk \'{print $1}\' filename';
        exitCode = 1;
      } else {
        const lines = inputContent.split('\n');
        let colIdx = 1;
        const matchCol = printExpr ? printExpr.match(/\$([0-9]+)/) : null;
        if (matchCol) {
          colIdx = parseInt(matchCol[1], 10);
        }
        output = lines
          .map((line) => {
            if (colIdx === 0) return line;
            const cols = line.trim().split(/\s+|,/);
            return cols[colIdx - 1] || '';
          })
          .join('\n');
      }
      break;
    }

    case 'tar': {
      const flagsArg = args[0] || '';
      const isCreate = flagsArg.includes('c');
      const isExtract = flagsArg.includes('x');
      const isList = flagsArg.includes('t');
      const isVerbose = flagsArg.includes('v');
      const nonFlags = args.slice(1);

      if (isCreate && nonFlags.length >= 2) {
        const archiveName = nonFlags[0];
        const sources = nonFlags.slice(1);
        const archiveResolved = resolvePath(env.PWD, archiveName, env);
        const { parent, name } = getParentNodeAndName(updatedVFS, archiveResolved);
        if (parent && parent.type === 'directory') {
          parent.children = parent.children || [];
          const existing = parent.children.find((c) => c.name === name);
          const tarContent = `[TAR ARCHIVE CONTAINING: ${sources.join(', ')}]`;
          if (existing) {
            existing.content = tarContent;
            existing.size = 1024 * sources.length;
          } else {
            parent.children.push({
              id: 'file-' + Math.random().toString(36).substr(2, 9),
              name,
              type: 'file',
              permissions: 'rw-r--r--',
              owner: env.USER || 'user',
              group: env.USER || 'user',
              size: 1024 * sources.length,
              updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              content: tarContent,
            });
          }
        }
        output = sources.map((s) => `a ${s}`).join('\n');
        if (!isVerbose) output = `Archive ${archiveName} created successfully.`;
      } else if (isExtract && nonFlags.length >= 1) {
        const archiveName = nonFlags[0];
        output = `x welcome.txt\nx projects/\nx projects/demo.sh\nArchive ${archiveName} extracted successfully.`;
      } else if (isList && nonFlags.length >= 1) {
        const archiveName = nonFlags[0];
        output = `-rw-r--r-- user/user 1024 2026-08-28 10:00 welcome.txt\ndrwxr-xr-x user/user 4096 2026-08-28 10:00 projects/`;
      } else {
        output = 'tar: usage: tar -czvf archive.tar.gz file OR tar -xzvf archive.tar.gz';
        exitCode = 1;
      }
      break;
    }

    case 'gzip': {
      const decompress = args.includes('-d');
      const target = args.find((a) => !a.startsWith('-'));
      if (!target) {
        output = 'gzip: missing operand';
        exitCode = 1;
      } else {
        const resolved = resolvePath(env.PWD, target, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node) {
          output = `gzip: ${target}: No such file or directory`;
          exitCode = 1;
        } else if (decompress || node.name.endsWith('.gz')) {
          node.name = node.name.replace(/\.gz$/, '');
          output = '';
        } else {
          node.name = `${node.name}.gz`;
          output = '';
        }
      }
      break;
    }

    case 'gunzip': {
      const target = args.find((a) => !a.startsWith('-'));
      if (!target) {
        output = 'gunzip: missing operand. Usage: gunzip <file.gz>';
        exitCode = 1;
      } else {
        let resolved = resolvePath(env.PWD, target, env);
        let node = getNodeAtPath(updatedVFS, resolved);
        if (!node && !target.endsWith('.gz')) {
          resolved = resolvePath(env.PWD, `${target}.gz`, env);
          node = getNodeAtPath(updatedVFS, resolved);
        }
        if (!node) {
          output = `gunzip: ${target}: No such file or directory`;
          exitCode = 1;
        } else {
          node.name = node.name.replace(/\.gz$/, '');
          output = '';
        }
      }
      break;
    }

    case 'sort': {
      const reverse = args.includes('-r');
      const numeric = args.includes('-n');
      const unique = args.includes('-u');
      const fileArg = args.find((a) => !a.startsWith('-'));
      let lines: string[] = [];

      if (fileArg) {
        const resolved = resolvePath(env.PWD, fileArg, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node || node.type !== 'file') {
          output = `sort: cannot read: ${fileArg}: No such file or directory`;
          exitCode = 2;
          break;
        }
        lines = (node.content || '').split('\n').filter(Boolean);
      } else if (stdin) {
        lines = stdin.split('\n').filter(Boolean);
      }

      lines.sort((a, b) => {
        if (numeric) {
          const numA = parseFloat(a) || 0;
          const numB = parseFloat(b) || 0;
          return numA - numB;
        }
        return a.localeCompare(b);
      });

      if (reverse) lines.reverse();
      if (unique) lines = Array.from(new Set(lines));
      output = lines.join('\n');
      break;
    }

    case 'uniq': {
      const count = args.includes('-c');
      const fileArg = args.find((a) => !a.startsWith('-'));
      let lines: string[] = [];

      if (fileArg) {
        const resolved = resolvePath(env.PWD, fileArg, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node || node.type !== 'file') {
          output = `uniq: ${fileArg}: No such file or directory`;
          exitCode = 1;
          break;
        }
        lines = (node.content || '').split('\n');
      } else if (stdin) {
        lines = stdin.split('\n');
      }

      const result: string[] = [];
      let prev = '';
      let countNum = 0;

      for (let i = 0; i < lines.length; i++) {
        const cur = lines[i];
        if (cur === prev) {
          countNum++;
        } else {
          if (prev !== '') {
            result.push(count ? `   ${countNum} ${prev}` : prev);
          }
          prev = cur;
          countNum = 1;
        }
      }
      if (prev !== '') {
        result.push(count ? `   ${countNum} ${prev}` : prev);
      }
      output = result.join('\n');
      break;
    }

    case 'cut': {
      let delim = '\t';
      let field = 1;
      for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('-d')) {
          delim = args[i].replace('-d', '') || args[i + 1] || '\t';
        } else if (args[i].startsWith('-f')) {
          field = parseInt(args[i].replace('-f', '') || args[i + 1] || '1', 10);
        }
      }
      const fileArg = args.find((a) => !a.startsWith('-') && a !== delim && a !== String(field));
      let lines: string[] = [];

      if (fileArg) {
        const resolved = resolvePath(env.PWD, fileArg, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node || node.type !== 'file') {
          output = `cut: ${fileArg}: No such file or directory`;
          exitCode = 1;
          break;
        }
        lines = (node.content || '').split('\n');
      } else if (stdin) {
        lines = stdin.split('\n');
      }

      output = lines.map((l) => l.split(delim)[field - 1] || '').join('\n');
      break;
    }

    case 'tr': {
      if (args.length < 2) {
        output = 'tr: missing operand. Usage: tr SET1 SET2';
        exitCode = 1;
      } else {
        const from = args[0].replace(/['"]/g, '');
        const to = args[1].replace(/['"]/g, '');
        const targetText = stdin || output;
        if (from === 'a-z' && to === 'A-Z') {
          output = targetText.toUpperCase();
        } else if (from === 'A-Z' && to === 'a-z') {
          output = targetText.toLowerCase();
        } else {
          output = targetText.split(from).join(to);
        }
      }
      break;
    }

    case 'diff': {
      if (args.length < 2) {
        output = 'diff: missing operand. Usage: diff <file1> <file2>';
        exitCode = 2;
      } else {
        const f1 = resolvePath(env.PWD, args[0], env);
        const f2 = resolvePath(env.PWD, args[1], env);
        const n1 = getNodeAtPath(updatedVFS, f1);
        const n2 = getNodeAtPath(updatedVFS, f2);
        if (!n1 || !n2) {
          output = `diff: ${!n1 ? args[0] : args[1]}: No such file or directory`;
          exitCode = 2;
        } else if (n1.content === n2.content) {
          output = '';
        } else {
          output = `1c1\n< ${n1.content?.slice(0, 50) || ''}\n---\n> ${n2.content?.slice(0, 50) || ''}`;
          exitCode = 1;
        }
      }
      break;
    }

    case 'uptime': {
      output = ' 13:30:00 up 4 days,  3:12,  1 user,  load average: 0.08, 0.04, 0.01';
      break;
    }

    case 'hostname': {
      output = 'linux-terminal-box';
      break;
    }

    case 'id': {
      output = 'uid=1000(user) gid=1000(user) groups=1000(user),27(sudo),100(users)';
      break;
    }

    case 'groups': {
      output = 'user sudo users';
      break;
    }

    case 'top':
    case 'htop': {
      output = `top - 18:58:10 up 4 days,  3:12,  1 user,  load average: 0.12, 0.08, 0.05
Tasks:  42 total,   1 running,  41 sleeping,   0 stopped,   0 zombie
%Cpu(s):  1.5 us,  0.5 sy,  0.0 ni, 97.8 id,  0.2 wa,  0.0 hi,  0.0 si
MiB Mem :   8192.0 total,   4120.5 free,   2140.2 used,   1931.3 buff/cache

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1000 user      20   0  124500  28400  12100 R   1.2   0.3   0:01.45 bash
    1 root      20   0  168400   9800   6500 S   0.0   0.1   0:04.12 systemd
  142 root      20   0   14200   3200   2800 S   0.0   0.0   0:00.85 sshd
  882 user      20   0  512000  84000  42000 S   0.0   1.0   0:12.30 node (AST Sandbox)`;
      break;
    }

    case 'python':
    case 'python3': {
      output = `Python 3.12.2 (main, Feb 20 2026, 12:00:00) [GCC 13.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> print("Hello from Online Linux Terminal!")
Hello from Online Linux Terminal!
>>> `;
      break;
    }

    case 'bash':
    case 'sh': {
      const scriptArg = args.find((a) => !a.startsWith('-'));
      if (!scriptArg) {
        output = 'bash: interactive subshell ready.';
      } else {
        const resolved = resolvePath(env.PWD, scriptArg, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node || node.type !== 'file') {
          output = `bash: ${scriptArg}: No such file or directory`;
          exitCode = 127;
        } else {
          const lines = (node.content || '').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
          const outputs: string[] = [];
          for (const line of lines) {
            const subRes = await executeCommand(line, updatedVFS, env, history, stdin);
            if (subRes.result.output) outputs.push(subRes.result.output);
          }
          output = outputs.join('\n');
        }
      }
      break;
    }

    case 'chown': {
      if (args.length < 2) {
        output = 'chown: missing operand';
        exitCode = 1;
      } else {
        const newOwner = args[0];
        const target = args[1];
        const resolved = resolvePath(env.PWD, target, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node) {
          output = `chown: cannot access '${target}': No such file or directory`;
          exitCode = 1;
        } else {
          node.owner = newOwner;
          output = '';
        }
      }
      break;
    }

    case 'head':
    case 'tail': {
      let numLines = 10;
      let fileArgs = args;

      if (args[0] === '-n' && args[1]) {
        numLines = parseInt(args[1], 10) || 10;
        fileArgs = args.slice(2);
      } else if (args[0]?.startsWith('-n')) {
        numLines = parseInt(args[0].replace('-n', ''), 10) || 10;
        fileArgs = args.slice(1);
      }

      if (fileArgs.length === 0) {
        if (stdin) {
          const lines = stdin.split('\n');
          output = command === 'head' ? lines.slice(0, numLines).join('\n') : lines.slice(-numLines).join('\n');
        } else {
          output = `${command}: missing file operand`;
          exitCode = 1;
        }
      } else {
        const resolved = resolvePath(env.PWD, fileArgs[0], env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node || node.type !== 'file') {
          output = `${command}: cannot open '${fileArgs[0]}': No such file or directory`;
          exitCode = 1;
        } else {
          const lines = (node.content || '').split('\n');
          output = command === 'head' ? lines.slice(0, numLines).join('\n') : lines.slice(-numLines).join('\n');
        }
      }
      break;
    }

    case 'wc': {
      let content = stdin;
      let file = '';
      if (args.length > 0) {
        file = args.find((a) => !a.startsWith('-')) || '';
        if (file) {
          const resolved = resolvePath(env.PWD, file, env);
          const node = getNodeAtPath(updatedVFS, resolved);
          if (!node || node.type !== 'file') {
            output = `wc: ${file}: No such file or directory`;
            exitCode = 1;
            break;
          }
          content = node.content || '';
        }
      }
      if (!content && !file) {
        output = 'wc: missing file operand';
        exitCode = 1;
      } else {
        const lines = content ? content.split('\n').length : 0;
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const bytes = new TextEncoder().encode(content).length;
        output = ` ${lines}  ${words} ${bytes}${file ? ' ' + file : ''}`;
      }
      break;
    }

    case 'whoami': {
      output = env.USER || 'user';
      break;
    }

    case 'date': {
      output = new Date().toString();
      break;
    }

    case 'uname': {
      if (args.includes('-a')) {
        output = 'Linux linux-terminal-box 6.8.0-online-term #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux';
      } else {
        output = 'Linux';
      }
      break;
    }

    case 'history': {
      output = history.map((h, i) => ` ${(i + 1).toString().padStart(4)}  ${h}`).join('\n');
      break;
    }

    case 'chmod': {
      if (args.length < 2) {
        output = 'chmod: missing operand';
        exitCode = 1;
      } else {
        const mode = args[0];
        const target = args[1];
        const resolved = resolvePath(env.PWD, target, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node) {
          output = `chmod: cannot access '${target}': No such file or directory`;
          exitCode = 1;
        } else {
          node.permissions = mode.length === 3 ? parseOctalPerms(mode) : mode;
          output = '';
        }
      }
      break;
    }

    case 'nano':
    case 'vim':
    case 'vi': {
      const filename = args[0] || 'untitled.txt';
      const resolved = resolvePath(env.PWD, filename, env);
      const node = getNodeAtPath(updatedVFS, resolved);
      let content = '';
      if (node) {
        if (node.type === 'directory') {
          output = `${command}: ${filename}: Is a directory`;
          exitCode = 1;
          break;
        }
        content = node.content || '';
      }
      openEditor = { filename: resolved, content };
      output = `[Opening ${command} interactive editor for ${filename}...]`;
      break;
    }

    case 'apt':
    case 'apt-get': {
      if (args[0] === 'install' && args[1]) {
        const pkg = args[1].toLowerCase();
        await addInstalledPackage(pkg);
        installedPkg = pkg;
        output = `Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following NEW packages will be installed:
  ${pkg}
0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.
Need to get 1,240 kB of archives.
Selecting previously unselected package ${pkg}.
Unpacking ${pkg} (1.0.0-online)...
Setting up ${pkg} (1.0.0-online)...
Processing triggers for man-db...
Package '${pkg}' successfully installed! Try running '${pkg}'.`;
      } else {
        output = `apt 2.4.11 (amd64)
Usage: apt install <package_name> (e.g. apt install cowsay, figlet, sl)`;
      }
      break;
    }

    case 'cowsay': {
      const installed = await getInstalledPackages();
      if (!installed.includes('cowsay')) {
        output = `cowsay: command not found. Install it with: apt install cowsay`;
        exitCode = 127;
      } else {
        const msg = args.join(' ') || 'Moo! Welcome to Online Linux Terminal!';
        output = ` ${'_'.repeat(msg.length + 2)}
< ${msg} >
 ${'-'.repeat(msg.length + 2)}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
      }
      break;
    }

    case 'figlet': {
      const installed = await getInstalledPackages();
      if (!installed.includes('figlet')) {
        output = `figlet: command not found. Install it with: apt install figlet`;
        exitCode = 127;
      } else {
        const msg = (args.join(' ') || 'LINUX').toUpperCase();
        output = `  _  _  _  _  _  _
 | || || || || || |   ${msg}
 |_||_||_||_||_||_|`;
      }
      break;
    }

    case 'curl': {
      if (args.length === 0) {
        output = 'curl: try \'curl --help\' or \'curl --manual\' for more information';
        exitCode = 2;
      } else {
        const url = args.find((a) => a.startsWith('http://') || a.startsWith('https://'));
        if (!url) {
          output = `curl: (6) Could not resolve host: ${args[0]}`;
          exitCode = 6;
        } else {
          try {
            const res = await fetch(url);
            const text = await res.text();
            output = text.slice(0, 1000) + (text.length > 1000 ? '\n...[output truncated]' : '');
          } catch (e) {
            output = `HTTP/1.1 200 OK\nServer: OnlineLinuxTerminal-Mock\nContent-Type: text/plain\n\nFetched response from ${url} (CORS fetch simulated)`;
          }
        }
      }
      break;
    }

    case 'wget': {
      if (args.length === 0) {
        output = 'wget: missing URL\nUsage: wget [OPTION]... [URL]...';
        exitCode = 1;
      } else {
        const url = args.find((a) => a.startsWith('http://') || a.startsWith('https://')) || args[0];
        const outFlagIdx = args.findIndex((a) => a === '-O' || a === '-o');
        let outName = 'index.html';
        if (outFlagIdx !== -1 && args[outFlagIdx + 1]) {
          outName = args[outFlagIdx + 1];
        } else {
          const parts = url.split('/');
          const last = parts[parts.length - 1];
          if (last && !last.includes('?')) outName = last;
        }
        const resolved = resolvePath(env.PWD, outName, env);
        const { parent, name } = getParentNodeAndName(updatedVFS, resolved);
        if (parent && parent.type === 'directory') {
          parent.children = parent.children || [];
          const existing = parent.children.find((c) => c.name === name);
          const downloadContent = `<!DOCTYPE html>\n<html>\n<head><title>Downloaded from ${url}</title></head>\n<body>\n<h1>Resource from ${url}</h1>\n<p>Saved via Online Linux Terminal wget.</p>\n</body>\n</html>`;
          if (existing) {
            existing.content = downloadContent;
          } else {
            parent.children.push({
              id: 'file-' + Math.random().toString(36).substr(2, 9),
              name,
              type: 'file',
              permissions: 'rw-r--r--',
              owner: env.USER || 'user',
              group: env.USER || 'user',
              size: 512,
              updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              content: downloadContent,
            });
          }
        }
        output = `--2026-08-28 12:00:00--  ${url}\nResolving host... 104.21.72.10\nConnecting... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: 512 [text/html]\nSaving to: '${outName}'\n\n${outName}             100%[===================>]     512  --.-KB/s    in 0.001s\n\n2026-08-28 12:00:01 (512 KB/s) - '${outName}' saved [512/512]`;
      }
      break;
    }

    case 'ssh': {
      if (args.length === 0) {
        output = 'usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-B bind_interface] [user@]hostname [command]';
        exitCode = 1;
      } else {
        const target = args.find((a) => !a.startsWith('-')) || 'remote-server';
        output = `Warning: Permanently added '${target}' (ED25519) to the list of known hosts.\nAuthenticated with publickey (id_rsa).\nLinux remote-server 6.8.0-cloud #1 SMP Debian GNU/Linux\nLast login: Fri Aug 28 10:00:00 2026 from 192.168.1.50\n(SSH session simulated in sandbox)`;
      }
      break;
    }

    case 'scp': {
      if (args.length < 2) {
        output = 'usage: scp [-346ABCOpqRrsTv] source ... target';
        exitCode = 1;
      } else {
        const src = args[0];
        const dst = args[1];
        output = `${src}                                          100% 1024KB   4.2MB/s   00:00\nTransferred ${src} to ${dst} via encrypted SSH tunnel.`;
      }
      break;
    }

    case 'rsync': {
      if (args.length < 2) {
        output = 'rsync  version 3.2.7  protocol version 31\nUsage: rsync [OPTION...] SRC... [DEST]';
        exitCode = 1;
      } else {
        const nonFlags = args.filter((a) => !a.startsWith('-'));
        const src = nonFlags[0] || 'src/';
        const dst = nonFlags[1] || 'dst/';
        output = `sending incremental file list\n${src}\n\nsent 1,024 bytes  received 35 bytes  2,118.00 bytes/sec\ntotal size is 4,096  speedup is 3.87`;
      }
      break;
    }

    case 'find': {
      let searchPath = args[0] && !args[0].startsWith('-') ? args[0] : '.';
      const resolved = resolvePath(env.PWD, searchPath, env);
      const targetNode = getNodeAtPath(updatedVFS, resolved);
      if (!targetNode) {
        output = `find: '${searchPath}': No such file or directory`;
        exitCode = 1;
        break;
      }
      const nameFilterIdx = args.findIndex((a) => a === '-name' || a === '-iname');
      let namePattern: string | null = null;
      if (nameFilterIdx !== -1 && args[nameFilterIdx + 1]) {
        namePattern = args[nameFilterIdx + 1].replace(/"/g, '').replace(/'/g, '');
      }

      const typeFilterIdx = args.findIndex((a) => a === '-type');
      let typeFilter: string | null = null;
      if (typeFilterIdx !== -1 && args[typeFilterIdx + 1]) {
        typeFilter = args[typeFilterIdx + 1];
      }

      const results: string[] = [];
      function traverse(node: VFSNode, currentDisplayPath: string) {
        let matches = true;
        if (namePattern) {
          const isWildcard = namePattern.startsWith('*');
          const cleanPattern = namePattern.replace(/^\*/, '').replace(/\*$/, '');
          if (isWildcard && namePattern.endsWith('*')) {
            matches = node.name.toLowerCase().includes(cleanPattern.toLowerCase());
          } else if (isWildcard) {
            matches = node.name.toLowerCase().endsWith(cleanPattern.toLowerCase());
          } else if (namePattern.endsWith('*')) {
            matches = node.name.toLowerCase().startsWith(cleanPattern.toLowerCase());
          } else {
            matches = node.name.toLowerCase() === namePattern.toLowerCase();
          }
        }
        if (typeFilter) {
          if (typeFilter === 'f' && node.type !== 'file') matches = false;
          if (typeFilter === 'd' && node.type !== 'directory') matches = false;
        }

        if (matches) {
          results.push(currentDisplayPath);
        }

        if (node.type === 'directory' && node.children) {
          for (const child of node.children) {
            const childPath = currentDisplayPath === '/' ? `/${child.name}` : `${currentDisplayPath}/${child.name}`;
            traverse(child, childPath);
          }
        }
      }

      traverse(targetNode, resolved === '/' ? '/' : resolved);
      output = results.join('\n');
      break;
    }

    case 'tree': {
      let target = args.find((a) => !a.startsWith('-')) || '.';
      const resolved = resolvePath(env.PWD, target, env);
      const node = getNodeAtPath(updatedVFS, resolved);
      if (!node) {
        output = `tree: ${target}: No such file or directory`;
        exitCode = 1;
        break;
      }
      const lines: string[] = [resolved];
      let dirCount = 0;
      let fileCount = 0;

      function printTree(n: VFSNode, prefix = '') {
        if (n.type !== 'directory' || !n.children) return;
        const children = n.children;
        children.forEach((child, idx) => {
          const isLast = idx === children.length - 1;
          const branch = isLast ? '└── ' : '├── ';
          lines.push(`${prefix}${branch}${child.name}`);
          if (child.type === 'directory') {
            dirCount++;
            printTree(child, prefix + (isLast ? '    ' : '│   '));
          } else {
            fileCount++;
          }
        });
      }

      printTree(node);
      lines.push(`\n${dirCount} directories, ${fileCount} files`);
      output = lines.join('\n');
      break;
    }

    case 'ps': {
      output = `  PID TTY          TIME CMD\n    1 ?        00:00:02 init\n  420 pts/0    00:00:00 bash\n 1337 pts/0    00:00:00 ps`;
      break;
    }

    case 'kill': {
      if (args.length === 0 || args.includes('-l')) {
        output = ` 1) SIGHUP\t 2) SIGINT\t 3) SIGQUIT\t 9) SIGKILL\t15) SIGTERM`;
      } else {
        output = `[kill] Signal sent to process ${args[args.length - 1]}`;
      }
      break;
    }

    case 'df': {
      output = `Filesystem     1K-blocks      Used Available Use% Mounted on\nudev             4006248         0   4006248   0% /dev\ntmpfs             805444      1440    804004   1% /run\n/dev/sda1       51464032  14820128  34013444  31% /\ntmpfs            4027208         0   4027208   0% /dev/shm`;
      break;
    }

    case 'du': {
      let target = args.find((a) => !a.startsWith('-')) || '.';
      const resolved = resolvePath(env.PWD, target, env);
      const node = getNodeAtPath(updatedVFS, resolved);
      if (!node) {
        output = `du: cannot access '${target}': No such file or directory`;
        exitCode = 1;
      } else {
        output = `142M\t${target}`;
      }
      break;
    }

    case 'free': {
      output = `               total        used        free      shared  buff/cache   available\nMem:         8054416     1420512     4210340       45120     2423564     6310240\nSwap:        2097148           0     2097148`;
      break;
    }

    case 'which': {
      if (!args[0]) {
        exitCode = 1;
        break;
      }
      const found = args.map((cmd) => `/usr/bin/${cmd}`);
      output = found.join('\n');
      break;
    }

    case 'sudo': {
      if (args.length === 0) {
        output = `usage: sudo -h | -K | -k | -V\nusage: sudo -v [-ABkNnS] [-g group] [-h host] [-p prompt] [-u user]`;
        break;
      }
      const subCmd = args.join(' ');
      const subRes = await executeCommand(subCmd, updatedVFS, { ...env, USER: 'root' }, history, stdin);
      return subRes;
    }

    case 'ping': {
      const host = args.find((a) => !a.startsWith('-')) || 'onlinelinuxterminal.com';
      output = `PING ${host} (104.21.72.10) 56(84) bytes of data.\n64 bytes from 104.21.72.10: icmp_seq=1 ttl=58 time=12.4 ms\n64 bytes from 104.21.72.10: icmp_seq=2 ttl=58 time=11.8 ms\n64 bytes from 104.21.72.10: icmp_seq=3 ttl=58 time=12.1 ms\n64 bytes from 104.21.72.10: icmp_seq=4 ttl=58 time=12.0 ms\n\n--- ${host} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3004ms\nrtt min/avg/max/mdev = 11.802/12.075/12.412/0.218 ms`;
      break;
    }

    case 'netstat': {
      output = `Active Internet connections (only servers)\nProto Recv-Q Send-Q Local Address           Foreign Address         State\ntcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN\ntcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN\ntcp6       0      0 :::80                   :::*                    LISTEN\ntcp6       0      0 :::22                   :::*                    LISTEN`;
      break;
    }

    case 'systemctl': {
      const action = args[0] || 'status';
      const unit = args[1] || 'nginx';
      if (action === 'status') {
        output = `● ${unit}.service - Web Server Service\n     Loaded: loaded (/lib/systemd/system/${unit}.service; enabled; vendor preset: enabled)\n     Active: active (running) since Sat 2026-08-29 00:00:00 UTC; 4h 20min ago\n   Main PID: 1234 (${unit})\n      Tasks: 4 (limit: 4652)\n     Memory: 28.4M\n        CPU: 1.230s\n     CGroup: /system.slice/${unit}.service`;
      } else {
        output = `[systemctl] Executed ${action} for unit ${unit}`;
      }
      break;
    }

    case 'crontab': {
      if (args.includes('-l')) {
        output = `# Edit this file to introduce tasks to be run by cron.\n# m h  dom mon dow   command\n0 2 * * * /home/user/projects/demo.sh > /dev/null 2>&1\n*/15 * * * * /usr/bin/curl -s https://onlinelinuxterminal.com > /dev/null`;
      } else {
        output = `crontab: use "crontab -l" to list or "crontab -e" to edit.`;
      }
      break;
    }

    case 'man': {
      if (args.length === 0) {
        output = 'What manual page do you want? (e.g. man grep, man find, man chmod, man tar)';
        exitCode = 1;
      } else {
        const target = args[0].toLowerCase();
        const cmdEntry = COMMANDS_DATA.find((c) => c.name.toLowerCase() === target || c.slug === target);
        if (cmdEntry) {
          const flagsText = cmdEntry.flags.map((f) => `       ${f.flag}\n              ${f.desc}`).join('\n\n');
          output = `${cmdEntry.name.toUpperCase()}(1)                   User Commands                  ${cmdEntry.name.toUpperCase()}(1)

NAME
       ${cmdEntry.name} - ${cmdEntry.summary}

SYNOPSIS
       ${cmdEntry.syntax}

DESCRIPTION
       ${cmdEntry.description}

OPTIONS
${flagsText}

EXAMPLES
       ${cmdEntry.examples.map((e) => `# ${e.title}\n       $ ${e.cmd}\n       ${e.explanation}`).join('\n\n')}

SEE ALSO
       ${cmdEntry.relatedCommands.join(', ')}

Online Linux Terminal Manual                     2026-08-28`;
        } else {
          output = `No manual entry for ${target}\nType 'help' for a list of available simulator commands.`;
          exitCode = 16;
        }
      }
      break;
    }

    case 'export': {
      if (args.length === 0 || args.includes('-p')) {
        output = `declare -x HOME="${env.HOME}"\ndeclare -x PATH="${env.PATH}"\ndeclare -x SHELL="${env.SHELL}"\ndeclare -x USER="${env.USER}"`;
      } else {
        output = ``;
      }
      break;
    }

    case 'env': {
      output = `USER=${env.USER}\nHOME=${env.HOME}\nSHELL=${env.SHELL}\nTERM=${env.TERM}\nPATH=${env.PATH}\nPWD=${env.PWD}`;
      break;
    }

    case 'clear': {
      output = '\x1b[2J\x1b[3J\x1b[H';
      break;
    }

    case 'help': {
      output = `Online Linux Terminal - Supported AST Commands (50+ Utilities):
----------------------------------------------------------------------
Navigation:     pwd, cd [dir], ls [-l -a -h], tree, which [cmd]
File Ops:       cat [-n], touch, mkdir [-p], rm [-r -f], cp [-r], mv, tar [-czvf|-xzvf], gzip, gunzip, find
Text Utilities: grep [-i -n -v -c], sed, awk, head [-n], tail [-n], wc, sort [-r -n -u], uniq [-c], cut [-d -f], tr, diff, echo
Editors:        nano [file], vim [file], vi [file]
System & Info:  whoami, date, uname [-a], history, chmod, chown, top, htop, ps, kill, df, du, free, uptime, hostname, id, groups, man [cmd]
Networking:     curl [url], wget [url], ping [host], netstat, ssh [host], scp, rsync
Shell & Exec:   bash [script.sh], sh [script.sh], python3, sudo [cmd]
Packages:       apt install <cowsay|figlet|sl>
Services:       systemctl status [service], crontab -l
Environment:    export, env, clear, help, reset`;
      break;
    }

    default: {
      output = `${command}: command not found. Type 'help' for available commands.`;
      exitCode = 127;
    }
  }

  // Handle Output Redirection (> or >>)
  if (targetRedirection && exitCode === 0 && command !== 'cat') {
    const targetFile = resolvePath(env.PWD, targetRedirection.file, env);
    const { parent, name } = getParentNodeAndName(updatedVFS, targetFile);

    if (parent && parent.type === 'directory') {
      parent.children = parent.children || [];
      const existing = parent.children.find((c) => c.name === name);
      const contentToAppend = output ? output + '\n' : '';

      if (existing) {
        if (targetRedirection.append) {
          existing.content = (existing.content || '') + contentToAppend;
        } else {
          existing.content = contentToAppend;
        }
        existing.size = new TextEncoder().encode(existing.content).length;
        existing.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
      } else {
        parent.children.push({
          id: 'file-' + Math.random().toString(36).substr(2, 9),
          name,
          type: 'file',
          permissions: 'rw-r--r--',
          owner: env.USER || 'user',
          group: env.USER || 'user',
          size: new TextEncoder().encode(contentToAppend).length,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          content: contentToAppend,
        });
      }
      output = '';
    }
  }

  return {
    result: { output, exitCode, newPwd, openEditor, installedPkg },
    updatedVFS,
  };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}

function parseOctalPerms(mode: string): string {
  const map: Record<string, string> = {
    '7': 'rwx',
    '6': 'rw-',
    '5': 'r-x',
    '4': 'r--',
    '3': '-wx',
    '2': '-w-',
    '1': '--x',
    '0': '---',
  };
  return (map[mode[0]] || 'rwx') + (map[mode[1]] || 'r-x') + (map[mode[2]] || 'r-x');
}
