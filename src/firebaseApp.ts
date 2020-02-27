import { initializeApp, firestore } from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

const app = initializeApp({
  apiKey: process.env.VUE_APP_API_KEY,
  authDomain: process.env.VUE_APP_AUTH_DOMAIN,
  databaseURL: process.env.VUE_APP_DATABASE_URL,
  projectId:
    process.env.VUE_APP_EMULATOR_PROJECT_ID || process.env.VUE_APP_PROJECT_ID,
  storageBucket: process.env.VUE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_APP_ID,
  measurementId: process.env.VUE_APP_MEASUREMENT_ID
});

const f = app.firestore();

if (process.env.VUE_APP_FIRESTORE_EMULATOR_HOST) {
  f.settings({
    host: process.env.VUE_APP_FIRESTORE_EMULATOR_HOST,
    ssl: false
  });
}

export const auth = app.auth();
export const db = f;
export const serverTimestamp = firestore.FieldValue.serverTimestamp;
