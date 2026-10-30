import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export interface FirebaseStatusInfo {
  projectId: string;
  isInitialized: boolean;
  status: 'initialized' | 'unconfigured' | 'error';
  message: string;
  missingKeys: string[];
  configuredAt?: string;
}

/**
 * Travi Firebase Configuration
 * Target Project ID: travi-app-23th10
 */
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'travi-app-23th10',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'travi-app-23th10.firebaseapp.com',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'travi-app-23th10.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let initStatus: FirebaseStatusInfo;

// Inspect available credentials without inventing fake ones
const missingRequired: string[] = [];
if (!firebaseConfig.apiKey) missingRequired.push('VITE_FIREBASE_API_KEY');
if (!firebaseConfig.appId) missingRequired.push('VITE_FIREBASE_APP_ID');

if (missingRequired.length > 0) {
  // Graceful unconfigured boundary: frontend renders completely without credentials
  initStatus = {
    projectId: firebaseConfig.projectId,
    isInitialized: false,
    status: 'unconfigured',
    missingKeys: missingRequired,
    message: `Firebase boundary initialized in offline/mock mode for project [${firebaseConfig.projectId}]. Awaiting API credentials in .env for live backend integration.`,
  };
} else {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    authInstance = getAuth(appInstance);
    firestoreInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);

    initStatus = {
      projectId: firebaseConfig.projectId,
      isInitialized: true,
      status: 'initialized',
      missingKeys: [],
      message: `Firebase successfully initialized with live project [${firebaseConfig.projectId}].`,
      configuredAt: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    initStatus = {
      projectId: firebaseConfig.projectId,
      isInitialized: false,
      status: 'error',
      missingKeys: [],
      message: `Firebase initialization failed: ${errorMsg}`,
    };
  }
}

export const firebaseApp = appInstance;
export const firebaseAuth = authInstance;
export const firestoreDb = firestoreInstance;
export const firebaseStorage = storageInstance;

/**
 * Returns current status of the modular Firebase boundary.
 * Guarantees zero runtime crashes when credentials are not configured.
 */
export function getFirebaseStatus(): FirebaseStatusInfo {
  return { ...initStatus };
}

export interface FirebaseDiagnosticsInfo {
  isConfigured: boolean;
  projectId: string;
  authDomain: string;
  storageBucket: string;
  hasApiKey: boolean;
  hasAppId: boolean;
  hasMessagingSenderId: boolean;
  hasMeasurementId: boolean;
  firestoreReady: boolean;
  authReady: boolean;
  status: 'initialized' | 'unconfigured' | 'error';
  missingKeys: string[];
  configuredAt?: string;
}

/**
 * Returns sanitized, credentials-free connection diagnostics for development inspection.
 * Never prints or leaks secret values, keys, or tokens.
 */
export function getFirebaseDiagnostics(): FirebaseDiagnosticsInfo {
  const status = getFirebaseStatus();
  return {
    isConfigured: status.isInitialized,
    projectId: status.projectId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
    hasApiKey: Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5),
    hasAppId: Boolean(firebaseConfig.appId && firebaseConfig.appId.length > 5),
    hasMessagingSenderId: Boolean(firebaseConfig.messagingSenderId),
    hasMeasurementId: Boolean(firebaseConfig.measurementId),
    firestoreReady: firestoreInstance !== null,
    authReady: authInstance !== null,
    status: status.status,
    missingKeys: status.missingKeys,
    configuredAt: status.configuredAt,
  };
}
