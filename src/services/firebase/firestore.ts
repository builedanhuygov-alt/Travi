/**
 * Travi Cloud Firestore Boundary & Data Isolation Schema — Foundation v0.1
 * Target Project ID: travi-app-23th10
 *
 * Architecture Note:
 * In Foundation v0.1, all active database operations are deferred to Phase 2.
 * This module defines the formal schema hierarchy, typed collection paths,
 * and user data isolation contracts that match `firestore.rules`.
 */

import { doc, getDoc } from 'firebase/firestore';
import { firestoreDb, getFirebaseStatus } from './config.ts';

/**
 * Collection Path Schemas enforcing Strict User Data Isolation
 */
export const FirestoreCollections = {
  // Public Curated Platform Collections (Read-Only to clients)
  DESTINATIONS: 'destinations',
  EXPERIENCES: 'experiences',
  CIRCLES: 'circles',

  // Community Generated Collections
  DISPATCHES: 'dispatches',

  // User Document Root
  USERS: 'users',
} as const;

/**
 * Subcollections scoped strictly under /users/{userId}/...
 * Matches the isolation security rules in firestore.rules
 */
export const UserSubcollections = {
  TRIPS: 'trips',
  MEMORIES: 'memories',
  SAVED_DESTINATIONS: 'savedDestinations',
  BOOKINGS: 'bookings',
  PREFERENCES: 'preferences',
} as const;

export type UserSubcollectionType =
  (typeof UserSubcollections)[keyof typeof UserSubcollections];

/**
 * Generates an isolated user path: /users/{userId}/{subcollection}
 * Enforces architectural guarantee that user data is segregated by UID.
 */
export function getUserSubcollectionPath(
  userId: string,
  subcollection: UserSubcollectionType
): string {
  if (!userId || userId.trim() === '') {
    throw new Error('User data isolation violation: userId must be provided.');
  }
  return `users/${userId}/${subcollection}`;
}

/**
 * Generates a specific document path under a user's isolated collection
 */
export function getUserDocumentPath(
  userId: string,
  subcollection: UserSubcollectionType,
  docId: string
): string {
  return `${getUserSubcollectionPath(userId, subcollection)}/${docId}`;
}

/**
 * Inspection helper for Firestore boundary status.
 */
export function getFirestoreServiceStatus(): {
  isLive: boolean;
  projectId: string;
  isolationModel: string;
  hasDbInstance: boolean;
} {
  const status = getFirebaseStatus();
  return {
    isLive: status.isInitialized && firestoreDb !== null,
    projectId: status.projectId,
    isolationModel: 'Strict User-Scoped Subcollections (/users/{userId}/*)',
    hasDbInstance: firestoreDb !== null,
  };
}

export type FirestoreReachabilityState =
  | 'unconfigured'
  | 'untested'
  | 'checking'
  | 'reachable'
  | 'permission_denied'
  | 'network_error';

export interface FirestoreReachabilityReport {
  state: FirestoreReachabilityState;
  isReachable: boolean;
  message: string;
  checkedAt?: string;
  latencyMs?: number;
}

/**
 * Actively tests whether Cloud Firestore is reachable over the network
 * by querying the public /destinations collection.
 * Does not write or mutate any data. Never exposes secrets.
 */
export async function testFirestoreReachability(): Promise<FirestoreReachabilityReport> {
  if (!firestoreDb) {
    return {
      state: 'unconfigured',
      isReachable: false,
      message: 'Firestore SDK is in offline mode (credentials missing).',
    };
  }

  const start = Date.now();
  try {
    const testDocRef = doc(firestoreDb, FirestoreCollections.DESTINATIONS, '_connectivity_ping');
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Reachability timeout after 6000ms')), 6000)
    );
    await Promise.race([getDoc(testDocRef), timeoutPromise]);
    const latencyMs = Date.now() - start;

    return {
      state: 'reachable',
      isReachable: true,
      message: `Cloud Firestore responsive (${latencyMs}ms latency).`,
      checkedAt: new Date().toISOString(),
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('permission-denied') || msg.includes('PERMISSION_DENIED')) {
      return {
        state: 'permission_denied',
        isReachable: false,
        message: 'Cloud Firestore responded, but permission rules denied read on /destinations.',
        checkedAt: new Date().toISOString(),
        latencyMs,
      };
    }
    return {
      state: 'network_error',
      isReachable: false,
      message: `Firestore network error: ${msg}`,
      checkedAt: new Date().toISOString(),
      latencyMs,
    };
  }
}

