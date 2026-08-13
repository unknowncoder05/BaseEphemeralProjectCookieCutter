import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  description,
  onClick,
  hoverable = false
}) => {
  const hoverStyles = hoverable ? 'hover:shadow-lg transition-shadow cursor-pointer' : '';

  return (
    <div
      className={`pm-surface-panel rounded-lg shadow-md ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {(title || description) && (
        <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
          {title && <h3 className="text-lg font-semibold pm-text-strong">{title}</h3>}
          {description && <p className="mt-1 text-sm pm-text-muted">{description}</p>}
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );
};
