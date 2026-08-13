import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import backendManager from '../services/BackendManager';
import env from '../config/environment';

const ServerStartPage: React.FC = () => {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleStartServer = async () => {
    setIsStarting(true);
    setError(null);

    try {
      await backendManager.manualStart();

      // Wait a moment for backend to be fully ready
      await new Promise(resolve => setTimeout(resolve, env.navigationDelay));

      // Navigate to projects page
      navigate('/projects');
    } catch (err) {
      console.error('Failed to start server:', err);
      setError(t('serverStart.error'));
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-secondary-900 dark:to-secondary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full pm-surface-panel rounded-lg shadow-xl p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">
            {t('serverStart.title')}
          </h1>

          {/* Description */}
          <p className="text-secondary-600 dark:text-secondary-300 mb-6">
            {t('serverStart.description')}
          </p>

          {/* Start Button */}
          <button
            onClick={handleStartServer}
            disabled={isStarting}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
              isStarting
                ? 'bg-secondary-400 cursor-not-allowed'
                : 'bg-primary-700 hover:bg-primary-800 active:scale-95'
            }`}
          >
            {isStarting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t('serverStart.starting')}
              </span>
            ) : (
              t('serverStart.action')
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Info Box */}
          {isStarting && (
            <div className="mt-6 p-4 bg-primary-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-primary-800">
                <strong>{t('serverStart.waiting')}</strong>
                <br />
                {t('serverStart.checklistIntro')}
              </p>
              <ul className="text-xs text-primary-700 mt-2 space-y-1 text-left">
                <li>{t('serverStart.steps.launch')}</li>
                <li>{t('serverStart.steps.ip')}</li>
                <li>{t('serverStart.steps.app')}</li>
                <li>{t('serverStart.steps.sync')}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerStartPage;
