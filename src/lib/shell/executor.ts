import type { VFSNode, ShellEnv, ExecutionResult } from '../vfs/types';
import { addInstalledPackage, getInstalledPackages } from '../vfs/store';
import { COMMANDS_DATA } from '../../data/commandsData';

export function resolvePath(currentPwd: string, targetPath: string, env: ShellEnv): string {
  if (!targetPath || targetPath === '.') return currentPwd;
  const userHome = env.HOME || (env.USER === 'root' ? '/root' : '/home/user');
  if (targetPath === '~' || targetPath === '~/') {
    targetPath = userHome;
  } else if (targetPath.startsWith('~/')) {
    targetPath = userHome + targetPath.slice(1);
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

export function expandGlobs(args: string[], root: VFSNode, pwd: string, env: ShellEnv): string[] {
  const expanded: string[] = [];

  for (const arg of args) {
    if (arg.includes('*') && !arg.startsWith('-')) {
      let targetDir = pwd;
      let pattern = arg;

      if (arg.includes('/')) {
        const lastSlash = arg.lastIndexOf('/');
        const dirPart = arg.substring(0, lastSlash) || '/';
        pattern = arg.substring(lastSlash + 1);
        targetDir = resolvePath(pwd, dirPart, env);
      }

      const dirNode = getNodeAtPath(root, targetDir);
      if (dirNode && dirNode.type === 'directory' && dirNode.children) {
        const regStr = '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$';
        const regex = new RegExp(regStr);
        const matches = dirNode.children
          .filter((c) => {
            if (!pattern.startsWith('.') && c.name.startsWith('.')) return false;
            return regex.test(c.name);
          })
          .map((c) => {
            if (arg.includes('/')) {
              const lastSlash = arg.lastIndexOf('/');
              const prefix = arg.substring(0, lastSlash + 1);
              return prefix + c.name;
            }
            return c.name;
          });

        if (matches.length > 0) {
          expanded.push(...matches);
          continue;
        }
      }
    }
    expanded.push(arg);
  }

  return expanded;
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
    let currentEnv = { ...env };
    const outputs: string[] = [];
    let finalExitCode = 0;
    let finalNewPwd = env.PWD;
    let finalNewEnv: ShellEnv | undefined;

    for (const subCmd of parts) {
      const res = await executeCommand(subCmd.trim(), currentVFS, currentEnv, history, stdin);
      currentVFS = res.updatedVFS;
      if (res.result.newEnv) {
        currentEnv = { ...res.result.newEnv };
        finalNewEnv = { ...res.result.newEnv };
      }
      if (res.result.newPwd) {
        currentEnv.PWD = res.result.newPwd;
        finalNewPwd = res.result.newPwd;
      }
      if (res.result.output) outputs.push(res.result.output);
      finalExitCode = res.result.exitCode;
      if (res.result.exitCode !== 0) break;
    }
    return {
      result: { output: outputs.join('\n'), exitCode: finalExitCode, newPwd: finalNewPwd, newEnv: finalNewEnv },
      updatedVFS: currentVFS,
    };
  }

  // Handle Command Chaining (;)
  if (trimmed.includes(';') && !trimmed.includes('sed ') && !trimmed.includes('awk ')) {
    const parts = trimmed.split(';');
    let currentVFS = rootVFS;
    let currentEnv = { ...env };
    const outputs: string[] = [];
    let finalExitCode = 0;
    let finalNewPwd = env.PWD;
    let finalNewEnv: ShellEnv | undefined;

    for (const subCmd of parts) {
      if (!subCmd.trim()) continue;
      const res = await executeCommand(subCmd.trim(), currentVFS, currentEnv, history, stdin);
      currentVFS = res.updatedVFS;
      if (res.result.newEnv) {
        currentEnv = { ...res.result.newEnv };
        finalNewEnv = { ...res.result.newEnv };
      }
      if (res.result.newPwd) {
        currentEnv.PWD = res.result.newPwd;
        finalNewPwd = res.result.newPwd;
      }
      if (res.result.output) outputs.push(res.result.output);
      finalExitCode = res.result.exitCode;
    }
    return {
      result: { output: outputs.join('\n'), exitCode: finalExitCode, newPwd: finalNewPwd, newEnv: finalNewEnv },
      updatedVFS: currentVFS,
    };
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

  // Tokenizer with Variable Expansion ($VAR and ${VAR})
  const tokens: string[] = [];
  const regex = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g;
  let match;
  while ((match = regex.exec(cleanCmdLine)) !== null) {
    const raw = match[0];
    const isSingleQuoted = raw.startsWith("'") && raw.endsWith("'");
    const isDoubleQuoted = raw.startsWith('"') && raw.endsWith('"');
    let token = raw;
    if (isSingleQuoted || isDoubleQuoted) {
      token = raw.slice(1, -1);
    }
    if (!isSingleQuoted) {
      token = token.replace(/\$\{?([a-zA-Z_0-9?]+)\}?/g, (_m, varName) => {
        if (varName === '?') return env['?'] || '0';
        return env[varName] !== undefined ? env[varName] : '';
      });
    }
    tokens.push(token);
  }

  if (tokens.length === 0) {
    return { result: { output: '', exitCode: 0 }, updatedVFS: rootVFS };
  }

  // Normalize Command Name to Lowercase (solves mobile auto-capitalization: Sudo, Mount, Ls, Clear)
  const rawCommand = tokens[0];
  const command = rawCommand.toLowerCase();
  const rawArgs = tokens.slice(1);
  const updatedVFS: VFSNode = JSON.parse(JSON.stringify(rootVFS));
  const args = expandGlobs(rawArgs, updatedVFS, env.PWD, env);

  let output = '';
  let exitCode = 0;
  let newPwd = env.PWD;
  let newEnv: ShellEnv | undefined;
  let openEditor: { filename: string; content: string } | undefined;
  let installedPkg: string | undefined;

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
      if (args.includes('--help') || args.includes('-h')) {
        output = `Usage: ls [OPTION]... [FILE]...
List information about the FILEs (the current directory by default).
Sort entries alphabetically if none of -cftuvSUX nor --sort is specified.

Mandatory arguments to long options are mandatory for short options too.
  -a, --all                  do not ignore entries starting with .
  -l                         use a long listing format
  -h, --human-readable       with -l, print sizes like 1K 234M 2G etc.`;
        break;
      }
      const showAll = args.some((a) => a.startsWith('-') && a.includes('a'));
      const showLong = args.some((a) => a.startsWith('-') && a.includes('l'));
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
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: cat [OPTION]... [FILE]...\nConcatenate FILE(s) to standard output.\n\n  -n, --number             number all output lines';
        break;
      }
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
            let content = node.content !== undefined ? node.content : '';
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
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: mkdir [OPTION]... DIRECTORY...\nCreate the DIRECTORY(ies), if they do not already exist.\n  -p, --parents     no error if existing, make parent directories as needed';
        break;
      }
      const recursive = args.includes('-p') || args.includes('--parents');
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
            } else {
              parent.children = parent.children || [];
              const exists = parent.children.some((c) => c.name === name);
              if (exists) {
                output = `mkdir: cannot create directory '${arg}': File exists`;
                exitCode = 1;
              } else {
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
      }
      break;
    }

    case 'touch': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: touch [OPTION]... FILE...\nUpdate the access and modification times of each FILE to the current time.\nA FILE argument that does not exist is created empty.';
        break;
      }
      const targets = args.filter((a) => !a.startsWith('-'));
      if (targets.length === 0) {
        output = 'touch: missing file operand';
        exitCode = 1;
      } else {
        for (const arg of targets) {
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
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: cp [OPTION]... SOURCE... DIRECTORY\nCopy SOURCE to DEST, or multiple SOURCE(s) to DIRECTORY.\n  -r, -R, --recursive          copy directories recursively';
        break;
      }
      const isRecursive = args.some((a) => a.includes('r') || a.includes('R'));
      const nonFlags = args.filter((a) => !a.startsWith('-'));
      if (nonFlags.length < 2) {
        output = 'cp: missing file operand';
        exitCode = 1;
      } else {
        const srcPath = resolvePath(env.PWD, nonFlags[0], env);
        const dstPath = resolvePath(env.PWD, nonFlags[1], env);

        const srcNode = getNodeAtPath(updatedVFS, srcPath);
        if (!srcNode) {
          output = `cp: cannot stat '${nonFlags[0]}': No such file or directory`;
          exitCode = 1;
        } else if (srcNode.type === 'directory' && !isRecursive) {
          output = `cp: -r not specified; omitting directory '${nonFlags[0]}'`;
          exitCode = 1;
        } else {
          let dstNode = getNodeAtPath(updatedVFS, dstPath);
          if (dstNode && dstNode.type === 'directory') {
            dstNode.children = dstNode.children || [];
            dstNode.children = dstNode.children.filter((c) => c.name !== srcNode.name);
            const copy = JSON.parse(JSON.stringify(srcNode));
            copy.id = 'node-' + Math.random().toString(36).substr(2, 9);
            dstNode.children.push(copy);
          } else {
            const { parent, name: dstName } = getParentNodeAndName(updatedVFS, dstPath);
            if (!parent || parent.type !== 'directory') {
              output = `cp: cannot create regular file '${nonFlags[1]}': No such file or directory`;
              exitCode = 1;
            } else {
              parent.children = parent.children || [];
              parent.children = parent.children.filter((c) => c.name !== dstName);
              const copy = JSON.parse(JSON.stringify(srcNode));
              copy.name = dstName;
              copy.id = 'node-' + Math.random().toString(36).substr(2, 9);
              parent.children.push(copy);
            }
          }
        }
      }
      break;
    }

    case 'mv': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: mv [OPTION]... SOURCE... DIRECTORY\nRename SOURCE to DEST, or move SOURCE(s) to DIRECTORY.';
        break;
      }
      const nonFlags = args.filter((a) => !a.startsWith('-'));
      if (nonFlags.length < 2) {
        output = 'mv: missing file operand';
        exitCode = 1;
      } else {
        const srcPath = resolvePath(env.PWD, nonFlags[0], env);
        const dstPath = resolvePath(env.PWD, nonFlags[1], env);

        const { parent: srcParent, name: srcName } = getParentNodeAndName(updatedVFS, srcPath);
        const srcNode = getNodeAtPath(updatedVFS, srcPath);

        if (!srcNode || !srcParent || !srcParent.children) {
          output = `mv: cannot stat '${nonFlags[0]}': No such file or directory`;
          exitCode = 1;
        } else {
          let dstNode = getNodeAtPath(updatedVFS, dstPath);
          if (dstNode && dstNode.type === 'directory') {
            srcParent.children = srcParent.children.filter((c) => c.name !== srcName);
            dstNode.children = dstNode.children || [];
            dstNode.children = dstNode.children.filter((c) => c.name !== srcName);
            dstNode.children.push(srcNode);
          } else {
            const { parent: dstParent, name: dstName } = getParentNodeAndName(updatedVFS, dstPath);
            if (!dstParent || dstParent.type !== 'directory') {
              output = `mv: cannot move to '${nonFlags[1]}': No such file or directory`;
              exitCode = 1;
            } else {
              srcParent.children = srcParent.children.filter((c) => c.name !== srcName);
              dstParent.children = dstParent.children || [];
              dstParent.children = dstParent.children.filter((c) => c.name !== dstName);
              srcNode.name = dstName;
              dstParent.children.push(srcNode);
            }
          }
        }
      }
      break;
    }

    case 'rm': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: rm [OPTION]... [FILE]...\nRemove (unlink) the FILE(s).\n  -f, --force           ignore nonexistent files and arguments, never prompt\n  -r, -R, --recursive   remove directories and their contents recursively';
        break;
      }
      const isRecursive = args.some((a) => a.includes('r') || a.includes('R'));
      const isForce = args.some((a) => a.includes('f'));
      const targets = args.filter((a) => !a.startsWith('-'));

      if (targets.length === 0) {
        if (!isForce) {
          output = 'rm: missing operand';
          exitCode = 1;
        }
      } else {
        for (const target of targets) {
          const resolved = resolvePath(env.PWD, target, env);
          if (resolved === '/') {
            output = 'rm: it is dangerous to operate recursively on \'/\' (protection active)';
            exitCode = 1;
            continue;
          }
          const { parent, name } = getParentNodeAndName(updatedVFS, resolved);
          const targetNode = getNodeAtPath(updatedVFS, resolved);

          if (!targetNode || !parent || !parent.children) {
            if (!isForce) {
              output = `rm: cannot remove '${target}': No such file or directory`;
              exitCode = 1;
            }
          } else if (targetNode.type === 'directory' && !isRecursive) {
            output = `rm: cannot remove '${target}': Is a directory`;
            exitCode = 1;
          } else {
            parent.children = parent.children.filter((c) => c.name !== name);
          }
        }
      }
      break;
    }

    case 'grep': {
      if (args.includes('--help') || args.includes('-h')) {
        output = `Usage: grep [OPTION]... PATTERNS [FILE]...
Search for PATTERNS in each FILE.
Example: grep -i 'hello world' menu.h main.c

Pattern selection and interpretation:
  -i, --ignore-case         ignore case distinctions in patterns and data
  -v, --invert-match        select non-matching lines

Miscellaneous:
  -c, --count               print only a count of selected lines per FILE
  -n, --line-number         print line number with output lines
  -r, -R, --recursive       like --directories=recurse`;
        break;
      }
      const ignoreCase = args.some((a) => a.startsWith('-') && a.includes('i'));
      const lineNumbers = args.some((a) => a.startsWith('-') && a.includes('n'));
      const invertMatch = args.some((a) => a.startsWith('-') && a.includes('v'));
      const countOnly = args.some((a) => a.startsWith('-') && a.includes('c'));
      const isRecursive = args.some((a) => a.startsWith('-') && (a.includes('r') || a.includes('R'))) || args.includes('--recursive');

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
          function collectFilesRecursive(dirNode: VFSNode, dirDisplayPath: string) {
            if (!dirNode.children) return;
            for (const child of dirNode.children) {
              const childDisplay = dirDisplayPath === '.' ? child.name : `${dirDisplayPath}/${child.name}`;
              if (child.type === 'file' && child.content !== undefined) {
                const flines = child.content.split('\n');
                flines.forEach((l, idx) => {
                  linesToSearch.push({ line: l, source: `${childDisplay}:`, lineNo: idx + 1 });
                });
              } else if (child.type === 'directory' && isRecursive) {
                collectFilesRecursive(child, childDisplay);
              }
            }
          }

          for (const fileArg of fileArgs) {
            const resolved = resolvePath(env.PWD, fileArg, env);
            const node = getNodeAtPath(updatedVFS, resolved);
            if (!node) {
              output += `grep: ${fileArg}: No such file or directory\n`;
              exitCode = 2;
            } else if (node.type === 'directory') {
              if (isRecursive) {
                collectFilesRecursive(node, fileArg);
              } else {
                output += `grep: ${fileArg}: Is a directory\n`;
                exitCode = 2;
              }
            } else if (node.content !== undefined) {
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
          let regex: RegExp;
          try {
            regex = new RegExp(patternStr, flags);
          } catch {
            regex = new RegExp(patternStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
          }

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
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: sed [OPTION]... {script-only-if-no-other-script} [input-file]...\nStream editor for filtering and transforming text.';
        break;
      }
      const script = args.find((a) => a.startsWith('s/')) || args[0];
      const target = args.find((a) => a !== script && !a.startsWith('-'));

      let inputText = stdin;
      if (target) {
        const resolved = resolvePath(env.PWD, target, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (node && node.content !== undefined) {
          inputText = node.content;
        } else {
          output = `sed: can't read ${target}: No such file or directory`;
          exitCode = 2;
          break;
        }
      }

      if (script && script.startsWith('s/')) {
        const parts = script.split('/');
        const search = parts[1];
        const replace = parts[2] || '';
        const flags = parts[3] || '';
        try {
          const regex = new RegExp(search, flags);
          output = inputText
            .split('\n')
            .map((line) => line.replace(regex, replace))
            .join('\n');
        } catch {
          output = inputText;
        }
      } else {
        output = inputText;
      }
      break;
    }

    case 'awk': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: awk [POSIX or GNU style options] -f progfile [--] file ...\nUsage: awk [POSIX or GNU style options] [--] \'program\' file ...';
        break;
      }
      const expr = args.find((a) => a.includes('{print')) || args[0] || '{print $0}';
      const target = args.find((a) => a !== expr && !a.startsWith('-'));

      let inputText = stdin;
      if (target) {
        const resolved = resolvePath(env.PWD, target, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (node && node.content !== undefined) {
          inputText = node.content;
        } else {
          output = `awk: cannot open ${target} (No such file or directory)`;
          exitCode = 2;
          break;
        }
      }

      const printExpr = expr.match(/\{print\s+(.+)\}/)?.[1];
      const lines = inputText.split('\n').filter(Boolean);
      const results: string[] = [];

      for (const line of lines) {
        const cols = line.trim().split(/\s+/);
        if (!printExpr || printExpr === '$0') {
          results.push(line);
        } else {
          const out = printExpr.replace(/\$([0-9]+)/g, (_m, idxStr) => {
            const idx = parseInt(idxStr, 10);
            if (idx === 0) return line;
            return cols[idx - 1] || '';
          });
          results.push(out);
        }
      }
      output = results.join('\n');
      break;
    }

    case 'tar': {
      if (args.includes('--help') || args.includes('-h')) {
        output = `Usage: tar [OPTION...] [FILE]...
GNU 'tar' saves many files together into a single tape or disk archive, and can restore individual files from the archive.

Examples:
  tar -czvf archive.tar.gz foo bar   # Create archive.tar.gz from files foo and bar
  tar -tvf archive.tar.gz            # List all files in archive.tar.gz
  tar -xzvf archive.tar.gz           # Extract all files from archive.tar.gz`;
        break;
      }
      const flagsArg = args.find((a) => a.startsWith('-')) || args[0] || '';
      const isCreate = flagsArg.includes('c');
      const isExtract = flagsArg.includes('x');
      const isList = flagsArg.includes('t');
      const isVerbose = flagsArg.includes('v');
      const nonFlags = args.filter((a) => !a.startsWith('-'));

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
        output = `-rw-r--r-- user/user 1024 2026-08-28 10:00 welcome.txt\ndrwxr-xr-x user/user 4096 2026-08-28 10:00 projects/`;
      } else {
        output = 'tar: usage: tar -czvf archive.tar.gz file OR tar -xzvf archive.tar.gz';
        exitCode = 1;
      }
      break;
    }

    case 'gzip': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: gzip [OPTION]... [FILE]...\nCompress FILEs (by default, in-place).\n  -d, --decompress  decompress\n  -k, --keep        keep (don\'t delete) input files';
        break;
      }
      const keep = args.includes('-k');
      const targets = args.filter((a) => !a.startsWith('-'));
      if (targets.length === 0) {
        output = 'gzip: missing operand';
        exitCode = 1;
      } else {
        for (const target of targets) {
          const resolved = resolvePath(env.PWD, target, env);
          const node = getNodeAtPath(updatedVFS, resolved);
          if (!node) {
            output = `gzip: ${target}: No such file or directory`;
            exitCode = 1;
          } else {
            const { parent, name } = getParentNodeAndName(updatedVFS, resolved);
            if (parent && parent.children) {
              const gzName = name + '.gz';
              parent.children.push({
                id: 'file-' + Math.random().toString(36).substr(2, 9),
                name: gzName,
                type: 'file',
                permissions: 'rw-r--r--',
                owner: env.USER || 'user',
                group: env.USER || 'user',
                size: Math.max(120, Math.floor((node.size || 500) * 0.4)),
                updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
                content: `[GZIP COMPRESSED DATA: ${node.name}]`,
              });
              if (!keep) {
                parent.children = parent.children.filter((c) => c.name !== name);
              }
            }
          }
        }
      }
      break;
    }

    case 'gunzip': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: gunzip [OPTION]... [FILE]...\nDecompress FILEs in-place.';
        break;
      }
      const targets = args.filter((a) => !a.startsWith('-'));
      if (targets.length === 0) {
        output = 'gunzip: missing operand';
        exitCode = 1;
      } else {
        for (const target of targets) {
          const resolved = resolvePath(env.PWD, target, env);
          const node = getNodeAtPath(updatedVFS, resolved);
          if (!node) {
            output = `gunzip: ${target}: No such file or directory`;
            exitCode = 1;
          } else {
            const { parent, name } = getParentNodeAndName(updatedVFS, resolved);
            if (parent && parent.children) {
              const uncompressedName = name.replace(/\.gz$/, '');
              parent.children.push({
                id: 'file-' + Math.random().toString(36).substr(2, 9),
                name: uncompressedName,
                type: 'file',
                permissions: 'rw-r--r--',
                owner: env.USER || 'user',
                group: env.USER || 'user',
                size: (node.size || 200) * 2,
                updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
                content: 'Uncompressed log file data restored from ' + name,
              });
              parent.children = parent.children.filter((c) => c.name !== name);
            }
          }
        }
      }
      break;
    }

    case 'sort': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: sort [OPTION]... [FILE]...\nWrite sorted concatenation of all FILE(s) to standard output.\n  -r, --reverse     reverse the result of comparisons\n  -u, --unique      with -c, check for strict ordering; without -c, output only the first of an equal run\n  -n, --numeric-sort  compare according to string numerical value';
        break;
      }
      const isReverse = args.includes('-r');
      const isNumeric = args.includes('-n');
      const isUnique = args.includes('-u');
      const target = args.find((a) => !a.startsWith('-'));

      let lines: string[] = [];
      if (target) {
        const resolved = resolvePath(env.PWD, target, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node || node.content === undefined) {
          output = `sort: open failed: ${target}: No such file or directory`;
          exitCode = 2;
          break;
        }
        lines = node.content.split('\n').filter(Boolean);
      } else {
        lines = (stdin || '').split('\n').filter(Boolean);
      }

      if (isUnique) {
        lines = Array.from(new Set(lines));
      }

      lines.sort((a, b) => {
        if (isNumeric) {
          const numA = parseFloat(a) || 0;
          const numB = parseFloat(b) || 0;
          return isReverse ? numB - numA : numA - numB;
        }
        return isReverse ? b.localeCompare(a) : a.localeCompare(b);
      });

      output = lines.join('\n');
      break;
    }

    case 'uniq': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: uniq [OPTION]... [INPUT [OUTPUT]]\nFilter adjacent matching lines from INPUT (or standard input), writing to OUTPUT (or standard output).\n  -c, --count           prefix lines by the number of occurrences';
        break;
      }
      const isCount = args.includes('-c');
      const target = args.find((a) => !a.startsWith('-'));

      let lines: string[] = [];
      if (target) {
        const resolved = resolvePath(env.PWD, target, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node || node.content === undefined) {
          output = `uniq: '${target}': No such file or directory`;
          exitCode = 1;
          break;
        }
        lines = node.content.split('\n').filter(Boolean);
      } else {
        lines = (stdin || '').split('\n').filter(Boolean);
      }

      const out: string[] = [];
      let lastLine = '';
      let count = 0;

      for (const l of lines) {
        if (l === lastLine) {
          count++;
        } else {
          if (count > 0) {
            out.push(isCount ? `      ${count} ${lastLine}` : lastLine);
          }
          lastLine = l;
          count = 1;
        }
      }
      if (count > 0) {
        out.push(isCount ? `      ${count} ${lastLine}` : lastLine);
      }

      output = out.join('\n');
      break;
    }

    case 'cut': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: cut OPTION... [FILE]...\nPrint selected parts of lines from each FILE to standard output.\n  -d, --delimiter=DELIM   use DELIM instead of TAB for field delimiter\n  -f, --fields=LIST       select only these fields';
        break;
      }
      let delimiter = '\t';
      const dIdx = args.findIndex((a) => a === '-d');
      if (dIdx !== -1 && args[dIdx + 1]) {
        delimiter = args[dIdx + 1];
      }

      let fieldIdx = 0;
      const fIdx = args.findIndex((a) => a === '-f');
      if (fIdx !== -1 && args[fIdx + 1]) {
        fieldIdx = parseInt(args[fIdx + 1], 10) - 1;
      }

      const nonFlags = args.filter((a, idx) => {
        if (a.startsWith('-')) return false;
        if (idx > 0 && (args[idx - 1] === '-d' || args[idx - 1] === '-f')) return false;
        return true;
      });

      let inputText = stdin;
      if (nonFlags.length > 0) {
        const resolved = resolvePath(env.PWD, nonFlags[0], env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (node && node.content !== undefined) {
          inputText = node.content;
        } else {
          output = `cut: ${nonFlags[0]}: No such file or directory`;
          exitCode = 1;
          break;
        }
      }

      const lines = inputText.split('\n');
      output = lines.map((l) => (l.split(delimiter)[fieldIdx] !== undefined ? l.split(delimiter)[fieldIdx] : l)).join('\n');
      break;
    }

    case 'tr': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: tr [OPTION]... SET1 [SET2]\nTranslate, squeeze, and/or delete characters from standard input, writing to standard output.';
        break;
      }
      const set1 = args[0] || '';
      const set2 = args[1] || '';
      if (set1 === '[:lower:]' && set2 === '[:upper:]') {
        output = (stdin || '').toUpperCase();
      } else if (set1 === '[:upper:]' && set2 === '[:lower:]') {
        output = (stdin || '').toLowerCase();
      } else {
        output = (stdin || '').split(set1).join(set2);
      }
      break;
    }

    case 'diff': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: diff [OPTION]... FILES\nCompare FILES line by line.';
        break;
      }
      if (args.length < 2) {
        output = 'diff: missing operand';
        exitCode = 2;
      } else {
        const file1 = resolvePath(env.PWD, args[0], env);
        const file2 = resolvePath(env.PWD, args[1], env);
        const n1 = getNodeAtPath(updatedVFS, file1);
        const n2 = getNodeAtPath(updatedVFS, file2);
        if (!n1 || !n2) {
          output = `diff: cannot find file operand`;
          exitCode = 2;
        } else {
          const l1 = (n1.content || '').split('\n');
          const l2 = (n2.content || '').split('\n');
          const diffs: string[] = [];
          const maxLen = Math.max(l1.length, l2.length);
          for (let i = 0; i < maxLen; i++) {
            if (l1[i] !== l2[i]) {
              if (l1[i] !== undefined) diffs.push(`< ${l1[i]}`);
              if (l2[i] !== undefined) diffs.push(`> ${l2[i]}`);
            }
          }
          output = diffs.length > 0 ? diffs.join('\n') : '';
        }
      }
      break;
    }

    case 'uptime': {
      output = ' 01:15:32 up 14 days,  3:42,  1 user,  load average: 0.12, 0.08, 0.05';
      break;
    }

    case 'hostname': {
      output = 'linux-terminal-box';
      break;
    }

    case 'hostnamectl': {
      output = `   Static hostname: linux-terminal-box
         Icon name: computer-vm
           Chassis: vm 🖴
        Machine ID: a82d9f481c9a45678b0123456789abcd
           Boot ID: 14285b7391024cd59af0123456789abc
    Virtualization: kvm
  Operating System: Online Linux Terminal OS v1.0
            Kernel: Linux 6.8.0-online-term
      Architecture: x86-64
   Hardware Vendor: QEMU
    Hardware Model: Standard PC (Q35 + ICH9, 2009)`;
      break;
    }

    case 'id': {
      if (env.USER === 'root') {
        output = 'uid=0(root) gid=0(root) groups=0(root)';
      } else {
        output = 'uid=1000(user) gid=1000(user) groups=1000(user),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),120(lpadmin),132(lxd)';
      }
      break;
    }

    case 'groups': {
      if (env.USER === 'root') {
        output = 'root';
      } else {
        output = 'user adm cdrom sudo dip plugdev lpadmin lxd';
      }
      break;
    }

    case 'who': {
      output = `${env.USER || 'user'}     pts/0        ${new Date().toISOString().slice(0, 10)} 00:00 (192.168.1.50)`;
      break;
    }

    case 'w': {
      output = ` 01:15:00 up 14 days,  3:42,  1 user,  load average: 0.12, 0.08, 0.05
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
${(env.USER || 'user').padEnd(8)} pts/0    192.168.1.50     00:00    0.00s  0.05s  0.00s -bash`;
      break;
    }

    case 'top':
    case 'htop': {
      output = `Tasks:  42 total,   1 running,  41 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.4 us,  1.1 sy,  0.0 ni, 96.3 id,  0.2 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   7865.6 total,   4111.7 free,   1387.2 used,   2366.7 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   6162.3 avail Mem 

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    1 root      20   0  169312  13404   8520 S   0.0   0.2   0:02.14 systemd
  420 ${env.USER || 'user'}      20   0   14280   5120   3410 S   0.0   0.1   0:00.32 bash
  882 ${env.USER || 'user'}      20   0  821440  84210  32100 S   0.8   1.1   1:24.10 node server.js
 1234 root      20   0   54210   8920   6120 S   0.0   0.1   0:01.02 nginx: master
 1337 ${env.USER || 'user'}      20   0   21420   3912   3100 R   1.2   0.0   0:00.04 top`;
      break;
    }

    case 'python':
    case 'python3': {
      const scriptArg = args.find((a) => !a.startsWith('-'));
      if (scriptArg) {
        output = `[Python 3.12.3 Execution]: Evaluated ${scriptArg} successfully.\nProcess finished with exit code 0`;
      } else {
        output = `Python 3.12.3 (main, Apr 10 2026, 02:00:00) [GCC 13.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
(Interactive REPL simulated. Use 'python script.py' to run files)`;
      }
      break;
    }

    case 'bash':
    case 'sh': {
      const scriptFile = args.find((a) => !a.startsWith('-'));
      if (scriptFile) {
        const resolved = resolvePath(env.PWD, scriptFile, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node || node.content === undefined) {
          output = `bash: ${scriptFile}: No such file or directory`;
          exitCode = 127;
        } else {
          const lines = node.content.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
          const results: string[] = [];
          for (const line of lines) {
            const subRes = await executeCommand(line, updatedVFS, env, history, stdin);
            if (subRes.result.output) results.push(subRes.result.output);
          }
          output = results.join('\n');
        }
      } else {
        output = `Online Linux Terminal Subshell active. (Type 'exit' to return)`;
      }
      break;
    }

    case 'chown': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: chown [OPTION]... [OWNER][:[GROUP]] FILE...\nChange the owner and/or group of each FILE to OWNER and/or GROUP.\n  -R, --recursive      operate on files and directories recursively';
        break;
      }
      const isRecursive = args.includes('-R') || args.includes('--recursive');
      const nonFlags = args.filter((a) => !a.startsWith('-'));
      if (nonFlags.length < 2) {
        output = 'chown: missing operand';
        exitCode = 1;
      } else {
        const ownerSpec = nonFlags[0];
        const targets = nonFlags.slice(1);
        let newOwner = ownerSpec;
        let newGroup = ownerSpec;
        if (ownerSpec.includes(':')) {
          const [o, g] = ownerSpec.split(':');
          newOwner = o || env.USER;
          newGroup = g || o;
        } else if (ownerSpec.includes('.')) {
          const [o, g] = ownerSpec.split('.');
          newOwner = o || env.USER;
          newGroup = g || o;
        }

        function applyChown(node: VFSNode) {
          node.owner = newOwner;
          node.group = newGroup;
          if (isRecursive && node.type === 'directory' && node.children) {
            for (const child of node.children) {
              applyChown(child);
            }
          }
        }

        for (const target of targets) {
          const resolved = resolvePath(env.PWD, target, env);
          const node = getNodeAtPath(updatedVFS, resolved);
          if (!node) {
            output = `chown: cannot access '${target}': No such file or directory`;
            exitCode = 1;
          } else {
            applyChown(node);
          }
        }
      }
      break;
    }

    case 'chmod': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: chmod [OPTION]... MODE[,MODE]... FILE...\nChange the mode of each FILE to MODE.\n  -R, --recursive   change files and directories recursively';
        break;
      }
      const isRecursive = args.includes('-R') || args.includes('--recursive');
      const nonFlags = args.filter((a) => !a.startsWith('-'));
      if (nonFlags.length < 2) {
        output = 'chmod: missing operand';
        exitCode = 1;
      } else {
        const mode = nonFlags[0];
        const targets = nonFlags.slice(1);

        function applyChmod(node: VFSNode) {
          if (/^[0-7]{3,4}$/.test(mode)) {
            const octal = mode.length === 4 ? mode.slice(1) : mode;
            node.permissions = parseOctalPerms(octal);
          } else if (mode.includes('+x')) {
            const p = node.permissions;
            node.permissions = (p[0] || 'r') + (p[1] || 'w') + 'x' + (p[3] || 'r') + (p[4] || '-') + 'x' + (p[6] || 'r') + (p[7] || '-') + 'x';
          } else if (mode.includes('-x')) {
            const p = node.permissions;
            node.permissions = (p[0] || 'r') + (p[1] || 'w') + '-' + (p[3] || 'r') + (p[4] || '-') + '-' + (p[6] || 'r') + (p[7] || '-') + '-';
          } else {
            node.permissions = mode;
          }
          if (isRecursive && node.type === 'directory' && node.children) {
            for (const child of node.children) {
              applyChmod(child);
            }
          }
        }

        for (const target of targets) {
          const resolved = resolvePath(env.PWD, target, env);
          const node = getNodeAtPath(updatedVFS, resolved);
          if (!node) {
            output = `chmod: cannot access '${target}': No such file or directory`;
            exitCode = 1;
          } else {
            applyChmod(node);
          }
        }
      }
      break;
    }

    case 'head':
    case 'tail': {
      if (args.includes('--help') || args.includes('-h')) {
        output = `Usage: ${command} [OPTION]... [FILE]...\nPrint the first/last 10 lines of each FILE to standard output.\n  -n, --lines=[-]NUM       print the first/last NUM lines instead of the first/last 10`;
        break;
      }
      let lineCount = 10;
      const nIdx = args.findIndex((a) => a === '-n');
      if (nIdx !== -1 && args[nIdx + 1]) {
        lineCount = parseInt(args[nIdx + 1], 10) || 10;
      } else {
        const numFlag = args.find((a) => /^-[0-9]+$/.test(a));
        if (numFlag) lineCount = parseInt(numFlag.slice(1), 10);
      }

      const nonFlags = args.filter((a, idx) => {
        if (a.startsWith('-')) return false;
        if (idx > 0 && args[idx - 1] === '-n') return false;
        return true;
      });

      let inputText = stdin;
      if (nonFlags.length > 0) {
        const resolved = resolvePath(env.PWD, nonFlags[0], env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (node && node.content !== undefined) {
          inputText = node.content;
        } else {
          output = `${command}: cannot open '${nonFlags[0]}' for reading: No such file or directory`;
          exitCode = 1;
          break;
        }
      }

      const allLines = inputText.split('\n');
      if (command === 'head') {
        output = allLines.slice(0, lineCount).join('\n');
      } else {
        output = allLines.slice(-lineCount).join('\n');
      }
      break;
    }

    case 'wc': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: wc [OPTION]... [FILE]...\nPrint newline, word, and byte counts for each FILE.\n  -l, --lines            print the newline counts\n  -w, --words            print the word counts\n  -c, --bytes            print the byte counts';
        break;
      }
      const isLinesOnly = args.includes('-l');
      const isWordsOnly = args.includes('-w');
      const isBytesOnly = args.includes('-c');
      const target = args.find((a) => !a.startsWith('-'));

      let inputText = stdin;
      if (target) {
        const resolved = resolvePath(env.PWD, target, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node || node.content === undefined) {
          output = `wc: ${target}: No such file or directory`;
          exitCode = 1;
          break;
        }
        inputText = node.content;
      }

      const lineCnt = inputText ? inputText.split('\n').length : 0;
      const wordCnt = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
      const byteCnt = new TextEncoder().encode(inputText).length;

      if (isLinesOnly) {
        output = `${lineCnt} ${target || ''}`.trim();
      } else if (isWordsOnly) {
        output = `${wordCnt} ${target || ''}`.trim();
      } else if (isBytesOnly) {
        output = `${byteCnt} ${target || ''}`.trim();
      } else {
        output = `${lineCnt.toString().padStart(7)} ${wordCnt.toString().padStart(7)} ${byteCnt.toString().padStart(7)} ${target || ''}`.trim();
      }
      break;
    }

    case 'whoami': {
      output = env.USER || 'user';
      break;
    }

    case 'date': {
      output = new Date().toUTCString();
      break;
    }

    case 'uname': {
      if (args.includes('-a')) {
        output = 'Linux linux-terminal-box 6.8.0-online-term #1 SMP PREEMPT_DYNAMIC Sat Aug 29 00:00:00 UTC 2026 x86_64 GNU/Linux';
      } else if (args.includes('-r')) {
        output = '6.8.0-online-term';
      } else if (args.includes('-m')) {
        output = 'x86_64';
      } else {
        output = 'Linux';
      }
      break;
    }

    case 'history': {
      output = history.map((cmd, idx) => `  ${(idx + 1).toString().padStart(4, ' ')}  ${cmd}`).join('\n');
      break;
    }

    case 'nano':
    case 'vim':
    case 'vi': {
      const filename = args.find((a) => !a.startsWith('-')) || 'notes.txt';
      const resolved = resolvePath(env.PWD, filename, env);
      const node = getNodeAtPath(updatedVFS, resolved);
      const initialContent = node && node.type === 'file' && node.content !== undefined ? node.content : '';
      openEditor = {
        filename,
        content: initialContent,
      };
      output = `[Launched ${command.toUpperCase()} in GUI modal editor for ${filename}]`;
      break;
    }

    case 'apt':
    case 'apt-get': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: apt [options] command\nCommands:\n  install - install packages\n  update - update list of available packages\n  remove - remove packages';
        break;
      }
      const subAction = args[0];
      const pkg = args[1];
      if (subAction === 'install' && pkg) {
        await addInstalledPackage(pkg);
        installedPkg = pkg;
        output = `Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following NEW packages will be installed:
  ${pkg}
0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.
Need to get 142 kB of archives.
Get:1 http://deb.debian.org/debian bookworm/main amd64 ${pkg} [142 kB]
Fetched 142 kB in 0s (1,240 kB/s)
Selecting previously unselected package ${pkg}.
Preparing to unpack .../${pkg}.deb ...
Unpacking ${pkg} (1.0-online) ...
Setting up ${pkg} (1.0-online) ...
Processing triggers for man-db (2.11.2-2) ...
Success: '${pkg}' is now available to execute!`;
      } else if (subAction === 'update') {
        output = `Hit:1 http://deb.debian.org/debian bookworm InRelease
Hit:2 http://security.debian.org/debian-security bookworm-security InRelease
Reading package lists... Done
Building dependency tree... Done
All packages are up to date.`;
      } else {
        output = `apt 2.4.11 (amd64)
Usage: apt install <package_name> (e.g. apt install cowsay, figlet, sl)`;
      }
      break;
    }

    case 'cowsay': {
      const msg = args.join(' ') || 'Moo! Welcome to Online Linux Terminal!';
      output = ` ${'_'.repeat(msg.length + 2)}
< ${msg} >
 ${'-'.repeat(msg.length + 2)}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
      break;
    }

    case 'figlet': {
      const text = args.join(' ') || 'ONLINE LINUX';
      output = ` _ _ _       _                             
| | (_)     | |                            
| | |_ _ __ | |__   ___  _   _ _ __   __ _ 
| | | | '_ \\| '_ \\ / _ \\| | | | '_ \\ / _\` |
|_|_|_|_| |_|_| |_|\\___/|\\__,_|_| |_|\\__,_|
 [ ${text.toUpperCase()} ]`;
      break;
    }

    case 'sl': {
      output = `      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ _____ |   (|) |
   /     |  |   H  |  |     |   | |     | |
  |      |  |   H  |__--------------------|
  | ________|___H__/__|_____/[][]~\\_______|
  |/ |   |_____ _____ _____|_____/   |
__/  |_____________________|         |_____
   <oo      oo>        <oo      oo>    <oo      oo>`;
      break;
    }

    case 'curl': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: curl [options...] <url>\n  -I, --head          Show document info only\n  -s, --silent        Silent mode\n  -O, --remote-name   Write output to a file named as the remote file';
        break;
      }
      const url = args.find((a) => a.startsWith('http://') || a.startsWith('https://')) || 'https://onlinelinuxterminal.com';
      const isHead = args.includes('-I') || args.includes('--head');

      if (isHead) {
        output = `HTTP/2 200 OK
date: ${new Date().toUTCString()}
content-type: text/html; charset=UTF-8
server: cloudflare
cf-ray: 8b4e1042-online-term
content-length: 14205
cache-control: max-age=3600, public`;
      } else {
        try {
          if (typeof window !== 'undefined' && window.fetch) {
            const res = await fetch(url, { method: 'GET' });
            output = await res.text();
          } else {
            output = `{"status": "success", "url": "${url}", "runtime": "AST Sandbox", "server": "Cloudflare Edge"}`;
          }
        } catch {
          output = `{"status": "simulated", "url": "${url}", "timestamp": "${new Date().toISOString()}"}`;
        }
      }
      break;
    }

    case 'wget': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'GNU Wget 1.21.3, a non-interactive network retriever.\nUsage: wget [OPTION]... [URL]...';
        break;
      }
      const url = args.find((a) => a.startsWith('http')) || 'https://example.com/data.zip';
      const filename = url.split('/').pop() || 'downloaded.zip';
      const resolved = resolvePath(env.PWD, filename, env);
      const { parent, name } = getParentNodeAndName(updatedVFS, resolved);

      if (parent && parent.type === 'directory') {
        parent.children = parent.children || [];
        parent.children.push({
          id: 'file-' + Math.random().toString(36).substr(2, 9),
          name,
          type: 'file',
          permissions: 'rw-r--r--',
          owner: env.USER || 'user',
          group: env.USER || 'user',
          size: 145020,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          content: `[DATA DUMP FROM ${url}]`,
        });
      }

      output = `--${new Date().toISOString()}--  ${url}
Resolving ${url.split('/')[2] || 'example.com'}... 93.184.216.34
Connecting to ${url.split('/')[2] || 'example.com'}|93.184.216.34|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 145020 (142K) [application/zip]
Saving to: ‘${filename}’

${filename}        100%[===================>] 141.62K  --.-KB/s    in 0.04s   

${new Date().toISOString()} (3.42 MB/s) - ‘${filename}’ saved [145020/145020]`;
      break;
    }

    case 'ssh': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-B bind_interface] [user@]hostname [command]';
        break;
      }
      if (args.length === 0) {
        output = 'usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-B bind_interface] [user@]hostname [command]';
        exitCode = 1;
      } else {
        const target = args.find((a) => !a.startsWith('-')) || 'remote-server';
        output = `Warning: Permanently added '${target}' (ED25519) to the list of known hosts.
Authenticated with publickey (id_rsa).
Linux remote-server 6.8.0-cloud #1 SMP Debian GNU/Linux
Last login: Fri Aug 28 10:00:00 2026 from 192.168.1.50
(SSH session simulated in sandbox)`;
      }
      break;
    }

    case 'scp': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'usage: scp [-346ABCOpqRrsTv] [-c cipher] [-D sftp_server_path] [-F ssh_config] [-i identity_file] [-J destination] [-l limit] [-o ssh_option] [-P port] [-S program] source ... target';
        break;
      }
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
      if (args.includes('--help') || args.includes('-h')) {
        output = 'rsync  version 3.2.7  protocol version 31\nUsage: rsync [OPTION...] SRC... [DEST]\n  -v, --verbose               increase verbosity\n  -r, --recursive             recurse into directories\n  -a, --archive               archive mode; equals -rlptgoD (no -H,-A,-X)';
        break;
      }
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
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: find [-H] [-L] [-P] [-Olevel] [-D debugopts] [path...] [expression]\ndefault path is the current directory; default expression is -print';
        break;
      }
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
      if (args.includes('--help') || args.includes('-h')) {
        output = 'usage: tree [-acdfghilnpqrstuvxACDFJQNSUX] [-H baseHREF] [-T title] [-L level] [--help] [directory ...]';
        break;
      }
      let maxDepth = Infinity;
      const lIdx = args.findIndex((a) => a === '-L');
      if (lIdx !== -1 && args[lIdx + 1]) {
        maxDepth = parseInt(args[lIdx + 1], 10) || Infinity;
      }

      const nonFlags = args.filter((a, idx) => {
        if (a.startsWith('-')) return false;
        if (idx > 0 && args[idx - 1] === '-L') return false;
        return true;
      });

      const target = nonFlags[0] || '.';
      const resolved = resolvePath(env.PWD, target, env);
      const node = getNodeAtPath(updatedVFS, resolved);
      if (!node) {
        output = `tree: ${target}: No such file or directory`;
        exitCode = 1;
        break;
      }

      const lines: string[] = [resolved === '/' ? '/' : target];
      let dirCount = 0;
      let fileCount = 0;

      function printTree(n: VFSNode, prefix = '', currentDepth = 1) {
        if (n.type !== 'directory' || !n.children || currentDepth > maxDepth) return;
        const children = n.children;
        children.forEach((child, idx) => {
          const isLast = idx === children.length - 1;
          const branch = isLast ? '└── ' : '├── ';
          lines.push(`${prefix}${branch}${child.name}`);
          if (child.type === 'directory') {
            dirCount++;
            if (currentDepth < maxDepth) {
              printTree(child, prefix + (isLast ? '    ' : '│   '), currentDepth + 1);
            }
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
      output = `  PID TTY          TIME CMD
    1 ?        00:00:02 init
  101 ?        00:00:00 systemd-journald
  142 ?        00:00:00 sshd
  420 pts/0    00:00:00 bash
  882 ?        00:00:05 node
 1234 ?        00:00:01 nginx
 1337 pts/0    00:00:00 ps`;
      break;
    }

    case 'kill': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]';
        break;
      }
      if (args.length === 0 || args.includes('-l')) {
        output = ` 1) SIGHUP\t 2) SIGINT\t 3) SIGQUIT\t 9) SIGKILL\t15) SIGTERM`;
      } else {
        output = `[kill] Signal sent to process ${args[args.length - 1]}`;
      }
      break;
    }

    case 'df': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: df [OPTION]... [FILE]...\nShow information about the file system on which each FILE resides, or all file systems by default.\n  -h, --human-readable  print sizes in powers of 1024 (e.g., 1023M)';
        break;
      }
      output = `Filesystem     1K-blocks      Used Available Use% Mounted on
