import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginScreen } from './LoginScreen';
import React from 'react';

const mockSignIn = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    session: null,
    user: null,
    isLoading: false,
    signOut: vi.fn(),
  }),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields and sign in button', () => {
    render(<LoginScreen />);
    expect(screen.getByPlaceholderText('email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('form has aria-label for accessibility', () => {
    render(<LoginScreen />);
    expect(screen.getByRole('form', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls signIn from useAuth with entered credentials', async () => {
    mockSignIn.mockResolvedValueOnce(null);
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.type(screen.getByPlaceholderText('email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('password'), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'secret123');
  });

  it('displays error message when signIn returns an error string', async () => {
    mockSignIn.mockResolvedValueOnce('incorrect email or password');
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.type(screen.getByPlaceholderText('email'), 'wrong@example.com');
    await user.type(screen.getByPlaceholderText('password'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('incorrect email or password')).toBeInTheDocument();
    });
  });

  it('error message has aria-live="assertive" for screen readers', async () => {
    mockSignIn.mockResolvedValueOnce('incorrect email or password');
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.type(screen.getByPlaceholderText('email'), 'x@x.com');
    await user.type(screen.getByPlaceholderText('password'), 'bad');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      const errorEl = screen.getByText('incorrect email or password');
      expect(errorEl).toHaveAttribute('aria-live', 'assertive');
    });
  });

  it('button shows "signing in..." and is disabled while loading', async () => {
    let resolveSignIn: (val: string | null) => void;
    mockSignIn.mockImplementationOnce(
      () => new Promise((resolve) => { resolveSignIn = resolve; })
    );
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.type(screen.getByPlaceholderText('email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('password'), 'pass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

    await act(async () => { resolveSignIn('incorrect email or password'); });
  });

  it('resets button to "sign in" after failed login', async () => {
    mockSignIn.mockResolvedValueOnce('incorrect email or password');
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.type(screen.getByPlaceholderText('email'), 'x@x.com');
    await user.type(screen.getByPlaceholderText('password'), 'bad');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
    });
  });
});

function act(fn: () => Promise<void>) {
  return fn();
}
