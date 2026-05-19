import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '/login');
});

test('renders login screen', () => {
  render(<App />);
  expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});

test('sign out clears auth and returns to login', async () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('mockPlayerId', '123');
  localStorage.setItem('currentPlayerId', '123');
  window.history.pushState({}, '', '/playersList');

  render(<App />);

  fireEvent.click(screen.getByRole('link', { name: /sign out/i }));

  expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('mockPlayerId')).toBeNull();
  expect(localStorage.getItem('currentPlayerId')).toBeNull();
});
