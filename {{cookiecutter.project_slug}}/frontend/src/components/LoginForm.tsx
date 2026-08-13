import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, clearError } from '../store/authSlice';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToSignUp }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const emailError = touched.email && !email.trim()
    ? t('auth.validation.emailRequired')
    : touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? t('auth.validation.emailInvalid')
      : '';

  const passwordError = touched.password && !password
    ? t('auth.validation.passwordRequired')
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!email.trim() || !password) return;

    try {
      await dispatch(login({ email, password })).unwrap();
      onSuccess?.();
    } catch {
      // error handled by Redux
    }
  };

  const fieldBase = "mt-1 block w-full px-3 py-2 rounded-lg border bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 dark:placeholder-secondary-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors";
  const fieldOk = "border-secondary-300 dark:border-secondary-600";
  const fieldErr = "border-red-400 dark:border-red-500 focus:ring-red-400";

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 px-4 py-12 transition-colors">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            {t('auth.login.title')}
          </h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-300">
            {t('auth.login.subtitle')}
          </p>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                {t('auth.login.email')}
              </label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                className={`${fieldBase} ${emailError ? fieldErr : fieldOk}`}
                aria-describedby={emailError ? 'email-error' : undefined}
                aria-invalid={!!emailError}
              />
              {emailError && (
                <p id="email-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  {t('auth.login.password')}
                </label>
                <button
                  type="button"
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  tabIndex={-1}
                >
                  {t('auth.login.forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  className={`${fieldBase} pr-10 ${passwordError ? fieldErr : fieldOk}`}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  aria-invalid={!!passwordError}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-600 dark:text-secondary-300 hover:text-secondary-700 dark:hover:text-secondary-100 transition-colors"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Server-side error */}
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-primary-700 hover:bg-primary-800 dark:bg-primary-700 dark:hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isLoading && (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-secondary-500 dark:text-secondary-300">
          {t('auth.login.noAccount')}{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
          >
            {t('auth.login.signUp')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
