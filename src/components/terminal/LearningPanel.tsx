import React, { useState } from 'react';
import { BookOpen, CheckCircle, ChevronRight, HelpCircle, Award } from 'lucide-react';

export interface LessonStep {
  title: string;
  instruction: string;
  commandSuggestion: string;
  hint: string;
}

export interface Lesson {
  id: string;
  title: string;
  category: string;
  steps: LessonStep[];
}

export const SAMPLE_LESSONS: Lesson[] = [
  {
    id: 'basics',
    title: '1. Linux Navigation Basics',
    category: 'Beginner',
    steps: [
      {
        title: 'Check Current Working Directory',
        instruction: 'Print your active current working directory path to see where you are located.',
        commandSuggestion: 'pwd',
        hint: 'Type "pwd" and press Enter.',
      },
      {
        title: 'List Files in Long Format',
        instruction: 'List all files in your home directory along with permissions and sizes.',
        commandSuggestion: 'ls -l',
        hint: 'Use "ls -l" to show detailed file metadata.',
      },
      {
        title: 'Read Welcome Notes',
        instruction: 'Inspect the content of the welcome text file using cat.',
        commandSuggestion: 'cat welcome.txt',
        hint: 'Run "cat welcome.txt".',
      },
    ],
  },
  {
    id: 'files',
    title: '2. Creating & Searching Files',
    category: 'Intermediate',
    steps: [
      {
        title: 'Create a New Directory',
        instruction: 'Create a new directory named "lab" inside your user folder.',
        commandSuggestion: 'mkdir lab',
        hint: 'Type "mkdir lab" and press Enter.',
      },
      {
        title: 'Create a File with Content',
        instruction: 'Redirect a line of text into a new file inside your lab directory.',
        commandSuggestion: 'echo "hello linux" > lab/test.txt',
        hint: 'Run echo with redirection ">".',
      },
      {
        title: 'Grep Search for Log Errors',
        instruction: 'Search for the keyword "error" in the system log file.',
        commandSuggestion: 'grep error /var/log/syslog',
        hint: 'Use "grep error /var/log/syslog".',
      },
    ],
  },
];

interface LearningPanelProps {
  onRunSuggestedCommand?: (cmd: string) => void;
}

export const LearningPanel: React.FC<LearningPanelProps> = ({ onRunSuggestedCommand }) => {
  const [activeLesson, setActiveLesson] = useState<Lesson>(SAMPLE_LESSONS[0]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const step = activeLesson.steps[currentStepIdx];
  const stepKey = `${activeLesson.id}-${currentStepIdx}`;

  const markCompleted = () => {
    setCompletedSteps((prev) => ({ ...prev, [stepKey]: true }));
    if (currentStepIdx < activeLesson.steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  return (
    <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-full text-zinc-100 font-sans shadow-xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold text-sm tracking-wide text-zinc-100">Interactive Lessons</h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
          {activeLesson.category}
        </span>
      </div>

      {/* Lesson Selector Tabs */}
      <div className="flex space-x-2 py-3 overflow-x-auto">
        {SAMPLE_LESSONS.map((l) => (
          <button
            key={l.id}
            onClick={() => {
              setActiveLesson(l);
              setCurrentStepIdx(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              l.id === activeLesson.id
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {l.title}
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>
              Step {currentStepIdx + 1} of {activeLesson.steps.length}
            </span>
            {completedSteps[stepKey] && (
              <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Completed</span>
              </span>
            )}
          </div>

          <h3 className="font-semibold text-base text-emerald-400">{step.title}</h3>
          <p className="text-xs text-zinc-300 leading-relaxed">{step.instruction}</p>

          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-1.5 font-mono text-xs">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Suggested Command:</div>
            <div className="flex items-center justify-between text-emerald-300">
              <code>$ {step.commandSuggestion}</code>
              {onRunSuggestedCommand && (
                <button
                  onClick={() => onRunSuggestedCommand(step.commandSuggestion)}
                  className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-700/50 rounded text-[11px] transition-colors"
                >
                  Run in Terminal
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-2 p-2.5 bg-zinc-900/60 rounded-lg text-xs text-zinc-400 border border-zinc-800/50">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{step.hint}</span>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
          <button
            onClick={() => setCurrentStepIdx((p) => Math.max(0, p - 1))}
            disabled={currentStepIdx === 0}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-400 font-mono"
          >
            ← Previous
          </button>

          <button
            onClick={markCompleted}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <span>{completedSteps[stepKey] ? 'Next Step' : 'Mark Step Complete'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
