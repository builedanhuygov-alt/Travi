/**
 * Reactive React Hook for Firebase Authentication State
 * Milestone v0.5 — Live Service Integration Gate
 * Target Project ID: travi-app-23th10
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithGoogle as authSignInWithGoogle,
  signInWithEmail as authSignInWithEmail,
  signUpWithEmail as authSignUpWithEmail,
  signOutUser,
  subscribeToAuthState,
  sanitizeUserSession,
  getAuthServiceStatus,
  type TravelerAuthSession,
  type AuthServiceStatus,
} from './auth.ts';

export interface UseAuthReturn {
  user: User | null;
  session: TravelerAuthSession | null;
  isLoading: boolean;
  isLiveAuth: boolean;
  status: AuthServiceStatus;
  error: string | null;
  signInWithGoogle: () => Promise<boolean>;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<TravelerAuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const status = getAuthServiceStatus();

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
      setSession(sanitizeUserSession(currentUser));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleSignInWithGoogle = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedUser = await authSignInWithGoogle();
      setUser(loggedUser);
      setSession(sanitizeUserSession(loggedUser));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignInWithEmail = useCallback(async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedUser = await authSignInWithEmail(email, pass);
      setUser(loggedUser);
      setSession(sanitizeUserSession(loggedUser));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignUpWithEmail = useCallback(async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await authSignUpWithEmail(email, pass);
      setUser(newUser);
      setSession(sanitizeUserSession(newUser));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await signOutUser();
      setUser(null);
      setSession(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    session,
    isLoading,
    isLiveAuth: status.isLive,
    status,
    error,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    signOut: handleSignOut,
    clearError,
  };
}
