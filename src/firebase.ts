import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, connectAuthEmulator, getAuth } from "firebase/auth";
import { Firestore, connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const requiredConfigValues = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.appId,
];

const hasFirebaseConfig = requiredConfigValues.every(Boolean);

export const firebaseApp: FirebaseApp | null = hasFirebaseConfig
    ? getApps().length
        ? getApp()
        : initializeApp(firebaseConfig)
    : null;

export const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export const firestoreDb: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
export const isFirebaseConfigured = Boolean(firebaseApp);

const useEmulators = (process.env.REACT_APP_FIREBASE_USE_EMULATORS ?? "").toLowerCase() === "true";
let emulatorsConnected = false;

export const connectFirebaseEmulators = (): void => {
    if (!useEmulators || emulatorsConnected || !firebaseAuth || !firestoreDb) {
        return;
    }

    const authUrl = process.env.REACT_APP_FIREBASE_AUTH_EMULATOR_URL ?? "http://127.0.0.1:9099";
    const firestoreHost = process.env.REACT_APP_FIREBASE_FIRESTORE_EMULATOR_HOST ?? "127.0.0.1";
    const firestorePort = Number(process.env.REACT_APP_FIREBASE_FIRESTORE_EMULATOR_PORT ?? "8080");

    connectAuthEmulator(firebaseAuth, authUrl, { disableWarnings: true });
    connectFirestoreEmulator(firestoreDb, firestoreHost, firestorePort);
    emulatorsConnected = true;
};

connectFirebaseEmulators();
