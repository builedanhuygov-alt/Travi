/**
 * Travi Real User Cloud Ledger Service
 * Milestone v1.1 — Real User Experience & Firestore Persistence
 * Target Project ID: travi-app-23th10
 *
 * Security Model:
 * Scoped strictly under /users/{userId}/* subcollections:
 * - /users/{userId}/trips/{tripId}
 * - /users/{userId}/savedDestinations/{destId}
 * - /users/{userId}/memories/{memoryId}
 * - /users/{userId}/preferences/tasteProfile
 *
 * All operations enforce client ownership matching firestore.rules:
 * allow read, write: if request.auth != null && request.auth.uid == userId;
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import type { Trip, Memory, TasteProfile } from '../../types/index.ts';
import { firestoreDb } from './config.ts';
import { getUserSubcollectionPath } from './firestore.ts';
import { verifyOwnershipForCloudSync } from '../storage/persistenceBoundary.ts';
import { EMPTY_TASTE_PROFILE } from '../taste/tasteData.ts';

export interface UserCloudState {
  trips: Trip[];
  savedDestIds: string[];
  memories: Memory[];
  tasteProfile: TasteProfile;
  isLoading: boolean;
  error: string | null;
  lastSyncedAt?: string;
}

/**
 * Returns the scoped Firestore subcollection path for a user with validation.
 */
export function getUserLedgerPath(
  userId: string,
  collectionName: 'trips' | 'savedDestinations' | 'memories' | 'preferences'
): string {
  if (!userId || userId.trim() === '') {
    throw new Error('Security isolation violation: userId is required.');
  }
  return getUserSubcollectionPath(userId.trim(), collectionName);
}

// ---------------------------------------------------------------------------
// 1. Trips CRUD (/users/{userId}/trips/*)
// ---------------------------------------------------------------------------

export async function fetchUserTrips(userId: string): Promise<Trip[]> {
  if (!userId || userId.trim() === '') {
    throw new Error('Cannot fetch user trips: userId is required.');
  }
  if (!firestoreDb) return [];

  const tripsPath = getUserSubcollectionPath(userId, 'trips');
  if (!verifyOwnershipForCloudSync(userId, tripsPath)) {
    throw new Error('Security isolation violation: Attempted cross-user read');
  }

  const snap = await getDocs(collection(firestoreDb, tripsPath));
  const trips: Trip[] = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data && typeof data.title === 'string') {
      trips.push({ ...(data as Trip), id: d.id });
    }
  });

  return trips;
}

