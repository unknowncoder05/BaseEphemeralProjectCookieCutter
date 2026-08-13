import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';
import { Navbar, Breadcrumbs } from '../components/shared';

const features = [
  {
    key: 'auth',
    icon: '🔐',
    color: 'bg-primary-50 dark:bg-primary-900/20',
  },
  {
    key: 'items',
    icon: '📦',
    color: 'bg-primary-50 dark:bg-primary-900/20',
  },
  {
    key: 'realtime',
    icon: '⚡',
    color: 'bg-primary-50 dark:bg-primary-900/20',
  },
  {
    key: 'async',
    icon: '⚙️',
    color: 'bg-primary-50 dark:bg-primary-900/20',
  },
  {
    key: 'cloud',
    icon: '☁️',
    color: 'bg-primary-50 dark:bg-primary-900/20',
  },
  {
    key: 'darkMode',
    icon: '🌙',
    color: 'bg-primary-50 dark:bg-primary-700/20',
  },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 transition-colors">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs />
        
        {/* Hero */}
        <div className="text-center mb-16 pt-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-4">
            {t('dashboard.badge')}
          </span>

          <h1 className="text-4xl sm:text-5xl font-bold text-secondary-900 dark:text-white mb-4 leading-tight">
            {t('dashboard.welcome')}
          </h1>

          <p className="text-xl text-secondary-500 dark:text-secondary-300 mb-2">
            {t('dashboard.subtitle')}
          </p>

          <p className="text-sm text-secondary-600 dark:text-secondary-300">
            {t('dashboard.loggedInAs')} {user?.email}
          </p>

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => navigate('/items')}
              className="px-6 py-3 bg-primary-700 hover:bg-primary-800 dark:bg-primary-700 dark:hover:bg-primary-800 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {t('dashboard.cta.items')}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="px-6 py-3 bg-white dark:bg-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-200 font-medium rounded-lg border border-secondary-200 dark:border-secondary-700 transition-colors shadow-sm"
            >
              {t('dashboard.cta.settings')}
            </button>
          </div>
        </div>

        {/* Features */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary-600 dark:text-secondary-300 text-center mb-8">
            {t('dashboard.features')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.key}
                className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-100 dark:border-secondary-700 p-5 flex gap-4 transition-colors"
              >
                <div
                  className={`${f.color} rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0 text-lg`}
                >
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900 dark:text-white text-sm mb-1">
                    {t(`features.${f.key}`)}
                  </h3>
                  <p className="text-xs text-secondary-500 dark:text-secondary-300 leading-relaxed">
                    {t(`features.${f.key}Desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
