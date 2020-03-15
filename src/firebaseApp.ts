import { initializeApp, firestore } from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/functions'
import 'firebase/messaging'

const app = initializeApp({
  apiKey: process.env.VUE_APP_API_KEY,
  authDomain: process.env.VUE_APP_AUTH_DOMAIN,
  databaseURL: process.env.VUE_APP_DATABASE_URL,
  projectId:
    process.env.VUE_APP_EMULATOR_PROJECT_ID || process.env.VUE_APP_PROJECT_ID,
  storageBucket: process.env.VUE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_APP_ID,
  measurementId: process.env.VUE_APP_MEASUREMENT_ID,
})

// Firestore
const _firestore = app.firestore()
const _functions = app.functions()

if (process.env.VUE_APP_FIRESTORE_EMULATOR_HOST) {
  _firestore.settings({
    host: process.env.VUE_APP_FIRESTORE_EMULATOR_HOST,
    ssl: false,
  })
  _functions.useFunctionsEmulator('http://localhost:5001')
}

export const auth = app.auth()
export const db = _firestore
export const functions = app.functions()
export const serverTimestamp = firestore.FieldValue.serverTimestamp
export const arrayUnion = firestore.FieldValue.arrayUnion
export const messaging = app.messaging()