export async function saveUserTrip(userId: string, trip: Trip): Promise<Trip> {
  if (!userId || userId.trim() === '') {
    throw new Error('Cannot save trip: userId is required.');
  }
  if (!trip || !trip.id || trip.id.trim() === '') {
    throw new Error('Cannot save trip: trip and trip.id are required.');
  }
  if (!firestoreDb) {
    throw new Error('Cannot save trip to cloud: Firestore offline or unconfigured');
  }

  const tripsPath = getUserSubcollectionPath(userId, 'trips');
  if (!verifyOwnershipForCloudSync(userId, tripsPath)) {
    throw new Error('Security isolation violation: Attempted cross-user write');
  }

  const tripRef = doc(firestoreDb, tripsPath, trip.id);
  const payload = {
    ...trip,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(tripRef, payload, { merge: true });
  return trip;
}

export async function deleteUserTrip(userId: string, tripId: string): Promise<boolean> {
  if (!userId || userId.trim() === '') {
    throw new Error('Cannot delete trip: userId is required.');
  }
  if (!tripId || tripId.trim() === '') {
    throw new Error('Cannot delete trip: tripId is required.');
  }
  if (!firestoreDb) return false;

  const tripsPath = getUserSubcollectionPath(userId, 'trips');
  if (!verifyOwnershipForCloudSync(userId, tripsPath)) {
    throw new Error('Security isolation violation: Attempted cross-user delete');
  }

  const tripRef = doc(firestoreDb, tripsPath, tripId);
  await deleteDoc(tripRef);
  return true;
}

// ---------------------------------------------------------------------------
// 2. Saved Destinations CRUD (/users/{userId}/savedDestinations/*)
// ---------------------------------------------------------------------------

export async function fetchUserSavedDestinations(userId: string): Promise<string[]> {
  if (!userId || userId.trim() === '') {
    throw new Error('Cannot fetch saved destinations: userId is required.');
  }
  if (!firestoreDb) return [];

  const savedDestsPath = getUserSubcollectionPath(userId, 'savedDestinations');
  if (!verifyOwnershipForCloudSync(userId, savedDestsPath)) {
    throw new Error('Security isolation violation: Attempted cross-user read');
  }

  const snap = await getDocs(collection(firestoreDb, savedDestsPath));
  const ids: string[] = [];
  snap.forEach((d) => {
    ids.push(d.id);
  });

  return ids;
}

export async function saveUserSavedDestination(userId: string, destinationId: string): Promise<boolean> {
  if (!userId || userId.trim() === '') {
    throw new Error('Cannot save destination: userId is required.');
  }
  if (!destinationId || destinationId.trim() === '') {
    throw new Error('Cannot save destination: destinationId is required.');
  }
  if (!firestoreDb) return false;

  const savedDestsPath = getUserSubcollectionPath(userId, 'savedDestinations');
  if (!verifyOwnershipForCloudSync(userId, savedDestsPath)) {
    throw new Error('Security isolation violation: Attempted cross-user write');
  }

  const destRef = doc(firestoreDb, savedDestsPath, destinationId);
  await setDoc(destRef, {
    destinationId,
    savedAt: new Date().toISOString(),
  });
  return true;
}

export async function deleteUserSavedDestination(userId: string, destinationId: string): Promise<boolean> {
  if (!userId || userId.trim() === '') {
    throw new Error('Cannot delete destination: userId is required.');
  }
  if (!destinationId || destinationId.trim() === '') {
    throw new Error('Cannot delete destination: destinationId is required.');
  }
  if (!firestoreDb) return false;

  const savedDestsPath = getUserSubcollectionPath(userId, 'savedDestinations');
  if (!verifyOwnershipForCloudSync(userId, savedDestsPath)) {
    throw new Error('Security isolation violation: Attempted cross-user delete');
  }

  const destRef = doc(firestoreDb, savedDestsPath, destinationId);
  await deleteDoc(destRef);
  return true;
}

// ---------------------------------------------------------------------------
// 3. Memories CRUD (/users/{userId}/memories/*)
// ---------------------------------------------------------------------------

export async function fetchUserMemories(userId: string): Promise<Memory[]> {
  if (!userId || userId.trim() === '') {
    throw new Error('Cannot fetch memories: userId is required.');
  }
  if (!firestoreDb) return [];

  const memsPath = getUserSubcollectionPath(userId, 'memories');
  if (!verifyOwnershipForCloudSync(userId, memsPath)) {
    throw new Error('Security isolation violation: Attempted cross-user read');
  }

  const snap = await getDocs(collection(firestoreDb, memsPath));
  const memories: Memory[] = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data && typeof data.title === 'string') {
      memories.push({ ...(data as Memory), id: d.id });
    }
  });

  return memories;
}

