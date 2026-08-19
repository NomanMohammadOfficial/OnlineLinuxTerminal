import React from 'react';

interface AdSlotProps {
  type?: 'banner' | 'leaderboard' | 'sidebar';
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ type = 'banner', className = '' }) => {
  let heightClass = 'h-[90px]';
  if (type === 'leaderboard') heightClass = 'h-[90px] sm:h-[100px]';
  if (type === 'sidebar') heightClass = 'h-[250px]';

  return (
    <div
      className={`w-full bg-zinc-900/40 border border-zinc-800/60 rounded-xl flex flex-col items-center justify-center text-zinc-600 text-xs font-mono select-none overflow-hidden ${heightClass} ${className}`}
      aria-label="Advertisement Space"
    >
      <span class="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Sponsored Advertisement</span>
      <span class="text-zinc-600 font-mono text-[11px]">AdSense Slot ({type})</span>
    </div>
  );
};
