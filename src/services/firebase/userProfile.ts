/**
 * Travi Real User Identity & Profile Service
 * Milestone v1.1 — Real User Experience & Firestore Persistence
 * Target Project ID: travi-app-23th10
 *
 * Security Model:
 * Stored under /users/{userId} matching firestore.rules:
 * match /users/{userId} {
 *   allow read: if isAuthenticated();
 *   allow create, update, delete: if isOwner(userId);
 * }
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { firestoreDb, firebaseAuth } from './config.ts';

export interface UserProfileData {
  uid: string;
  displayName: string;
  handle: string;
  bio: string;
  homeBase: string;
  avatarUrl?: string;
  email: string | null;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates editable profile fields before submitting to Firestore or Auth.
 */
export function validateUserProfile(data: Partial<UserProfileData>): ProfileValidationResult {
  const errors: Record<string, string> = {};

  if (data.displayName !== undefined) {
    const trimmed = data.displayName.trim();
    if (trimmed.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters.';
    } else if (trimmed.length > 50) {
      errors.displayName = 'Display name cannot exceed 50 characters.';
    }
  }

  if (data.handle !== undefined) {
    const sanitized = data.handle.startsWith('@') ? data.handle.slice(1) : data.handle;
    if (sanitized.length < 3) {
      errors.handle = 'Username handle must be at least 3 characters.';
    } else if (sanitized.length > 30) {
      errors.handle = 'Username handle cannot exceed 30 characters.';
    } else if (!/^[a-zA-Z0-9_.]+$/.test(sanitized)) {
      errors.handle = 'Username can only contain letters, numbers, underscores, and dots.';
    }
  }

  if (data.bio !== undefined && data.bio.length > 500) {
    errors.bio = 'Bio cannot exceed 500 characters.';
  }

  if (data.homeBase !== undefined && data.homeBase.length > 100) {
    errors.homeBase = 'Home base location cannot exceed 100 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Formats a handle string to always have a clean @ prefix.
 */
export function formatHandle(handle: string): string {
  const clean = handle.trim().replace(/^@+/, '');
  return clean.length > 0 ? `@${clean}` : '';
}

/**
 * Generates clean, neutral default identity values for a real authenticated user.
 * Never hardcodes sample personal identities (e.g. Minh Duy) as defaults.
 */
export function getFallbackProfile(user: {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}): UserProfileData {
  const baseName = user.displayName?.trim() || user.email?.split('@')[0] || 'Traveler';
  const cleanHandle = baseName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'traveler';

  return {
    uid: user.uid,
    displayName: baseName,
    handle: `@${cleanHandle}`,
    bio: '',
    homeBase: '',
    avatarUrl: user.photoURL || undefined,
    email: user.email || null,
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Fetches user profile document from Cloud Firestore under /users/{userId}.
 * Returns null if not found or if Firestore is offline.
 */
export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  if (!userId || !firestoreDb) {
    return null;
  }

  try {
    const userDocRef = doc(firestoreDb, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (err: unknown) {
    console.warn('[Travi UserProfile] Failed to fetch profile from Firestore:', err);
    return null;
  }
}

/**
 * Saves user profile to Cloud Firestore under /users/{userId}.
 * Also updates Firebase Auth profile (displayName, photoURL) if matching session.
 */
export async function saveUserProfile(
  userId: string,
  data: Partial<UserProfileData>
): Promise<UserProfileData> {
  if (!userId || userId.trim() === '') {
    throw new Error('User profile update rejected: userId must be provided.');
  }

  const validation = validateUserProfile(data);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(`Profile validation failed: ${firstError}`);
  }

  const formattedData: Partial<UserProfileData> = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  if (formattedData.handle) {
    formattedData.handle = formatHandle(formattedData.handle);
  }
  if (formattedData.displayName) {
    formattedData.displayName = formattedData.displayName.trim();
  }
  if (formattedData.bio !== undefined) {
    formattedData.bio = formattedData.bio.trim();
  }
  if (formattedData.homeBase !== undefined) {
    formattedData.homeBase = formattedData.homeBase.trim();
  }

  // Update Firebase Auth session if current user matches
  if (firebaseAuth?.currentUser && firebaseAuth.currentUser.uid === userId) {
    const authUpdates: { displayName?: string; photoURL?: string } = {};
    if (formattedData.displayName) authUpdates.displayName = formattedData.displayName;
    if (formattedData.avatarUrl !== undefined) authUpdates.photoURL = formattedData.avatarUrl;

    if (Object.keys(authUpdates).length > 0) {
      try {
        await updateProfile(firebaseAuth.currentUser, authUpdates);
      } catch (authErr) {
        console.warn('[Travi UserProfile] Could not update Auth profile:', authErr);
      }
    }
  }

  // Persist to Cloud Firestore /users/{userId}
  if (firestoreDb) {
    const userDocRef = doc(firestoreDb, 'users', userId);
    await setDoc(userDocRef, formattedData, { merge: true });
  }

  // Return the complete merged profile
  const existing = await getUserProfile(userId);
  return {
    uid: userId,
    displayName: formattedData.displayName || existing?.displayName || 'Traveler',
    handle: formattedData.handle || existing?.handle || '@traveler',
    bio: formattedData.bio !== undefined ? formattedData.bio : existing?.bio || '',
    homeBase: formattedData.homeBase !== undefined ? formattedData.homeBase : existing?.homeBase || '',
    avatarUrl: formattedData.avatarUrl || existing?.avatarUrl,
    email: formattedData.email !== undefined ? formattedData.email : existing?.email || null,
    currency: formattedData.currency || existing?.currency || 'USD',
    updatedAt: formattedData.updatedAt,
    createdAt: existing?.createdAt || formattedData.createdAt || new Date().toISOString(),
  };
}
