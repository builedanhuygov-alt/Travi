import { describe, it, expect } from 'vitest';
import {
  getUserLedgerPath,
  fetchUserTrips,
  saveUserTrip,
  deleteUserTrip,
  fetchUserSavedDestinations,
  saveUserSavedDestination,
  deleteUserSavedDestination,
  fetchUserMemories,
  saveUserMemory,
  deleteUserMemory,
  fetchUserTasteProfile,
  saveUserTasteProfile,
  migrateDemoDataToCloud,
} from '../userLedger.ts';
import type { Trip, Memory } from '../../../types/index.ts';

describe('Real User Ledger & Firestore Data Service (Milestone v1.1)', () => {
  const testUid = 'user_isolated_test_999';

  describe('1. Owner Path Isolation (getUserLedgerPath)', () => {
    it('scopes subcollections strictly within /users/{userId}/*', () => {
      expect(getUserLedgerPath(testUid, 'trips')).toBe('users/user_isolated_test_999/trips');
      expect(getUserLedgerPath(testUid, 'savedDestinations')).toBe('users/user_isolated_test_999/savedDestinations');
      expect(getUserLedgerPath(testUid, 'memories')).toBe('users/user_isolated_test_999/memories');
      expect(getUserLedgerPath(testUid, 'preferences')).toBe('users/user_isolated_test_999/preferences');
    });

    it('rejects path generation with empty or whitespace userId', () => {
      expect(() => getUserLedgerPath('', 'trips')).toThrowError(/userId is required/);
      expect(() => getUserLedgerPath('   ', 'savedDestinations')).toThrowError(/userId is required/);
    });
  });

  describe('2. Input Validation Safeguards for CRUD Operations', () => {
    const mockTrip: Trip = {
      id: 'trip_unit_1',
      title: 'Solitary Alpine Retreat',
      destination: 'Zermatt',
      country: 'Switzerland',
      startDate: '2026-10-12',
      endDate: '2026-10-18',
      daysCount: 6,
      travelersCount: 2,
      status: 'upcoming',
      coverImage: 'https://images.unsplash.com/alpine.jpg',
      itineraryStops: ['Gornergrat', 'Matterhorn Glacier'],
    };

    const mockMemory: Memory = {
      id: 'mem_unit_1',
      title: 'Dawn Bell at Zuiho-in',
      location: 'Kyoto',
      country: 'Japan',
      date: 'Autumn 2026',
      note: 'The gravel raking echoes through the mist.',
      image: 'https://images.unsplash.com/kyoto.jpg',
      badge: 'Zen Sanctuary',
    };

    it('rejects operations when userId is missing', async () => {
      await expect(fetchUserTrips('')).rejects.toThrowError(/userId is required/);
      await expect(saveUserTrip('', mockTrip)).rejects.toThrowError(/userId is required/);
      await expect(deleteUserTrip('', 'trip_1')).rejects.toThrowError(/userId is required/);

      await expect(fetchUserSavedDestinations('')).rejects.toThrowError(/userId is required/);
      await expect(saveUserSavedDestination('', 'dest_1')).rejects.toThrowError(/userId is required/);
      await expect(deleteUserSavedDestination('', 'dest_1')).rejects.toThrowError(/userId is required/);

      await expect(fetchUserMemories('')).rejects.toThrowError(/userId is required/);
      await expect(saveUserMemory('', mockMemory)).rejects.toThrowError(/userId is required/);
      await expect(deleteUserMemory('', 'mem_1')).rejects.toThrowError(/userId is required/);

      await expect(fetchUserTasteProfile('')).rejects.toThrowError(/userId is required/);
      await expect(saveUserTasteProfile('', {} as any)).rejects.toThrowError(/userId is required/);
    });

    it('rejects delete or save operations when item ID is missing', async () => {
      await expect(deleteUserTrip(testUid, '')).rejects.toThrowError(/tripId is required/);
      await expect(saveUserSavedDestination(testUid, '')).rejects.toThrowError(/destinationId is required/);
      await expect(deleteUserSavedDestination(testUid, '')).rejects.toThrowError(/destinationId is required/);
      await expect(deleteUserMemory(testUid, '')).rejects.toThrowError(/memoryId is required/);
    });
  });

  describe('3. Demo Data Migration Boundary (migrateDemoDataToCloud)', () => {
    it('rejects migration with empty userId', async () => {
      await expect(
        migrateDemoDataToCloud('', {
          trips: [],
          savedDestIds: [],
          memories: [],
          tasteProfile: {} as any,
        })
      ).rejects.toThrowError(/userId is required/);
    });

    it('gracefully handles empty local dataset without throwing', async () => {
      const result = await migrateDemoDataToCloud(testUid, {
        trips: [],
        savedDestIds: [],
        memories: [],
        tasteProfile: {} as any,
      });

      expect(result.tripsMigrated).toBe(0);
      expect(result.savedDestinationsMigrated).toBe(0);
      expect(result.memoriesMigrated).toBe(0);
      expect(result.tasteProfileMigrated).toBe(false);
      expect(result.success).toBe(true);
      expect(result.message).toContain('No local records needed migration');
    });
  });
});
