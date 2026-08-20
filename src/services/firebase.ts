import { initializeApp } from "firebase/app";
import { getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

function isConfiguredValue(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && normalized !== "undefined" && normalized !== "null";
}

export const firebaseEnabled = Object.values(firebaseConfig).every(isConfiguredValue);

export const app = firebaseEnabled
  ? getApps()[0] ?? initializeApp(firebaseConfig)
  : null;
export const db = app ? getFirestore(app) : null;
