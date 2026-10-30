import { describe, it, expect } from 'vitest';
import {
  getAuthServiceStatus,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  subscribeToAuthState,
  sanitizeUserSession,
} from '../auth.ts';
import { testFirestoreReachability } from '../firestore.ts';
import type { User } from 'firebase/auth';

describe('Firebase Authentication Boundary & Security (Milestone v0.5)', () => {
  describe('1. Auth Boundary Configuration Status', () => {
    it('reports correct target project ID and valid status structure', () => {
      const status = getAuthServiceStatus();

      expect(status.projectId).toBe('travi-app-23th10');
      if (status.isLive) {
        expect(status.status).toBe('initialized');
        expect(status.missingKeys).toEqual([]);
      } else {
        expect(status.status).toBe('unconfigured');
        expect(status.missingKeys).toContain('VITE_FIREBASE_API_KEY');
        expect(status.missingKeys).toContain('VITE_FIREBASE_APP_ID');
      }
      expect(status.supportedProviders).toEqual(['google', 'email_password']);
      expect(status.consoleSetupUrl).toContain('travi-app-23th10');
    });
  });

  describe('2. Sign-In Operations & Validation', () => {
    it('validates email format before attempting network calls', async () => {
      await expect(signInWithEmail('invalid-email', 'secret123')).rejects.toThrowError(
        /valid email/
      );
      await expect(signUpWithEmail('invalid-email', 'secret123')).rejects.toThrowError(
        /valid email/
      );
    });

    it('validates password length before attempting network calls', async () => {
      await expect(signInWithEmail('explorer@travi.test', '123')).rejects.toThrowError(
        /at least 6 characters/
      );
      await expect(signUpWithEmail('explorer@travi.test', '123')).rejects.toThrowError(
        /at least 6 characters/
      );
    });

    it('rejects signInWithGoogle in non-browser or unconfigured environment', async () => {
      await expect(signInWithGoogle()).rejects.toThrow();
    });

    it('signOutUser completes safely without errors', async () => {
      await expect(signOutUser()).resolves.toBeUndefined();
    });
  });

  describe('3. Auth State Observer & Session Sanitization', () => {
    it('subscribeToAuthState returns an unsubscribe function without errors', () => {
      const unsubscribe = subscribeToAuthState(() => {});
      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });

    it('sanitizeUserSession returns null when user is null', () => {
      expect(sanitizeUserSession(null)).toBeNull();
    });

    it('sanitizeUserSession strips internal properties and creates safe TravelerAuthSession', () => {
      const mockUser = {
        uid: 'uid_test_12345',
        email: 'traveler@travi.test',
        displayName: 'Minh Duy',
        photoURL: 'https://images.unsplash.com/avatar.jpg',
        refreshToken: 'SUPER_SECRET_TOKEN_DO_NOT_EXPOSE',
      } as unknown as User;

      const session = sanitizeUserSession(mockUser);

      expect(session).toEqual({
        uid: 'uid_test_12345',
        email: 'traveler@travi.test',
        displayName: 'Minh Duy',
        photoURL: 'https://images.unsplash.com/avatar.jpg',
        isMockUser: false,
      });

      // Crucial: Sensitive token fields are NOT present
      expect((session as any).refreshToken).toBeUndefined();
    });
  });

  describe('4. Firestore Cloud Reachability Inspection', () => {
    it('testFirestoreReachability returns a structured reachability report without crashing', async () => {
      const report = await testFirestoreReachability();
      expect(['unconfigured', 'reachable', 'permission_denied', 'network_error']).toContain(report.state);
      expect(typeof report.isReachable).toBe('boolean');
      expect(typeof report.message).toBe('string');
    });
  });
});
