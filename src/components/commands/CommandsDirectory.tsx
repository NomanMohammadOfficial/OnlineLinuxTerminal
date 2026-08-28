import React, { useState, useMemo } from 'react';
import { Search, Terminal, ArrowRight, BookOpen, Layers } from 'lucide-react';
import type { LinuxCommand } from '../../data/commandsData';

interface CommandsDirectoryProps {
  commands: LinuxCommand[];
  categories: readonly string[];
}

export const CommandsDirectory: React.FC<CommandsDirectoryProps> = ({ commands, categories }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredCommands = useMemo(() => {
    return commands.filter((cmd) => {
      const matchesCategory = selectedCategory === 'All' || cmd.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cmd.name.toLowerCase().includes(q) ||
        cmd.summary.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        cmd.syntax.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [commands, searchQuery, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Search Bar & Category Filter Controls */}
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 50+ Linux commands by name, syntax, or keywords (e.g. grep, chmod, find, ports)..."
            className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-sm transition-all shadow-xl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 hover:text-zinc-300 px-2 py-1 bg-zinc-800 rounded-md"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer font-medium ${
                  isActive
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-lg shadow-emerald-950/60'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Showing <strong className="text-zinc-200">{filteredCommands.length}</strong> of {commands.length} commands</span>
        </div>
        {selectedCategory !== 'All' && (
          <span className="text-emerald-400 font-medium">Category: {selectedCategory}</span>
        )}
      </div>

      {/* Commands Grid */}
      {filteredCommands.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCommands.map((cmd) => (
            <a
              key={cmd.slug}
              href={`/commands/${cmd.slug}/`}
              className="group p-5 bg-zinc-900/60 border border-zinc-800/90 hover:border-emerald-700/80 rounded-2xl transition-all hover:bg-zinc-900/90 shadow-md hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400 font-mono text-lg font-extrabold group-hover:text-emerald-300">
                      ${cmd.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                    {cmd.category}
                  </span>
                </div>

                <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800/60 font-mono text-[11px] text-emerald-400/90 truncate">
                  <code>{cmd.syntax}</code>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-sans">
                  {cmd.summary}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono text-emerald-400 group-hover:text-emerald-300">
                <span className="font-semibold flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>View Manual & Try Live</span>
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 p-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-3">
          <Terminal className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-zinc-200 font-sans">No commands found matching "{searchQuery}"</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Try searching for a different command name like <code className="text-emerald-400">grep</code>, <code className="text-emerald-400">chmod</code>, or <code className="text-emerald-400">find</code>.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-mono mt-2"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
