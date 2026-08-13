import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { getCurrentUser } from './store/authSlice';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeInitializer } from './components/shared/ThemeInitializer';
import { CommandPalette } from './components/shared/CommandPalette';
import AuthPage from './pages/AuthPage';
import VerifyAccount from './components/VerifyAccount';
import VerifyLogin from './components/VerifyLogin';
import ServerDown from './pages/ServerDown';
import ServerStartPage from './pages/ServerStartPage';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import ItemsPage from './pages/ItemsPage';
import SettingsPage from './pages/SettingsPage';
import ComponentLibrary from './pages/debug/ComponentLibrary';
import backendManager from './services/BackendManager';
import environment from './config/environment';
import NotFoundPage from './pages/NotFoundPage';
import { useTranslation } from 'react-i18next';

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();
  return isAuthenticated ? element : <Navigate to="/login" state={{ from: location }} replace />;
};

const AuthWrapper: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const { t } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const initApp = async () => {
      if (environment.apiGatewayStartEndpoint) {
        const isHealthy = await backendManager.checkHealth();
        setBackendHealthy(isHealthy);
        if (!isHealthy) {
          setIsInitialized(true);
          return;
        }
      } else {
        setBackendHealthy(true);
      }

      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          await dispatch(getCurrentUser()).unwrap();
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setIsInitialized(true);
    };

    initApp();
  }, [dispatch]);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600 dark:text-secondary-300">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  if (backendHealthy === false && environment.apiGatewayStartEndpoint) {
    return (
      <Router>
        <Routes>
          <Route path="/start-server" element={<ServerStartPage />} />
          <Route path="*" element={<Navigate to="/start-server" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <ThemeInitializer />
      <CommandPalette />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--secondary-800)',
            color: 'var(--toast-foreground)',
            borderRadius: '0.5rem',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: 'var(--success-500)',
              secondary: 'var(--toast-foreground)'
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: 'var(--danger-500)',
              secondary: 'var(--toast-foreground)'
            },
          },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage key="login" />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage key="signup" />}
        />
        <Route
          path="/verify"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <VerifyAccount key="verify" />}
        />
        <Route
          path="/verify-login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <VerifyLogin key="verify-login" />}
        />

        <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
        <Route path="/items" element={<PrivateRoute element={<ItemsPage />} />} />
        <Route path="/items/:id" element={<PrivateRoute element={<ItemsPage />} />} />
        <Route path="/settings" element={<PrivateRoute element={<SettingsPage />} />} />
        <Route path="/debug/components" element={<ComponentLibrary />} />

        <Route path="/server-down" element={<ServerDown key="server-down" />} />
        <Route path="/start-server" element={<ServerStartPage key="start-server" />} />

        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <div className="App">
          <AuthWrapper />
        </div>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
