import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { LOCALES, type SupportedLocale, getLocalizedPath } from '../../i18n/translations';

interface LanguageSwitcherProps {
  currentLang: SupportedLocale;
  currentPath?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLang,
  currentPath = '/',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLocale = LOCALES.find((l) => l.code === currentLang) || LOCALES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-lg text-xs font-mono transition-colors min-h-[44px]"
        aria-label="Select Language"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-emerald-400" />
        <span>{activeLocale.flag}</span>
        <span className="hidden sm:inline font-semibold">{activeLocale.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in duration-150">
          <div className="px-3 py-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
            Select Language
          </div>
          {LOCALES.map((locale) => {
            const targetUrl = getLocalizedPath(currentPath, locale.code);
            const isSelected = locale.code === currentLang;
            return (
              <a
                key={locale.code}
                href={targetUrl}
                className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-zinc-800 ${
                  isSelected ? 'text-emerald-400 font-semibold bg-emerald-950/40' : 'text-zinc-300'
                }`}
              >
                <span className="text-base">{locale.flag}</span>
                <span>{locale.name}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};
