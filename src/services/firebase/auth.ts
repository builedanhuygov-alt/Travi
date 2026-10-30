/**
 * Travi Firebase Authentication Boundary & Operations
 * Milestone v0.5 — Live Service Integration Gate
 * Target Project ID: travi-app-23th10
 *
 * Requirements:
 * 1. Implement minimal, secure sign-in and sign-out flow using Firebase's supported SDK.
 * 2. Include clear loading, error, signed-in, and signed-out states.
 * 3. Protect user-specific data and avoid exposing private information.
 * 4. Verify required Firebase Console settings and authentication providers.
 * 5. Do not silently migrate localStorage demo data into Firestore.
 * 6. When unconfigured, provide clear actionable errors without crashing.
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { firebaseAuth, getFirebaseStatus } from './config.ts';

export interface TravelerAuthSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isMockUser: boolean;
}

export interface AuthServiceStatus {
  isLive: boolean;
  projectId: string;
  status: 'initialized' | 'unconfigured' | 'error';
  message: string;
  missingKeys: string[];
  supportedProviders: ('google' | 'email_password')[];
  consoleSetupUrl: string;
}

/**
 * Returns current authenticated user or null.
 */
export function getCurrentAuthUser(): User | null {
  if (!firebaseAuth) {
    return null;
  }
  return firebaseAuth.currentUser;
}

/**
 * Transforms Firebase User object into a sanitized, safe public session.
 * Prevents leaking internal tokens or sensitive credentials into views.
 */
export function sanitizeUserSession(user: User | null): TravelerAuthSession | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Explorer',
    photoURL: user.photoURL,
    isMockUser: false,
  };
}

/**
 * Checks whether live Firebase Auth is ready or in mock boundary mode.
 */
export function getAuthServiceStatus(): AuthServiceStatus {
  const status = getFirebaseStatus();
  return {
    isLive: status.isInitialized && firebaseAuth !== null,
    projectId: status.projectId,
    status: status.status,
    message: status.message,
    missingKeys: status.missingKeys,
    supportedProviders: ['google', 'email_password'],
    consoleSetupUrl: `https://console.firebase.google.com/project/${status.projectId}/authentication/providers`,
  };
}

/**
 * Signs in with Google using Firebase SDK popup.
 * Throws informative error when running in offline unconfigured mode.
 */
export async function signInWithGoogle(): Promise<User> {
  if (!firebaseAuth) {
    const status = getAuthServiceStatus();
    throw new Error(
      `Firebase Authentication is not configured for project [${status.projectId}]. Missing: ${status.missingKeys.join(', ')}. Enable Google sign-in in Firebase Console: ${status.consoleSetupUrl}`
    );
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const userCredential = await signInWithPopup(firebaseAuth, provider);
  return userCredential.user;
}

/**
 * Signs in with Email and Password using Firebase SDK.
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  if (!firebaseAuth) {
    const status = getAuthServiceStatus();
    throw new Error(
      `Firebase Authentication is not configured for project [${status.projectId}]. Missing: ${status.missingKeys.join(', ')}. Enable Email/Password in Firebase Console: ${status.consoleSetupUrl}`
    );
  }

  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!pass || pass.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const userCredential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), pass);
  return userCredential.user;
}

/**
 * Registers a new account with Email and Password using Firebase SDK.
 */
export async function signUpWithEmail(email: string, pass: string): Promise<User> {
  if (!firebaseAuth) {
    const status = getAuthServiceStatus();
    throw new Error(
      `Firebase Authentication is not configured for project [${status.projectId}]. Missing: ${status.missingKeys.join(', ')}. Enable Email/Password in Firebase Console: ${status.consoleSetupUrl}`
    );
  }

  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!pass || pass.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), pass);
  return userCredential.user;
}

/**
 * Signs out the currently active Firebase user.
 */
export async function signOutUser(): Promise<void> {
  if (!firebaseAuth) {
    return;
  }
  await signOut(firebaseAuth);
}

/**
 * Subscribes to Firebase Auth state changes.
 * When in offline unconfigured mode, cleanly notifies with null and returns an unsubscriber.
 */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  if (!firebaseAuth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(firebaseAuth, callback);
}