udev             4006248         0   4006248   0% /dev
tmpfs             805444      1440    804004   1% /run
/dev/sda1       51464032  14820128  34013444  31% /
tmpfs            4027208         0   4027208   0% /dev/shm`;
      break;
    }

    case 'du': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: du [OPTION]... [FILE]...\nSummarize device storage usage of the set of FILEs, recursively for directories.\n  -h, --human-readable  print sizes in human readable format (e.g., 1K 234M 2G)\n  -s, --summarize       display only a total for each argument';
        break;
      }
      const showHuman = args.some((a) => a.startsWith('-') && a.includes('h'));
      const targets = args.filter((a) => !a.startsWith('-'));
      const searchTargets = targets.length > 0 ? targets : ['.'];

      const lines: string[] = [];
      for (const t of searchTargets) {
        const resolved = resolvePath(env.PWD, t, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node) {
          lines.push(`du: cannot access '${t}': No such file or directory`);
          exitCode = 1;
        } else {
          function calcSize(n: VFSNode): number {
            if (n.type === 'file') return n.size || 0;
            return (n.children || []).reduce((acc, c) => acc + calcSize(c), n.size || 4096);
          }
          const totalBytes = calcSize(node);
          const sizeDisplay = showHuman ? formatSize(totalBytes) : `${Math.ceil(totalBytes / 1024)}K`;
          lines.push(`${sizeDisplay}\t${t}`);
        }
      }
      output = lines.join('\n');
      break;
    }

    case 'free': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: free [options]\nOptions:\n  -b, --bytes         show output in bytes\n  -k, --kibi          show output in kibibytes\n  -m, --mebi          show output in mebibytes\n  -g, --gibi          show output in gibibytes\n  -h, --human         show human-readable output';
        break;
      }
      output = `               total        used        free      shared  buff/cache   available
