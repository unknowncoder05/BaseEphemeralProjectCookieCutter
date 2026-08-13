import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Command {
  id: string;
  name: string;
  description: string;
  shortcut?: string[];
  action: () => void;
  icon?: React.ReactNode;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const commands: Command[] = [
    {
      id: 'dashboard',
      name: t('commandPalette.commands.dashboard.name'),
      description: t('commandPalette.commands.dashboard.description'),
      shortcut: ['g', 'd'],
      action: () => navigate('/dashboard'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'items',
      name: t('commandPalette.commands.items.name'),
      description: t('commandPalette.commands.items.description'),
      shortcut: ['g', 'i'],
      action: () => navigate('/items'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    },
    {
      id: 'settings',
      name: t('commandPalette.commands.settings.name'),
      description: t('commandPalette.commands.settings.description'),
      shortcut: ['g', 's'],
      action: () => navigate('/settings'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 'debug-components',
      name: t('commandPalette.commands.debug.name'),
      description: t('commandPalette.commands.debug.description'),
      shortcut: ['d', 'c'],
      action: () => navigate('/debug/components'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredCommands = commands.filter(
    (command) =>
      command.name.toLowerCase().includes(query.toLowerCase()) ||
      command.description.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-40">
      <div className="fixed inset-0 bg-secondary-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-secondary-800 rounded-xl shadow-2xl border border-secondary-200 dark:border-secondary-700 mx-4">
        <div className="flex items-center px-4 py-3 border-b border-secondary-100 dark:border-secondary-700">
          <svg className="w-5 h-5 text-secondary-600 dark:text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            autoFocus
            type="text"
            className="flex-1 ml-3 text-secondary-900 dark:text-white bg-transparent border-none focus:ring-0 sm:text-sm placeholder-secondary-400"
            placeholder={t('commandPalette.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-semibold text-secondary-500 bg-secondary-50 dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded">{t('commandPalette.escapeKey')}</kbd>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto py-2">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command) => (
              <button
                key={command.id}
                className="w-full flex items-center px-4 py-3 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors group text-left"
                onClick={() => {
                  command.action();
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary-100 dark:bg-secondary-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 text-secondary-500 group-hover:text-primary-600 transition-colors">
                  {command.icon}
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-secondary-900 dark:text-white">{command.name}</p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-300">{command.description}</p>
                </div>
                {command.shortcut && (
                  <div className="flex gap-1 ml-auto">
                    {command.shortcut.map((key) => (
                      <kbd key={key} className="px-1.5 py-0.5 text-[10px] font-semibold text-secondary-600 dark:text-secondary-300 bg-secondary-50 dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded uppercase">
                        {key}
                      </kbd>
                    ))}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-secondary-500">{t('commandPalette.noResults', { query })}</p>
            </div>
          )}
        </div>
        
        <div className="px-4 py-3 bg-secondary-50 dark:bg-secondary-800/50 border-t border-secondary-100 dark:border-secondary-700 flex justify-between items-center">
          <div className="flex gap-4">
            <span className="flex items-center text-[10px] text-secondary-600 dark:text-secondary-300">
              <kbd className="mr-1.5 px-1 py-0.5 bg-white dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded">{t('commandPalette.enterKey')}</kbd> {t('commandPalette.select')}
            </span>
            <span className="flex items-center text-[10px] text-secondary-600 dark:text-secondary-300">
              <kbd className="mr-1.5 px-1 py-0.5 bg-white dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded">{t('commandPalette.arrowKeys')}</kbd> {t('commandPalette.navigate')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
