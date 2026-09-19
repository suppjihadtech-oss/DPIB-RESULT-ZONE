import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

export interface FirebaseStatus {
  isConfigured: boolean;
  projectId: string;
  authDomain: string;
  error?: string;
}

try {
  const config = {
    apiKey: firebaseConfigJson.apiKey,
    authDomain: firebaseConfigJson.authDomain,
    projectId: firebaseConfigJson.projectId,
    storageBucket: firebaseConfigJson.storageBucket,
    messagingSenderId: firebaseConfigJson.messagingSenderId,
    appId: firebaseConfigJson.appId,
  };

  if (!getApps().length) {
    app = initializeApp(config);
  } else {
    app = getApp();
  }

  const databaseId =
    firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
      ? firebaseConfigJson.firestoreDatabaseId
      : undefined;

  try {
    const firestoreSettings = {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
    };

    if (databaseId) {
      db = initializeFirestore(app, firestoreSettings, databaseId);
    } else {
      db = initializeFirestore(app, firestoreSettings);
    }
  } catch {
    if (databaseId) {
      db = getFirestore(app, databaseId);
    } else {
      db = getFirestore(app);
    }
  }

  auth = getAuth(app);
} catch (err: any) {
  console.error('Firebase initialization error:', err);
}

export function getFirebaseStatus(): FirebaseStatus {
  const isConfigured = Boolean(firebaseConfigJson?.projectId && firebaseConfigJson?.apiKey);
  return {
    isConfigured,
    projectId: firebaseConfigJson?.projectId || 'Not Connected',
    authDomain: firebaseConfigJson?.authDomain || '',
  };
}

export { app, db, auth };