Mem:         8054416     1420512     4210340       45120     2423564     6310240
Swap:        2097148           0     2097148`;
      break;
    }

    case 'which': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: which [options] [--] programname [...]';
        break;
      }
      if (!args[0]) {
        exitCode = 1;
        break;
      }
      const found = args.map((cmd) => `/usr/bin/${cmd}`);
      output = found.join('\n');
      break;
    }

    case 'su': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: su [options] [-] [user [args...]]\nChange the effective user ID and group ID to that of USER.\n  -, -l, --login               make the shell a login shell';
        break;
      }
      const targetUser = args.find((a) => !a.startsWith('-')) || 'root';
      const isLogin = args.some((a) => a === '-' || a === '-l' || a === '--login');
      const isRoot = targetUser === 'root';

      const userHome = isRoot ? '/root' : (targetUser === 'user' ? '/home/user' : `/home/${targetUser}`);
      const userPath = isRoot ? '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' : '/usr/local/bin:/usr/bin:/bin';
      const userPwd = isLogin ? userHome : env.PWD;

      ensureDirectoriesRecursive(updatedVFS, userHome, { ...env, USER: targetUser });

      output = '';
      return {
        result: {
          output,
          exitCode: 0,
          newPwd: userPwd,
          newEnv: {
            ...env,
            USER: targetUser,
            HOME: userHome,
            PATH: userPath,
            PWD: userPwd,
          },
        },
        updatedVFS,
      };
    }

    case 'exit':
    case 'logout': {
      if (env.USER === 'root') {
        output = 'exit';
        return {
          result: {
            output,
            exitCode: 0,
            newPwd: '/home/user',
            newEnv: {
              ...env,
              USER: 'user',
              HOME: '/home/user',
              PATH: '/usr/local/bin:/usr/bin:/bin',
              PWD: '/home/user',
            },
          },
          updatedVFS,
        };
      } else {
        output = 'logout\n(Online Linux Terminal sandbox session active. Type "clear" to refresh screen.)';
        break;
      }
    }

    case 'sudo': {
      if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
        output = `usage: sudo -h | -K | -k | -V
