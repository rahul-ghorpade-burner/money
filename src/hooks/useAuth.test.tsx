import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';
import React from 'react';

const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('throws when used outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    consoleError.mockRestore();
  });

  it('initializes with isLoading=true and no session', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('sets isLoading=false after onAuthStateChange fires with null session', () => {
    let authCallback: (event: string, session: null) => void = () => {};
    mockOnAuthStateChange.mockImplementation((cb: typeof authCallback) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      authCallback('INITIAL_SESSION', null);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.session).toBeNull();
  });

  it('sets session when onAuthStateChange fires with a session', () => {
    const fakeSession = { user: { id: 'user-123' }, access_token: 'tok' };
    let authCallback: (event: string, session: typeof fakeSession) => void = () => {};
    mockOnAuthStateChange.mockImplementation((cb: typeof authCallback) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      authCallback('SIGNED_IN', fakeSession);
    });

    expect(result.current.session).toEqual(fakeSession);
    expect(result.current.user).toEqual(fakeSession.user);
    expect(result.current.isLoading).toBe(false);
  });

  describe('signIn', () => {
    it('returns null on successful login', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({ error: null });
      const { result } = renderHook(() => useAuth(), { wrapper });

      let error: string | null = 'initial';
      await act(async () => {
        error = await result.current.signIn('user@example.com', 'password');
      });

      expect(error).toBeNull();
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password',
      });
    });

    it('returns sanitized error message on failed login', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: 'Invalid login credentials' },
      });
      const { result } = renderHook(() => useAuth(), { wrapper });

      let error: string | null = null;
      await act(async () => {
        error = await result.current.signIn('user@example.com', 'wrongpassword');
      });

      expect(error).toBe('incorrect email or password');
    });
  });

  describe('signOut', () => {
    it('calls supabase signOut successfully', async () => {
      mockSignOut.mockResolvedValueOnce({ error: null });
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalledOnce();
    });

    it('throws when supabase signOut fails', async () => {
      mockSignOut.mockResolvedValueOnce({ error: { message: 'network error' } });
      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.signOut();
        })
      ).rejects.toThrow('sign out failed');
    });
  });
});
