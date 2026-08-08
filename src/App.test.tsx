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

test('play as guest starts a local guest session and lands on home', async () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /play as guest/i }));

  expect(await screen.findByRole('heading', { name: /ready to play/i })).toBeInTheDocument();
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

  fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

  expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('mockPlayerId')).toBeNull();
  expect(localStorage.getItem('currentPlayerId')).toBeNull();
  expect(localStorage.getItem('isGuestSession')).toBeNull();
});

test('top menu includes primary links in user-focused order', () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('currentPlayerId', '123');
  window.history.pushState({}, '', '/rules');

  render(<App />);

  expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/player/123');
  expect(screen.getByRole('link', { name: /games/i })).toHaveAttribute('href', '/games');
  expect(screen.getByRole('link', { name: /account/i })).toHaveAttribute('href', '/player/123/account');
  expect(screen.getByRole('link', { name: /friends/i })).toHaveAttribute('href', '/player/123/friends');
  expect(Array.from(screen.getByRole('navigation', { name: /primary navigation/i }).querySelectorAll('a')).map((link) => link.textContent)).toEqual([
    'Home',
    'Games',
    'Rules',
    'Friends',
    'Account',
  ]);
  expect(screen.getByRole('button', { name: /sign out/i })).toHaveClass('app-header-signout');
  expect(screen.queryByRole('link', { name: /^players$/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /^teams$/i })).not.toBeInTheDocument();
});

test('account page hides the internal numeric player ID', async () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('currentPlayerId', '1');
  window.history.pushState({}, '', '/player/1/account');

  render(<App />);

  expect(await screen.findByRole('heading', { name: /player account details/i })).toBeInTheDocument();
  expect(screen.getByRole('main')).toHaveClass('player-account-page');
  expect(screen.queryByLabelText(/^id$/i)).not.toBeInTheDocument();
  expect(await screen.findByDisplayValue('Alex')).toHaveAttribute('id', 'nickname');
  expect(screen.getByDisplayValue('Alex Davis')).toHaveAttribute('id', 'fullName');
  expect(screen.getByLabelText(/public player id/i)).toHaveTextContent(/^Public Player IDAlex#/i);
  expect(screen.getByRole('button', { name: /^copy$/i })).toBeInTheDocument();
});

test.each(['/playersList', '/teams'])('legacy list route %s redirects to player home', async (route) => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('currentPlayerId', '1');
  window.history.pushState({}, '', route);

  render(<App />);

  await waitFor(() => expect(window.location.pathname).toBe('/player/1'));
  expect(screen.queryByRole('button', { name: /delete my previous games/i })).not.toBeInTheDocument();
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

test('games route lists previous games directly', async () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('currentPlayerId', '1');
  window.history.pushState({}, '', '/games');

  render(<App />);

  expect(await screen.findByRole('heading', { name: /games/i })).toBeInTheDocument();
  expect(await screen.findByRole('searchbox', { name: /search games/i })).toHaveAttribute(
    'placeholder',
    'Search by date, team, or player nickname',
  );
  expect(screen.getByRole('columnheader', { name: /margin/i })).toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: /books/i })).not.toBeInTheDocument();
  expect((await screen.findAllByText(/game #1/i)).length).toBeGreaterThan(0);
  expect(screen.getAllByLabelText(/alex and sam\. players: alex, sam/i).length).toBeGreaterThan(0);
  expect(screen.getAllByRole('link', { name: /continue/i })[0]).toHaveAttribute('href', '/player/1/game/1');

  fireEvent.change(screen.getByRole('searchbox', { name: /search games/i }), {
    target: { value: 'not a saved player' },
  });

  expect(screen.getByText(/no games match/i)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /continue/i })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /clear search/i }));

  expect(screen.getAllByRole('link', { name: /continue/i })[0]).toBeInTheDocument();
});

test('game history detail route shows read-only rounds and returns to games list', async () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('currentPlayerId', '1');
  window.history.pushState({}, '', '/games/1');

  render(<App />);

  expect(await screen.findByRole('heading', { name: /game rounds/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /end game/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /new game/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /save round/i })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('link', { name: /back/i }));

  await waitFor(() => expect(window.location.pathname).toBe('/games'));
});
