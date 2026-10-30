/**
 * Travi Isolated Demo Persistence Layer — Foundation v0.2
 *
 * Architectural Purpose:
 * Provides robust localStorage-backed demo persistence across all screens (Trips,
 * Saved Destinations, Memories, and Dispatches) while maintaining strict isolation
 * from business logic and views.
 *
 * In Phase 3, this storage boundary will be directly swappable with Cloud Firestore
 * client listeners without modifying the UI layer.
 */

import { useEffect, useState, useCallback } from 'react';
import type { Trip, Memory, Destination, TasteProfile } from '../../types/index.ts';
import { sampleTrips, sampleMemories, sampleDestinations, getAllDestinations } from '../../data/sampleData.ts';
import { EMPTY_TASTE_PROFILE, CURATED_DEMO_TASTE_PROFILE } from '../taste/tasteData.ts';

const STORAGE_KEYS = {
  TRIPS: 'travi_trips_v02',
  SAVED_DESTS: 'travi_saved_destinations_v02',
  MEMORIES: 'travi_memories_v02',
  DISPATCHES: 'travi_dispatches_v02',
  INQUIRIES: 'travi_inquiries_v02',
  TASTE_PROFILE: 'travi_taste_profile_v02',
} as const;

export interface StoredInquiry {
  id: string;
  experienceId: string;
  experienceTitle: string;
  date: string;
  guestsCount: number;
  totalPrice: string;
  createdAt: string;
}

export interface StoredDispatch {
  id: string;
  author: string;
  avatar: string;
  role: string;
  location: string;
  title: string;
  text: string;
  likes: number;
  isLiked?: boolean;
  tags: string[];
  image: string;
  createdAt: string;
}

const defaultDispatches: StoredDispatch[] = [
  {
    id: 'disp-1',
    author: 'Chloe Laurent',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    role: 'Gastronomy Curator',
    location: 'Ravello, Italy',
    title: 'Hidden Lemon Groves of Scala Valley',
    text: 'Instead of staying down on Amalfi beach where tourists fight for sunbeds, walk up the thousand stone steps to Scala. Signora Rosa let us harvest sfusato amalfitano lemons in her private orchard.',
    likes: 42,
    isLiked: false,
    tags: ['Slow Gastronomy', 'Local Farmsteads'],
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800&auto=format&fit=crop',
    createdAt: '2 hours ago',
  },
  {
    id: 'disp-2',
    author: 'Takuya Endo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    role: 'Woodblock & Machiya Archivist',
    location: 'Kyoto, Japan',
    title: 'Daitoku-ji at 7:30 AM',
    text: 'The secret to Kyoto is waking before the tour buses begin their engines. The gravel raking sounds at Zuihō-in provide an auditory meditation that resets months of metropolitan exhaustion.',
    likes: 67,
    isLiked: true,
    tags: ['Zen Architecture', 'Spiritual Sanctuaries'],
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop',
    createdAt: 'Yesterday',
  },
];

// Helper to notify other components/tabs of storage state changes
function emitSync(channel: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('travi-store-sync', { detail: { channel } }));
  }
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return null;
}

const inMemoryFallbackStore = new Map<string, string>();

function safeGetJSON<T>(key: string, fallback: T): T {
  const storage = getStorage();
  if (storage) {
    try {
      const raw = storage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn(`[Travi DemoStore] Error parsing key ${key}:`, e);
      return fallback;
    }
  }
  const raw = inMemoryFallbackStore.get(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSetJSON<T>(key: string, value: T): void {
  const serialized = JSON.stringify(value);
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(key, serialized);
      return;
    } catch (e) {
      console.warn(`[Travi DemoStore] Error setting key ${key}:`, e);
    }
  }
  inMemoryFallbackStore.set(key, serialized);
}

