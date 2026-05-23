import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import MockApi from './services/MockApi';

const originalApiUrl = process.env.REACT_APP_API_URL;

beforeEach(() => {
  process.env.REACT_APP_API_URL = 'mock';
  localStorage.clear();
  MockApi.reset();
  window.history.pushState({}, '', '/login');
});

afterAll(() => {
  process.env.REACT_APP_API_URL = originalApiUrl;
});

test('renders login screen', () => {
  render(<App />);
  expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /play as guest/i })).toBeInTheDocument();
});

test('play as guest starts a local guest session and lands on player details', async () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /play as guest/i }));

  expect(await screen.findByRole('heading', { name: /player details/i })).toBeInTheDocument();
  await waitFor(() => expect(window.location.pathname).toBe('/player/5'));
  expect(localStorage.getItem('token')).toBe('guest-token-5');
  expect(localStorage.getItem('currentPlayerId')).toBe('5');
  expect(localStorage.getItem('mockPlayerId')).toBe('5');
  expect(localStorage.getItem('isGuestSession')).toBe('true');
});

test('guest nickname can be edited before starting a game', async () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /play as guest/i }));

  const nicknameInput = await screen.findByLabelText(/nickname/i);
  expect(nicknameInput).not.toBeDisabled();

  fireEvent.change(nicknameInput, { target: { value: 'Wild Bill' } });
  fireEvent.click(screen.getByRole('button', { name: /start game/i }));

  expect(await screen.findByDisplayValue('Wild Bill')).toBeInTheDocument();
});

test('sign out clears auth and returns to login', async () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('mockPlayerId', '123');
  localStorage.setItem('currentPlayerId', '123');
  localStorage.setItem('isGuestSession', 'true');
  window.history.pushState({}, '', '/playersList');

  render(<App />);

  fireEvent.click(screen.getByRole('link', { name: /sign out/i }));

  expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('mockPlayerId')).toBeNull();
  expect(localStorage.getItem('currentPlayerId')).toBeNull();
  expect(localStorage.getItem('isGuestSession')).toBeNull();
});
