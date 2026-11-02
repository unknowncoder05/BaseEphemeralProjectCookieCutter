import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import i18n from './i18n';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('theme', 'light');
  window.history.replaceState({}, '', '/');
});

test('public home lets a guest navigate to login', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: i18n.t('home.hero.title') })).toBeInTheDocument();
  const loginButtons = screen.getAllByRole('button', { name: i18n.t('home.hero.ctaLogin') });
  fireEvent.click(loginButtons[0]);
  expect(await screen.findByRole('heading', { name: i18n.t('auth.login.title') })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/login');
});

test('protected dashboard redirects a guest to login', async () => {
  window.history.replaceState({}, '', '/dashboard');
  render(<App />);
  expect(await screen.findByRole('heading', { name: i18n.t('auth.login.title') })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/login');
});
