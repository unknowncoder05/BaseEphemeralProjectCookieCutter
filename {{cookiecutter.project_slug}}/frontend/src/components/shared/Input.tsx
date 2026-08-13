import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
          {label}
        </label>
      )}
      <input
        className={`
          block w-full rounded-lg shadow-sm transition-colors text-sm
          ${error
            ? 'border-danger-500 text-danger-900 dark:text-danger-400 placeholder-danger-300 focus:outline-none focus:ring-danger-500 focus:border-danger-500'
            : 'border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500 focus:ring-primary-500 focus:border-primary-500'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-300">{helperText}</p>
      )}
    </div>
  );
};
