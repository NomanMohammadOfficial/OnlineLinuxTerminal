export interface VFSNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  permissions: string; // e.g., 'rwxr-xr-x'
  owner: string;
  group: string;
  size: number;
  updatedAt: string;
  content?: string;
  children?: VFSNode[];
}

export interface ShellEnv {
  USER: string;
  HOME: string;
  PATH: string;
  SHELL: string;
  TERM: string;
  PWD: string;
  [key: string]: string;
}

export interface ExecutionResult {
  output: string;
  exitCode: number;
  newPwd?: string;
  openEditor?: {
    filename: string;
    content: string;
  };
  installedPkg?: string;
}
