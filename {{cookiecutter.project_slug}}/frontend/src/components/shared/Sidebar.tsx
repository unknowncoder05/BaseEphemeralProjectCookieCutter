import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarLink {
  to: string;
  label: string;
  icon?: React.ReactNode;
}

interface SidebarProps {
  links: SidebarLink[];
}

export const Sidebar: React.FC<SidebarProps> = ({ links }) => {
  const location = useLocation();

  return (
    <div className="w-64 h-full pm-surface-panel shadow-md border-r">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-200'
                    : 'border-transparent pm-text-muted hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]'
                } group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors`}
              >
                {link.icon && <span className="mr-3">{link.icon}</span>}
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
