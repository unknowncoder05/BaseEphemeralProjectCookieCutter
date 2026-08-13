import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { validateAccount, requestCode, clearError } from '../store/authSlice';
import { ValidateAccountRequest } from '../types/auth';

const VerifyLogin: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [phoneNumber, setPhoneNumber] = useState(searchParams.get('phone') || '');
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim() || !verificationCode.trim()) {
      return;
    }

    try {
      const loginData: ValidateAccountRequest = {
        phone_number: phoneNumber,
        token: verificationCode,
      };

      await dispatch(validateAccount(loginData)).unwrap();
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by Redux
    }
  };

  const handleResendCode = async () => {
    if (!phoneNumber.trim()) {
      return;
    }

    try {
      await dispatch(requestCode({
        phone_number: phoneNumber
      })).unwrap();

      toast.success(t('verification.resent'));
    } catch (error) {
      // Error is handled by Redux
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
            {t('verification.loginTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-300">
            {t('verification.subtitle')}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div className="space-y-4">
            <div>
              <label htmlFor="phone-number" className="block text-sm font-medium text-secondary-700">
                {t('verification.phoneNumber')}
              </label>
              <input
                id="phone-number"
                name="phone-number"
                type="tel"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-secondary-300 placeholder-secondary-500 text-secondary-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="verification-code" className="block text-sm font-medium text-secondary-700">
                {t('verification.code')}
              </label>
              <input
                id="verification-code"
                name="verification-code"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-secondary-300 placeholder-secondary-500 text-secondary-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder={t('verification.codePlaceholder')}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('verification.verifying')}
                </div>
              ) : (
                t('auth.login.submit')
              )}
            </button>
          </div>
        </form>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading || !phoneNumber.trim()}
            className="text-sm text-primary-600 hover:text-primary-500 disabled:text-secondary-600 dark:text-secondary-300"
          >
            {t('verification.resend')}
          </button>

          <div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-secondary-600 dark:text-secondary-300 hover:text-secondary-500"
            >
              {t('verification.backToLogin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyLogin;