export async function saveUserMemory(userId: string, memory: Memory): Promise<Memory> {
  if (!userId || userId.trim() === '') {
    throw new Error('Cannot save memory: userId is required.');
  }
  if (!memory || !memory.id || memory.id.trim() === '') {
    throw new Error('Cannot save memory: memory and memory.id are required.');
  }
  if (!firestoreDb) {
    throw new Error('Cannot save memory to cloud: Firestore offline or unconfigured');
  }

  const memsPath = getUserSubcollectionPath(userId, 'memories');
  if (!verifyOwnershipForCloudSync(userId, memsPath)) {
    throw new Error('Security isolation violation: Attempted cross-user write');
  }

  const memRef = doc(firestoreDb, memsPath, memory.id);
  const payload = {
    ...memory,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(memRef, payload, { merge: true });
  return memory;
}

export async function deleteUserMemory(userId: string, memoryId: string): Promise<boolean> {
  if (!userId || userId.trim() === '') {
    throw new Error('Cannot delete memory: userId is required.');
  }
  if (!memoryId || memoryId.trim() === '') {
    throw new Error('Cannot delete memory: memoryId is required.');
  }
  if (!firestoreDb) return false;

  const memsPath = getUserSubcollectionPath(userId, 'memories');
  if (!verifyOwnershipForCloudSync(userId, memsPath)) {
    throw new Error('Security isolation violation: Attempted cross-user delete');
  }

  const memRef = doc(firestoreDb, memsPath, memoryId);
  await deleteDoc(memRef);
  return true;
}

// ---------------------------------------------------------------------------
// 4. Taste Profile CRUD (/users/{userId}/preferences/tasteProfile)
// ---------------------------------------------------------------------------

export async function fetchUserTasteProfile(userId: string): Promise<TasteProfile | null> {
  if (!userId || userId.trim() === '') {
    throw new Error('Cannot fetch taste profile: userId is required.');
  }
  if (!firestoreDb) return null;

  const prefsPath = getUserSubcollectionPath(userId, 'preferences');
  if (!verifyOwnershipForCloudSync(userId, prefsPath)) {
    throw new Error('Security isolation violation: Attempted cross-user read');
  }

  const tasteRef = doc(firestoreDb, prefsPath, 'tasteProfile');
  const snap = await getDoc(tasteRef);
  if (snap.exists()) {
    return snap.data() as TasteProfile;
  }
  return null;
}

export async function saveUserTasteProfile(userId: string, profile: TasteProfile): Promise<void> {
  if (!userId || userId.trim() === '') {
    throw new Error('Cannot save taste profile: userId is required.');
  }
  if (!firestoreDb) {
    throw new Error('Cannot save taste profile to cloud: Firestore offline or unconfigured');
  }

  const prefsPath = getUserSubcollectionPath(userId, 'preferences');
  if (!verifyOwnershipForCloudSync(userId, prefsPath)) {
    throw new Error('Security isolation violation: Attempted cross-user write');
  }

  const tasteRef = doc(firestoreDb, prefsPath, 'tasteProfile');
  const payload: TasteProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(tasteRef, payload);
}

// ---------------------------------------------------------------------------
// 5. Duplicate-Safe Explicit Consent Migration
// ---------------------------------------------------------------------------

export interface MigrationSummary {
  success: boolean;
  tripsMigrated: number;
  tripsSkipped: number;
  savedDestinationsMigrated: number;
  savedDestinationsSkipped: number;
  memoriesMigrated: number;
  memoriesSkipped: number;
  tasteProfileMigrated: boolean;
  message: string;
}

/**
 * Migrates local demo data into Cloud Firestore with duplicate prevention.
 * Inspects existing cloud documents before writing. Never overwrites newer cloud data.
 */
export async function migrateDemoDataToCloud(
  userId: string,
  localData: {
    trips: Trip[];
    savedDestIds: string[];
    memories: Memory[];
    tasteProfile: TasteProfile;
  }
): Promise<MigrationSummary> {
  if (!userId || userId.trim() === '') {
    throw new Error('Cannot migrate demo data: userId is required.');
  }
  if (!firestoreDb) {
    return {
      success: false,
      tripsMigrated: 0,
      tripsSkipped: 0,
      savedDestinationsMigrated: 0,
      savedDestinationsSkipped: 0,
      memoriesMigrated: 0,
      memoriesSkipped: 0,
      tasteProfileMigrated: false,
      message: 'Cloud migration unavailable: Firebase is offline or user unauthenticated.',
    };
  }

  const tripsPath = getUserSubcollectionPath(userId, 'trips');
  const savedDestsPath = getUserSubcollectionPath(userId, 'savedDestinations');
  const memoriesPath = getUserSubcollectionPath(userId, 'memories');
  const prefsPath = getUserSubcollectionPath(userId, 'preferences');

  // Verify paths
  if (
    !verifyOwnershipForCloudSync(userId, tripsPath) ||
    !verifyOwnershipForCloudSync(userId, savedDestsPath) ||
    !verifyOwnershipForCloudSync(userId, memoriesPath) ||
    !verifyOwnershipForCloudSync(userId, prefsPath)
  ) {
    throw new Error('Security violation: Attempted to write outside /users/{uid}/*');
  }

  const localTrips = localData.trips || [];
  const localSavedIds = localData.savedDestIds || [];
  const localMemories = localData.memories || [];
  const localTaste = localData.tasteProfile || EMPTY_TASTE_PROFILE;

  // Short-circuit if local dataset has no records to migrate
  if (
    localTrips.length === 0 &&
    localSavedIds.length === 0 &&
    localMemories.length === 0 &&
    !localTaste.isCustomized
  ) {
    return {
      success: true,
      tripsMigrated: 0,
      tripsSkipped: 0,
      savedDestinationsMigrated: 0,
      savedDestinationsSkipped: 0,
      memoriesMigrated: 0,
      memoriesSkipped: 0,
      tasteProfileMigrated: false,
      message: 'No local records needed migration.',
    };
  }

  try {
    // 1. Fetch existing cloud IDs to prevent duplicates
    const existingTrips = await fetchUserTrips(userId);
    const existingTripIds = new Set(existingTrips.map((t) => t.id));

    const existingSaved = await fetchUserSavedDestinations(userId);
    const existingSavedIds = new Set(existingSaved);

    const existingMems = await fetchUserMemories(userId);
    const existingMemoryIds = new Set(existingMems.map((m) => m.id));

    const existingTaste = await fetchUserTasteProfile(userId);

    const batch = writeBatch(firestoreDb);
    let tripsMigrated = 0;
    let tripsSkipped = 0;
    let savedMigrated = 0;
    let savedSkipped = 0;
    let memoriesMigrated = 0;
    let memoriesSkipped = 0;

    for (const trip of localTrips) {
      if (!existingTripIds.has(trip.id)) {
        const tripRef = doc(firestoreDb, tripsPath, trip.id);
        batch.set(tripRef, { ...trip, migratedAt: new Date().toISOString() });
        tripsMigrated++;
      } else {
        tripsSkipped++;
      }
    }

    for (const destId of localSavedIds) {
      if (!existingSavedIds.has(destId)) {
        const destRef = doc(firestoreDb, savedDestsPath, destId);
        batch.set(destRef, { destinationId: destId, savedAt: new Date().toISOString() });
        savedMigrated++;
      } else {
        savedSkipped++;
      }
    }

    for (const memory of localMemories) {
      if (!existingMemoryIds.has(memory.id)) {
        const memRef = doc(firestoreDb, memoriesPath, memory.id);
        batch.set(memRef, { ...memory, migratedAt: new Date().toISOString() });
        memoriesMigrated++;
      } else {
        memoriesSkipped++;
      }
    }

    let tasteProfileMigrated = false;
    if (!existingTaste && localTaste.isCustomized) {
      const prefRef = doc(firestoreDb, prefsPath, 'tasteProfile');
      batch.set(prefRef, { ...localTaste, migratedAt: new Date().toISOString() });
      tasteProfileMigrated = true;
    }

    if (tripsMigrated === 0 && savedMigrated === 0 && memoriesMigrated === 0 && !tasteProfileMigrated) {
      return {
        success: true,
        tripsMigrated: 0,
        tripsSkipped,
        savedDestinationsMigrated: 0,
        savedDestinationsSkipped: savedSkipped,
        memoriesMigrated: 0,
        memoriesSkipped,
        tasteProfileMigrated: false,
        message: 'No local records needed migration.',
      };
    }

    await batch.commit();

    return {
      success: true,
      tripsMigrated,
      tripsSkipped,
      savedDestinationsMigrated: savedMigrated,
      savedDestinationsSkipped: savedSkipped,
      memoriesMigrated,
      memoriesSkipped,
      tasteProfileMigrated,
      message: `Migrated ${tripsMigrated} journeys and ${savedMigrated} sanctuaries to your cloud account (${tripsSkipped + savedSkipped} duplicates skipped).`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      tripsMigrated: 0,
      tripsSkipped: 0,
      savedDestinationsMigrated: 0,
      savedDestinationsSkipped: 0,
      memoriesMigrated: 0,
      memoriesSkipped: 0,
      tasteProfileMigrated: false,
      message: `Cloud migration failed: ${msg}`,
    };
  }
}
