export interface CommandFlag {
  flag: string;
  desc: string;
  example?: string;
}

export interface CommandExample {
  title: string;
  cmd: string;
  explanation: string;
  outputPreview?: string;
}

export interface CommandError {
  error: string;
  cause: string;
  solution: string;
}

export interface CommandFaq {
  question: string;
  answer: string;
}

export interface LinuxCommand {
  name: string;
  slug: string;
  category: 'Navigation' | 'File Operations' | 'Text Processing' | 'Permissions & Security' | 'System & Processes' | 'Disk & Storage' | 'Networking & Transfer' | 'Archives & Compression' | 'Package Management' | 'Editors & Shell';
  syntax: string;
  summary: string;
  description: string;
  flags: CommandFlag[];
  examples: CommandExample[];
  commonErrors?: CommandError[];
  relatedCommands: string[];
  faq: CommandFaq[];
  defaultSandboxCmd: string;
}

export const COMMANDS_DATA: LinuxCommand[] = [
  {
    slug: 'find',
    name: 'find',
    category: 'File Operations',
    syntax: 'find [PATH] [OPTIONS] [EXPRESSION]',
    summary: 'Search for files and directories in a directory hierarchy based on name, type, size, or modification date.',
    description: 'The `find` command is one of the most powerful and frequently used command-line utilities in Linux and Unix-like operating systems. It recursively searches through directories and subdirectories to locate files matching specific criteria such as filename patterns, file extensions, permission modes, file types, modification dates, and size thresholds. Unlike the `locate` command which queries a pre-built database index, `find` searches the live filesystem in real-time, ensuring 100% accurate results even for newly created or modified files.',
    flags: [
      { flag: '-name [pattern]', desc: 'Search for files matching the specified filename or wildcard pattern (case-sensitive).' },
      { flag: '-iname [pattern]', desc: 'Search for files matching the pattern ignoring case distinctions.' },
      { flag: '-type [f|d|l]', desc: 'Filter results by file type: f (regular file), d (directory), l (symbolic link).' },
      { flag: '-size [+|-][n]', desc: 'Search by file size: +10M (larger than 10MB), -1k (smaller than 1KB).' },
      { flag: '-mtime [n]', desc: 'Find files modified n*24 hours ago (+7 for older than a week, -1 for last 24h).' },
      { flag: '-exec [cmd] {} \\;', desc: 'Execute a specific shell command on each matching file found.' }
    ],
    examples: [
      {
        title: 'Find files by exact name or extension',
        cmd: 'find /var/log -name "*.log"',
        explanation: 'Recursively scans the /var/log directory for all files ending with the .log extension.',
        outputPreview: '/var/log/syslog\n/var/log/auth.log\n/var/log/nginx/access.log'
      },
      {
        title: 'Find all directories in the home folder',
        cmd: 'find /home/user -type d',
        explanation: 'Filters and outputs only directory paths inside the user home folder.',
        outputPreview: '/home/user\n/home/user/projects\n/home/user/docs'
      },
      {
        title: 'Find files modified in the last 24 hours',
        cmd: 'find . -type f -mtime -1',
        explanation: 'Locates recently created or modified files in the current working directory.',
        outputPreview: './welcome.txt\n./notes.txt'
      }
    ],
    commonErrors: [
      {
        error: 'find: Paths must precede expression',
        cause: 'Options were specified before the target search path.',
        solution: 'Always place the directory path immediately after the find command (e.g., `find /path -name "test"`).'
      },
      {
        error: 'find: Permission denied',
        cause: 'Attempting to search system directories without superuser privileges.',
        solution: 'Use `sudo find /root -name "*.conf"` or redirect stderr using `2>/dev/null`.'
      }
    ],
    relatedCommands: ['grep', 'ls', 'which', 'chmod'],
    faq: [
      {
        question: 'How do I search for files ignoring uppercase and lowercase?',
        answer: 'Use the `-iname` flag instead of `-name`, for example: `find . -iname "readme.txt"` matches README.txt, Readme.TXT, and readme.txt.'
      },
      {
        question: 'How do I delete all found files automatically?',
        answer: 'You can use the `-delete` action or `-exec rm -f {} \\;`. Always test your search query first before running the delete flag.'
      }
    ],
    defaultSandboxCmd: 'find /var/log -name "*.log"'
  },
  {
    slug: 'grep',
    name: 'grep',
    category: 'Text Processing',
    syntax: 'grep [OPTIONS] PATTERN [FILE...]',
    summary: 'Search for matching string patterns or regular expressions inside text files.',
    description: 'Grep (Global Regular Expression Print) is the standard Unix text search utility. It scans files line by line, matching input against a specified regular expression pattern, and prints matching lines to standard output. It is an indispensable tool for debugging system logs, filtering terminal command outputs via pipes (`|`), and auditing source code for security patterns.',
    flags: [
      { flag: '-i', desc: 'Ignore case distinctions in both patterns and input data.' },
      { flag: '-n', desc: 'Prefix each matched output line with its 1-based line number.' },
      { flag: '-v', desc: 'Invert the match to print lines that do NOT match the pattern.' },
      { flag: '-r, -R', desc: 'Recursively search all files under each directory.' },
      { flag: '-c', desc: 'Suppress normal output and print only the count of matching lines.' },
      { flag: '-E', desc: 'Interpret pattern as an Extended Regular Expression (ERE).' }
    ],
    examples: [
      {
        title: 'Search for errors in system log files',
        cmd: 'grep -i -n "error" /var/log/syslog',
        explanation: 'Searches /var/log/syslog for case-insensitive occurrences of "error" and prints line numbers.',
        outputPreview: '14: Aug 28 10:14:02 kernel: [ERROR] Network timeout on eth0'
      },
      {
        title: 'Filter process list through a pipe',
        cmd: 'ps aux | grep nginx',
        explanation: 'Pipes process snapshot data and isolates lines containing the nginx web server process.'
      },
      {
        title: 'Count total failed authentication attempts',
        cmd: 'grep -c "Failed password" /var/log/auth.log',
        explanation: 'Outputs the integer count of failed login attempts without listing every individual line.',
        outputPreview: '42'
      }
    ],
    commonErrors: [
      {
        error: 'grep: /path/to/dir: Is a directory',
        cause: 'Targeted a directory without specifying the recursive flag.',
        solution: 'Add the `-r` or `-R` flag when searching folders (e.g., `grep -r "keyword" /etc/`).'
      }
    ],
    relatedCommands: ['sed', 'awk', 'find', 'cat', 'head', 'tail'],
    faq: [
      {
        question: 'What is the difference between grep, egrep, and fgrep?',
        answer: '`grep` uses basic regular expressions, `egrep` (same as `grep -E`) supports extended regex like `+`, `?`, and `|`, and `fgrep` (same as `grep -F`) performs fast fixed-string matching without regex parsing.'
      }
    ],
    defaultSandboxCmd: 'grep -i -n "error" /var/log/syslog'
  },
  {
    slug: 'ls',
    name: 'ls',
    category: 'Navigation',
    syntax: 'ls [OPTIONS] [FILE|DIRECTORY...]',
    summary: 'List directory contents including file sizes, permissions, ownership, and modification timestamps.',
    description: 'The `ls` command is the fundamental navigation utility in Linux. It displays the names of files and directories within the current working directory or any specified path. When combined with flags like `-l` (long format) and `-a` (all files), it exposes essential file system metadata including read/write/execute permissions, file owner, group, file byte size, and last modified date.',
    flags: [
      { flag: '-l', desc: 'Use long listing format showing permissions, owner, group, size, and date.' },
      { flag: '-a', desc: 'Show all files including hidden entries that begin with a period (.).' },
      { flag: '-h', desc: 'Print file sizes in human-readable units (e.g., 4K, 25M, 2G) when used with -l.' },
      { flag: '-t', desc: 'Sort files by modification timestamp, newest first.' },
      { flag: '-R', desc: 'Recursively list all subdirectories and their contents.' },
      { flag: '-S', desc: 'Sort files by file size, largest first.' }
    ],
    examples: [
      {
        title: 'Detailed human-readable file listing',
        cmd: 'ls -l -h',
        explanation: 'Displays detailed metadata with human-readable file sizes.',
        outputPreview: '-rw-r--r-- 1 user user 482B Aug 28 12:00 welcome.txt\n-rw-r--r-- 1 user user 1.2K Aug 28 12:05 notes.txt'
      },
      {
        title: 'List hidden configuration files',
        cmd: 'ls -a /home/user',
        explanation: 'Reveals hidden dotfiles such as .bashrc, .profile, and .config.',
        outputPreview: '. .. .bashrc .profile .config welcome.txt notes.txt'
      }
    ],
    relatedCommands: ['cd', 'pwd', 'tree', 'chmod'],
    faq: [
      {
        question: 'Why do hidden files start with a dot (.) in Linux?',
        answer: 'In Unix convention, any file or directory starting with a period is treated as a hidden configuration file by default to keep directory listings clean.'
      }
    ],
    defaultSandboxCmd: 'ls -l -a -h'
  },
  {
    slug: 'cd',
    name: 'cd',
    category: 'Navigation',
    syntax: 'cd [DIRECTORY]',
    summary: 'Change the current working directory in the shell workspace.',
    description: '`cd` (Change Directory) is a built-in shell command used to navigate across the Linux filesystem hierarchy. It updates the current working directory for all subsequent relative path operations. Using special symbols like `~` (home directory), `..` (parent directory), and `-` (previous working directory) allows lightning-fast terminal navigation.',
    flags: [
      { flag: '~', desc: 'Navigate directly to the current user home directory (/home/user).' },
      { flag: '..', desc: 'Move up one level to the parent directory.' },
      { flag: '-', desc: 'Switch back to the previous working directory.' },
      { flag: '/', desc: 'Navigate to the root directory of the entire filesystem.' }
    ],
    examples: [
      {
        title: 'Navigate to the /etc configuration folder',
        cmd: 'cd /etc && pwd',
        explanation: 'Changes the active directory to /etc and prints the updated path.',
        outputPreview: '/etc'
      },
      {
        title: 'Return to user home directory',
        cmd: 'cd ~',
        explanation: 'Quickly returns to /home/user from any location.'
      }
    ],
    relatedCommands: ['pwd', 'ls', 'mkdir'],
    faq: [
      {
        question: 'What happens if you run cd without any arguments?',
        answer: 'Running `cd` with no arguments automatically defaults to your home directory (`$HOME` or `/home/user`).'
      }
    ],
    defaultSandboxCmd: 'cd /etc && ls -l'
  },
  {
    slug: 'pwd',
    name: 'pwd',
    category: 'Navigation',
    syntax: 'pwd [OPTIONS]',
    summary: 'Print the absolute path of the current working directory.',
    description: '`pwd` stands for "Print Working Directory". It outputs the full, absolute path starting from the root directory (`/`) to the folder you are currently located in. It is critical for writing scripts and verifying current context before executing destructive commands like `rm`.',
    flags: [
      { flag: '-L', desc: 'Print logical working directory (resolving symbolic links according to shell).' },
      { flag: '-P', desc: 'Print physical working directory with all symbolic links completely resolved.' }
    ],
    examples: [
      {
        title: 'Print current directory path',
        cmd: 'pwd',
        explanation: 'Outputs the absolute filesystem path.',
        outputPreview: '/home/user'
      }
    ],
    relatedCommands: ['cd', 'ls', 'whoami'],
    faq: [
      {
        question: 'What is the difference between logical and physical paths in pwd?',
        answer: 'If you enter a symlinked folder, `pwd -L` displays the symlink path you followed, whereas `pwd -P` reveals the true physical underlying directory on disk.'
      }
    ],
    defaultSandboxCmd: 'pwd'
  },
  {
    slug: 'cat',
    name: 'cat',
    category: 'File Operations',
    syntax: 'cat [OPTIONS] [FILE...]',
    summary: 'Concatenate and print file contents directly to the terminal standard output.',
    description: 'The `cat` utility (short for "concatenate") reads files sequentially and prints their contents to stdout. Beyond displaying file contents, `cat` is widely used with redirection operators (`>` and `>>`) to merge multiple files into one, create new text files, or append text logs.',
    flags: [
      { flag: '-n', desc: 'Number all output lines starting from 1.' },
      { flag: '-b', desc: 'Number only non-blank output lines.' },
      { flag: '-s', desc: 'Squeeze multiple consecutive blank lines into a single blank line.' },
      { flag: '-E', desc: 'Display a dollar sign ($) at the end of each line.' }
    ],
    examples: [
      {
        title: 'Display file contents with line numbers',
        cmd: 'cat -n welcome.txt',
        explanation: 'Reads welcome.txt and prints each line prefixed with its line index.',
        outputPreview: '1  =====================================================\n2    WELCOME TO ONLINE LINUX TERMINAL\n3  ====================================================='
      },
      {
        title: 'Inspect OS release configuration',
        cmd: 'cat /etc/os-release',
        explanation: 'Displays Linux distribution and kernel release information.'
      }
    ],
    relatedCommands: ['head', 'tail', 'echo'],
    faq: [
      {
        question: 'How do you view large files without filling the terminal?',
        answer: 'For large files, use `head` or `tail` instead of `cat` so you can inspect specific portions of output.'
      }
    ],
    defaultSandboxCmd: 'cat welcome.txt'
  },
  {
    slug: 'chmod',
    name: 'chmod',
    category: 'Permissions & Security',
    syntax: 'chmod [OPTIONS] MODE[,MODE]... FILE...',
    summary: 'Change file access permission mode bits for owner, group, and other users.',
    description: '`chmod` (Change Mode) manages file and directory permissions in Linux. Every file has read (`r=4`), write (`w=2`), and execute (`x=1`) permissions for three classes: User (Owner), Group, and Others. Permissions can be set using 3-digit octal notation (e.g., `755` or `644`) or symbolic notation (e.g., `u+x`, `g-w`, `o=r`).',
    flags: [
      { flag: '755', desc: 'rwxr-xr-x: Owner has full control; group and others can read and execute.' },
      { flag: '644', desc: 'rw-r--r--: Owner can read and write; group and others can read only.' },
      { flag: '700', desc: 'rwx------: Owner has full control; no access for anyone else.' },
      { flag: '-R', desc: 'Recursively change file permissions on all subdirectories and files.' },
      { flag: '+x', desc: 'Make a script or binary file executable for all users.' }
    ],
    examples: [
      {
        title: 'Make a bash script executable',
        cmd: 'chmod +x /home/user/projects/demo.sh && ls -l /home/user/projects/demo.sh',
        explanation: 'Adds execute permissions to demo.sh and verifies the updated mode bits.',
        outputPreview: '-rwxr-xr-x 1 user user 180 Aug 28 12:10 demo.sh'
      },
      {
        title: 'Set standard web file permissions (644)',
        cmd: 'chmod 644 /var/log/syslog',
        explanation: 'Grants read/write to owner and read-only to group and others.'
      }
    ],
    commonErrors: [
      {
        error: 'chmod: changing permissions of ...: Operation not permitted',
        cause: 'You do not own the file and lack root privileges.',
        solution: 'Use `sudo chmod 755 [file]` or switch to the file owner account.'
      }
    ],
    relatedCommands: ['chown', 'ls', 'sudo'],
    faq: [
      {
        question: 'What do the numbers in chmod 755 represent?',
        answer: 'Each digit represents permissions for Owner, Group, and Others. 7 is 4(read)+2(write)+1(execute), while 5 is 4(read)+1(execute).'
      }
    ],
    defaultSandboxCmd: 'chmod 755 /home/user/projects/demo.sh'
  },
  {
    slug: 'chown',
    name: 'chown',
    category: 'Permissions & Security',
    syntax: 'chown [OPTIONS] OWNER[:GROUP] FILE...',
    summary: 'Change file owner and group attributes.',
    description: '`chown` (Change Owner) alters the user ownership and group association of files, directories, and links. System administrators frequently use `chown` when deploying web applications or restoring user permissions after file migrations.',
    flags: [
      { flag: '-R', desc: 'Recursively change ownership of directories and all contents.' },
      { flag: '-v', desc: 'Verbose output reporting every ownership change executed.' },
      { flag: '-c', desc: 'Report only when an actual change is made.' }
    ],
    examples: [
      {
        title: 'Change owner of a file to user',
        cmd: 'chown user /var/log/syslog && ls -l /var/log/syslog',
        explanation: 'Assigns user ownership to the system syslog file and checks with ls.',
        outputPreview: '-rw-r--r-- 1 user root 2048 Aug 28 10:14 /var/log/syslog'
      }
    ],
    relatedCommands: ['chmod', 'whoami', 'sudo'],
    faq: [
      {
        question: 'Can regular non-root users transfer file ownership with chown?',
        answer: 'On most Linux systems, only the root superuser can transfer file ownership to another user for security isolation.'
      }
    ],
    defaultSandboxCmd: 'chown user /var/log/syslog'
  },
  {
    slug: 'mkdir',
    name: 'mkdir',
    category: 'File Operations',
    syntax: 'mkdir [OPTIONS] DIRECTORY...',
    summary: 'Create new directories and folder hierarchies.',
    description: '`mkdir` (Make Directory) creates one or more new directories in the file system. With the `-p` (parents) flag, it can create complete nested directory paths in a single command without throwing errors if intermediate folders already exist.',
    flags: [
      { flag: '-p, --parents', desc: 'Create intermediate parent directories as needed without error if existing.' },
      { flag: '-m, --mode=MODE', desc: 'Set file permission mode for new directories upon creation (e.g., -m 700).' },
      { flag: '-v, --verbose', desc: 'Print a confirmation message for every created directory.' }
    ],
    examples: [
      {
        title: 'Create nested directory hierarchy in one step',
        cmd: 'mkdir -p /home/user/workspace/src/components && ls -R /home/user/workspace',
        explanation: 'Creates workspace, src, and components directories automatically.',
        outputPreview: '/home/user/workspace:\nsrc\n\n/home/user/workspace/src:\ncomponents'
      }
    ],
    relatedCommands: ['rm', 'touch', 'cd', 'ls', 'cp'],
    faq: [
      {
        question: 'Why should you always use mkdir -p in scripts?',
        answer: '`-p` prevents scripts from failing if the directory already exists and ensures all necessary parent directories are created automatically.'
      }
    ],
    defaultSandboxCmd: 'mkdir -p /home/user/workspace/lab'
  },
  {
    slug: 'rm',
    name: 'rm',
    category: 'File Operations',
    syntax: 'rm [OPTIONS] FILE...',
    summary: 'Remove files or directories from the filesystem.',
    description: '`rm` (Remove) deletes files and directories. Linux filesystems do not have a "Recycle Bin" or "Trash" for CLI commands—once a file is removed with `rm`, its data blocks are unlinked immediately. Combining `-r` (recursive) and `-f` (force) allows removing non-empty directory trees.',
    flags: [
      { flag: '-r, -R', desc: 'Remove directories and their contents recursively.' },
      { flag: '-f', desc: 'Force removal without prompting for confirmation or reporting non-existent files.' },
      { flag: '-i', desc: 'Prompt interactively before every file removal.' },
      { flag: '-v', desc: 'Verbose mode explaining what is being deleted.' }
    ],
    examples: [
      {
        title: 'Remove a specific file',
        cmd: 'rm /home/user/notes.txt && ls -l',
        explanation: 'Deletes notes.txt and verifies the directory listing.'
      },
      {
        title: 'Recursively delete a directory and all files',
        cmd: 'rm -rf /tmp/test_dir',
        explanation: 'Forces recursive removal of the test directory without confirmation prompts.'
      }
    ],
    commonErrors: [
      {
        error: 'rm: cannot remove ...: Is a directory',
        cause: 'Attempted to remove a directory without the recursive `-r` flag.',
        solution: 'Use `rm -r [directory]` or `rm -rf [directory]`.'
      }
    ],
    relatedCommands: ['mkdir', 'touch', 'mv', 'cp'],
    faq: [
      {
        question: 'Can you recover files deleted with rm in Linux?',
        answer: 'CLI deletion directly unlinks filesystem inodes. Without specialized forensic carving tools or backups, files deleted with `rm` cannot be easily recovered.'
      }
    ],
    defaultSandboxCmd: 'rm -i /home/user/notes.txt'
  },
  {
    slug: 'cp',
    name: 'cp',
    category: 'File Operations',
    syntax: 'cp [OPTIONS] SOURCE... DEST',
    summary: 'Copy files and directories to a destination path.',
    description: '`cp` (Copy) duplicates files or folders from a source to a destination. It supports copying single files, multiple files into target directories, and recursive directory tree replication with preservation of file modes and timestamps.',
    flags: [
      { flag: '-r, -R', desc: 'Copy directories and their contents recursively.' },
      { flag: '-p', desc: 'Preserve specified attributes like mode, ownership, and timestamps.' },
      { flag: '-a', desc: 'Archive mode (same as -dR --preserve=all) for exact backups.' },
      { flag: '-u', desc: 'Copy only when the SOURCE file is newer than the destination file.' },
      { flag: '-v', desc: 'Verbose output showing files as they are copied.' }
    ],
    examples: [
      {
        title: 'Create a backup copy of a configuration file',
        cmd: 'cp welcome.txt welcome.txt.bak && ls -l',
        explanation: 'Duplicates welcome.txt into welcome.txt.bak in the same directory.',
        outputPreview: '-rw-r--r-- 1 user user 482B welcome.txt\n-rw-r--r-- 1 user user 482B welcome.txt.bak'
      }
    ],
    relatedCommands: ['mv', 'rm', 'tar'],
    faq: [
      {
        question: 'What is the best flag to back up an entire folder preserving permissions?',
        answer: 'Use `cp -a [source] [destination]` (Archive mode) to preserve permissions, ownership, symlinks, and timestamps.'
      }
    ],
    defaultSandboxCmd: 'cp welcome.txt welcome.bak'
  },
  {
    slug: 'mv',
    name: 'mv',
    category: 'File Operations',
    syntax: 'mv [OPTIONS] SOURCE... DEST',
    summary: 'Move or rename files and directories.',
    description: '`mv` (Move) renames files and directories or moves them across different folder locations. If source and destination are on the same filesystem partition, `mv` is an atomic inode pointer update that executes instantly regardless of file size.',
    flags: [
      { flag: '-i', desc: 'Prompt before overwriting an existing destination file.' },
      { flag: '-f', desc: 'Force overwrite without prompting.' },
      { flag: '-n', desc: 'Do not overwrite an existing file (no-clobber).' },
      { flag: '-v', desc: 'Verbose mode explaining actions being taken.' }
    ],
    examples: [
      {
        title: 'Rename a file in the current directory',
        cmd: 'mv notes.txt project_ideas.txt && ls -l',
        explanation: 'Renames notes.txt to project_ideas.txt.',
        outputPreview: '-rw-r--r-- 1 user user 1200B project_ideas.txt'
      }
    ],
    relatedCommands: ['cp', 'rm'],
    faq: [
      {
        question: 'Is moving a file between two folders on the same drive instantaneous?',
        answer: 'Yes. On the same filesystem partition, `mv` simply re-links the directory inode without copying data blocks across disk.'
      }
    ],
    defaultSandboxCmd: 'mv notes.txt ideas.txt'
  },
  {
    slug: 'touch',
    name: 'touch',
    category: 'File Operations',
    syntax: 'touch [OPTIONS] FILE...',
    summary: 'Create empty files or update file access and modification timestamps.',
    description: '`touch` is the standard tool for quickly creating empty placeholder files or updating the access and modification timestamps of existing files to the current system time.',
    flags: [
      { flag: '-a', desc: 'Change only the access time.' },
      { flag: '-m', desc: 'Change only the modification time.' },
      { flag: '-c', desc: 'Do not create any files if they do not already exist.' }
    ],
    examples: [
      {
        title: 'Create multiple new empty files',
        cmd: 'touch server.js config.json .env && ls -l',
        explanation: 'Creates three empty files in the current folder.',
        outputPreview: '-rw-r--r-- 1 user user 0B server.js\n-rw-r--r-- 1 user user 0B config.json\n-rw-r--r-- 1 user user 0B .env'
      }
    ],
    relatedCommands: ['mkdir', 'cat', 'echo'],
    faq: [
      {
        question: 'What happens if you touch an existing file?',
        answer: 'Touching an existing file will NOT alter or erase its content; it only updates its last-accessed and last-modified timestamps.'
      }
    ],
    defaultSandboxCmd: 'touch index.html style.css app.js'
  },
  {
    slug: 'head',
    name: 'head',
    category: 'Text Processing',
    syntax: 'head [OPTIONS] [FILE...]',
    summary: 'Output the first part (top lines) of text files.',
    description: '`head` outputs the beginning portion of files, displaying the first 10 lines by default. It is ideal for quickly inspecting file headers, CSV schemas, or top log entries without loading massive files into memory.',
    flags: [
      { flag: '-n [NUM]', desc: 'Print the first NUM lines instead of the default 10.' },
      { flag: '-c [NUM]', desc: 'Print the first NUM bytes of each file.' },
      { flag: '-q', desc: 'Quiet mode; never print headers giving file names.' }
    ],
    examples: [
      {
        title: 'View top 5 lines of syslog',
        cmd: 'head -n 5 /var/log/syslog',
        explanation: 'Extracts and prints only the first 5 lines of the system log file.',
        outputPreview: 'Aug 28 10:00:01 systemd[1]: Starting Daily apt upgrade...\nAug 28 10:00:02 kernel: Booting Linux on physical CPU...'
      }
    ],
    relatedCommands: ['tail', 'cat', 'sed'],
    faq: [
      {
        question: 'How do you view everything except the last 10 lines?',
        answer: 'Use `head -n -10 [file]` to output all lines from the start up to the last 10 lines.'
      }
    ],
    defaultSandboxCmd: 'head -n 5 welcome.txt'
  },
  {
    slug: 'tail',
    name: 'tail',
    category: 'Text Processing',
    syntax: 'tail [OPTIONS] [FILE...]',
    summary: 'Output the last part (bottom lines) of files or stream real-time logs.',
    description: '`tail` displays the final lines of files (default: 10 lines). With the `-f` (follow) flag, `tail` remains open and continuously streams new log lines to your terminal in real-time as they are written by web servers, databases, and background services.',
    flags: [
      { flag: '-n [NUM]', desc: 'Output the last NUM lines instead of the default 10.' },
      { flag: '-f', desc: 'Follow mode; continuously output appended data as the file grows.' },
      { flag: '-F', desc: 'Follow mode with retry; keeps tracking file even if rotated or recreated.' }
    ],
    examples: [
      {
        title: 'Inspect last 10 lines of authentication logs',
        cmd: 'tail -n 10 /var/log/auth.log',
        explanation: 'Prints the most recent authentication attempts.',
        outputPreview: 'Aug 28 12:15:00 sshd: Accepted publickey for user from 192.168.1.5'
      }
    ],
    relatedCommands: ['head', 'cat', 'grep'],
    faq: [
      {
        question: 'How do you stop tail -f live streaming in terminal?',
        answer: 'Press `Ctrl + C` to send the interrupt signal and return to the shell prompt.'
      }
    ],
    defaultSandboxCmd: 'tail -n 5 /var/log/syslog'
  },
  {
    slug: 'wc',
    name: 'wc',
    category: 'Text Processing',
    syntax: 'wc [OPTIONS] [FILE...]',
    summary: 'Print newline, word, and byte counts for files.',
    description: '`wc` (Word Count) reads files or standard input and computes statistics including line count (`-l`), word count (`-w`), and byte count (`-c`). It is widely used in shell pipelines to count query results or filter matches (e.g., `grep ... | wc -l`).',
    flags: [
      { flag: '-l', desc: 'Count and print total newline line counts.' },
      { flag: '-w', desc: 'Count and print total words.' },
      { flag: '-c', desc: 'Count and print total bytes.' },
      { flag: '-m', desc: 'Count and print total characters.' }
    ],
    examples: [
      {
        title: 'Count total lines in a file',
        cmd: 'wc -l welcome.txt',
        explanation: 'Outputs the line count for welcome.txt.',
        outputPreview: '15 welcome.txt'
      },
      {
        title: 'Count matching error occurrences in logs',
        cmd: 'grep "error" /var/log/syslog | wc -l',
        explanation: 'Pipes grep output into wc -l to get the exact integer count.'
      }
    ],
    relatedCommands: ['grep', 'cat', 'head'],
    faq: [
      {
        question: 'Why does wc -l sometimes show 1 less line than expected?',
        answer: '`wc -l` counts newline (`\\n`) characters. If the final line in a file lacks a trailing newline character, it is not counted as a full line.'
      }
    ],
    defaultSandboxCmd: 'wc -l welcome.txt'
  },
  {
    slug: 'echo',
    name: 'echo',
    category: 'Text Processing',
    syntax: 'echo [OPTIONS] [STRING...]',
    summary: 'Print text strings or write data to files using shell redirection.',
    description: '`echo` displays strings of text to standard output. When paired with `>` (overwrite) or `>>` (append) redirection operators, `echo` is the most common way to create config files, append environment variables, or print script debug statuses.',
    flags: [
      { flag: '-e', desc: 'Enable interpretation of backslash escapes (e.g., \\n for newline, \\t for tab).' },
      { flag: '-n', desc: 'Do not output the trailing newline character.' }
    ],
    examples: [
      {
        title: 'Write text to a new file',
        cmd: 'echo "API_PORT=8080" > /home/user/.env && cat /home/user/.env',
        explanation: 'Creates or overwrites .env with API_PORT=8080.',
        outputPreview: 'API_PORT=8080'
      }
    ],
    relatedCommands: ['cat', 'touch'],
    faq: [
      {
        question: 'What is the difference between > and >> in echo?',
        answer: '`>` completely overwrites the target file, while `>>` appends new text to the end of the file preserving existing content.'
      }
    ],
    defaultSandboxCmd: 'echo "Hello from Online Linux Terminal!"'
  },
  {
    slug: 'sed',
    name: 'sed',
    category: 'Text Processing',
    syntax: 'sed [OPTIONS] SCRIPT [INPUT-FILE...]',
    summary: 'Stream editor for filtering and transforming text using pattern substitutions.',
    description: '`sed` (Stream Editor) performs basic text transformations on an input stream or file. Its most famous capability is search-and-replace using the `s/find/replace/g` syntax, allowing automated batch editing of source code and configurations without opening a visual editor.',
    flags: [
      { flag: '-i', desc: 'Edit files in place directly instead of printing to stdout.' },
      { flag: '-e [script]', desc: 'Add the script to the commands to be executed.' },
      { flag: '-n', desc: 'Suppress automatic printing of pattern space.' }
    ],
    examples: [
      {
        title: 'Substitute string patterns in text output',
        cmd: 'echo "localhost:3000" | sed "s/3000/8080/g"',
        explanation: 'Replaces port 3000 with 8080 in the stream.',
        outputPreview: 'localhost:8080'
      }
    ],
    relatedCommands: ['awk', 'grep'],
    faq: [
      {
        question: 'What does the /g at the end of a sed substitution mean?',
        answer: '`/g` stands for global. It replaces all occurrences of the matching pattern on each line, rather than just the first occurrence.'
      }
    ],
    defaultSandboxCmd: 'echo "foo bar foo" | sed "s/foo/baz/g"'
  },
  {
    slug: 'awk',
    name: 'awk',
    category: 'Text Processing',
    syntax: 'awk [OPTIONS] \'program\' [FILE...]',
    summary: 'Pattern scanning and column text processing language.',
    description: '`awk` is a complete programming language designed for data extraction and reporting. It treats text files as tables divided into records (lines) and fields (columns delimited by spaces or commas), making it effortless to parse CSVs, log files, and system process tables.',
    flags: [
      { flag: '-F [separator]', desc: 'Define custom field separator character (e.g., -F: for /etc/passwd).' },
      { flag: '-v [var=val]', desc: 'Assign a value to an internal awk program variable.' }
    ],
    examples: [
      {
        title: 'Extract usernames from /etc/passwd',
        cmd: 'awk -F: \'{print $1}\' /etc/passwd',
        explanation: 'Splits lines by colon (:) and prints the first column containing account usernames.',
        outputPreview: 'root\ndaemon\nbin\nsys\nuser'
      }
    ],
    relatedCommands: ['sed', 'grep'],
    faq: [
      {
        question: 'What do $0, $1, $2 mean in awk?',
        answer: '`$0` represents the entire line, `$1` represents the first column field, `$2` represents the second field, and so forth.'
      }
    ],
    defaultSandboxCmd: 'awk -F: \'{print $1}\' /etc/passwd'
  },
  {
    slug: 'ps',
    name: 'ps',
    category: 'System & Processes',
    syntax: 'ps [OPTIONS]',
    summary: 'Report a snapshot of currently running system processes.',
    description: '`ps` (Process Status) provides detailed information about active processes running on your Linux system, including Process ID (PID), CPU usage, Memory utilization, Terminal (TTY), runtime, and the command string.',
    flags: [
      { flag: 'aux', desc: 'Display all running processes for all users in BSD syntax with CPU/MEM percentages.' },
      { flag: '-ef', desc: 'Standard system V syntax listing all processes with parent PID (PPID).' },
      { flag: '-u [user]', desc: 'Filter processes owned by a specific username.' }
    ],
    examples: [
      {
        title: 'List all running system processes',
        cmd: 'ps aux',
        explanation: 'Outputs complete process table snapshot.',
        outputPreview: 'USER  PID %CPU %MEM    VSZ   RSS TTY STAT START   TIME COMMAND\nroot    1  0.0  0.1 168920 11420 ?   Ss   10:00   0:02 /sbin/init\nuser  420  0.0  0.2  24500  4800 pts/0 S+ 10:15   0:00 bash'
      }
    ],
    relatedCommands: ['top', 'htop', 'kill'],
    faq: [
      {
        question: 'What is the difference between ps and top?',
        answer: '`ps` gives a single static snapshot of processes at that exact moment, whereas `top` is an interactive real-time dashboard that continually refreshes.'
      }
    ],
    defaultSandboxCmd: 'ps aux'
  },
  {
    slug: 'top',
    name: 'top',
    category: 'System & Processes',
    syntax: 'top [OPTIONS]',
    summary: 'Display real-time Linux processes and system resource utilization.',
    description: '`top` is the built-in dynamic process viewer for Unix systems. It displays real-time CPU load averages, memory/swap usage, task states, and a continuously updated list of top resource-consuming processes sorted by CPU or RAM.',
    flags: [
      { flag: '-b', desc: 'Batch mode for sending output to files or scripts.' },
      { flag: '-n [iter]', desc: 'Exit after the specified number of refresh iterations.' },
      { flag: '-u [user]', desc: 'Monitor only processes owned by the specified user.' }
    ],
    examples: [
      {
        title: 'Inspect system resource snapshot',
        cmd: 'top',
        explanation: 'Runs top and outputs system load statistics.'
      }
    ],
    relatedCommands: ['htop', 'ps', 'kill', 'free'],
    faq: [
      {
        question: 'How do you exit top in the terminal?',
        answer: 'Press `q` on your keyboard to quit the interactive top interface.'
      }
    ],
    defaultSandboxCmd: 'top'
  },
  {
    slug: 'htop',
    name: 'htop',
    category: 'System & Processes',
    syntax: 'htop [OPTIONS]',
    summary: 'Interactive process viewer with colorful CPU meters and mouse support.',
    description: '`htop` is a modern, visual alternative to `top`. It offers color-coded visual graphs for each CPU core, memory/swap meters, process tree hierarchies, and shortcut keys for killing or renicing processes.',
    flags: [
      { flag: '-u [user]', desc: 'Display only processes belonging to a given user.' },
      { flag: '-t', desc: 'Show processes in an interactive tree view hierarchy.' }
    ],
    examples: [
      {
        title: 'Launch interactive process monitor',
        cmd: 'htop',
        explanation: 'Displays the interactive colorful process manager.'
      }
    ],
    relatedCommands: ['top', 'ps', 'kill', 'free'],
    faq: [
      {
        question: 'Why do developers prefer htop over top?',
        answer: '`htop` allows smooth vertical and horizontal scrolling, supports mouse clicks, provides per-core CPU bars, and lets you kill processes without typing PIDs manually.'
      }
    ],
    defaultSandboxCmd: 'htop'
  },
  {
    slug: 'kill',
    name: 'kill',
    category: 'System & Processes',
    syntax: 'kill [OPTIONS] PID...',
    summary: 'Send termination or control signals to processes by PID.',
    description: '`kill` transmits POSIX signals to running processes. Despite its name, `kill` is a signal dispatcher. By default, it sends `SIGTERM` (15), which politely asks a process to clean up resources and exit. If a program is completely frozen, `SIGKILL` (9) forcefully terminates it immediately.',
    flags: [
      { flag: '-9, -KILL', desc: 'Send SIGKILL to forcefully terminate a process immediately (cannot be caught or ignored).' },
      { flag: '-15, -TERM', desc: 'Send SIGTERM to request graceful termination (default signal).' },
      { flag: '-l', desc: 'List all available signal names and numbers.' }
    ],
    examples: [
      {
        title: 'Gracefully terminate process with PID 1024',
        cmd: 'kill 1024',
        explanation: 'Sends SIGTERM to allow graceful shutdown.'
      },
      {
        title: 'Force kill an unresponsive process',
        cmd: 'kill -9 1024',
        explanation: 'Immediately stops the process at the kernel level.'
      }
    ],
    relatedCommands: ['ps', 'top'],
    faq: [
      {
        question: 'Why should kill -9 be your last resort?',
        answer: 'SIGKILL does not give the application time to save open files, close database connections, or remove temporary lockfiles.'
      }
    ],
    defaultSandboxCmd: 'kill -l'
  },
  {
    slug: 'df',
    name: 'df',
    category: 'Disk & Storage',
    syntax: 'df [OPTIONS] [FILE...]',
    summary: 'Report file system disk space usage across mounted storage partitions.',
    description: '`df` (Disk Free) analyzes mounted filesystems to display total disk capacity, used space, available free space, and mount points. It is the first command sysadmins run when encountering "No space left on device" errors.',
    flags: [
      { flag: '-h, --human-readable', desc: 'Print sizes in human-readable powers of 1024 (e.g., 10G, 500M).' },
      { flag: '-T, --print-type', desc: 'Include filesystem type column (ext4, xfs, btrfs, tmpfs).' },
      { flag: '-i, --inodes', desc: 'Display inode usage statistics instead of block usage.' }
    ],
    examples: [
      {
        title: 'Check human-readable disk space',
        cmd: 'df -h',
        explanation: 'Displays disk usage for all mounted partitions with readable GB/MB units.',
        outputPreview: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   14G   34G  30% /\ntmpfs           3.9G     0  3.9G   0% /dev/shm'
      }
    ],
    relatedCommands: ['du', 'free'],
    faq: [
      {
        question: 'What does 100% inode usage mean in df -i?',
        answer: 'If inodes are 100% full, the disk cannot create new files even if `df -h` reports gigabytes of free disk space remaining.'
      }
    ],
    defaultSandboxCmd: 'df -h'
  },
  {
    slug: 'du',
    name: 'du',
    category: 'Disk & Storage',
    syntax: 'du [OPTIONS] [FILE...]',
    summary: 'Estimate file and directory space usage.',
    description: '`du` (Disk Usage) measures the space occupied by individual files and folders on disk. Unlike `df` which inspects entire partitions, `du` recursively scans directories to identify which folders or log files are consuming disk space.',
    flags: [
      { flag: '-s, --summarize', desc: 'Display only a total sum for each specified directory argument.' },
      { flag: '-h, --human-readable', desc: 'Print sizes in human readable format (e.g., 24K, 500M, 4G).' },
      { flag: '-d, --max-depth=N', desc: 'Print total for a directory only if it is N or fewer levels below.' }
    ],
    examples: [
      {
        title: 'Check folder size summary',
        cmd: 'du -sh /var/log',
        explanation: 'Outputs the total human-readable size of the /var/log directory.',
        outputPreview: '142M    /var/log'
      }
    ],
    relatedCommands: ['df', 'ls', 'find'],
    faq: [
      {
        question: 'What is the fastest command to find the largest directories on Linux?',
        answer: 'Run `du -sh /* 2>/dev/null | sort -hr | head -n 10` to display the top 10 largest folders sorted by size.'
      }
    ],
    defaultSandboxCmd: 'du -sh /home/user'
  },
  {
    slug: 'free',
    name: 'free',
    category: 'Disk & Storage',
    syntax: 'free [OPTIONS]',
    summary: 'Display total amount of free and used physical memory and swap.',
    description: '`free` provides an instant summary of system RAM and Swap memory utilization. It reports total, used, free, shared, buffer/cache, and available memory.',
    flags: [
      { flag: '-h, --human', desc: 'Show memory values in human-readable units (e.g., 8Gi, 512Mi).' },
      { flag: '-m, --mega', desc: 'Display amounts in megabytes.' },
      { flag: '-g, --giga', desc: 'Display amounts in gigabytes.' }
    ],
    examples: [
      {
        title: 'Check human-readable RAM usage',
        cmd: 'free -h',
        explanation: 'Prints RAM and swap memory in GB and MB.',
        outputPreview: '               total        used        free      shared  buff/cache   available\nMem:           7.8Gi       1.4Gi       4.2Gi        45Mi       2.2Gi       6.1Gi\nSwap:          2.0Gi          0B       2.0Gi'
      }
    ],
    relatedCommands: ['top', 'htop', 'df'],
    faq: [
      {
        question: 'Why does Linux report low free memory when my system is running fine?',
        answer: 'Linux uses spare RAM for caching disk files (buff/cache) to boost performance. If applications need memory, the kernel automatically frees the cache instantly. Look at the `available` column for true free capacity.'
      }
    ],
    defaultSandboxCmd: 'free -h'
  },
  {
    slug: 'curl',
    name: 'curl',
    category: 'Networking & Transfer',
    syntax: 'curl [OPTIONS] [URL...]',
    summary: 'Transfer data from or to a server using HTTP, HTTPS, FTP, and more.',
    description: '`curl` (Client URL) is a universal command-line utility for transferring data across networks. It supports HTTP, HTTPS, FTP, SFTP, and REST API testing with custom headers, authentication, cookies, and proxy routing.',
    flags: [
      { flag: '-I, --head', desc: 'Fetch HTTP response headers only without downloading body.' },
      { flag: '-L, --location', desc: 'Follow HTTP 301/302 redirects automatically.' },
      { flag: '-X, --request [METHOD]', desc: 'Specify custom HTTP request method (GET, POST, PUT, DELETE).' },
      { flag: '-d, --data [data]', desc: 'Send POST data payload in request body.' },
      { flag: '-H, --header [header]', desc: 'Pass custom HTTP request header (e.g., "Authorization: Bearer token").' },
      { flag: '-o [file]', desc: 'Write output to file instead of stdout.' }
    ],
    examples: [
      {
        title: 'Inspect HTTP response headers of a website',
        cmd: 'curl -I https://onlinelinuxterminal.com',
        explanation: 'Fetches HTTP status code, content-type, cache-control, and server headers.',
        outputPreview: 'HTTP/2 200\ncontent-type: text/html; charset=utf-8\nserver: cloudflare'
      },
      {
        title: 'Download a remote file',
        cmd: 'curl -O https://example.com/archive.zip',
        explanation: 'Downloads archive.zip preserving remote file name.'
      }
    ],
    relatedCommands: ['wget', 'ping'],
    faq: [
      {
        question: 'How do you send a JSON POST request with curl?',
        answer: 'Use `curl -X POST -H "Content-Type: application/json" -d \'{"key":"value"}\' https://api.example.com`.'
      }
    ],
    defaultSandboxCmd: 'curl -I https://onlinelinuxterminal.com'
  },
  {
    slug: 'wget',
    name: 'wget',
    category: 'Networking & Transfer',
    syntax: 'wget [OPTIONS] [URL...]',
    summary: 'Non-interactive network downloader for HTTP, HTTPS, and FTP.',
    description: '`wget` is a robust file downloader capable of recursive directory downloading, resuming interrupted transfers, and running unattended in the background.',
    flags: [
      { flag: '-c, --continue', desc: 'Resume getting a partially-downloaded file.' },
      { flag: '-b, --background', desc: 'Go to background immediately after startup.' },
      { flag: '-O [file]', desc: 'Write documents to specified filename.' },
      { flag: '-r, --recursive', desc: 'Specify recursive web crawling and downloading.' }
    ],
    examples: [
      {
        title: 'Download file from URL',
        cmd: 'wget https://example.com/installer.sh',
        explanation: 'Downloads installer.sh directly into the current directory.'
      }
    ],
    relatedCommands: ['curl'],
    faq: [
      {
        question: 'What is the main difference between curl and wget?',
        answer: '`wget` is specialized for downloading files, recursive mirroring, and resuming transfers. `curl` is a broader data transfer tool for interacting with REST APIs and sending complex requests.'
      }
    ],
    defaultSandboxCmd: 'wget --help'
  },
  {
    slug: 'tar',
    name: 'tar',
    category: 'Archives & Compression',
    syntax: 'tar [OPTIONS] [ARCHIVE-FILE] [FILE...]',
    summary: 'Archive multiple files into a single tape archive (.tar or .tar.gz).',
    description: '`tar` (Tape Archive) bundles multiple files and entire directory structures into a single uncompressed archive file, or compresses them on the fly using gzip (`.tar.gz`), bzip2 (`.tar.bz2`), or xz.',
    flags: [
      { flag: '-c, --create', desc: 'Create a new tar archive.' },
      { flag: '-x, --extract', desc: 'Extract files from an existing archive.' },
      { flag: '-z, --gzip', desc: 'Compress or decompress archive using gzip algorithm.' },
      { flag: '-v, --verbose', desc: 'Verbosely list files processed.' },
      { flag: '-f, --file [ARCHIVE]', desc: 'Use archive file specified.' },
      { flag: '-t, --list', desc: 'List the contents of an archive without extracting it.' }
    ],
    examples: [
      {
        title: 'Compress a folder into a .tar.gz archive',
        cmd: 'tar -czvf backup.tar.gz /home/user/projects',
        explanation: 'Creates a compressed archive named backup.tar.gz containing all files in projects.',
        outputPreview: 'backup.tar.gz created successfully.'
      },
      {
        title: 'Extract a .tar.gz archive',
        cmd: 'tar -xzvf backup.tar.gz -C /tmp',
        explanation: 'Extracts all contents of backup.tar.gz into the /tmp directory.'
      }
    ],
    relatedCommands: ['gzip', 'cp'],
    faq: [
      {
        question: 'How do you remember the tar flags for extracting vs creating?',
        answer: 'Think **-czvf** for **C**reate Zip Verbose File, and **-xzvf** for e**X**tract Zip Verbose File.'
      }
    ],
    defaultSandboxCmd: 'tar --help'
  },
  {
    slug: 'gzip',
    name: 'gzip',
    category: 'Archives & Compression',
    syntax: 'gzip [OPTIONS] [FILE...]',
    summary: 'Compress or expand files using Lempel-Ziv coding (LZ77).',
    description: '`gzip` compresses individual files, replacing them with `.gz` extensions. It is the standard compression format across Linux for package distribution, web compression, and system log archiving.',
    flags: [
      { flag: '-d, --decompress', desc: 'Decompress files (same as gunzip).' },
      { flag: '-k, --keep', desc: 'Keep (do not delete) original input files during compression.' },
      { flag: '-9, --best', desc: 'Use maximum compression ratio (slower).' }
    ],
    examples: [
      {
        title: 'Compress a log file',
        cmd: 'gzip -k notes.txt && ls -l notes.txt*',
        explanation: 'Compresses notes.txt to notes.txt.gz while preserving original notes.txt.',
        outputPreview: '-rw-r--r-- 1 user user 1200 notes.txt\n-rw-r--r-- 1 user user  420 notes.txt.gz'
      }
    ],
    relatedCommands: ['tar'],
    faq: [
      {
        question: 'Can gzip compress a directory directly without tar?',
        answer: 'No, `gzip` only compresses individual files. To compress a whole folder, bundle it first with `tar` (producing a `.tar.gz`).'
      }
    ],
    defaultSandboxCmd: 'gzip -k welcome.txt && ls -l'
  },
  {
    slug: 'sudo',
    name: 'sudo',
    category: 'Permissions & Security',
    syntax: 'sudo [OPTIONS] COMMAND',
    summary: 'Execute a command with superuser (root) security privileges.',
    description: '`sudo` (SuperUser DO) allows authorized users to execute sensitive system administration commands with root privileges according to the `/etc/sudoers` policy.',
    flags: [
      { flag: '-i, --login', desc: 'Launch an interactive login shell as the root user.' },
      { flag: '-u [user]', desc: 'Run command as a specified user instead of root.' },
      { flag: '-l', desc: 'List allowed and forbidden commands for the invoking user.' }
    ],
    examples: [
      {
        title: 'Update system package index as root',
        cmd: 'sudo apt update',
        explanation: 'Elevates privileges to refresh package repositories.'
      }
    ],
    relatedCommands: ['whoami', 'chmod', 'chown'],
    faq: [
      {
        question: 'What is the difference between sudo and su?',
        answer: '`sudo` runs an individual command with root privileges using your own password. `su` switches your entire shell session to root or another user and requires that target user password.'
      }
    ],
    defaultSandboxCmd: 'sudo whoami'
  },
  {
    slug: 'whoami',
    name: 'whoami',
    category: 'System & Processes',
    syntax: 'whoami [OPTIONS]',
    summary: 'Print the effective username associated with the current shell session.',
    description: '`whoami` outputs the username of the currently logged-in effective user. It is widely used in shell scripts to verify whether execution is running under root or an unprivileged service account.',
    flags: [
      { flag: '--help', desc: 'Display help summary and exit.' },
      { flag: '--version', desc: 'Output version information and exit.' }
    ],
    examples: [
      {
        title: 'Check active user identity',
        cmd: 'whoami',
        explanation: 'Prints current session username.',
        outputPreview: 'user'
      }
    ],
    relatedCommands: ['sudo', 'uname'],
    faq: [
      {
        question: 'How is whoami different from the id command?',
        answer: '`whoami` prints only the username string, whereas `id` prints the numeric UID, primary GID, and all secondary groups.'
      }
    ],
    defaultSandboxCmd: 'whoami'
  },
  {
    slug: 'date',
    name: 'date',
    category: 'System & Processes',
    syntax: 'date [OPTIONS] [+FORMAT]',
    summary: 'Display or set system date and time.',
    description: '`date` prints or sets the system date, time, and timezone. In shell scripts, it is commonly formatted (e.g., `date +%Y-%m-%d`) to generate timestamped backup filenames and logs.',
    flags: [
      { flag: '+%Y-%m-%d', desc: 'Format output as Year-Month-Day (e.g., 2026-08-29).' },
      { flag: '-u, --utc', desc: 'Print date and time in Coordinated Universal Time (UTC).' }
    ],
    examples: [
      {
        title: 'Print current date and time',
        cmd: 'date',
        explanation: 'Outputs the standard system timestamp.'
      }
    ],
    relatedCommands: ['uname'],
    faq: [
      {
        question: 'How do you format a timestamp for backup filenames?',
        answer: 'Run `date +%Y%m%d_%H%M%S` which produces a clean format like `20260829_120000`.'
      }
    ],
    defaultSandboxCmd: 'date'
  },
  {
    slug: 'uname',
    name: 'uname',
    category: 'System & Processes',
    syntax: 'uname [OPTIONS]',
    summary: 'Print operating system name and kernel architecture.',
    description: '`uname` (Unix Name) prints details about the current operating system, Linux kernel version, hostname, and CPU architecture (x86_64, aarch64, arm).',
    flags: [
      { flag: '-a, --all', desc: 'Print all system info in sequence (kernel name, hostname, release, version, machine).' },
      { flag: '-r, --kernel-release', desc: 'Print the kernel release version.' },
      { flag: '-m, --machine', desc: 'Print the machine hardware architecture (e.g., x86_64).' }
    ],
    examples: [
      {
        title: 'Print complete system information',
        cmd: 'uname -a',
        explanation: 'Displays Linux kernel release, architecture, and build timestamps.',
        outputPreview: 'Linux linux-box 6.8.0-generic #42-Ubuntu SMP x86_64 GNU/Linux'
      }
    ],
    relatedCommands: ['whoami', 'date'],
    faq: [
      {
        question: 'How do you check if your Linux system is 64-bit or 32-bit?',
        answer: 'Run `uname -m`. If it prints `x86_64` or `aarch64`, it is 64-bit; if `i686` or `armv7l`, it is 32-bit.'
      }
    ],
    defaultSandboxCmd: 'uname -a'
  },
  {
    slug: 'history',
    name: 'history',
    category: 'System & Processes',
    syntax: 'history [OPTIONS]',
    summary: 'Display the list of previously executed terminal commands.',
    description: '`history` shows the shell history list with line numbers. It allows users to review previous commands, audit actions, or re-run previous commands using the `!n` event recall syntax.',
    flags: [
      { flag: '-c', desc: 'Clear the history list in the current session.' },
      { flag: '-d [OFFSET]', desc: 'Delete the history entry at position OFFSET.' },
      { flag: '[N]', desc: 'List only the last N commands.' }
    ],
    examples: [
      {
        title: 'View recent command history',
        cmd: 'history',
        explanation: 'Outputs the chronological list of commands executed in the session.'
      }
    ],
    relatedCommands: ['clear'],
    faq: [
      {
        question: 'How do you quickly re-run the last executed command?',
        answer: 'Type `!!` and press Enter to execute the previous command, or `!grep` to re-run the most recent command starting with grep.'
      }
    ],
    defaultSandboxCmd: 'history'
  },
  {
    slug: 'clear',
    name: 'clear',
    category: 'System & Processes',
    syntax: 'clear',
    summary: 'Clear the terminal screen display and scrollback buffer.',
    description: '`clear` clears your terminal canvas, giving you a clean working space with the prompt placed at the top of the window. You can also trigger this anytime with the `Ctrl + L` keyboard shortcut.',
    flags: [
      { flag: '-x', desc: 'Do not clear the scrollback buffer; only scroll current screen view.' }
    ],
    examples: [
      {
        title: 'Clear terminal screen',
        cmd: 'clear',
        explanation: 'Wipes the screen buffer and resets prompt to top.'
      }
    ],
    relatedCommands: ['history'],
    faq: [
      {
        question: 'What is the keyboard shortcut for clear?',
        answer: 'Pressing `Ctrl + L` in almost all Linux shells instantly clears the screen.'
      }
    ],
    defaultSandboxCmd: 'clear'
  },
  {
    slug: 'which',
    name: 'which',
    category: 'Navigation',
    syntax: 'which [OPTIONS] [COMMAND...]',
    summary: 'Locate the executable binary path of a command in system PATH.',
    description: '`which` searches the directories listed in your `$PATH` environment variable to find and display the absolute location of an executable binary file.',
    flags: [
      { flag: '-a', desc: 'Print all matching pathnames of each argument across PATH.' }
    ],
    examples: [
      {
        title: 'Find where python3 or grep is installed',
        cmd: 'which grep python3',
        explanation: 'Outputs the binary paths in /usr/bin or /bin.',
        outputPreview: '/usr/bin/grep\n/usr/bin/python3'
      }
    ],
    relatedCommands: ['find', 'ls'],
    faq: [
      {
        question: 'What is the difference between which and whereis?',
        answer: '`which` locates only the executable binary in `$PATH`, while `whereis` also locates source files and man documentation pages.'
      }
    ],
    defaultSandboxCmd: 'which grep bash cat'
  },
  {
    slug: 'nano',
    name: 'nano',
    category: 'Editors & Shell',
    syntax: 'nano [OPTIONS] [FILE...]',
    summary: 'Simple, user-friendly in-terminal text editor.',
    description: '`nano` is a modeless, beginner-friendly command-line text editor for Unix-like systems. It displays keyboard shortcuts at the bottom of the screen, making editing configuration files accessible without learning complex modal commands.',
    flags: [
      { flag: '-l, --linenumbers', desc: 'Display line numbers to the left of the text.' },
      { flag: '-m, --mouse', desc: 'Enable mouse support for cursor placement and selection.' }
    ],
    examples: [
      {
        title: 'Open notes.txt in nano text editor',
        cmd: 'nano notes.txt',
        explanation: 'Opens the interactive text editor modal in browser.'
      }
    ],
    relatedCommands: ['vim', 'cat', 'touch'],
    faq: [
      {
        question: 'How do you save and exit in nano?',
        answer: 'Press `Ctrl + O` then Enter to Save (Write Out), and `Ctrl + X` to Exit.'
      }
    ],
    defaultSandboxCmd: 'nano notes.txt'
  },
  {
    slug: 'vim',
    name: 'vim',
    category: 'Editors & Shell',
    syntax: 'vim [OPTIONS] [FILE...]',
    summary: 'Highly configurable, powerful modal text editor.',
    description: '`vim` (Vi IMproved) is an advanced modal text editor built for efficient text editing. It uses distinct modes: Normal mode for navigation, Insert mode (`i`) for typing text, Visual mode (`v`) for selecting blocks, and Command mode (`:`) for file saving and quitting (`:wq`).',
    flags: [
      { flag: '+[num]', desc: 'Start editing file at specified line number.' },
      { flag: '-R', desc: 'Read-only mode to prevent accidental overwrites.' }
    ],
    examples: [
      {
        title: 'Edit configuration in vim',
        cmd: 'vim welcome.txt',
        explanation: 'Launches vim editor modal in the sandbox.'
      }
    ],
    relatedCommands: ['nano', 'cat'],
    faq: [
      {
        question: 'How do you exit vim?',
        answer: 'Press `Esc`, type `:wq` and hit Enter to save and quit, or `:q!` to quit without saving.'
      }
    ],
    defaultSandboxCmd: 'vim welcome.txt'
  },
  {
    slug: 'apt',
    name: 'apt',
    category: 'Package Management',
    syntax: 'apt [OPTIONS] COMMAND',
    summary: 'Debian and Ubuntu command-line package management tool.',
    description: '`apt` (Advanced Package Tool) is the high-level package manager for Debian, Ubuntu, and derivative Linux distributions. It handles searching, installing, upgrading, and removing software packages and resolving dependencies automatically.',
    flags: [
      { flag: 'update', desc: 'Download updated package lists and version metadata from repositories.' },
      { flag: 'upgrade', desc: 'Upgrade all installed packages to their newest available versions.' },
      { flag: 'install [pkg]', desc: 'Download and install specified software package.' },
      { flag: 'remove [pkg]', desc: 'Uninstall specified package while keeping configuration files.' }
    ],
    examples: [
      {
        title: 'Install cowsay ASCII utility in sandbox',
        cmd: 'apt install cowsay && cowsay "Linux is awesome!"',
        explanation: 'Installs the cowsay utility into the virtual filesystem and runs it.',
        outputPreview: ' < Linux is awesome! >\n --------\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||'
      }
    ],
    relatedCommands: ['sudo'],
    faq: [
      {
        question: 'What is the difference between apt and apt-get?',
        answer: '`apt` is designed for interactive end-user use with color output and progress bars. `apt-get` is the lower-level tool preferred in automated bash scripts.'
      }
    ],
    defaultSandboxCmd: 'apt install cowsay'
  },
  {
    slug: 'cowsay',
    name: 'cowsay',
    category: 'Editors & Shell',
    syntax: 'cowsay [OPTIONS] [MESSAGE]',
    summary: 'Generate an ASCII art picture of a cow with a message speech bubble.',
    description: '`cowsay` is a classic Unix novelty program that generates a humorous ASCII art cow speaking or thinking text supplied by the user or piped from other commands.',
    flags: [
      { flag: '-d', desc: 'Dead cow face appearance.' },
      { flag: '-g', desc: 'Greedy cow mode with dollar sign eyes.' }
    ],
    examples: [
      {
        title: 'Generate speaking cow banner',
        cmd: 'cowsay "Welcome to Online Linux Terminal!"',
        explanation: 'Renders speech bubble with ASCII cow illustration.'
      }
    ],
    relatedCommands: ['figlet', 'echo'],
    faq: [
      {
        question: 'How do you pipe command output into cowsay?',
        answer: 'Run `uname -a | cowsay` or `date | cowsay` to have the cow announce system info!'
      }
    ],
    defaultSandboxCmd: 'cowsay "Linux CLI in your browser!"'
  },
  {
    slug: 'figlet',
    name: 'figlet',
    category: 'Editors & Shell',
    syntax: 'figlet [OPTIONS] [TEXT...]',
    summary: 'Generate large text banners using ASCII art characters.',
    description: '`figlet` reads text and outputs large stylized ASCII art banners, commonly used in system MOTD (Message Of The Day) login banners and script headers.',
    flags: [
      { flag: '-c', desc: 'Center the output banner text on the screen.' },
      { flag: '-f [font]', desc: 'Specify custom ASCII font style.' }
    ],
    examples: [
      {
        title: 'Create large ASCII terminal banner',
        cmd: 'figlet "LINUX"',
        explanation: 'Outputs huge stylized ASCII text.'
      }
    ],
    relatedCommands: ['cowsay', 'echo'],
    faq: [
      {
        question: 'Where is figlet used in real Linux servers?',
        answer: 'It is commonly configured in `/etc/motd` to display the server hostname when SSH users log in.'
      }
    ],
    defaultSandboxCmd: 'figlet "LINUX TERMINAL"'
  },
  {
    slug: 'tree',
    name: 'tree',
    category: 'Navigation',
    syntax: 'tree [OPTIONS] [DIRECTORY]',
    summary: 'Display directory structure in a recursive visual tree diagram.',
    description: '`tree` is a recursive directory listing program that produces a depth-indented visual tree of files and folders.',
    flags: [
      { flag: '-L [level]', desc: 'Max display depth of the directory tree.' },
      { flag: '-d', desc: 'List directories only without listing files.' },
      { flag: '-a', desc: 'All files are listed including hidden files.' }
    ],
    examples: [
      {
        title: 'Visualize directory tree up to depth 2',
        cmd: 'tree -L 2 /home/user',
        explanation: 'Outputs folder tree hierarchy.'
      }
    ],
    relatedCommands: ['ls', 'find', 'pwd'],
    faq: [
      {
        question: 'How do you prevent tree from flooding your screen on big folders?',
        answer: 'Use the `-L` flag (e.g., `tree -L 2`) to restrict visualization depth.'
      }
    ],
    defaultSandboxCmd: 'tree /home/user'
  },
  {
    slug: 'ping',
    name: 'ping',
    category: 'Networking & Transfer',
    syntax: 'ping [OPTIONS] DESTINATION',
    summary: 'Send ICMP ECHO_REQUEST to network hosts to test connectivity and latency.',
    description: '`ping` is the fundamental network diagnostics tool used to verify whether a remote host or IP address is reachable across an IP network. It measures the round-trip time (RTT) for packets sent from the local machine to a destination and reports packet loss percentages.',
    flags: [
      { flag: '-c [count]', desc: 'Stop sending ECHO_REQUEST packets after count packets are sent.' },
      { flag: '-i [interval]', desc: 'Wait interval seconds between sending each packet (default 1s).' },
      { flag: '-W [timeout]', desc: 'Time to wait for a response in seconds before timing out.' }
    ],
    examples: [
      {
        title: 'Ping a host with limited count',
        cmd: 'ping -c 4 onlinelinuxterminal.com',
        explanation: 'Sends exactly 4 ICMP packets to test network latency and packet loss.',
        outputPreview: 'PING onlinelinuxterminal.com (104.21.72.10): 56 data bytes\n64 bytes from 104.21.72.10: icmp_seq=0 ttl=58 time=12.4 ms\n64 bytes from 104.21.72.10: icmp_seq=1 ttl=58 time=11.8 ms\n--- onlinelinuxterminal.com ping statistics ---\n4 packets transmitted, 4 packets received, 0.0% packet loss'
      }
    ],
    relatedCommands: ['curl', 'netstat', 'traceroute'],
    faq: [
      {
        question: 'Why does ping run indefinitely on Linux?',
        answer: 'By default, Linux `ping` continues until you interrupt it with `Ctrl + C`, or specify `-c [count]`.'
      }
    ],
    defaultSandboxCmd: 'ping -c 4 onlinelinuxterminal.com'
  },
  {
    slug: 'netstat',
    name: 'netstat',
    category: 'Networking & Transfer',
    syntax: 'netstat [OPTIONS]',
    summary: 'Print network connections, routing tables, interface statistics, and listening ports.',
    description: '`netstat` (Network Statistics) provides comprehensive visibility into incoming and outgoing network connections, listening TCP/UDP ports, routing tables, and interface metrics.',
    flags: [
      { flag: '-t', desc: 'Display TCP network connections.' },
      { flag: '-u', desc: 'Display UDP network connections.' },
      { flag: '-l', desc: 'Show only listening server sockets.' },
      { flag: '-p', desc: 'Show the PID and program name to which each socket belongs.' },
      { flag: '-n', desc: 'Show numerical addresses and port numbers instead of resolving hostnames.' }
    ],
    examples: [
      {
        title: 'Check all listening ports and services',
        cmd: 'netstat -tuln',
        explanation: 'Lists all open TCP and UDP ports in numeric format.',
        outputPreview: 'Proto Recv-Q Send-Q Local Address           Foreign Address         State\ntcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN\ntcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN'
      }
    ],
    relatedCommands: ['ss', 'ping', 'curl'],
    faq: [
      {
        question: 'What is the modern replacement for netstat in newer Linux distributions?',
        answer: 'The `ss` (Socket Statistics) command from `iproute2` is the faster, modern successor to `netstat`.'
      }
    ],
    defaultSandboxCmd: 'netstat -tuln'
  },
  {
    slug: 'ssh',
    name: 'ssh',
    category: 'Networking & Transfer',
    syntax: 'ssh [OPTIONS] [USER@]HOSTNAME [COMMAND]',
    summary: 'Securely log into remote Linux servers and execute commands over encrypted connections.',
    description: '`ssh` (Secure Shell) is the industry-standard cryptographic network protocol for operating network services securely over an unsecured network. It provides end-to-end encrypted terminal login, remote command execution, and port forwarding.',
    flags: [
      { flag: '-p [port]', desc: 'Port to connect to on the remote server (default is 22).' },
      { flag: '-i [keyfile]', desc: 'Select private key identity file for public key authentication (e.g., ~/.ssh/id_rsa).' },
      { flag: '-v', desc: 'Verbose mode for debugging SSH connection and handshake failures.' }
    ],
    examples: [
      {
        title: 'Connect to remote server using custom key',
        cmd: 'ssh -i ~/.ssh/id_ed25519 user@remote-server.com',
        explanation: 'Initiates encrypted SSH session using ED25519 public key authentication.'
      }
    ],
    relatedCommands: ['scp', 'rsync', 'curl'],
    faq: [
      {
        question: 'How do you generate an SSH key pair in Linux?',
        answer: 'Run `ssh-keygen -t ed25519 -C "your_email@example.com"` and follow the prompts to create your key in `~/.ssh/`.'
      }
    ],
    defaultSandboxCmd: 'ssh --help'
  },
  {
    slug: 'scp',
    name: 'scp',
    category: 'Networking & Transfer',
    syntax: 'scp [OPTIONS] SOURCE DEST',
    summary: 'Securely copy files and directories between hosts over SSH connection.',
    description: '`scp` (Secure Copy Protocol) transfers files securely between a local host and a remote host, or between two remote servers, using the same authentication and encryption as SSH.',
    flags: [
      { flag: '-r', desc: 'Recursively copy entire directories.' },
      { flag: '-P [port]', desc: 'Specify port to connect to on the remote host.' },
      { flag: '-i [keyfile]', desc: 'Identity file for SSH private key authentication.' }
    ],
    examples: [
      {
        title: 'Copy a local file to remote server',
        cmd: 'scp notes.txt user@remote-server:/home/user/docs/',
        explanation: 'Uploads notes.txt to the remote server directory over SSH.'
      }
    ],
    relatedCommands: ['rsync', 'ssh', 'cp'],
    faq: [
      {
        question: 'Why do developers prefer rsync over scp for large backups?',
        answer: '`rsync` can resume interrupted transfers and only transfers modified delta byte chunks, saving enormous bandwidth.'
      }
    ],
    defaultSandboxCmd: 'scp --help'
  },
  {
    slug: 'rsync',
    name: 'rsync',
    category: 'Networking & Transfer',
    syntax: 'rsync [OPTIONS] SOURCE... DEST',
    summary: 'Fast and versatile remote and local file-copying and synchronization tool.',
    description: '`rsync` (Remote Sync) synchronizes files and directories between two locations with delta-transfer algorithm, minimizing data transfer by sending only the differences between files.',
    flags: [
      { flag: '-a, --archive', desc: 'Archive mode (preserves permissions, timestamps, symlinks, owners, groups).' },
      { flag: '-v, --verbose', desc: 'Increase verbosity showing transferred files.' },
      { flag: '-z, --compress', desc: 'Compress file data during transfer.' },
      { flag: '--delete', desc: 'Delete extraneous files from destination directories that no longer exist in source.' }
    ],
    examples: [
      {
        title: 'Synchronize local directory with remote backup',
        cmd: 'rsync -avz /home/user/projects/ user@backup-server:/backups/projects/',
        explanation: 'Transfers and synchronizes project folder with compression and archive preservation.'
      }
    ],
    relatedCommands: ['scp', 'cp', 'tar'],
    faq: [
      {
        question: 'What is the trailing slash difference in rsync source paths?',
        answer: '`rsync -a src/ dst/` copies the *contents* of `src` into `dst`, whereas `rsync -a src dst/` creates the folder `dst/src`.'
      }
    ],
    defaultSandboxCmd: 'rsync --help'
  },
  {
    slug: 'systemctl',
    name: 'systemctl',
    category: 'System & Processes',
    syntax: 'systemctl [OPTIONS] COMMAND [UNIT...]',
    summary: 'Control and inspect the systemd system and service manager.',
    description: '`systemctl` is the central management tool for controlling systemd services, daemons, timers, and system states (boot targets, reboots, shutdowns) on modern Linux distributions.',
    flags: [
      { flag: 'status [service]', desc: 'Check running status, memory, and recent log entries of a service.' },
      { flag: 'start [service]', desc: 'Start (activate) one or more service units.' },
      { flag: 'stop [service]', desc: 'Stop (deactivate) one or more service units.' },
      { flag: 'restart [service]', desc: 'Stop and then start the specified service.' },
      { flag: 'enable [service]', desc: 'Enable service to start automatically on system boot.' }
    ],
    examples: [
      {
        title: 'Check status of nginx web server',
        cmd: 'systemctl status nginx',
        explanation: 'Inspects running state, PID, uptime, and recent journal logs for nginx.',
        outputPreview: '● nginx.service - A high performance web server\n   Loaded: loaded (/lib/systemd/system/nginx.service; enabled)\n   Active: active (running) since Fri 2026-08-28 10:00:00 UTC\n  Main PID: 1234 (nginx)'
      }
    ],
    relatedCommands: ['journalctl', 'ps', 'top', 'service'],
    faq: [
      {
        question: 'What is the difference between systemctl restart and systemctl reload?',
        answer: '`restart` stops and restarts the process (causing brief downtime). `reload` tells the service to reload its configuration files on the fly without dropping active connections.'
      }
    ],
    defaultSandboxCmd: 'systemctl status nginx'
  },
  {
    slug: 'crontab',
    name: 'crontab',
    category: 'System & Processes',
    syntax: 'crontab [OPTIONS]',
    summary: 'Schedule recurring background cron jobs and automated tasks.',
    description: '`crontab` (Cron Table) allows users to schedule automated scripts, database backups, and maintenance routines to execute periodically at specific minutes, hours, days, or months.',
    flags: [
      { flag: '-l', desc: 'Display (list) current crontab file contents.' },
      { flag: '-e', desc: 'Edit current crontab entries in system text editor.' },
      { flag: '-r', desc: 'Remove current crontab file completely.' }
    ],
    examples: [
      {
        title: 'List scheduled cron jobs',
        cmd: 'crontab -l',
        explanation: 'Outputs active scheduled cron jobs for the current user.',
        outputPreview: '# Run database backup daily at 2:00 AM\n0 2 * * * /home/user/scripts/backup.sh'
      }
    ],
    relatedCommands: ['systemctl', 'date', 'at'],
    faq: [
      {
        question: 'What does * * * * * mean in crontab syntax?',
        answer: 'The 5 fields correspond to: **Minute (0-59)**, **Hour (0-23)**, **Day of Month (1-31)**, **Month (1-12)**, and **Day of Week (0-6)**. `* * * * *` executes every single minute.'
      }
    ],
    defaultSandboxCmd: 'crontab -l'
  },
  {
    slug: 'export',
    name: 'export',
    category: 'Editors & Shell',
    syntax: 'export [NAME[=VALUE]...]',
    summary: 'Set and export environment variables to child shell processes.',
    description: '`export` marks shell variables to be exported to the environment of subsequently executed child commands and subshells.',
    flags: [
      { flag: '-p', desc: 'Display a list of all exported variables in the current shell.' }
    ],
    examples: [
      {
        title: 'Export an environment variable',
        cmd: 'export NODE_ENV=production && echo $NODE_ENV',
        explanation: 'Sets NODE_ENV to production and verifies with echo.',
        outputPreview: 'production'
      }
    ],
    relatedCommands: ['env', 'echo', 'alias'],
    faq: [
      {
        question: 'How do you make exported variables permanent across reboots?',
        answer: 'Add the `export VAR=value` statement to your `~/.bashrc` or `~/.profile` configuration file.'
      }
    ],
    defaultSandboxCmd: 'export APP_PORT=8080 && echo $APP_PORT'
  }
];


export const COMMAND_CATEGORIES = [
  'All',
  'Navigation',
  'File Operations',
  'Text Processing',
  'Permissions & Security',
  'System & Processes',
  'Disk & Storage',
  'Networking & Transfer',
  'Archives & Compression',
  'Package Management',
  'Editors & Shell'
] as const;
