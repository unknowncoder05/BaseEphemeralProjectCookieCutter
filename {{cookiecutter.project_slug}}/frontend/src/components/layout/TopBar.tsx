import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { signOut } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(signOut());
    navigate('/login');
  };

  return (
    <div className="h-14 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between px-4 shadow-sm transition-colors">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors lg:hidden"
        >
          <svg className="w-6 h-6 text-secondary-600 dark:text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{process.env.REACT_APP_PROJECT_NAME || 'My App'}</span>
          <span className="hidden sm:inline text-sm text-secondary-500 dark:text-secondary-300">{t('app.starterTemplate')}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? t('theme.light') : t('theme.dark')}
          className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
        >
          {isDark ? (
            <svg className="w-5 h-5 text-secondary-500 dark:text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-secondary-500 dark:text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="px-2.5 py-1.5 text-xs font-semibold text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
          >
            {i18n.language.toUpperCase()}
          </button>
          {langOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
              <div className="absolute right-0 mt-1 w-20 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 py-1 z-20">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      localStorage.setItem('language', lang.code);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors ${
                      i18n.language === lang.code
                        ? 'text-primary-600 dark:text-primary-400 font-bold'
                        : 'text-secondary-700 dark:text-secondary-300'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-primary-700 dark:bg-primary-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:inline text-sm font-medium text-secondary-700 dark:text-secondary-200">
              {user?.email?.split('@')[0] || 'User'}
            </span>
            <svg className="w-4 h-4 text-secondary-500 dark:text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 py-1 z-20">
                <div className="px-4 py-3 border-b border-secondary-200 dark:border-secondary-700">
                  <p className="text-sm font-medium text-secondary-900 dark:text-white">{user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-300">{user?.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                >
                  {t('nav.settings')}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  {t('nav.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
