import { connectAuthEmulator as __connectAuthEmu } from 'firebase/auth'
import { connectFirestoreEmulator as __connectFsEmu } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Helpful warning if the developer forgot to create .env
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

if (!isFirebaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Permit to Work] Firebase is not configured. Copy .env.example to .env and add your project keys.'
  )
}

// Only initialize the SDK when configured — calling getAuth() with an undefined
// apiKey throws synchronously (auth/invalid-api-key) and would blank the whole
// app, including the "Connect Firebase" setup screen. When unconfigured we
// export nulls; nothing reads them until the user is past the setup screen.
let app = null
let auth = null
let db = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  // Session persistence (sessionStorage): login is dropped when the tab/browser
  // is closed; a same-tab reload keeps the session.
  setPersistence(auth, browserSessionPersistence).catch((e) => {
    // eslint-disable-next-line no-console
    console.warn('[Permit to Work] could not set session persistence:', e?.message || e)
  })
}

export { auth, db }
export default app

// ── Local emulator wiring (demo / offline dev only) ──────────────────────────
// When VITE_USE_EMULATOR is "1", point Auth + Firestore at the local Firebase
// emulators. Guarded by an env flag absent in production builds.
export const usingEmulator = import.meta.env.VITE_USE_EMULATOR === '1'
if (usingEmulator && auth && db) {
  __connectAuthEmu(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  __connectFsEmu(db, '127.0.0.1', 8080)
}
