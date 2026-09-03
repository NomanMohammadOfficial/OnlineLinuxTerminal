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
  - Run 'sudo su' to switch to superuser root privileges.
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
              id: 'file-deploy',
              name: 'deploy.sh',
              type: 'file',
              permissions: 'rwxr-xr-x',
              owner: 'user',
              group: 'user',
              size: 110,
              updatedAt: '2026-08-19 12:18:00',
              content: `#!/bin/bash
echo "Deploying application v1.0..."
echo "Running health checks..."
echo "Deployment successful!"`
            },
            {
              id: 'file-config',
              name: 'config.txt',
              type: 'file',
              permissions: 'rw-r--r--',
              owner: 'user',
              group: 'user',
              size: 120,
              updatedAt: '2026-08-19 12:19:00',
              content: `server_port=8080
environment=production
max_connections=1000
debug_mode=false`
            },
            {
              id: 'file-idrsa',
              name: 'id_rsa',
              type: 'file',
              permissions: 'rw-------',
              owner: 'user',
              group: 'user',
              size: 260,
              updatedAt: '2026-08-19 12:19:30',
              content: `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACD7exampleprivatekeynotrealforsecuritysandbox0123456789==
-----END OPENSSH PRIVATE KEY-----`
            },
            {
              id: 'file-run',
              name: 'run.sh',
              type: 'file',
              permissions: 'rwxr-xr-x',
              owner: 'user',
              group: 'user',
              size: 80,
              updatedAt: '2026-08-19 12:19:45',
              content: `#!/bin/bash
echo "Executing test suite..."
echo "All tests passed (100%)"`
            },
            {
              id: 'file-oldname',
              name: 'old_name.txt',
              type: 'file',
              permissions: 'rw-r--r--',
              owner: 'user',
              group: 'user',
              size: 45,
              updatedAt: '2026-08-19 12:19:50',
              content: 'Old document file ready to be renamed with mv.'
            },
            {
              id: 'file-serverlog',
              name: 'server.log',
              type: 'file',
              permissions: 'rw-r--r--',
              owner: 'user',
              group: 'user',
              size: 160,
              updatedAt: '2026-08-19 12:19:55',
              content: `[2026-08-19 12:00:00] INFO server started on port 8080
[2026-08-19 12:05:00] INFO connection from 192.168.1.50
[2026-08-19 12:10:00] WARN high response latency: 240ms`
            },
            {
              id: 'file-serverlog-gz',
              name: 'server.log.gz',
              type: 'file',
              permissions: 'rw-r--r--',
              owner: 'user',
              group: 'user',
              size: 90,
              updatedAt: '2026-08-19 12:19:58',
              content: '[GZIP ARCHIVE: server.log]'
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
      id: 'dir-root-home',
      name: 'root',
      type: 'directory',
      permissions: 'rwx------',
      owner: 'root',
      group: 'root',
      size: 4096,
      updatedAt: '2026-08-19 12:00:00',
      children: [
        {
          id: 'file-root-bashrc',
          name: '.bashrc',
          type: 'file',
          permissions: 'rw-r--r--',
          owner: 'root',
          group: 'root',
          size: 140,
          updatedAt: '2026-08-19 12:00:00',
          content: `# ~/.bashrc: executed by bash for non-login root shells.
export PS1='\\[\\033[01;31m\\]root@linux-box\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]# '`
        },
        {
          id: 'file-root-profile',
          name: '.profile',
          type: 'file',
          permissions: 'rw-r--r--',
          owner: 'root',
          group: 'root',
          size: 160,
          updatedAt: '2026-08-19 12:00:00',
          content: `# ~/.profile: executed by Bourne-compatible login shells.
PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export PATH`
        },
        {
          id: 'file-root-flag',
          name: 'root_flag.txt',
          type: 'file',
          permissions: 'rw-------',
          owner: 'root',
          group: 'root',
          size: 45,
          updatedAt: '2026-08-19 12:00:00',
          content: 'ONLINE_LINUX_TERMINAL_ROOT_ACCESS_GRANTED_2026'
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
        },
        {
          id: 'file-hosts',
          name: 'hosts',
          type: 'file',
          permissions: 'rw-r--r--',
          owner: 'root',
          group: 'root',
          size: 150,
          updatedAt: '2026-08-19 12:00:00',
          content: `127.0.0.1 localhost
127.0.1.1 linux-terminal-box
::1       localhost ip6-localhost ip6-loopback
ff02::1   ip6-allnodes
ff02::2   ip6-allrouters`
        },
        {
          id: 'file-resolvconf',
          name: 'resolv.conf',
          type: 'file',
          permissions: 'rw-r--r--',
          owner: 'root',
          group: 'root',
          size: 50,
          updatedAt: '2026-08-19 12:00:00',
          content: `nameserver 8.8.8.8
nameserver 1.1.1.1`
        },
        {
          id: 'file-fstab',
          name: 'fstab',
          type: 'file',
          permissions: 'rw-r--r--',
          owner: 'root',
          group: 'root',
          size: 210,
          updatedAt: '2026-08-19 12:00:00',
          content: `# /etc/fstab: static file system information.
/dev/sda1       /               ext4    errors=remount-ro 0       1
tmpfs           /dev/shm        tmpfs   defaults        0       0
devpts          /dev/pts        devpts  gid=5,mode=620  0       0
sysfs           /sys            sysfs   defaults        0       0
proc            /proc           proc    defaults        0       0`
        },
        {
          id: 'file-sudoers',
          name: 'sudoers',
          type: 'file',
          permissions: 'r--r-----',
          owner: 'root',
          group: 'root',
          size: 150,
          updatedAt: '2026-08-19 12:00:00',
          content: `Defaults        env_reset
root    ALL=(ALL:ALL) ALL
%sudo   ALL=(ALL:ALL) NOPASSWD: ALL
user    ALL=(ALL:ALL) NOPASSWD: ALL`
        },
        {
          id: 'file-shells',
          name: 'shells',
          type: 'file',
          permissions: 'rw-r--r--',
          owner: 'root',
          group: 'root',
          size: 50,
          updatedAt: '2026-08-19 12:00:00',
          content: `/bin/sh
/bin/bash
/usr/bin/sh
/usr/bin/bash`
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
      id: 'dir-mnt',
      name: 'mnt',
      type: 'directory',
      permissions: 'rwxr-xr-x',
      owner: 'root',
      group: 'root',
      size: 4096,
      updatedAt: '2026-08-19 12:00:00',
      children: []
    },
    {
      id: 'dir-media',
      name: 'media',
      type: 'directory',
      permissions: 'rwxr-xr-x',
      owner: 'root',
      group: 'root',
      size: 4096,
      updatedAt: '2026-08-19 12:00:00',
      children: []
    },
    {
      id: 'dir-proc',
      name: 'proc',
      type: 'directory',
      permissions: 'r-xr-xr-x',
      owner: 'root',
      group: 'root',
      size: 0,
      updatedAt: '2026-08-19 12:00:00',
      children: [
        {
          id: 'file-proc-cpuinfo',
          name: 'cpuinfo',
          type: 'file',
          permissions: 'r--r--r--',
          owner: 'root',
          group: 'root',
          size: 320,
          updatedAt: '2026-08-19 12:00:00',
          content: `processor\t: 0
vendor_id\t: GenuineIntel
model name\t: Intel(R) Xeon(R) Platinum CPU @ 2.50GHz
cpu MHz\t\t: 2500.000
cache size\t: 33792 KB
cpu cores\t: 4`
        },
        {
          id: 'file-proc-meminfo',
          name: 'meminfo',
          type: 'file',
          permissions: 'r--r--r--',
          owner: 'root',
          group: 'root',
          size: 260,
          updatedAt: '2026-08-19 12:00:00',
          content: `MemTotal:        8054416 kB
MemFree:         4210340 kB
MemAvailable:    6310240 kB
Buffers:          142051 kB
Cached:          2281513 kB
SwapTotal:       2097148 kB
SwapFree:        2097148 kB`
        },
        {
          id: 'file-proc-version',
          name: 'version',
          type: 'file',
          permissions: 'r--r--r--',
          owner: 'root',
          group: 'root',
          size: 120,
          updatedAt: '2026-08-19 12:00:00',
          content: 'Linux version 6.8.0-online-term (gcc version 13.2.0) #1 SMP PREEMPT_DYNAMIC'
        },
        {
          id: 'file-proc-loadavg',
          name: 'loadavg',
          type: 'file',
          permissions: 'r--r--r--',
          owner: 'root',
          group: 'root',
          size: 30,
          updatedAt: '2026-08-19 12:00:00',
          content: '0.12 0.08 0.05 1/142 420'
        }
      ]
    },
    {
      id: 'dir-sys',
      name: 'sys',
      type: 'directory',
      permissions: 'r-xr-xr-x',
      owner: 'root',
      group: 'root',
      size: 0,
      updatedAt: '2026-08-19 12:00:00',
      children: []
    },
    {
      id: 'dir-dev',
      name: 'dev',
      type: 'directory',
      permissions: 'rwxr-xr-x',
      owner: 'root',
      group: 'root',
      size: 4096,
      updatedAt: '2026-08-19 12:00:00',
      children: [
        {
          id: 'file-dev-null',
          name: 'null',
          type: 'file',
          permissions: 'crw-rw-rw-',
          owner: 'root',
          group: 'root',
          size: 0,
          updatedAt: '2026-08-19 12:00:00',
          content: ''
        },
        {
          id: 'file-dev-zero',
          name: 'zero',
          type: 'file',
          permissions: 'crw-rw-rw-',
          owner: 'root',
          group: 'root',
          size: 0,
          updatedAt: '2026-08-19 12:00:00',
          content: ''
        },
        {
          id: 'file-dev-random',
          name: 'random',
          type: 'file',
          permissions: 'crw-rw-rw-',
          owner: 'root',
          group: 'root',
          size: 0,
          updatedAt: '2026-08-19 12:00:00',
          content: ''
        },
        {
          id: 'file-dev-sda',
          name: 'sda',
          type: 'file',
          permissions: 'brw-rw----',
          owner: 'root',
          group: 'disk',
          size: 0,
          updatedAt: '2026-08-19 12:00:00',
          content: ''
        },
        {
          id: 'file-dev-sda1',
          name: 'sda1',
          type: 'file',
          permissions: 'brw-rw----',
          owner: 'root',
          group: 'disk',
          size: 0,
          updatedAt: '2026-08-19 12:00:00',
          content: ''
        }
      ]
    },
    {
      id: 'dir-bin',
      name: 'bin',
      type: 'directory',
      permissions: 'rwxr-xr-x',
      owner: 'root',
      group: 'root',
      size: 4096,
      updatedAt: '2026-08-19 12:00:00',
      children: [
        { id: 'bin-bash', name: 'bash', type: 'file', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', size: 1183448, updatedAt: '2026-08-19 12:00:00' },
        { id: 'bin-sh', name: 'sh', type: 'file', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', size: 125688, updatedAt: '2026-08-19 12:00:00' },
        { id: 'bin-ls', name: 'ls', type: 'file', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', size: 142144, updatedAt: '2026-08-19 12:00:00' },
        { id: 'bin-cat', name: 'cat', type: 'file', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', size: 43416, updatedAt: '2026-08-19 12:00:00' },
        { id: 'bin-grep', name: 'grep', type: 'file', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', size: 178224, updatedAt: '2026-08-19 12:00:00' },
        { id: 'bin-mount', name: 'mount', type: 'file', permissions: 'rwsr-xr-x', owner: 'root', group: 'root', size: 55432, updatedAt: '2026-08-19 12:00:00' },
        { id: 'bin-umount', name: 'umount', type: 'file', permissions: 'rwsr-xr-x', owner: 'root', group: 'root', size: 39120, updatedAt: '2026-08-19 12:00:00' },
        { id: 'bin-su', name: 'su', type: 'file', permissions: 'rwsr-xr-x', owner: 'root', group: 'root', size: 67816, updatedAt: '2026-08-19 12:00:00' }
      ]
    },
    {
      id: 'dir-usr',
      name: 'usr',
      type: 'directory',
      permissions: 'rwxr-xr-x',
      owner: 'root',
      group: 'root',
      size: 4096,
      updatedAt: '2026-08-19 12:00:00',
      children: [
        {
          id: 'dir-usr-bin',
          name: 'bin',
          type: 'directory',
          permissions: 'rwxr-xr-x',
          owner: 'root',
          group: 'root',
          size: 4096,
          updatedAt: '2026-08-19 12:00:00',
          children: [
            { id: 'ubin-sudo', name: 'sudo', type: 'file', permissions: 'rwsr-xr-x', owner: 'root', group: 'root', size: 182336, updatedAt: '2026-08-19 12:00:00' },
            { id: 'ubin-curl', name: 'curl', type: 'file', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', size: 265888, updatedAt: '2026-08-19 12:00:00' },
            { id: 'ubin-python3', name: 'python3', type: 'file', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', size: 5882100, updatedAt: '2026-08-19 12:00:00' },
            { id: 'ubin-iotop', name: 'iotop', type: 'file', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', size: 84320, updatedAt: '2026-08-19 12:00:00' },
            { id: 'ubin-iostat', name: 'iostat', type: 'file', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', size: 92450, updatedAt: '2026-08-19 12:00:00' },
            { id: 'ubin-iota', name: 'iota', type: 'file', permissions: 'rwxr-xr-x', owner: 'root', group: 'root', size: 15420000, updatedAt: '2026-08-19 12:00:00' }
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
