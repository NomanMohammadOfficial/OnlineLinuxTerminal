import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { TerminalRunner } from './TerminalRunner';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { getStoredVFS } from '../../lib/vfs/store';
import { getNodeAtPath } from '../../lib/shell/executor';

interface ChallengeRunnerProps {
  scenarioSlug: string;
  title: string;
  points: string;
  mission: string;
  hint: string;
}

export const ChallengeRunner: React.FC<ChallengeRunnerProps> = ({
  scenarioSlug,
  title,
  points,
  mission,
  hint,
}) => {
  const [isSolved, setIsSolved] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const checkSolution = async (lastCmd?: string) => {
    const currentVFS = await getStoredVFS();

    let solved = false;
    let msg = '';

    if (scenarioSlug === 'find-hidden-flag') {
      const osRelease = getNodeAtPath(currentVFS, '/etc/os-release');
      if (lastCmd && (lastCmd.includes('os-release') || lastCmd.includes('cat /etc'))) {
        solved = true;
        msg = 'Congratulations! You located the system configuration flag!';
      }
    } else if (scenarioSlug === 'fix-log-permissions') {
      const authLog = getNodeAtPath(currentVFS, '/var/log/auth.log');
      if (authLog && (authLog.permissions.includes('rwx') || authLog.permissions.includes('r-x') || authLog.permissions === 'rwxr-xr-x')) {
        solved = true;
        msg = 'Great job! You successfully modified file permissions on /var/log/auth.log!';
      }
    } else if (scenarioSlug === 'extract-ip-grep') {
      if (lastCmd && lastCmd.includes('grep') && (lastCmd.includes('192.168') || lastCmd.includes('10.0'))) {
        solved = true;
        msg = 'Awesome! You successfully filtered IP addresses using grep!';
      }
    }

    if (solved) {
      setIsSolved(true);
      setStatusMessage(msg);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      setStatusMessage('Requirement not yet satisfied. Keep trying!');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Mission Sidebar */}
      <div className="lg:col-span-1 space-y-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-amber-400 font-bold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
              {points}
            </span>
            {isSolved ? (
              <span className="flex items-center space-x-1 text-xs text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>SOLVED</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-xs text-zinc-400">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>In Progress</span>
              </span>
            )}
          </div>

          <h2 className="font-bold text-base text-emerald-400">Mission Briefing</h2>
          <p class="text-xs text-zinc-300 leading-relaxed">{mission}</p>

          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-amber-400">Hint:</div>
            <p className="text-zinc-400 font-mono text-[11px]">{hint}</p>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold border ${
                isSolved
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800'
              }`}
            >
              {statusMessage}
            </div>
          )}
        </div>

        <button
          onClick={() => checkSolution()}
          className="w-full mt-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-lg text-xs transition-colors shadow-sm"
        >
          Check Solution Now
        </button>
      </div>

      {/* Terminal Workspace */}
      <div className="lg:col-span-2">
        <TerminalRunner
          className="h-[520px]"
          onCommandRun={(cmd) => {
            checkSolution(cmd);
          }}
        />
      </div>
    </div>
  );
};