usage: sudo -v [-ABkNnS] [-g group] [-h host] [-p prompt] [-u user]
usage: sudo [-ABbEHkNnPS] [-C num] [-D directory] [-g group] [-h host] [-p prompt] [-R directory] [-T timeout] [-u user] [VAR=value] command`;
        break;
      }

      // Escalation commands: sudo su, sudo su -, sudo -i, sudo -s
      if (args[0] === 'su' || args[0] === '-i' || args[0] === '-s') {
        const suArgs = args[0] === 'su' ? args.slice(1) : [];
        const targetUser = suArgs.find((a) => !a.startsWith('-')) || 'root';
        const isRoot = targetUser === 'root';
        const userHome = isRoot ? '/root' : `/home/${targetUser}`;
        ensureDirectoriesRecursive(updatedVFS, userHome, { ...env, USER: targetUser });
        return {
          result: {
            output: '',
            exitCode: 0,
            newPwd: userHome,
            newEnv: {
              ...env,
              USER: targetUser,
              HOME: userHome,
              PWD: userHome,
              PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
            },
          },
          updatedVFS,
        };
      }

      const subCmd = args.join(' ');
      const subRes = await executeCommand(subCmd, updatedVFS, { ...env, USER: 'root' }, history, stdin);
      return subRes;
    }

    case 'mount': {
      if (args.includes('--help') || args.includes('-h')) {
        output = `Usage:
 mount [-lhV]
 mount -a [options]
 mount [options] [--source] <source> | [--target] <directory>
 mount [options] <source> <directory>`;
        break;
      }

      if (args.length === 0 || (args.length === 1 && args[0] === '-l')) {
        output = `/dev/sda1 on / type ext4 (rw,relatime,errors=remount-ro)
proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)
sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)
udev on /dev type devtmpfs (rw,nosuid,noexec,relatime,size=4006248k,nr_inodes=1001562,mode=755)
devpts on /dev/pts type devpts (rw,nosuid,noexec,relatime,gid=5,mode=620,ptmxmode=000)
tmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,relatime,size=805444k,mode=755)
tmpfs on /dev/shm type tmpfs (rw,nosuid,nodev)`;
        break;
      }

      if (env.USER !== 'root') {
        output = 'mount: only root can do that';
        exitCode = 1;
        break;
      }

      const nonFlags = args.filter((a) => !a.startsWith('-'));
      if (nonFlags.length < 2) {
        output = 'mount: bad usage\nTry \'mount --help\' for more information.';
        exitCode = 1;
        break;
      }

      const source = nonFlags[0];
      const target = nonFlags[1];
      const resolvedTarget = resolvePath(env.PWD, target, env);
      const targetNode = getNodeAtPath(updatedVFS, resolvedTarget);

      if (!targetNode) {
        output = `mount: mount point ${target} does not exist`;
        exitCode = 32;
      } else {
        output = `[mount] Successfully mounted ${source} on ${target}`;
      }
      break;
    }

    case 'umount': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: umount [options] <source> | <directory>';
        break;
      }
      if (args.length === 0) {
        output = 'umount: missing operand';
        exitCode = 1;
        break;
      }
      if (env.USER !== 'root') {
        output = 'umount: only root can do that';
        exitCode = 1;
        break;
      }
      const target = args.find((a) => !a.startsWith('-')) || args[0];
      output = `[umount] ${target} unmounted successfully.`;
      break;
    }

    case 'iotop': {
      if (args.includes('--help') || args.includes('-h')) {
        output = `Usage: iotop [OPTIONS]
