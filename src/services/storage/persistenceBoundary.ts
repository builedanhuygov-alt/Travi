/**
 * Travi Persistence Architecture & Data Isolation Boundary
 * Milestone v0.5 — Live Service Integration Gate
 * Target Project ID: travi-app-23th10
 *
 * Requirements:
 * 1. Keep demo mode available at all times.
 * 2. Define a strict boundary between local demo persistence and authenticated cloud persistence.
 * 3. Do not silently migrate local demo data into a remote database upon sign-in.
 * 4. User data written to Cloud Firestore must strictly conform to firestore.rules (/users/{userId}/*).
 * 5. Do not loosen security rules.
 */

import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { firestoreDb, getFirebaseStatus } from '../firebase/config.ts';
import { getUserSubcollectionPath } from '../firebase/firestore.ts';
import { demoStore } from './demoStore.ts';

export type PersistenceMode = 'local_demo' | 'authenticated_cloud';

export interface PersistenceBoundaryStatus {
  currentMode: PersistenceMode;
  isCloudSyncEnabled: boolean;
  userIsolationPath: string | null;
  canMigrate: boolean;
  isolationContract: string;
  migrationPolicyNotice: string;
}

export interface CloudMigrationResult {
  success: boolean;
  migratedCounts: {
    trips: number;
    savedDestinations: number;
    memories: number;
    tasteProfileConfigured: boolean;
  };
  message: string;
}

/**
 * Returns current status of the persistence boundary.
 * Guarantees that unauthenticated users remain strictly in local demo mode.
 */
export function getPersistenceBoundaryStatus(userId?: string | null): PersistenceBoundaryStatus {
  const firebaseStatus = getFirebaseStatus();
  const isAuthenticated = Boolean(userId && userId.trim() !== '');
  const hasLiveDb = firebaseStatus.isInitialized && firestoreDb !== null;

  const currentMode: PersistenceMode = isAuthenticated && hasLiveDb ? 'authenticated_cloud' : 'local_demo';

  return {
    currentMode,
    isCloudSyncEnabled: currentMode === 'authenticated_cloud',
    userIsolationPath: isAuthenticated ? `/users/${userId}/*` : null,
    canMigrate: isAuthenticated && hasLiveDb,
    isolationContract: 'Strict User-Scoped Subcollections: all cloud documents map to /users/{uid}/*',
    migrationPolicyNotice:
      'Zero Silent Migration Guarantee: Local demo data is NEVER automatically transferred to remote Firestore upon sign-in. Data synchronization requires explicit, authenticated user initiation.',
  };
}

/**
 * Verifies that a target cloud path strictly respects the user-scoped isolation model.
 */
export function verifyOwnershipForCloudSync(userId: string, targetPath: string): boolean {
  if (!userId || userId.trim() === '') return false;
  const expectedPrefix = `users/${userId}/`;
  return targetPath.startsWith(expectedPrefix);
}

/**
 * Explicit, user-initiated migration helper to transfer local demo ledger into Cloud Firestore.
 * Conforms strictly to firestore.rules.
 * Returns clear failure when offline or unauthenticated.
 */
