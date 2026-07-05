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
  expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
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

  expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('mockPlayerId')).toBeNull();
  expect(localStorage.getItem('currentPlayerId')).toBeNull();
  expect(localStorage.getItem('isGuestSession')).toBeNull();
});

test('top menu includes current player home, account, and friends links', () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('currentPlayerId', '123');
  window.history.pushState({}, '', '/rules');

  render(<App />);

  expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/player/123');
  expect(screen.getByRole('link', { name: /account/i })).toHaveAttribute('href', '/player/123/account');
  expect(screen.getByRole('link', { name: /friends/i })).toHaveAttribute('href', '/player/123/friends');
});

test('top menu closes when clicking outside it', () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('currentPlayerId', '123');
  window.history.pushState({}, '', '/rules');

  render(<App />);

  const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
  fireEvent.click(menuButton);

  expect(menuButton).toHaveAttribute('aria-expanded', 'true');

  fireEvent.mouseDown(document.body);

  expect(menuButton).toHaveAttribute('aria-expanded', 'false');
});