export const demoStore = {
  // Trips CRUD
  getTrips(): Trip[] {
    const data = safeGetJSON<unknown>(STORAGE_KEYS.TRIPS, sampleTrips);
    if (!Array.isArray(data)) return sampleTrips;
    return data.filter((t): t is Trip => Boolean(t && typeof t === 'object' && typeof (t as any).id === 'string' && typeof (t as any).title === 'string'));
  },

  createTrip(newTrip: Omit<Trip, 'id'> & { id?: string }): Trip {
    const trips = demoStore.getTrips();
    const tripWithId: Trip = {
      ...newTrip,
      id: newTrip.id || `trip-${Date.now()}`,
    };
    const updated = [tripWithId, ...trips];
    safeSetJSON(STORAGE_KEYS.TRIPS, updated);
    emitSync('trips');
    return tripWithId;
  },

  updateTrip(id: string, updates: Partial<Trip>): Trip | null {
    const trips = demoStore.getTrips();
    const index = trips.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const updatedTrip = { ...trips[index], ...updates };
    trips[index] = updatedTrip;
    safeSetJSON(STORAGE_KEYS.TRIPS, trips);
    emitSync('trips');
    return updatedTrip;
  },

  deleteTrip(id: string): boolean {
    const trips = demoStore.getTrips();
    const filtered = trips.filter((t) => t.id !== id);
    if (filtered.length === trips.length) return false;
    safeSetJSON(STORAGE_KEYS.TRIPS, filtered);
    emitSync('trips');
    return true;
  },

  // Saved Destinations
  getSavedDestinationIds(): string[] {
    const data = safeGetJSON<unknown>(STORAGE_KEYS.SAVED_DESTS, ['kyoto-japan']);
    if (!Array.isArray(data)) return ['kyoto-japan'];
    return data.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  },

  isDestinationSaved(destId: string): boolean {
    const saved = demoStore.getSavedDestinationIds();
    return saved.includes(destId);
  },

  toggleSaveDestination(destId: string): boolean {
    const saved = demoStore.getSavedDestinationIds();
    const exists = saved.includes(destId);
    const updated = exists ? saved.filter((id) => id !== destId) : [...saved, destId];
    safeSetJSON(STORAGE_KEYS.SAVED_DESTS, updated);
    emitSync('saved_dests');
    return !exists;
  },

  getSavedDestinations(): Destination[] {
    const savedIds = demoStore.getSavedDestinationIds();
    return sampleDestinations.filter((d) => savedIds.includes(d.id));
  },

  // Memories
  getMemories(): Memory[] {
    const data = safeGetJSON<unknown>(STORAGE_KEYS.MEMORIES, sampleMemories);
    if (!Array.isArray(data)) return sampleMemories;
    return data.filter((m): m is Memory => Boolean(m && typeof m === 'object' && typeof (m as any).id === 'string'));
  },

  createMemory(newMem: Omit<Memory, 'id'> & { id?: string }): Memory {
    const memories = demoStore.getMemories();
    const memWithId: Memory = {
      ...newMem,
      id: newMem.id || `mem-${Date.now()}`,
    };
    const updated = [memWithId, ...memories];
    safeSetJSON(STORAGE_KEYS.MEMORIES, updated);
    emitSync('memories');
    return memWithId;
  },

  deleteMemory(id: string): boolean {
    const memories = demoStore.getMemories();
    const filtered = memories.filter((m) => m.id !== id);
    if (filtered.length === memories.length) return false;
    safeSetJSON(STORAGE_KEYS.MEMORIES, filtered);
    emitSync('memories');
    return true;
  },

  // Dispatches
  getDispatches(): StoredDispatch[] {
    const data = safeGetJSON<unknown>(STORAGE_KEYS.DISPATCHES, defaultDispatches);
    if (!Array.isArray(data)) return defaultDispatches;
    return data.filter((d): d is StoredDispatch => Boolean(d && typeof d === 'object' && typeof (d as any).id === 'string'));
  },

  createDispatch(dispatch: Omit<StoredDispatch, 'id' | 'likes' | 'isLiked' | 'createdAt'>): StoredDispatch {
    const current = demoStore.getDispatches();
    const newEntry: StoredDispatch = {
      ...dispatch,
      id: `disp-${Date.now()}`,
      likes: 1,
      isLiked: true,
      createdAt: 'Just now',
    };
    safeSetJSON(STORAGE_KEYS.DISPATCHES, [newEntry, ...current]);
    emitSync('dispatches');
    return newEntry;
  },

  toggleLikeDispatch(id: string): void {
    const current = demoStore.getDispatches();
    const updated = current.map((d) => {
      if (d.id === id) {
        const nextLiked = !d.isLiked;
        return {
          ...d,
          isLiked: nextLiked,
          likes: nextLiked ? d.likes + 1 : Math.max(0, d.likes - 1),
        };
      }
      return d;
    });
    safeSetJSON(STORAGE_KEYS.DISPATCHES, updated);
    emitSync('dispatches');
  },

  // Inquiries / Bookings
  getInquiries(): StoredInquiry[] {
    const data = safeGetJSON<unknown>(STORAGE_KEYS.INQUIRIES, []);
    if (!Array.isArray(data)) return [];
    return data.filter((i): i is StoredInquiry => Boolean(i && typeof i === 'object' && typeof (i as any).id === 'string'));
  },

  createInquiry(inquiry: Omit<StoredInquiry, 'id' | 'createdAt'>): StoredInquiry {
    const current = demoStore.getInquiries();
    const newEntry: StoredInquiry = {
      ...inquiry,
      id: `inq-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    safeSetJSON(STORAGE_KEYS.INQUIRIES, [newEntry, ...current]);
    emitSync('inquiries');
    return newEntry;
  },

  // Taste Profile (8 Pillars)
  getTasteProfile(): TasteProfile {
    const raw = safeGetJSON<unknown>(STORAGE_KEYS.TASTE_PROFILE, EMPTY_TASTE_PROFILE);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return EMPTY_TASTE_PROFILE;
    }
    const profileObj = raw as Record<string, unknown>;
    const sanitized: TasteProfile = {
      ...EMPTY_TASTE_PROFILE,
      updatedAt: typeof profileObj.updatedAt === 'string' ? profileObj.updatedAt : undefined,
      isCustomized: typeof profileObj.isCustomized === 'boolean' ? profileObj.isCustomized : false,
    };
    const pillars = ['films', 'music', 'food', 'architecture', 'art', 'history', 'nature', 'localCulture'] as const;
    for (const p of pillars) {
      if (Array.isArray(profileObj[p])) {
        sanitized[p] = (profileObj[p] as unknown[]).filter((item): item is string => typeof item === 'string');
      }
    }
    return sanitized;
  },

  saveTasteProfile(profile: TasteProfile): void {
    const hasAnySelection = Object.entries(profile).some(
      ([key, val]) => Array.isArray(val) && val.length > 0 && key !== 'updatedAt' && key !== 'isCustomized'
    );
    const updated: TasteProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
      isCustomized: hasAnySelection,
    };
    safeSetJSON(STORAGE_KEYS.TASTE_PROFILE, updated);
    emitSync('taste_profile');
  },

  resetTasteProfile(): TasteProfile {
    safeSetJSON(STORAGE_KEYS.TASTE_PROFILE, EMPTY_TASTE_PROFILE);
    emitSync('taste_profile');
    return EMPTY_TASTE_PROFILE;
  },

  loadCuratedTasteProfile(): TasteProfile {
    safeSetJSON(STORAGE_KEYS.TASTE_PROFILE, CURATED_DEMO_TASTE_PROFILE);
    emitSync('taste_profile');
    return CURATED_DEMO_TASTE_PROFILE;
  },

  clearTasteProfile(): TasteProfile {
    safeSetJSON(STORAGE_KEYS.TASTE_PROFILE, EMPTY_TASTE_PROFILE);
    emitSync('taste_profile');
    return EMPTY_TASTE_PROFILE;
  },

  // Global reset for testing
  resetToDemoDefaults(): void {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(STORAGE_KEYS.TRIPS);
    storage.removeItem(STORAGE_KEYS.SAVED_DESTS);
    storage.removeItem(STORAGE_KEYS.MEMORIES);
    storage.removeItem(STORAGE_KEYS.DISPATCHES);
    storage.removeItem(STORAGE_KEYS.INQUIRIES);
    storage.removeItem(STORAGE_KEYS.TASTE_PROFILE);
    emitSync('all');
  },
};

import { useAuth } from '../firebase/useAuth.ts';
import {
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
} from '../firebase/userLedger.ts';

/**
 * Reactive React hook to access and synchronize traveler data.
 * When authenticated: loads and persists user-scoped records from Cloud Firestore (/users/{uid}/*).
 * When unauthenticated: operates in isolated local demo mode (demoStore).
 */
export function useDemoStore() {
  const { user: authUser } = useAuth();
  const userId = authUser?.uid || null;

  // Local demo state (active for unauthenticated guests)
  const [localTrips, setLocalTrips] = useState<Trip[]>(() => demoStore.getTrips());
  const [localSavedIds, setLocalSavedIds] = useState<string[]>(() => demoStore.getSavedDestinationIds());
  const [localMemories, setLocalMemories] = useState<Memory[]>(() => demoStore.getMemories());
  const [dispatches, setDispatches] = useState<StoredDispatch[]>(() => demoStore.getDispatches());
  const [inquiries, setInquiries] = useState<StoredInquiry[]>(() => demoStore.getInquiries());
  const [localTaste, setLocalTaste] = useState<TasteProfile>(() => demoStore.getTasteProfile());

  // Cloud state (active for authenticated users)
  const [cloudTrips, setCloudTrips] = useState<Trip[]>([]);
  const [cloudSavedIds, setCloudSavedIds] = useState<string[]>([]);
  const [cloudMemories, setCloudMemories] = useState<Memory[]>([]);
  const [cloudTaste, setCloudTaste] = useState<TasteProfile>(EMPTY_TASTE_PROFILE);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  // Sync local demo state with storage events
  const refreshLocal = useCallback(() => {
    setLocalTrips(demoStore.getTrips());
    setLocalSavedIds(demoStore.getSavedDestinationIds());
    setLocalMemories(demoStore.getMemories());
    setDispatches(demoStore.getDispatches());
    setInquiries(demoStore.getInquiries());
    setLocalTaste(demoStore.getTasteProfile());
  }, []);

  useEffect(() => {
    const handleSync = () => {
      refreshLocal();
    };

    window.addEventListener('travi-store-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('travi-store-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [refreshLocal]);

  // Load cloud data whenever authUser changes
  useEffect(() => {
    if (!userId) {
      return;
    }

    let isCancelled = false;
    queueMicrotask(() => {
      if (!isCancelled) {
        setIsCloudLoading(true);
        setCloudError(null);
      }
    });

    Promise.all([
      fetchUserTrips(userId),
      fetchUserSavedDestinations(userId),
      fetchUserMemories(userId),
      fetchUserTasteProfile(userId),
    ])
      .then(([tripsData, savedData, memsData, tasteData]) => {
        if (isCancelled) return;
        setCloudTrips(tripsData);
        setCloudSavedIds(savedData);
        setCloudMemories(memsData);
        setCloudTaste(tasteData || EMPTY_TASTE_PROFILE);
      })
      .catch((err) => {
        if (isCancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setCloudError(msg);
      })
      .finally(() => {
        if (!isCancelled) setIsCloudLoading(false);
      });

    return () => {
      isCancelled = true;
      setCloudTrips([]);
      setCloudSavedIds([]);
      setCloudMemories([]);
      setCloudTaste(EMPTY_TASTE_PROFILE);
      setIsCloudLoading(false);
      setCloudError(null);
    };
  }, [userId]);

  // Active data selection based on auth state
  const isCloudActive = Boolean(userId);
  const trips = isCloudActive ? cloudTrips : localTrips;
  const savedDestIds = isCloudActive ? cloudSavedIds : localSavedIds;
  const memories = isCloudActive ? cloudMemories : localMemories;
  const tasteProfile = isCloudActive ? cloudTaste : localTaste;

  // Real Mutations (Cloud if authenticated, DemoStore if guest)
  const createTrip = useCallback(
    (newTrip: Omit<Trip, 'id'> & { id?: string }): Trip => {
      const tripWithId: Trip = {
        ...newTrip,
        id: newTrip.id || `trip-${Date.now()}`,
      };
      if (userId) {
        setCloudTrips((prev) => [tripWithId, ...prev]);
        saveUserTrip(userId, tripWithId).catch((err) => {
          console.error('[Travi CloudStore] Error saving trip:', err);
          // Rollback on error
          setCloudTrips((prev) => prev.filter((t) => t.id !== tripWithId.id));
        });
        return tripWithId;
      }
      return demoStore.createTrip(newTrip);
    },
    [userId]
  );

  const updateTrip = useCallback(
    (id: string, updates: Partial<Trip>): Trip | null => {
      if (userId) {
        let updatedTrip: Trip | null = null;
        setCloudTrips((prev) =>
          prev.map((t) => {
            if (t.id === id) {
              updatedTrip = { ...t, ...updates };
              return updatedTrip;
            }
            return t;
          })
        );
        if (updatedTrip) {
          saveUserTrip(userId, updatedTrip).catch((err) => {
            console.error('[Travi CloudStore] Error updating trip:', err);
          });
        }
        return updatedTrip;
      }
      return demoStore.updateTrip(id, updates);
    },
    [userId]
  );

  const deleteTrip = useCallback(
    (id: string): boolean => {
      if (userId) {
        setCloudTrips((prev) => prev.filter((t) => t.id !== id));
        deleteUserTrip(userId, id).catch((err) => {
          console.error('[Travi CloudStore] Error deleting trip:', err);
        });
        return true;
      }
      return demoStore.deleteTrip(id);
    },
    [userId]
  );

  const toggleSaveDestination = useCallback(
    (destId: string): boolean => {
      if (userId) {
        const exists = cloudSavedIds.includes(destId);
        if (exists) {
          setCloudSavedIds((prev) => prev.filter((id) => id !== destId));
          deleteUserSavedDestination(userId, destId).catch((err) => {
            console.error('[Travi CloudStore] Error deleting bookmark:', err);
          });
          return false;
        } else {
          setCloudSavedIds((prev) => [...prev, destId]);
          saveUserSavedDestination(userId, destId).catch((err) => {
            console.error('[Travi CloudStore] Error saving bookmark:', err);
          });
          return true;
        }
      }
      return demoStore.toggleSaveDestination(destId);
    },
    [userId, cloudSavedIds]
  );

  const isDestinationSaved = useCallback(
    (destId: string): boolean => {
      return savedDestIds.includes(destId);
    },
    [savedDestIds]
  );

  const createMemory = useCallback(
    (newMem: Omit<Memory, 'id'> & { id?: string }): Memory => {
      const memWithId: Memory = {
        ...newMem,
        id: newMem.id || `mem-${Date.now()}`,
      };
      if (userId) {
        setCloudMemories((prev) => [memWithId, ...prev]);
        saveUserMemory(userId, memWithId).catch((err) => {
          console.error('[Travi CloudStore] Error saving memory:', err);
          setCloudMemories((prev) => prev.filter((m) => m.id !== memWithId.id));
        });
        return memWithId;
      }
      return demoStore.createMemory(newMem);
    },
    [userId]
  );

  const deleteMemory = useCallback(
    (id: string): boolean => {
      if (userId) {
        setCloudMemories((prev) => prev.filter((m) => m.id !== id));
        deleteUserMemory(userId, id).catch((err) => {
          console.error('[Travi CloudStore] Error deleting memory:', err);
        });
        return true;
      }
      return demoStore.deleteMemory(id);
    },
    [userId]
  );

  const saveTasteProfile = useCallback(
    (profile: TasteProfile): void => {
      if (userId) {
        setCloudTaste(profile);
        saveUserTasteProfile(userId, profile).catch((err) => {
          console.error('[Travi CloudStore] Error saving taste profile:', err);
        });
        return;
      }
      demoStore.saveTasteProfile(profile);
    },
    [userId]
  );

  const savedDestinations = getAllDestinations().filter((d) => savedDestIds.includes(d.id));

  return {
    trips,
    savedDestIds,
    savedDestinations,
    memories,
    dispatches,
    inquiries,
    tasteProfile,
    isCloudActive,
    isCloudLoading,
    cloudError,
    userId,
    saveTasteProfile,
    resetTasteProfile: demoStore.resetTasteProfile,
    loadCuratedTasteProfile: demoStore.loadCuratedTasteProfile,
    clearTasteProfile: demoStore.clearTasteProfile,
    createTrip,
    updateTrip,
    deleteTrip,
    toggleSaveDestination,
    isDestinationSaved,
    createMemory,
    deleteMemory,
    createDispatch: demoStore.createDispatch,
    toggleLikeDispatch: demoStore.toggleLikeDispatch,
    createInquiry: demoStore.createInquiry,
    resetToDemoDefaults: demoStore.resetToDemoDefaults,
    refreshAll: refreshLocal,
  };
}
