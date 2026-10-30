import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getPersistenceBoundaryStatus,
  verifyOwnershipForCloudSync,
  migrateLocalDemoLedgerToCloud,
  fetchUserCloudLedger,
} from '../persistenceBoundary.ts';

describe('Persistence Architecture & Cloud Sync Boundary (Milestone v0.5)', () => {
  describe('1. Mode Detection & Isolation Contract', () => {
    it('defaults to local_demo mode when user is unauthenticated', () => {
      const status = getPersistenceBoundaryStatus(null);

      expect(status.currentMode).toBe('local_demo');
      expect(status.isCloudSyncEnabled).toBe(false);
      expect(status.userIsolationPath).toBeNull();
      expect(status.canMigrate).toBe(false);
      expect(status.isolationContract).toContain('/users/{uid}/*');
    });

    it('enforces zero silent migration policy in boundary status notice', () => {
      const status = getPersistenceBoundaryStatus('uid_user_123');
      expect(status.migrationPolicyNotice).toContain('Zero Silent Migration Guarantee');
      expect(status.migrationPolicyNotice).toContain('NEVER automatically transferred');
    });
  });

  describe('2. User Ownership Path Verification', () => {
    const testUid = 'user_abc_789';

    it('validates target paths scoped strictly under /users/{uid}/*', () => {
      expect(verifyOwnershipForCloudSync(testUid, `users/${testUid}/trips`)).toBe(true);
      expect(verifyOwnershipForCloudSync(testUid, `users/${testUid}/memories`)).toBe(true);
      expect(verifyOwnershipForCloudSync(testUid, `users/${testUid}/savedDestinations`)).toBe(true);
    });

    it('rejects target paths belonging to other users or public collections', () => {
      // Cross-user path attempt
      expect(verifyOwnershipForCloudSync(testUid, 'users/other_user_456/trips')).toBe(false);
      // Public collection attempt
      expect(verifyOwnershipForCloudSync(testUid, 'destinations/kyoto-japan')).toBe(false);
      expect(verifyOwnershipForCloudSync(testUid, 'experiences/exp-1')).toBe(false);
      // Empty user ID
      expect(verifyOwnershipForCloudSync('', `users/${testUid}/trips`)).toBe(false);
    });
  });

  describe('3. Cloud Ledger Migration Safeguard', () => {
    it('safely rejects migration when Firebase is in offline mode or user is missing', async () => {
      const result = await migrateLocalDemoLedgerToCloud('test_user_offline');

      expect(result.success).toBe(false);
      expect(result.migratedCounts.trips).toBe(0);
      expect(result.message).toMatch(/(Cloud migration unavailable|PERMISSION_DENIED|Missing or insufficient permissions)/);
    });

    it('fetchUserCloudLedger enforces path security and returns structured summary', async () => {
      const summary = await fetchUserCloudLedger('test_user_offline');
      expect(typeof summary.success).toBe('boolean');
      expect(summary.queriedPath).toBe('/users/test_user_offline/*');
      expect(typeof summary.tripsCount).toBe('number');
      expect(typeof summary.message).toBe('string');
    });
  });

  describe('4. Malformed Storage Recovery & Schema Integrity', () => {
    let mockStore: Record<string, string> = {};

    beforeEach(() => {
      mockStore = {};
      const mockStorage = {
        getItem: (key: string) => mockStore[key] ?? null,
        setItem: (key: string, val: string) => {
          mockStore[key] = String(val);
        },
        removeItem: (key: string) => {
          delete mockStore[key];
        },
        clear: () => {
          mockStore = {};
        },
        key: (idx: number) => Object.keys(mockStore)[idx] ?? null,
        length: 0,
      } as Storage;
      globalThis.localStorage = mockStorage;
    });

    afterEach(() => {
      delete (globalThis as any).localStorage;
    });

    it('safely recovers to defaults when localStorage contains non-array corrupted trips', async () => {
      const { demoStore } = await import('../demoStore.ts');
      globalThis.localStorage.setItem('travi_trips_v02', JSON.stringify({ corrupted: 'not an array' }));

      const trips = demoStore.getTrips();
      expect(Array.isArray(trips)).toBe(true);
      expect(trips.length).toBeGreaterThan(0);
      globalThis.localStorage.removeItem('travi_trips_v02');
    });

    it('safely recovers to defaults when localStorage contains non-array saved destinations', async () => {
      const { demoStore } = await import('../demoStore.ts');
      globalThis.localStorage.setItem('travi_saved_destinations_v02', JSON.stringify(12345));

      const saved = demoStore.getSavedDestinationIds();
      expect(Array.isArray(saved)).toBe(true);
      expect(saved).toEqual(['kyoto-japan']);
      globalThis.localStorage.removeItem('travi_saved_destinations_v02');
    });

    it('safely recovers to defaults when localStorage contains non-object taste profile', async () => {
      const { demoStore } = await import('../demoStore.ts');
      globalThis.localStorage.setItem('travi_taste_profile_v02', JSON.stringify('corrupted string'));

      const profile = demoStore.getTasteProfile();
      expect(profile).toBeDefined();
      expect(Array.isArray(profile.films)).toBe(true);
      expect(profile.films.length).toBe(0);
      globalThis.localStorage.removeItem('travi_taste_profile_v02');
    });

    it('preserves personalized dayNotes when trip is created', async () => {
      const { demoStore } = await import('../demoStore.ts');
      const testTrip = demoStore.createTrip({
        title: 'Kyoto Sanctuary with Personal Notes',
        destination: 'Kyoto, Japan',
        country: 'Japan',
        startDate: 'Autumn 2026',
        endDate: 'TBD',
        status: 'planning',
        coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800',
        daysCount: 3,
        travelersCount: 2,
        itineraryStops: ['Daitoku-ji Rock Garden', 'Uji Tea Farm', 'Saga Bamboo Walk'],
        dayNotes: { 1: 'Morning private meditation permit arranged.' },
      });

      expect(testTrip.dayNotes).toBeDefined();
      expect(testTrip.dayNotes?.[1]).toBe('Morning private meditation permit arranged.');

      const retrieved = demoStore.getTrips().find((t) => t.id === testTrip.id);
      expect(retrieved?.dayNotes?.[1]).toBe('Morning private meditation permit arranged.');

      demoStore.deleteTrip(testTrip.id);
    });
  });
});
