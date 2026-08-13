import React, { Component, ErrorInfo, ReactNode } from 'react';
import i18n from '../../i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-6 bg-secondary-50 rounded-lg border-2 border-dashed border-secondary-200">
          <svg className="w-12 h-12 text-secondary-600 dark:text-secondary-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-secondary-900">{i18n.t('errors.boundary.title')}</h3>
          <p className="text-secondary-600 dark:text-secondary-300 mb-4 text-center">{i18n.t('errors.boundary.description')}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-primary-700 text-white rounded-md hover:bg-primary-800 transition-colors"
          >
            {i18n.t('errors.boundary.retry')}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
