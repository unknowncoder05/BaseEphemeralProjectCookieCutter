import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ServerDown: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleRetry = () => {
    // Clear any stored error state and try to go back to home
    window.location.href = '/';
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-4">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
            {t('serverDown.title')}
          </h2>

          <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-300">
            {t('serverDown.description')}
          </p>

          <p className="mt-4 text-center text-sm text-secondary-500">
            {t('serverDown.retryHint')}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={handleRetry}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('serverDown.retry')}
          </button>

          <button
            onClick={handleGoHome}
            className="w-full flex justify-center py-2 px-4 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 dark:text-secondary-100 bg-white dark:bg-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('serverDown.goHome')}
          </button>
        </div>

        <div className="mt-6">
          <p className="text-xs text-secondary-600 dark:text-secondary-300">
            {t('serverDown.errorCode')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServerDown;
