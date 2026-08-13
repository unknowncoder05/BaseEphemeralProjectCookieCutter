import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface BreadcrumbItem {
  label: string;
  path: string;
}

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm font-medium text-secondary-700 hover:text-primary-600 dark:text-secondary-300 dark:hover:text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            {t('nav.dashboard')}
          </Link>
        </li>
        {pathnames.map((value, index) => {
          if (value === 'dashboard') return null;
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

          return (
            <li key={to}>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-secondary-600 dark:text-secondary-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                {last ? (
                  <span className="ml-1 text-sm font-medium text-secondary-500 md:ml-2 dark:text-secondary-300">
                    {label}
                  </span>
                ) : (
                  <Link
                    to={to}
                    className="ml-1 text-sm font-medium text-secondary-700 hover:text-primary-600 md:ml-2 dark:text-secondary-300 dark:hover:text-white"
                  >
                    {label}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
