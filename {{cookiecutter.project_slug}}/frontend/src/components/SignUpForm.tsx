import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { signUp, clearError } from '../store/authSlice';

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
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

function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length < 8) return 0;
  const score = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;
  if (score === 0) return 1;
  if (score === 1) return 2;
  return 3;
}

const STRENGTH_COLOR = ['', 'bg-red-400', 'bg-primary-400', 'bg-primary-500'] as const;
const STRENGTH_KEY   = ['', 'weak', 'fair', 'strong'] as const;

const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const firstNameRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    email: '', password: '', password_confirm: '',
    first_name: '', last_name: '', middle_name: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    firstNameRef.current?.focus();
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const errors = {
    first_name:       touched.first_name && !form.first_name.trim() ? t('auth.validation.firstNameRequired') : '',
    last_name:        touched.last_name  && !form.last_name.trim()  ? t('auth.validation.lastNameRequired')  : '',
    email: touched.email
      ? !form.email.trim()                              ? t('auth.validation.emailRequired')
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? t('auth.validation.emailInvalid')
      : ''
      : '',
    password: touched.password
      ? !form.password          ? t('auth.validation.passwordRequired')
      : form.password.length < 8 ? t('auth.validation.passwordMin')
      : ''
      : '',
    password_confirm: touched.password_confirm && form.password_confirm !== form.password
      ? t('auth.validation.passwordsNoMatch')
      : '',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allFields = ['first_name', 'last_name', 'email', 'password', 'password_confirm'];
    setTouched(Object.fromEntries(allFields.map((f) => [f, true])));
    if (Object.values(errors).some(Boolean)) return;
    if (!form.first_name || !form.last_name || !form.email || !form.password) return;

    try {
      await dispatch(signUp(form)).unwrap();
      onSuccess?.();
    } catch {
      // error handled by Redux
    }
  };

  const strength = passwordStrength(form.password);

  const fieldBase = "mt-1 block w-full px-3 py-2 rounded-lg border bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 dark:placeholder-secondary-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors";
  const ok  = "border-secondary-300 dark:border-secondary-600";
  const err = "border-red-400 dark:border-red-500 focus:ring-red-400";

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 px-4 py-12 transition-colors">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            {t('auth.signup.title')}
          </h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-300">
            {t('auth.signup.subtitle')}
          </p>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  {t('auth.signup.firstName')}
                </label>
                <input
                  ref={firstNameRef}
                  id="first_name" name="first_name" type="text"
                  autoComplete="given-name"
                  value={form.first_name}
                  onChange={handleChange}
                  onBlur={() => touch('first_name')}
                  className={`${fieldBase} ${errors.first_name ? err : ok}`}
                  aria-invalid={!!errors.first_name}
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.first_name}</p>
                )}
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  {t('auth.signup.lastName')}
                </label>
                <input
                  id="last_name" name="last_name" type="text"
                  autoComplete="family-name"
                  value={form.last_name}
                  onChange={handleChange}
                  onBlur={() => touch('last_name')}
                  className={`${fieldBase} ${errors.last_name ? err : ok}`}
                  aria-invalid={!!errors.last_name}
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.last_name}</p>
                )}
              </div>
            </div>

            {/* Middle name (optional) */}
            <div>
              <label htmlFor="middle_name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                {t('auth.signup.middleName')}
                <span className="ml-1 text-xs font-normal text-secondary-600 dark:text-secondary-300">
                  ({t('auth.signup.optional')})
                </span>
              </label>
              <input
                id="middle_name" name="middle_name" type="text"
                autoComplete="additional-name"
                value={form.middle_name}
                onChange={handleChange}
                className={`${fieldBase} ${ok}`}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                {t('auth.signup.email')}
              </label>
              <input
                id="email" name="email" type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                onBlur={() => touch('email')}
                className={`${fieldBase} ${errors.email ? err : ok}`}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password + strength indicator */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                {t('auth.signup.password')}
              </label>
              <div className="relative">
                <input
                  id="password" name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={() => touch('password')}
                  className={`${fieldBase} pr-10 ${errors.password ? err : ok}`}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-600 dark:text-secondary-300 hover:text-secondary-700 dark:hover:text-secondary-100 transition-colors"
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
              {errors.password ? (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.password}</p>
              ) : (
                <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-300">{t('auth.signup.passwordHint')}</p>
              )}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          strength >= level ? STRENGTH_COLOR[strength] : 'bg-secondary-200 dark:bg-secondary-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-300">
                    {t(`auth.signup.passwordStrength.${STRENGTH_KEY[strength]}`)}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="password_confirm" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                {t('auth.signup.passwordConfirm')}
              </label>
              <div className="relative">
                <input
                  id="password_confirm" name="password_confirm"
                  type={showPwConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password_confirm}
                  onChange={handleChange}
                  onBlur={() => touch('password_confirm')}
                  className={`${fieldBase} pr-10 ${errors.password_confirm ? err : ok}`}
                  aria-invalid={!!errors.password_confirm}
                />
                <button
                  type="button"
                  onClick={() => setShowPwConfirm((v) => !v)}
                  aria-label={showPwConfirm ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-600 dark:text-secondary-300 hover:text-secondary-700 dark:hover:text-secondary-100 transition-colors"
                >
                  <EyeIcon open={showPwConfirm} />
                </button>
              </div>
              {errors.password_confirm && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.password_confirm}</p>
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
              className="w-full py-2.5 px-4 bg-success-700 hover:bg-success-800 dark:bg-primary-700 dark:hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isLoading && (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isLoading ? t('auth.signup.submitting') : t('auth.signup.submit')}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-secondary-500 dark:text-secondary-300">
          {t('auth.signup.hasAccount')}{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
          >
            {t('auth.signup.signIn')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;