export async function migrateLocalDemoLedgerToCloud(userId: string): Promise<CloudMigrationResult> {
  const boundary = getPersistenceBoundaryStatus(userId);

  if (!boundary.canMigrate || !firestoreDb) {
    return {
      success: false,
      migratedCounts: {
        trips: 0,
        savedDestinations: 0,
        memories: 0,
        tasteProfileConfigured: false,
      },
      message:
        'Cloud migration unavailable: Firebase is operating in offline demo mode or traveler is unauthenticated.',
    };
  }

  // Verify subcollection paths before attempting writes
  const tripsPath = getUserSubcollectionPath(userId, 'trips');
  const savedDestsPath = getUserSubcollectionPath(userId, 'savedDestinations');
  const memoriesPath = getUserSubcollectionPath(userId, 'memories');
  const prefsPath = getUserSubcollectionPath(userId, 'preferences');

  if (
    !verifyOwnershipForCloudSync(userId, tripsPath) ||
    !verifyOwnershipForCloudSync(userId, savedDestsPath) ||
    !verifyOwnershipForCloudSync(userId, memoriesPath) ||
    !verifyOwnershipForCloudSync(userId, prefsPath)
  ) {
    throw new Error('Security violation: Attempted to write to a path outside /users/{uid}/*');
  }

  // Read current local demo state
  const localTrips = demoStore.getTrips();
  const localSavedIds = demoStore.getSavedDestinationIds();
  const localMemories = demoStore.getMemories();
  const localTaste = demoStore.getTasteProfile();

  try {
    const batch = writeBatch(firestoreDb);

    for (const trip of localTrips) {
      const tripRef = doc(firestoreDb, tripsPath, trip.id);
      batch.set(tripRef, { ...trip, migratedAt: new Date().toISOString() });
    }

    for (const destId of localSavedIds) {
      const destRef = doc(firestoreDb, savedDestsPath, destId);
      batch.set(destRef, { destinationId: destId, savedAt: new Date().toISOString() });
    }

    for (const memory of localMemories) {
      const memRef = doc(firestoreDb, memoriesPath, memory.id);
      batch.set(memRef, { ...memory, migratedAt: new Date().toISOString() });
    }

    const prefRef = doc(firestoreDb, prefsPath, 'tasteProfile');
    const sanitizedTaste = Object.fromEntries(
      Object.entries(localTaste).filter(([, v]) => v !== undefined)
    );
    batch.set(prefRef, { ...sanitizedTaste, migratedAt: new Date().toISOString() });

    await batch.commit();

    return {
      success: true,
      migratedCounts: {
        trips: localTrips.length,
        savedDestinations: localSavedIds.length,
        memories: localMemories.length,
        tasteProfileConfigured: (localTaste.isCustomized ?? false),
      },
      message: `Successfully synchronized ${localTrips.length} journeys and ${localSavedIds.length} bookmarks to cloud profile.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      migratedCounts: { trips: 0, savedDestinations: 0, memories: 0, tasteProfileConfigured: false },
      message: `Cloud migration unavailable: ${msg}`,
    };
  }
}

export interface CloudLedgerSummary {
  success: boolean;
  tripsCount: number;
  savedDestinationsCount: number;
  memoriesCount: number;
  hasTasteProfile: boolean;
  queriedPath: string;
  fetchedAt: string;
  message: string;
}

/**
 * Reads user-owned documents from Cloud Firestore under /users/{userId}/*
 * Strictly validates path ownership before issuing any read query.
 */
export async function fetchUserCloudLedger(userId: string): Promise<CloudLedgerSummary> {
  const boundary = getPersistenceBoundaryStatus(userId);

  if (!boundary.canMigrate || !firestoreDb) {
    return {
      success: false,
      tripsCount: 0,
      savedDestinationsCount: 0,
      memoriesCount: 0,
      hasTasteProfile: false,
      queriedPath: `/users/${userId}/*`,
      fetchedAt: new Date().toISOString(),
      message: 'Cloud read unavailable: Firebase is offline or traveler is unauthenticated.',
    };
  }

  const tripsPath = getUserSubcollectionPath(userId, 'trips');
  const savedDestsPath = getUserSubcollectionPath(userId, 'savedDestinations');
  const memoriesPath = getUserSubcollectionPath(userId, 'memories');
  const prefsPath = getUserSubcollectionPath(userId, 'preferences');

  if (
    !verifyOwnershipForCloudSync(userId, tripsPath) ||
    !verifyOwnershipForCloudSync(userId, savedDestsPath) ||
    !verifyOwnershipForCloudSync(userId, memoriesPath) ||
    !verifyOwnershipForCloudSync(userId, prefsPath)
  ) {
    throw new Error('Security violation: Attempted to read a path outside /users/{uid}/*');
  }

  try {
    const tripsSnap = await getDocs(collection(firestoreDb, tripsPath));
    const savedSnap = await getDocs(collection(firestoreDb, savedDestsPath));
    const memoriesSnap = await getDocs(collection(firestoreDb, memoriesPath));
    const prefSnap = await getDoc(doc(firestoreDb, prefsPath, 'tasteProfile'));

    return {
      success: true,
      tripsCount: tripsSnap.size,
      savedDestinationsCount: savedSnap.size,
      memoriesCount: memoriesSnap.size,
      hasTasteProfile: prefSnap.exists(),
      queriedPath: `/users/${userId}/*`,
      fetchedAt: new Date().toISOString(),
      message: `Verified cloud read: ${tripsSnap.size} journeys, ${savedSnap.size} sanctuaries, ${memoriesSnap.size} memories fetched from /users/${userId}/*.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      tripsCount: 0,
      savedDestinationsCount: 0,
      memoriesCount: 0,
      hasTasteProfile: false,
      queriedPath: `/users/${userId}/*`,
      fetchedAt: new Date().toISOString(),
      message: `Cloud read failed: ${msg}`,
    };
  }
}

