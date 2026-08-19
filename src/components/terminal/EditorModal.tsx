import React, { useState, useEffect } from 'react';
import { X, Save, FileCode } from 'lucide-react';

interface EditorModalProps {
  isOpen: boolean;
  filename: string;
  initialContent: string;
  onSave: (filename: string, content: string) => void;
  onClose: () => void;
}

export const EditorModal: React.FC<EditorModalProps> = ({
  isOpen,
  filename,
  initialContent,
  onSave,
  onClose,
}) => {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave(filename, content);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filename, content, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <FileCode className="w-5 h-5 text-emerald-400" />
            <span id="editor-title" className="font-mono text-sm font-semibold text-zinc-200">
              nano / vim editor — <span className="text-emerald-400">{filename}</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSave(filename, content)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-semibold rounded-md transition-colors shadow-sm"
              title="Save changes (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save (Ctrl+S)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
              title="Close editor (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Textarea Code Body */}
        <div className="flex-1 bg-zinc-950 p-4 font-mono text-sm leading-relaxed text-zinc-100 overflow-y-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full min-h-[350px] bg-transparent text-emerald-300 border-none outline-none resize-none font-mono focus:ring-0 selection:bg-emerald-900/60 selection:text-emerald-100"
            placeholder="Type content here..."
            autoFocus
            spellCheck={false}
          />
        </div>

        {/* Editor Footer Help Bar */}
        <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between font-mono">
          <div>
            <span>Lines: {content.split('\n').length}</span>
            <span className="ml-4">Characters: {content.length}</span>
          </div>
          <div>Press Esc or click Close to exit</div>
        </div>
      </div>
    </div>
  );
};
