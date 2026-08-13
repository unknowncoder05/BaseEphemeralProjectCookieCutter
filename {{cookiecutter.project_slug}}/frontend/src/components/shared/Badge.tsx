import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'sm',
  className = ''
}) => {
  const variants = {
    primary: 'bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800',
    secondary: 'pm-surface-muted pm-text-muted',
    success: 'bg-success-50 text-success-700 border-success-100 dark:bg-success-900/30 dark:text-success-400 dark:border-success-800',
    danger: 'bg-danger-50 text-danger-700 border-danger-100 dark:bg-danger-900/30 dark:text-danger-400 dark:border-danger-800',
    warning: 'bg-warning-50 text-warning-700 border-warning-100 dark:bg-warning-900/30 dark:text-warning-400 dark:border-warning-800',
    info: 'bg-info-50 text-info-700 border-info-100 dark:bg-info-900/30 dark:text-info-400 dark:border-info-800'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };

  return (
    <span className={`inline-flex items-center font-medium border rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};
