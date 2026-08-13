import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useTranslation } from 'react-i18next';
import { getCurrentUser } from '../store/authSlice';
import apiService from '../services/api';
import toast from 'react-hot-toast';
import { Breadcrumbs } from '../components/shared';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  // PM_GITHUB_START
  const [isConnectingGitHub, setIsConnectingGitHub] = useState(false);
  const [isDisconnectingGitHub, setIsDisconnectingGitHub] = useState(false);
  // PM_GITHUB_END

  // PM_GITHUB_START
  const handleGitHubCallback = useCallback(async (code: string, state: string) => {
    setIsConnectingGitHub(true);
    try {
      await apiService.gitHubCallback({ code, state });
      toast.success(t('settings.github.connectedSuccess'));
      // Refresh user data to get updated GitHub info
      dispatch(getCurrentUser());
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('settings.github.connectError'));
    } finally {
      setIsConnectingGitHub(false);
    }
  }, [dispatch, t]);
  // PM_GITHUB_END

  // Handle GitHub OAuth callback
  useEffect(() => {
    // PM_GITHUB_START
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const storedState = sessionStorage.getItem('github_oauth_state');

    if (code && state) {
      // Clear the URL params
      window.history.replaceState({}, '', '/settings');

      if (state !== storedState) {
        toast.error(t('settings.github.invalidState'));
        return;
      }

      sessionStorage.removeItem('github_oauth_state');

      // Exchange code for token
      handleGitHubCallback(code, state);
    }
    // PM_GITHUB_END
  }, [searchParams, handleGitHubCallback, t]);

  // PM_GITHUB_START
  const handleConnectGitHub = async () => {
    setIsConnectingGitHub(true);
    try {
      const response = await apiService.getGitHubAuthUrl();
      const { auth_url, state } = response.data;

      // Store state for validation
      sessionStorage.setItem('github_oauth_state', state);

      // Redirect to GitHub OAuth
      window.location.href = auth_url;
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('settings.github.authUrlError'));
      setIsConnectingGitHub(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    if (!window.confirm(t('settings.github.disconnectConfirm'))) {
      return;
    }

    setIsDisconnectingGitHub(true);
    try {
      await apiService.disconnectGitHub();
      toast.success(t('settings.github.disconnectedSuccess'));
      dispatch(getCurrentUser());
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('settings.github.disconnectError'));
    } finally {
      setIsDisconnectingGitHub(false);
    }
  };
  // PM_GITHUB_END

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors text-secondary-600 dark:text-secondary-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('settings.title')}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        {/* Profile Section */}
        <div className="pm-surface-panel rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-lg font-semibold pm-text-strong">{t('settings.profile.title')}</h2>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-700 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-lg font-medium pm-text-strong">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-sm pm-text-muted">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* PM_GITHUB_START */}
        {/* Integrations Section */}
        <div className="pm-surface-panel rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-lg font-semibold pm-text-strong">{t('settings.integrations.title')}</h2>
            <p className="text-sm pm-text-muted mt-1">{t('settings.integrations.subtitle')}</p>
          </div>
          <div className="px-6 py-4">
            {/* GitHub Integration */}
            <div className="flex items-center justify-between py-4 border-b border-secondary-100 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary-900 rounded-lg flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-medium text-secondary-900">{t('settings.github.title')}</h3>
                  {user?.github_connected ? (
                    <p className="text-sm text-primary-600">
                      {t('settings.github.connectedAs')} <span className="font-medium">@{user.github_username}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-secondary-500">{t('settings.github.description')}</p>
                  )}
                </div>
              </div>
              <div>
                {user?.github_connected ? (
                  <button
                    onClick={handleDisconnectGitHub}
                    disabled={isDisconnectingGitHub}
                    className="px-4 py-2 text-sm font-medium text-danger-600 bg-danger-50 hover:bg-danger-100 dark:bg-danger-900/20 dark:hover:bg-danger-900/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isDisconnectingGitHub ? t('settings.github.disconnecting') : t('settings.github.disconnect')}
                  </button>
                ) : (
                  <button
                    onClick={handleConnectGitHub}
                    disabled={isConnectingGitHub}
                    className="px-4 py-2 text-sm font-medium text-white bg-secondary-900 hover:bg-secondary-800 dark:bg-primary-700 dark:hover:bg-primary-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isConnectingGitHub ? t('settings.github.connecting') : t('settings.github.connect')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* PM_GITHUB_END */}
      </div>
    </div>
  );
};

export default SettingsPage;