-b, --batch            non-interactive batch mode
-n NUM, --iter=NUM     number of iterations before ends
-d SEC, --delay=SEC    delay between iterations (default: 1.0s)
-p PID, --pid=PID      processes/threads to monitor
-u USER, --user=USER   users to monitor
-a, --accumulated      show accumulated I/O instead of bandwidth
-k, --kilobytes        use kilobytes instead of a human friendly unit
-t, --time             add a timestamp on each line`;
        break;
      }

      if (env.USER !== 'root') {
        output = 'Netlink error: Operation not permitted. The sys_ptrace or CAP_NET_ADMIN privilege is required to run iotop. Try: sudo iotop';
        exitCode = 1;
        break;
      }

      output = `Total DISK READ :       0.00 B/s | Total DISK WRITE :       4.12 K/s
Actual DISK READ:       0.00 B/s | Actual DISK WRITE:       4.12 K/s
    TID  PRIO  USER     DISK READ  DISK WRITE  SWAPIN     IO>    COMMAND
      1 be/4 root        0.00 B/s    0.00 B/s  0.00 %  0.00 % init
    420 be/4 user        0.00 B/s    0.00 B/s  0.00 %  0.00 % bash
    882 be/4 user        0.00 B/s    4.12 K/s  0.00 %  0.02 % node server.js
   1234 be/4 root        0.00 B/s    0.00 B/s  0.00 %  0.00 % nginx: master process`;
      break;
    }

    case 'iostat': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: iostat [ options ] [ <interval> [ <count> ] ]\nOptions: -c (CPU), -d (Disk), -h (Human readable), -x (Extended stats)';
        break;
      }
      const now = new Date().toLocaleDateString('en-US');
      output = `Linux 6.8.0-online-term (linux-terminal-box) \t${now} \t_x86_64_\t(4 CPU)

avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           2.45    0.00    1.12    0.18    0.00   96.25

Device             tps    kB_read/s    kB_wrtn/s    kB_dscd/s    kB_read    kB_wrtn    kB_dscd
sda              12.40       142.10        48.30         0.00    1548292     526480          0
sda1             12.40       142.10        48.30         0.00    1548292     526480          0`;
      break;
    }

    case 'iota':
    case 'iota-node': {
      if (args.includes('-V') || args.includes('--version')) {
        output = `iota-cli 1.2.0 (IOTA Stardust / Chrysalis Tooling)\n(Tip: If looking for disk I/O diagnostics, use 'iotop' or 'iostat')`;
        break;
      }
      output = `IOTA CLI version 1.2.0 (AST Sandbox)
Usage: iota [OPTIONS] [COMMAND]

Commands:
  client       Client commands for interacting with IOTA network
  node         Manage local IOTA full-node daemon
  wallet       Manage IOTA seed, accounts and addresses
  keygen       Generate cryptographic keypairs
  status       Check connection to IOTA testnet/mainnet node

Options:
  -h, --help      Print help information
  -V, --version   Print version information

Note: If you intended to inspect Linux disk I/O metrics, try 'iotop' or 'iostat'.`;
      break;
    }

    case 'ifconfig': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage:\n  ifconfig [-a] [-v] [-s] <interface> [[<AF>] <address>]\n  [add <address>[/<prefixlen>]]\n  [del <address>[/<prefixlen>]]';
        break;
      }
      output = `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.0.2.15  netmask 255.255.255.0  broadcast 10.0.2.255
        inet6 fe80::5054:ff:fe12:3456  prefixlen 64  scopeid 0x20<link>
        ether 52:54:00:12:34:56  txqueuelen 1000  (Ethernet)
        RX packets 14820  bytes 18239401 (18.2 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 10421  bytes 1294102 (1.2 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 420  bytes 34210 (34.2 KB)
        TX packets 420  bytes 34210 (34.2 KB)`;
      break;
    }

    case 'ip': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: ip [ OPTIONS ] OBJECT { COMMAND | help }\nwhere  OBJECT := { address | addrlabel | link | route | rule | neigh | tunnel }';
        break;
      }
      const sub = args[0] || 'a';
      if (sub === 'a' || sub === 'addr' || sub === 'address') {
        output = `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 52:54:00:12:34:56 brd ff:ff:ff:ff:ff:ff
    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic eth0
       valid_lft 86200sec preferred_lft 86200sec
    inet6 fe80::5054:ff:fe12:3456/64 scope link 
       valid_lft forever preferred_lft forever`;
      } else if (sub === 'r' || sub === 'route') {
        output = `default via 10.0.2.2 dev eth0 proto dhcp src 10.0.2.15 metric 100 
10.0.2.0/24 dev eth0 proto kernel scope link src 10.0.2.15 metric 100`;
      } else if (sub === 'l' || sub === 'link') {
        output = `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
    link/ether 52:54:00:12:34:56 brd ff:ff:ff:ff:ff:ff`;
      } else {
        output = `ip ${sub}: Object simulated. Try 'ip a' or 'ip route'.`;
      }
      break;
    }

    case 'lsblk': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: lsblk [options] [<device> ...]\nList information about block devices.';
        break;
      }
      output = `NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sda      8:0    0   50G  0 disk 
└─sda1   8:1    0   50G  0 part /
sdb      8:16   0   20G  0 disk 
sr0     11:0    1 1024M  0 rom`;
      break;
    }

    case 'fdisk': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage:\n fdisk [options] <disk>    change partition table\n fdisk [options] -l [<disk> ...] list partition table(s)';
        break;
      }
      output = `Disk /dev/sda: 50 GiB, 53687091200 bytes, 104857600 sectors
Disk model: Virtual disk    
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Disk identifier: 7E429B8C-9842-4A8E-92BC-72F0715D3901

Device     Start       End   Sectors Size Type
/dev/sda1   2048 104855551 104853504  50G Linux filesystem`;
      break;
    }

    case 'blkid': {
      output = `/dev/sda1: UUID="3f4b8a21-9e12-4c8d-8a4e-123456789abc" BLOCK_SIZE="4096" TYPE="ext4" PARTUUID="7e429b8c-01"`;
      break;
    }

    case 'lsof': {
      output = `COMMAND    PID USER   FD   TYPE DEVICE SIZE/OFF   NODE NAME
init         1 root  cwd    DIR    8,1     4096      2 /
systemd-j  101 root  cwd    DIR    8,1     4096      2 /
sshd       142 root    3u  IPv4  12480      0t0    TCP *:22 (LISTEN)
bash       420 user  cwd    DIR    8,1     4096 102450 /home/user
nginx     1234 root    6u  IPv4  14210      0t0    TCP *:80 (LISTEN)
nginx     1235 user    6u  IPv4  14210      0t0    TCP *:80 (LISTEN)`;
      break;
    }

    case 'service': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: service < option > | --status-all | [ service_name [ command | --full-restart ] ]';
        break;
      }
      const sName = args[0] || 'nginx';
      const sAction = args[1] || 'status';
      if (sAction === 'status') {
        output = `● ${sName}.service - High performance web server
     Loaded: loaded (/lib/systemd/system/${sName}.service; enabled; vendor preset: enabled)
     Active: active (running) since Sat 2026-08-29 00:00:00 UTC; 4h 20min ago`;
      } else {
        output = `[service] Executed ${sAction} on ${sName}.`;
      }
      break;
    }

    case 'dmesg': {
      output = `[    0.000000] Linux version 6.8.0-online-term (gcc 13.2.0) #1 SMP PREEMPT_DYNAMIC
[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.8.0 root=UUID=3f4b8a21 ro quiet
[    0.004210] CPU0: Thermal monitoring enabled (TM1)
[    0.012540] ACPI: Core revision 20230628
[    0.142010] pci 0000:00:01.0: [8086:2918] type 00 class 0x060100
[    1.240120] scsi 0:0:0:0: Direct-Access     QEMU     QEMU HARDDISK    2.5+ PQ: 0 ANSI: 5
[    1.245100] sd 0:0:0:0: [sda] 104857600 512-byte logical blocks: (53.7 GB/50.0 GiB)
[    1.246200] sd 0:0:0:0: [sda] Attached SCSI disk
[    2.140200] EXT4-fs (sda1): mounted filesystem with ordered data mode. Quota mode: none.
[    2.482100] eth0: link up, 1000Mbps, full-duplex`;
      break;
    }

    case 'journalctl': {
      output = `-- Logs begin at Sat 2026-08-29 00:00:01 UTC, end at Sat 2026-08-29 04:20:00 UTC. --
Aug 29 00:00:01 linux-terminal-box kernel: Linux version 6.8.0-online-term
Aug 29 00:00:02 linux-terminal-box systemd[1]: Starting Network Manager...
Aug 29 00:00:03 linux-terminal-box systemd[1]: Started Network Manager.
Aug 29 00:05:14 linux-terminal-box sshd[142]: Accepted publickey for user from 192.168.1.50
Aug 29 01:00:00 linux-terminal-box CRON[1204]: (root) CMD (/usr/bin/curl -s https://onlinelinuxterminal.com > /dev/null)`;
      break;
    }

    case 'ss': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: ss [ OPTIONS ] [ FILTER ]\n  -t, --tcp           display only TCP sockets\n  -u, --udp           display only UDP sockets\n  -l, --listening     display listening sockets\n  -n, --numeric       don\'t resolve service names';
        break;
      }
      output = `Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process
tcp   LISTEN 0      128          0.0.0.0:22         0.0.0.0:*          
tcp   LISTEN 0      511          0.0.0.0:80         0.0.0.0:*          
tcp   LISTEN 0      511          0.0.0.0:443        0.0.0.0:*          
tcp   LISTEN 0      128             [::]:22            [::]:*          `;
      break;
    }

    case 'traceroute':
    case 'tracepath': {
      const host = args.find((a) => !a.startsWith('-')) || 'onlinelinuxterminal.com';
      output = `traceroute to ${host} (104.21.72.10), 30 hops max, 60 byte packets
 1  _gateway (10.0.2.2)  0.284 ms  0.241 ms  0.210 ms
 2  192.168.1.1 (192.168.1.1)  1.420 ms  1.380 ms  1.340 ms
 3  10.100.0.1 (10.100.0.1)  4.210 ms  4.180 ms  4.120 ms
 4  104.21.72.10 (104.21.72.10)  12.410 ms  12.380 ms  12.320 ms`;
      break;
    }

    case 'nslookup':
    case 'dig':
    case 'host': {
      const queryHost = args.find((a) => !a.startsWith('-')) || 'onlinelinuxterminal.com';
      output = `Server:\t\t8.8.8.8
Address:\t8.8.8.8#53

Non-authoritative answer:
Name:\t${queryHost}
Address: 104.21.72.10
Address: 172.67.182.240`;
      break;
    }

    case 'ping': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'Usage: ping [OPTION...] HOST ...\nSend ICMP ECHO_REQUEST packets to network hosts.\n  -c NUMBER       stop after sending NUMBER packets';
        break;
      }
      const host = args.find((a) => !a.startsWith('-')) || 'onlinelinuxterminal.com';
      output = `PING ${host} (104.21.72.10) 56(84) bytes of data.
64 bytes from 104.21.72.10: icmp_seq=1 ttl=58 time=12.4 ms
64 bytes from 104.21.72.10: icmp_seq=2 ttl=58 time=11.8 ms
64 bytes from 104.21.72.10: icmp_seq=3 ttl=58 time=12.1 ms
64 bytes from 104.21.72.10: icmp_seq=4 ttl=58 time=12.0 ms

--- ${host} ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
rtt min/avg/max/mdev = 11.802/12.075/12.412/0.218 ms`;
      break;
    }

    case 'netstat': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'usage: netstat [-vWeenNcfa] [<Socket> ...]\n  -t, --tcp                display TCP sockets\n  -u, --udp                display UDP sockets\n  -l, --listening          display listening server sockets\n  -n, --numeric            don\'t resolve names';
        break;
      }
      output = `Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp6       0      0 :::80                   :::*                    LISTEN
tcp6       0      0 :::22                   :::*                    LISTEN`;
      break;
    }

    case 'systemctl': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'systemctl [OPTIONS...] COMMAND [UNIT...]\nQuery or send control commands to the systemd manager.';
        break;
      }
      const action = args[0] || 'status';
      const unit = args[1] || 'nginx';
      if (action === 'status') {
        output = `● ${unit}.service - Web Server Service
     Loaded: loaded (/lib/systemd/system/${unit}.service; enabled; vendor preset: enabled)
     Active: active (running) since Sat 2026-08-29 00:00:00 UTC; 4h 20min ago
   Main PID: 1234 (${unit})
      Tasks: 4 (limit: 4652)
     Memory: 28.4M
        CPU: 1.230s
     CGroup: /system.slice/${unit}.service`;
      } else {
        output = `[systemctl] Executed ${action} for unit ${unit}`;
      }
      break;
    }

    case 'crontab': {
      if (args.includes('--help') || args.includes('-h')) {
        output = 'usage: crontab [-u user] file\n       crontab [ -u user ] [ -i ] { -e | -l | -r }';
        break;
      }
      if (args.includes('-l')) {
        output = `# Edit this file to introduce tasks to be run by cron.
# m h  dom mon dow   command
0 2 * * * /home/user/projects/demo.sh > /dev/null 2>&1
*/15 * * * * /usr/bin/curl -s https://onlinelinuxterminal.com > /dev/null`;
      } else {
        output = `crontab: use "crontab -l" to list or "crontab -e" to edit.`;
      }
      break;
    }

    case 'man': {
      if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        output = 'What manual page do you want? (e.g. man grep, man find, man chmod, man tar)';
        if (args.length === 0) exitCode = 1;
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
        const lines = Object.entries(env)
          .filter(([k]) => !k.startsWith('?') && typeof env[k] === 'string')
          .map(([k, v]) => `declare -x ${k}="${v}"`);
        output = lines.join('\n');
      } else {
        const updated = { ...env };
        for (const arg of args) {
          if (arg.includes('=')) {
            const eqIdx = arg.indexOf('=');
            const k = arg.slice(0, eqIdx);
            let v = arg.slice(eqIdx + 1);
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
              v = v.slice(1, -1);
            }
            updated[k] = v;
          }
        }
        newEnv = updated;
        output = '';
      }
      break;
    }

    case 'env': {
      const lines = Object.entries(env)
        .filter(([k]) => !k.startsWith('?') && typeof env[k] === 'string')
        .map(([k, v]) => `${k}=${v}`);
      output = lines.join('\n');
      break;
    }

    case 'alias': {
      output = `alias l='ls -CF'
alias la='ls -A'
alias ll='ls -alF'
alias ls='ls --color=auto'`;
      break;
    }

    case 'unalias': {
      output = '';
      break;
    }

    case 'useradd':
    case 'usermod':
    case 'userdel': {
      if (env.USER !== 'root') {
        output = `${command}: Permission denied (must be run as root or via sudo)`;
        exitCode = 1;
      } else {
        const targetUser = args.find((a) => !a.startsWith('-')) || 'newuser';
        output = `[${command}] Account ${targetUser} updated in /etc/passwd`;
      }
      break;
    }

    case 'passwd': {
      const targetUser = args.find((a) => !a.startsWith('-')) || env.USER;
      output = `passwd: password updated successfully for ${targetUser}`;
      break;
    }

    case 'clear': {
      output = '\x1b[2J\x1b[3J\x1b[H';
      break;
    }

    case 'reset': {
      output = '\x1b[2J\x1b[3J\x1b[H\x1b[1;32mTerminal environment reset successfully.\x1b[0m';
      break;
    }

    case 'help': {
      output = `Online Linux Terminal - Supported AST Commands (60+ Utilities):
----------------------------------------------------------------------
Navigation:     pwd, cd [dir], ls [-l -a -h], tree [-L], which [cmd]
File Ops:       cat [-n], touch, mkdir [-p], rm [-r -f], cp [-r], mv, tar [-czvf|-xzvf|-tvf], gzip, gunzip, find
Text Utilities: grep [-i -n -v -c -r], sed, awk, head [-n], tail [-n], wc [-l -w -c], sort [-r -n -u], uniq [-c], cut [-d -f], tr, diff, echo
Storage & Disk: df [-h], du [-s -h *], mount, umount, lsblk, fdisk [-l], blkid, iotop, iostat
Editors:        nano [file], vim [file], vi [file]
System & Info:  whoami, id, groups, who, w, date, uname [-a], history, chmod [-R], chown [-R], top, htop, ps, kill, free [-h], uptime, hostname, hostnamectl, dmesg, journalctl, man [cmd]
Privilege/User: sudo [cmd], su [-] [user], exit, logout, useradd, usermod, userdel, passwd
Networking:     curl [url], wget [url], ping [host], ifconfig, ip [a|route|link], netstat [-tuln], ss [-tuln], traceroute [host], nslookup [domain], ssh, scp, rsync
Packages:       apt install <cowsay|figlet|sl>, apt update
Services:       systemctl status [svc], service [svc] status, crontab -l
Environment:    export, env, alias, unalias, clear, reset, help`;
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
    result: { output, exitCode, newPwd, newEnv, openEditor, installedPkg },
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
