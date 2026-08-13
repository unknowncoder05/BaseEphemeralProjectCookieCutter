import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
            <svg
              className="h-12 w-12 text-primary-600 dark:text-primary-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900 dark:text-secondary-100">
            {t('notFound.title')}
          </h2>

          <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-300">
            {t('notFound.description')}
          </p>

          <p className="mt-4 text-center text-xs text-secondary-600 dark:text-secondary-300">
            {t('notFound.errorCode')}
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={() => navigate('/')}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('notFound.goHome')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
