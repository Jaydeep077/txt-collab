//import dotenv from 'dotenv'
//dotenv.config();
import { initializeApp } from "firebase/app"
import {
  getDatabase,
  ref,
  onValue,
  set,
  get,
  push,
  Database,
  connectDatabaseEmulator,
  onDisconnect,
  remove,
} from "firebase/database"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL:
    process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
      ? `http://${process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "localhost"}:${process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_PORT || "9000"}?ns=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`
      : process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL_DEV
        : process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const database: Database = getDatabase(app)

// Initialize Firebase only on the client side
if (typeof window !== "undefined") {
  try {
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
      const dbHost = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "localhost"
      const dbPort = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_PORT
        ? parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_PORT)
        : 9000
      console.log(`Connecting to Firebase Emulator at ${dbHost}:${dbPort}`)
      connectDatabaseEmulator(database, dbHost, dbPort)
    }
    console.log("Firebase initialized successfully")
  } catch (error) {
    console.error("Error initializing Firebase:", error)
  }
}

export interface PresenceUser {
  sessionId: string
  displayName: string
  joinedAt: number
}

/**
 * Registers this browser tab as a guest and streams the active guests for a document.
 * Each tab gets a unique session key; onDisconnect removes stale presence records.
 */
export function subscribeToPresence(
  documentId: string,
  displayName: string,
  callback: (users: PresenceUser[]) => void,
) {
  if (typeof window === "undefined" || !documentId) return () => {}

  const presenceRef = ref(database, `presence/${documentId}`)
  const sessionRef = push(presenceRef)
  const sessionId = sessionRef.key
  if (!sessionId) return () => {}

  const safeName = displayName.trim().slice(0, 32) || "Guest"
  const record: Omit<PresenceUser, "sessionId"> = {
    displayName: safeName,
    joinedAt: Date.now(),
  }

  // Register disconnect handling before announcing this session.
  void onDisconnect(sessionRef).remove()
    .then(() => set(sessionRef, record))
    .catch((error) => console.error("Could not register collaboration presence:", error))

  const unsubscribe = onValue(
    presenceRef,
    (snapshot) => {
      const value = snapshot.val() as Record<string, Omit<PresenceUser, "sessionId">> | null
      const users = Object.entries(value ?? {})
        .filter(([, user]) => user && typeof user.displayName === "string")
        .map(([key, user]) => ({
          sessionId: key,
          displayName: user.displayName.slice(0, 32),
          joinedAt: typeof user.joinedAt === "number" ? user.joinedAt : 0,
        }))
      callback(users)
    },
    (error) => console.error("Could not read collaboration presence:", error),
  )

  return () => {
    unsubscribe()
    void remove(sessionRef).catch((error) => {
      console.error("Could not remove collaboration presence:", error)
    })
  }
}

/**
 * Check if the client is online
 */
export function isOnline() {
  return typeof navigator !== "undefined" && navigator.onLine
}

/**
 * Get a document by ID
 */
export async function getDocument(id: string | undefined) {
  if (typeof window === "undefined") return null

  try {
    const localData = localStorage.getItem(`document_${id}`)
    console.log(`Getting document ${id} from database`)
    const docRef = ref(database, `documents/${id}`)
    const snapshot = await get(docRef)

    if (snapshot.exists()) {
      const data = snapshot.val()
      localStorage.setItem(`document_${id}`, JSON.stringify(data))
      return data
    }

    if (localData) {
      const parsedData = JSON.parse(localData)
      await set(docRef, parsedData)
      return parsedData
    }

    const newDoc = {
      content: "Start typing here...\n\nShare this link with others to collaborate in real-time.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await set(docRef, newDoc)
    localStorage.setItem(`document_${id}`, JSON.stringify(newDoc))
    return newDoc
  } catch (error) {
    console.error("Error getting document:", error)
    const localData = localStorage.getItem(`document_${id}`)
    if (localData) return JSON.parse(localData)

    const newDoc = {
      content: "Start typing here...\n\nShare this link with others to collaborate in real-time.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(`document_${id}`, JSON.stringify(newDoc))
    return newDoc
  }
}

/**
 * Update a document
 */
export async function updateDocument(id: string | undefined, content: string) {
  if (typeof window === "undefined") return

  try {
    const timestamp = new Date().toISOString()
    const localData = localStorage.getItem(`document_${id}`)
    const docData = { content, updatedAt: timestamp, createdAt: timestamp }

    if (localData) {
      try {
        const parsed = JSON.parse(localData)
        docData.createdAt = parsed.createdAt || timestamp
      } catch (error) {
        console.error("Error parsing local data:", error)
      }
    }

    localStorage.setItem(`document_${id}`, JSON.stringify(docData))
    const docRef = ref(database, `documents/${id}`)
    await set(docRef, docData)
    return true
  } catch (error) {
    console.error("Error updating document:", error)
    throw error
  }
}

/**
 * Subscribe to document changes
 */
export function subscribeToDocument(id: string | undefined, callback: (newContent: string) => void) {
  if (typeof window === "undefined") return () => {}

  try {
    const docRef = ref(database, `documents/${id}`)
    return onValue(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) return
        const data = snapshot.val()
        localStorage.setItem(`document_${id}`, JSON.stringify(data))
        callback(data.content)
      },
      (error) => console.error("Error subscribing to document:", error),
    )
  } catch (error) {
    console.error("Error setting up subscription:", error)
    return () => {}
  }
}

/**
 * Listen for online/offline status changes
 */
export function listenToOnlineStatus(callback: (online: boolean) => void) {
  if (typeof window === "undefined") return () => {}

  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)
  window.addEventListener("online", handleOnline)
  window.addEventListener("offline", handleOffline)
  callback(navigator.onLine)

  return () => {
    window.removeEventListener("online", handleOnline)
    window.removeEventListener("offline", handleOffline)
  }
}

/**
 * Create a new document with a generated ID
 */
export async function createNewDocument() {
  if (typeof window === "undefined") return null

  try {
    const docsRef = ref(database, "documents")
    const newDocRef = push(docsRef)
    const newId = newDocRef.key
    if (!newId) return null

    const timestamp = new Date().toISOString()
    await set(newDocRef, {
      content: "Initial content",
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    return newId
  } catch (error) {
    console.error("Error creating new document:", error)
    return null
  }
}
