import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, Maximize2, Minimize2, Copy, Check, Trash2, Edit3, Terminal as TerminalIcon, ShieldCheck } from 'lucide-react';
import type { VFSNode, ShellEnv } from '../../lib/vfs/types';
import { getStoredVFS, saveVFS, resetVFS, getStoredHistory, saveStoredHistory } from '../../lib/vfs/store';
import { executeCommand, getNodeAtPath, getParentNodeAndName, resolvePath } from '../../lib/shell/executor';
import { EditorModal } from './EditorModal';

interface TerminalRunnerProps {
  initialCommand?: string;
  className?: string;
  onCommandRun?: (cmd: string, output: string) => void;
}

export const TerminalRunner: React.FC<TerminalRunnerProps> = ({
  initialCommand,
  className = '',
  onCommandRun,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<any>(null);
  const fitAddonInstance = useRef<any>(null);

  const [vfs, setVfs] = useState<VFSNode | null>(null);
  const vfsRef = useRef<VFSNode | null>(null);
  vfsRef.current = vfs;

  const [history, setHistory] = useState<string[]>([]);
  const historyRef = useRef<string[]>([]);
  historyRef.current = history;

  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const historyIndexRef = useRef<number>(-1);
  historyIndexRef.current = historyIndex;

  const [currentInput, setCurrentInput] = useState<string>('');
  const currentLineRef = useRef<string>('');

  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [env, setEnv] = useState<ShellEnv>({
    USER: 'user',
    HOME: '/home/user',
    PATH: '/usr/local/bin:/usr/bin:/bin',
    SHELL: '/bin/bash',
    TERM: 'xterm-256color',
    PWD: '/home/user',
  });
  const envRef = useRef<ShellEnv>(env);
  envRef.current = env;

  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    filename: string;
    content: string;
  }>({
    isOpen: false,
    filename: '',
    content: '',
  });

  const getPrompt = useCallback((pwd: string) => {
    let displayPwd = pwd;
    if (pwd.startsWith('/home/user')) {
      displayPwd = pwd.replace('/home/user', '~');
    }
    return `\x1b[1;32muser@linux-box\x1b[0m:\x1b[1;34m${displayPwd}\x1b[0m$ `;
  }, []);

  const runCommandRef = useRef<(cmdStr: string, term: any) => Promise<void>>();

  const runCommandInternal = async (cmdStr: string, term: any) => {
    const currentVfs = vfsRef.current;
    if (!currentVfs) return;

    const trimmed = cmdStr.trim();
    if (!trimmed) {
      term.write('\r\n' + getPrompt(envRef.current.PWD));
      return;
    }

    const newHist = [...historyRef.current, trimmed];
    historyRef.current = newHist;
    setHistory(newHist);
    setHistoryIndex(-1);
    historyIndexRef.current = -1;
    saveStoredHistory(newHist);

    const { result, updatedVFS } = await executeCommand(trimmed, currentVfs, envRef.current, newHist);

    vfsRef.current = updatedVFS;
    setVfs(updatedVFS);
    await saveVFS(updatedVFS);

    if (result.newPwd && result.newPwd !== envRef.current.PWD) {
      const updatedEnv = { ...envRef.current, PWD: result.newPwd };
      envRef.current = updatedEnv;
      setEnv(updatedEnv);
    }

    if (onCommandRun) {
      onCommandRun(trimmed, result.output);
    }

    if (result.openEditor) {
      setEditorState({
        isOpen: true,
        filename: result.openEditor.filename,
        content: result.openEditor.content,
      });
    }

    if (result.output) {
      const formattedOutput = result.output.replace(/\n/g, '\r\n');
      term.write('\r\n' + formattedOutput);
    }

    const activePwd = result.newPwd || envRef.current.PWD;
    term.write('\r\n' + getPrompt(activePwd));
  };

  runCommandRef.current = runCommandInternal;

  const processInput = (data: string) => {
    const term = xtermInstance.current;
    if (!term) return;

    if (data === '\r') {
      const cmdToRun = currentLineRef.current;
      currentLineRef.current = '';
      setCurrentInput('');
      if (runCommandRef.current) {
        runCommandRef.current(cmdToRun, term);
      }
    } else if (data === '\x7f' || data === '\b') {
      if (currentLineRef.current.length > 0) {
        currentLineRef.current = currentLineRef.current.slice(0, -1);
        setCurrentInput(currentLineRef.current);
        term.write('\b \b');
      }
    } else if (data === '\x03') {
      term.write('^C\r\n' + getPrompt(envRef.current.PWD));
      currentLineRef.current = '';
      setCurrentInput('');
    } else if (data === '\x0c') {
      term.write('\x1b[2J\x1b[3J\x1b[H');
      term.write(getPrompt(envRef.current.PWD) + currentLineRef.current);
    } else if (data === '\x1b[A') {
      const hist = historyRef.current;
      if (hist.length > 0) {
        const nextIdx = historyIndexRef.current < hist.length - 1 ? historyIndexRef.current + 1 : historyIndexRef.current;
        historyIndexRef.current = nextIdx;
        setHistoryIndex(nextIdx);
        const cmdFromHist = hist[hist.length - 1 - (nextIdx < 0 ? 0 : nextIdx)] || '';
        while (currentLineRef.current.length > 0) {
          term.write('\b \b');
          currentLineRef.current = currentLineRef.current.slice(0, -1);
        }
        term.write(cmdFromHist);
        currentLineRef.current = cmdFromHist;
        setCurrentInput(cmdFromHist);
      }
    } else if (data === '\x1b[B') {
      const hist = historyRef.current;
      if (historyIndexRef.current > 0) {
        const nextIdx = historyIndexRef.current - 1;
        historyIndexRef.current = nextIdx;
        setHistoryIndex(nextIdx);
        const cmdFromHist = hist[hist.length - 1 - nextIdx] || '';
        while (currentLineRef.current.length > 0) {
          term.write('\b \b');
          currentLineRef.current = currentLineRef.current.slice(0, -1);
        }
        term.write(cmdFromHist);
        currentLineRef.current = cmdFromHist;
        setCurrentInput(cmdFromHist);
      } else if (historyIndexRef.current === 0) {
        historyIndexRef.current = -1;
        setHistoryIndex(-1);
        while (currentLineRef.current.length > 0) {
          term.write('\b \b');
          currentLineRef.current = currentLineRef.current.slice(0, -1);
        }
        currentLineRef.current = '';
        setCurrentInput('');
      }
    } else if (data === '\t') {
      if (currentLineRef.current.trim()) {
        const parts = currentLineRef.current.split(' ');
        const lastPart = parts[parts.length - 1];
        const currentVFS = vfsRef.current;
        if (currentVFS) {
          const node = getNodeAtPath(currentVFS, envRef.current.PWD);
          if (node && node.children) {
            const matches = node.children
              .map((c) => c.name)
              .filter((n) => n.startsWith(lastPart));
            if (matches.length === 1) {
              const completion = matches[0].slice(lastPart.length);
              term.write(completion);
              currentLineRef.current += completion;
              setCurrentInput(currentLineRef.current);
            } else if (matches.length > 1) {
              term.write('\r\n' + matches.join('  ') + '\r\n' + getPrompt(envRef.current.PWD) + currentLineRef.current);
            }
          }
        }
      }
    } else if (data >= ' ' || data === '\n') {
      currentLineRef.current += data;
      setCurrentInput(currentLineRef.current);
      term.write(data);
    }
  };

  const processInputRef = useRef<(data: string) => void>(processInput);
  processInputRef.current = processInput;

  useEffect(() => {
    async function initStorage() {
      const storedVFS = await getStoredVFS();
      const storedHist = await getStoredHistory();
      vfsRef.current = storedVFS;
      setVfs(storedVFS);
      historyRef.current = storedHist;
      setHistory(storedHist);
    }
    initStorage();
  }, []);

  useEffect(() => {
    if (!terminalRef.current || !vfs) return;
    if (xtermInstance.current) return;

    let isMounted = true;

    async function loadXterm() {
      const xtermPkg = await import('@xterm/xterm');
      const fitPkg = await import('@xterm/addon-fit');

      const TerminalCtor = xtermPkg.Terminal || (xtermPkg as any).default?.Terminal || (xtermPkg as any).default;
      const FitAddonCtor = fitPkg.FitAddon || (fitPkg as any).default?.FitAddon || (fitPkg as any).default;

      if (!isMounted || !TerminalCtor) return;

      const isMobile = window.innerWidth < 640;

      const term = new TerminalCtor({
        cursorBlink: true,
        cursorStyle: 'block',
        theme: {
          background: '#09090b',
          foreground: '#f4f4f5',
          cursor: '#34d399',
          selectionBackground: '#065f46',
          black: '#18181b',
          red: '#f87171',
          green: '#34d399',
          yellow: '#fbbf24',
          blue: '#60a5fa',
          magenta: '#c084fc',
          cyan: '#38bdf8',
          white: '#f4f4f5',
        },
        fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace",
        fontSize: isMobile ? 12 : 14,
        lineHeight: 1.25,
        convertEol: true,
      });

      const fitAddon = new FitAddonCtor();
      term.loadAddon(fitAddon);

      term.open(terminalRef.current!);
      fitAddon.fit();

      xtermInstance.current = term;
      fitAddonInstance.current = fitAddon;

      term.writeln('\x1b[1;32mWelcome to Online Linux Terminal AST Sandbox (onlinelinuxterminal.com)\x1b[0m');
      term.writeln('\x1b[90mType \x1b[1;37m"help"\x1b[90m for commands or \x1b[1;37m"cat welcome.txt"\x1b[90m to start.\x1b[0m');
      term.write(getPrompt(envRef.current.PWD));

      currentLineRef.current = '';

      let targetCmd = initialCommand;
      if (!targetCmd && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const queryCmd = urlParams.get('cmd');
        if (queryCmd) {
          targetCmd = queryCmd;
        }
      }

      if (targetCmd) {
        term.write(targetCmd);
        currentLineRef.current = targetCmd;
        setTimeout(() => {
          if (processInputRef.current) {
            processInputRef.current('\r');
          }
        }, 350);
      }

      const handleExternalCommand = (e: any) => {
        const cmdToRun = e.detail?.cmd;
        if (cmdToRun && term) {
          term.write(cmdToRun);
          currentLineRef.current = cmdToRun;
          if (processInputRef.current) {
            processInputRef.current('\r');
          }
        }
      };
      window.addEventListener('terminal:run-command', handleExternalCommand);

      term.onData((data: string) => {
        if (processInputRef.current) {
          processInputRef.current(data);
        }
      });

      const handleResize = () => {
        if (fitAddonInstance.current) {
          try {
            fitAddonInstance.current.fit();
          } catch {}
        }
      };
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
    }

    loadXterm();

    return () => {
      isMounted = false;
    };
  }, [vfs]);

  const handleResetSession = async () => {
    const freshVFS = await resetVFS();
    vfsRef.current = freshVFS;
    setVfs(freshVFS);
    historyRef.current = [];
    setHistory([]);
    historyIndexRef.current = -1;
    setHistoryIndex(-1);
    currentLineRef.current = '';
    setCurrentInput('');
    envRef.current = { ...envRef.current, PWD: '/home/user' };
    setEnv((prev) => ({ ...prev, PWD: '/home/user' }));
    if (xtermInstance.current) {
      xtermInstance.current.write('\x1b[2J\x1b[3J\x1b[H');
      xtermInstance.current.writeln('\x1b[1;33m[Session Reset Completed]\x1b[0m');
      xtermInstance.current.write(getPrompt('/home/user'));
    }
  };

  const handleClearScreen = () => {
    if (xtermInstance.current) {
      currentLineRef.current = '';
      setCurrentInput('');
      xtermInstance.current.write('\x1b[2J\x1b[3J\x1b[H');
      xtermInstance.current.write(getPrompt(envRef.current.PWD));
    }
  };

  const handleCopySelection = async () => {
    if (!xtermInstance.current) return;
    try {
      let textToCopy = '';
      if (xtermInstance.current.hasSelection()) {
        textToCopy = xtermInstance.current.getSelection();
      } else {
        const buffer = xtermInstance.current.buffer.active;
        const lines: string[] = [];
        for (let i = 0; i < buffer.length; i++) {
          const line = buffer.getLine(i);
          if (line) {
            lines.push(line.translateToString(true));
          }
        }
        textToCopy = lines.join('\n').trim();
      }

      if (textToCopy) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const handleVirtualKey = (key: string) => {
    if (!xtermInstance.current) return;
    const term = xtermInstance.current;
    if (key === 'TAB') {
      processInput('\t');
    } else if (key === 'CTRL+C') {
      processInput('\x03');
    } else if (key === 'ESC') {
      processInput('\x1b');
    } else if (key === 'CLEAR') {
      handleClearScreen();
    } else if (key === 'UP') {
      processInput('\x1b[A');
    } else if (key === 'DOWN') {
      processInput('\x1b[B');
    } else if (key === 'cd ..' || key === 'ls -l') {
      term.write(key);
      currentLineRef.current = key;
      processInput('\r');
    } else {
      processInput(key);
    }
  };

  const saveEditorFile = async (filename: string, content: string) => {
    const currentVfs = vfsRef.current;
    if (!currentVfs) return;

    const resolved = resolvePath(envRef.current.PWD, filename, envRef.current);
    const newVFS: VFSNode = JSON.parse(JSON.stringify(currentVfs));
    const { parent, name } = getParentNodeAndName(newVFS, resolved);

    if (parent && parent.type === 'directory') {
      parent.children = parent.children || [];
      const existing = parent.children.find((c) => c.name === name);
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      if (existing) {
        existing.content = content;
        existing.size = new TextEncoder().encode(content).length;
        existing.updatedAt = now;
      } else {
        parent.children.push({
          id: 'file-' + Math.random().toString(36).substr(2, 9),
          name,
          type: 'file',
          permissions: 'rw-r--r--',
          owner: envRef.current.USER || 'user',
          group: envRef.current.USER || 'user',
          size: new TextEncoder().encode(content).length,
          updatedAt: now,
          content,
        });
      }
    }

    vfsRef.current = newVFS;
    setVfs(newVFS);
    await saveVFS(newVFS);
    setEditorState({ isOpen: false, filename: '', content: '' });

    if (xtermInstance.current) {
      xtermInstance.current.writeln(`\r\n\x1b[1;32m[Saved ${resolved} successfully]\x1b[0m`);
      xtermInstance.current.write(getPrompt(envRef.current.PWD));
    }
  };

  return (
    <div className={`flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'w-full h-full min-h-[350px] sm:min-h-[480px]'} ${className}`}>
      {/* Control Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400 select-none gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
          <div className="flex space-x-1.5 shrink-0">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <div className="flex items-center space-x-1.5 text-zinc-300 font-mono text-[11px] sm:text-xs truncate">
            <TerminalIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-zinc-200 truncate">bash — terminal</span>
          </div>
          <div className="hidden lg:flex items-center space-x-1 bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/50 font-mono text-[10px] shrink-0">
            <ShieldCheck className="w-3 h-3" />
            <span>AST Sandbox (Free)</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          <button
            onClick={() => setEditorState({ isOpen: true, filename: 'notes.txt', content: '' })}
            className="flex items-center space-x-1 p-1.5 sm:px-2 sm:py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors min-h-[36px] min-w-[36px] justify-center"
            title="Open Code Editor"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline text-xs">Nano</span>
          </button>
          <button
            onClick={handleCopySelection}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center relative"
            title={copied ? 'Copied to Clipboard!' : 'Copy Selection or Terminal Output'}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 transition-transform scale-110" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={handleClearScreen}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Clear Terminal Screen (Ctrl+L)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetSession}
            className="flex items-center space-x-1 p-1.5 sm:px-2 sm:py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded transition-colors min-h-[36px] min-w-[36px] justify-center"
            title="Reset Terminal Session"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Reset</span>
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Canvas Container */}
      <div className="relative flex-1 bg-zinc-950 terminal-container overflow-hidden min-h-[260px] sm:min-h-[380px]">
        <div ref={terminalRef} className="w-full h-full" />
      </div>

      {/* Mobile & Shortcut Virtual Helper Bar with Arrow Buttons */}
      <div className="flex items-center space-x-1.5 px-3 py-2 bg-zinc-900/95 border-t border-zinc-800/80 overflow-x-auto text-xs font-mono text-zinc-300 scrollbar-none touch-pan-x select-none">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">Shortcuts:</span>
        {['TAB', 'CTRL+C', 'ESC', 'UP', 'DOWN', 'CLEAR', '|', '>', '~', '/', 'cd ..', 'ls -l'].map((key) => (
          <button
            key={key}
            onClick={() => handleVirtualKey(key)}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700/60 transition-all active:scale-95 text-xs shrink-0 font-medium min-h-[36px]"
          >
            {key === 'UP' ? '↑' : key === 'DOWN' ? '↓' : key}
          </button>
        ))}
      </div>

      {/* Editor Modal */}
      <EditorModal
        isOpen={editorState.isOpen}
        filename={editorState.filename}
        initialContent={editorState.content}
        onSave={saveEditorFile}
        onClose={() => setEditorState({ isOpen: false, filename: '', content: '' })}
      />
    </div>
  );
};
