import type { VFSNode } from './types';

export const INITIAL_VFS: VFSNode = {
  id: 'root',
  name: '/',
  type: 'directory',
  permissions: 'rwxr-xr-x',
  owner: 'root',
  group: 'root',
  size: 4096,
  updatedAt: '2026-08-19 12:00:00',
  children: [
    {
      id: 'dir-home',
      name: 'home',
      type: 'directory',
      permissions: 'rwxr-xr-x',
      owner: 'root',
      group: 'root',
      size: 4096,
      updatedAt: '2026-08-19 12:00:00',
      children: [
        {
          id: 'dir-user',
          name: 'user',
          type: 'directory',
          permissions: 'rwxr-xr-x',
          owner: 'user',
          group: 'user',
          size: 4096,
          updatedAt: '2026-08-19 12:00:00',
          children: [
            {
              id: 'file-welcome',
              name: 'welcome.txt',
              type: 'file',
              permissions: 'rw-r--r--',
              owner: 'user',
              group: 'user',
              size: 482,
              updatedAt: '2026-08-19 12:05:00',
              content: `=====================================================
  WELCOME TO ONLINE LINUX TERMINAL (onlinelinuxterminal.com)
=====================================================

You are in a fully functional client-side Linux simulation!

Quick tips to get started:
  - Run 'ls -l' to inspect your current directory files.
  - Run 'cat welcome.txt' to view file contents.
  - Run 'nano notes.txt' to launch the interactive editor.
  - Run 'grep error /var/log/syslog' to search log files.
  - Run 'apt install cowsay' to try simulated package installs!
  - Run 'help' to see all supported commands.

Happy Hacking!`
            },
            {
              id: 'file-notes',
              name: 'notes.txt',
              type: 'file',
              permissions: 'rw-r--r--',
              owner: 'user',
              group: 'user',
              size: 215,
              updatedAt: '2026-08-19 12:10:00',
              content: `TODO List:
1. Practice bash commands: ls, grep, find, chmod, cat
2. Complete Linux basics tutorial at /tutorials/
3. Fix server permissions on auth.log
4. Test curl fetch command on public APIs`
            },
            {
              id: 'file-data',
              name: 'data.csv',
              type: 'file',
              permissions: 'rw-r--r--',
              owner: 'user',
              group: 'user',
              size: 240,
              updatedAt: '2026-08-19 12:15:00',
              content: `id,name,role,status
101,Alice,DevOps,active
102,Bob,Frontend,inactive
103,Charlie,Security,active
104,Diana,SRE,active
105,Eve,DataEngineer,pending`
            },
            {
              id: 'dir-projects',
              name: 'projects',
              type: 'directory',
              permissions: 'rwxr-xr-x',
              owner: 'user',
              group: 'user',
              size: 4096,
              updatedAt: '2026-08-19 12:20:00',
              children: [
                {
                  id: 'file-script',
                  name: 'demo.sh',
                  type: 'file',
                  permissions: 'rwxr-xr-x',
                  owner: 'user',
                  group: 'user',
                  size: 145,
                  updatedAt: '2026-08-19 12:22:00',
                  content: `#!/bin/bash
echo "Initializing Online Linux Terminal System..."
date
whoami
echo "System Ready!"`
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'dir-etc',
      name: 'etc',
      type: 'directory',
      permissions: 'rwxr-xr-x',
      owner: 'root',
      group: 'root',
      size: 4096,
      updatedAt: '2026-08-19 12:00:00',
      children: [
        {
          id: 'file-osrelease',
          name: 'os-release',
          type: 'file',
          permissions: 'rw-r--r--',
          owner: 'root',
          group: 'root',
          size: 180,
          updatedAt: '2026-08-19 12:00:00',
          content: `NAME="Online Linux Terminal OS"
VERSION="1.0.0 (AST Sandbox)"
ID=onlinelinuxterminal
PRETTY_NAME="Online Linux Terminal v1.0"
HOME_URL="https://onlinelinuxterminal.com"`
        },
        {
          id: 'file-hostname',
          name: 'hostname',
          type: 'file',
          permissions: 'rw-r--r--',
          owner: 'root',
          group: 'root',
          size: 19,
          updatedAt: '2026-08-19 12:00:00',
          content: 'linux-terminal-box'
        },
        {
          id: 'file-passwd',
          name: 'passwd',
          type: 'file',
          permissions: 'rw-r--r--',
          owner: 'root',
          group: 'root',
          size: 95,
          updatedAt: '2026-08-19 12:00:00',
          content: `root:x:0:0:root:/root:/bin/bash
user:x:1000:1000:user:/home/user:/bin/bash`
        }
      ]
    },
    {
      id: 'dir-var',
      name: 'var',
      type: 'directory',
      permissions: 'rwxr-xr-x',
      owner: 'root',
      group: 'root',
      size: 4096,
      updatedAt: '2026-08-19 12:00:00',
      children: [
        {
          id: 'dir-log',
          name: 'log',
          type: 'directory',
          permissions: 'rwxr-xr-x',
          owner: 'root',
          group: 'root',
          size: 4096,
          updatedAt: '2026-08-19 12:00:00',
          children: [
            {
              id: 'file-syslog',
              name: 'syslog',
              type: 'file',
              permissions: 'rw-r--r--',
              owner: 'root',
              group: 'root',
              size: 410,
              updatedAt: '2026-08-19 12:30:00',
              content: `Aug 19 12:00:01 kernel: [0.000000] Linux version 6.8.0-online-term
Aug 19 12:00:02 systemd[1]: Starting Network Manager...
Aug 19 12:00:03 systemd[1]: Started Network Manager.
Aug 19 12:05:14 sshd[142]: Accepted password for user from 192.168.1.50 port 54321
Aug 19 12:12:00 kernel: [120.4] warning: high memory usage in AST sandbox
Aug 19 12:20:45 app[882]: error: failed to connect to database host db.local`
            },
            {
              id: 'file-authlog',
              name: 'auth.log',
              type: 'file',
              permissions: 'rw-r-----',
              owner: 'root',
              group: 'adm',
              size: 310,
              updatedAt: '2026-08-19 12:31:00',
              content: `Aug 19 12:01:00 sshd[101]: Failed password for invalid user admin from 10.0.0.15
Aug 19 12:01:04 sshd[101]: Failed password for invalid user root from 10.0.0.15
Aug 19 12:05:14 sshd[142]: Accepted publickey for user from 192.168.1.50
Aug 19 12:25:00 sudo: user : TTY=pts/0 ; PWD=/home/user ; COMMAND=/usr/bin/apt update`
            }
          ]
        }
      ]
    },
    {
      id: 'dir-tmp',
      name: 'tmp',
      type: 'directory',
      permissions: 'rwxrwxrwt',
      owner: 'root',
      group: 'root',
      size: 4096,
      updatedAt: '2026-08-19 12:00:00',
      children: []
    }
  ]
};
