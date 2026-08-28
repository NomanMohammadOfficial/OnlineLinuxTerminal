import type { VFSNode, ShellEnv, ExecutionResult } from '../vfs/types';
import { addInstalledPackage, getInstalledPackages } from '../vfs/store';

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

export async function executeCommand(
  cmdLine: string,
  rootVFS: VFSNode,
  env: ShellEnv,
  history: string[]
): Promise<{ result: ExecutionResult; updatedVFS: VFSNode }> {
  const trimmed = cmdLine.trim();
  if (!trimmed) {
    return { result: { output: '', exitCode: 0 }, updatedVFS: rootVFS };
  }

  // Handle Pipe (|) chaining basics
  if (trimmed.includes(' | ')) {
    const pipeParts = trimmed.split(' | ');
    let currentInputText = '';
    let currentVFS = rootVFS;
    let finalOutput = '';
    let finalExitCode = 0;

    for (let i = 0; i < pipeParts.length; i++) {
      const subCmd = pipeParts[i].trim();
      const res = await executeCommand(subCmd, currentVFS, env, history);
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
      const showHuman = args.some((a) => a.includes('h'));

      const pathArg = args.find((a) => !a.startsWith('-')) || '.';
      const targetPath = resolvePath(env.PWD, pathArg, env);
      const node = getNodeAtPath(updatedVFS, targetPath);

      if (!node) {
        output = `ls: cannot access '${pathArg}': No such file or directory`;
        exitCode = 2;
      } else if (node.type === 'file') {
        output = showLong ? `${node.permissions} 1 ${node.owner} ${node.group} ${node.size} ${node.updatedAt} ${node.name}` : node.name;
      } else {
        let items = node.children || [];
        if (!showAll) {
          items = items.filter((item) => !item.name.startsWith('.'));
        }

        if (showLong) {
          const lines = items.map((item) => {
            const prefix = item.type === 'directory' ? 'd' : '-';
            const perms = prefix + item.permissions;
            const sizeStr = showHuman ? formatSize(item.size) : item.size.toString().padStart(6);
            return `${perms} 1 ${item.owner.padEnd(6)} ${item.group.padEnd(6)} ${sizeStr} ${item.updatedAt} ${item.name}${item.type === 'directory' ? '/' : ''}`;
          });
          output = `total ${items.length}\n` + lines.join('\n');
        } else {
          output = items.map((item) => item.name + (item.type === 'directory' ? '/' : '')).join('  ');
        }
      }
      break;
    }

    case 'cat': {
      if (args.length === 0) {
        output = 'cat: missing operand';
        exitCode = 1;
      } else {
        const fileOutputs: string[] = [];
        for (const arg of args) {
          const resolved = resolvePath(env.PWD, arg, env);
          const node = getNodeAtPath(updatedVFS, resolved);
          if (!node) {
            fileOutputs.push(`cat: ${arg}: No such file or directory`);
            exitCode = 1;
          } else if (node.type === 'directory') {
            fileOutputs.push(`cat: ${arg}: Is a directory`);
            exitCode = 1;
          } else {
            fileOutputs.push(node.content || '');
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
      if (args.length === 0) {
        output = 'mkdir: missing operand';
        exitCode = 1;
      } else {
        for (const arg of args.filter((a) => !a.startsWith('-'))) {
          const resolved = resolvePath(env.PWD, arg, env);
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

      const nonFlags = args.filter((a) => !a.startsWith('-'));
      if (nonFlags.length < 1) {
        output = 'grep: missing pattern';
        exitCode = 2;
      } else {
        const patternStr = nonFlags[0];
        const fileArgs = nonFlags.slice(1);
        let linesToSearch: { line: string; source: string; lineNo: number }[] = [];

        if (fileArgs.length === 0) {
          output = 'grep: missing target file';
          exitCode = 2;
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
          output = matched.join('\n');
        }
      }
      break;
    }

    case 'sed': {
      // Basic sed substitution parsing: sed 's/old/new/g' filename
      const expr = args.find((a) => a.startsWith('s/') || a.startsWith("'s/") || a.startsWith('"s/'));
      const fileArg = args.find((a) => a !== expr && !a.startsWith('-'));

      if (!expr || !fileArg) {
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

          const resolved = resolvePath(env.PWD, fileArg, env);
          const node = getNodeAtPath(updatedVFS, resolved);
          if (!node || node.type !== 'file') {
            output = `sed: can't read ${fileArg}: No such file or directory`;
            exitCode = 2;
          } else {
            const regex = new RegExp(findStr, global ? 'g' : '');
            output = (node.content || '').replace(regex, replaceStr);
          }
        }
      }
      break;
    }

    case 'awk': {
      // Basic awk column print: awk '{print $1}' filename
      const printExpr = args.find((a) => a.includes('print'));
      const fileArg = args.find((a) => a !== printExpr && !a.startsWith('-'));

      if (!fileArg) {
        output = 'awk: usage: awk \'{print $1}\' filename';
        exitCode = 1;
      } else {
        const resolved = resolvePath(env.PWD, fileArg, env);
        const node = getNodeAtPath(updatedVFS, resolved);
        if (!node || node.type !== 'file') {
          output = `awk: cannot open file ${fileArg}`;
          exitCode = 2;
        } else {
          const lines = (node.content || '').split('\n');
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
      }
      break;
    }

    case 'tar': {
      // Simulated tar: tar -czvf archive.tar.gz file or tar -xzvf archive.tar.gz
      const flagsArg = args[0] || '';
      if (flagsArg.includes('c') && args.length >= 3) {
        const archiveName = args[1];
        const sourceFile = args[2];
        output = `a ${sourceFile}\nArchive ${archiveName} created successfully.`;
      } else if (flagsArg.includes('x') && args.length >= 2) {
        const archiveName = args[1];
        output = `x welcome.txt\nArchive ${archiveName} extracted successfully.`;
      } else {
        output = 'tar: usage: tar -czvf archive.tar.gz filename OR tar -xzvf archive.tar.gz';
        exitCode = 1;
      }
      break;
    }

    case 'gzip': {
      if (args.length === 0) {
        output = 'gzip: missing operand';
        exitCode = 1;
      } else {
        const target = args[0];
        output = `${target} compressed to ${target}.gz`;
      }
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
        output = `${command}: missing file operand`;
        exitCode = 1;
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
      if (args.length === 0) {
        output = 'wc: missing file operand';
        exitCode = 1;
      } else {
        const file = args.find((a) => !a.startsWith('-'));
        if (!file) {
          output = 'wc: missing file operand';
          exitCode = 1;
        } else {
          const resolved = resolvePath(env.PWD, file, env);
          const node = getNodeAtPath(updatedVFS, resolved);
          if (!node || node.type !== 'file') {
            output = `wc: ${file}: No such file or directory`;
            exitCode = 1;
          } else {
            const content = node.content || '';
            const lines = content.split('\n').length;
            const words = content.trim() ? content.trim().split(/\s+/).length : 0;
            const bytes = new TextEncoder().encode(content).length;
            output = ` ${lines}  ${words} ${bytes} ${file}`;
          }
        }
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
      const subRes = await executeCommand(subCmd, updatedVFS, { ...env, USER: 'root' }, history);
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
      output = `Online Linux Terminal - Supported AST Commands:
------------------------------------------------
Navigation:     pwd, cd [dir], ls [-l -a -h], tree, which [cmd]
File Ops:       cat, touch, mkdir, rm [-r -f], cp, mv, tar, gzip, find
Text Utilities: grep [-i -n -v], sed, awk, head, tail, wc, echo
Editors:        nano [file], vim [file], vi [file]
System & Info:  whoami, date, uname [-a], history, chmod, chown, top, ps, kill, df, free
Networking:     curl [url], ping [host], netstat
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
