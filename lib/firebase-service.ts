//import dotenv from 'dotenv'
//dotenv.config();
import { initializeApp } from "firebase/app"
import { getDatabase, ref, onValue, set, get, push, Database, connectDatabaseEmulator } from "firebase/database"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:  process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
      ? `http://${process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost'}:${process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_PORT || '9000'}?ns=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`
      : (process.env.NODE_ENV === 'development'
        ? process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL_DEV
        : process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL),
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const database: Database = getDatabase(app)

// Initialize Firebase only on the client side
if (typeof window !== "undefined") {
  try {
    // Development environment specific logic
    if (process.env.NODE_ENV === 'development') {
      // If USE_FIREBASE_EMULATOR is true, connect to the emulator
      if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
        const dbHost = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';
        const dbPort = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_PORT ? parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_PORT) : 9000;
        console.log(`Connecting to Firebase Emulator at ${dbHost}:${dbPort}`);
        connectDatabaseEmulator(database, dbHost, dbPort);
      }
    }
    console.log("Firebase initialized successfully")
  } catch (error) {
    console.error("Error initializing Firebase:", error)
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
  if (typeof window === "undefined") {
    return null // Server-side rendering, return null
  }

  try {
    // Check local storage first
    const localData = localStorage.getItem(`document_${id}`)

    // Try to get from database
    console.log(`Getting document ${id} from database`)
    const docRef = ref(database, `documents/${id}`)
    const snapshot = await get(docRef)

    if (snapshot.exists()) {
      console.log(`Document ${id} found in database`)
      const data = snapshot.val()

      // Save to local storage
      localStorage.setItem(`document_${id}`, JSON.stringify(data))

      return data
    } else {
      console.log(`Document ${id} not found, creating new`)

      // If not in database but in local storage, use that
      if (localData) {
        const parsedData = JSON.parse(localData)
        await set(docRef, parsedData)
        return parsedData
      }

      // Create new document
      const newDoc = {
        content: "Start typing here...\n\nShare this link with others to collaborate in real-time.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await set(docRef, newDoc)
      localStorage.setItem(`document_${id}`, JSON.stringify(newDoc))

      return newDoc
    }
  } catch (error) {
    console.error("Error getting document:", error)

    // If database access fails but we have local data, use that
    const localData = localStorage.getItem(`document_${id}`)
    if (localData) {
      return JSON.parse(localData)
    }

    // Create a new document in local storage only
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
    // Always update local storage
    const timestamp = new Date().toISOString()

    // Get existing data from local storage
    const localData = localStorage.getItem(`document_${id}`)
    const docData = {
      content,
      updatedAt: timestamp,
      createdAt: timestamp,
    }

    if (localData) {
      try {
        const parsed = JSON.parse(localData)
        docData.createdAt = parsed.createdAt || timestamp
      } catch (e) {
        console.error("Error parsing local data:", e)
      }
    }

    localStorage.setItem(`document_${id}`, JSON.stringify(docData))

    // Update in database
    console.log(`Updating document ${id} in database`)
    const docRef = ref(database, `documents/${id}`)
    await set(docRef, docData)
    console.log(`Document ${id} updated successfully`)

    return true
  } catch (error) {
    console.error("Error updating document:", error)
    throw error
  }
}

/**
 * Subscribe to document changes
 */
export function subscribeToDocument(id: string | undefined, callback: { (newContent: any): void; (arg0: any): void }) {
  if (typeof window === "undefined") return () => {}

  try {
    console.log(`Subscribing to document ${id}`)
    const docRef = ref(database, `documents/${id}`)

    const unsubscribe = onValue(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          console.log(`Document ${id} updated from database`)

          // Update local storage
          localStorage.setItem(`document_${id}`, JSON.stringify(data))

          // Call callback with content
          callback(data.content)
        }
      },
      (error) => {
        console.error("Error subscribing to document:", error)
      },
    )

    return unsubscribe
  } catch (error) {
    console.error("Error setting up subscription:", error)
    return () => {}
  }
}

/**
 * Listen for online/offline status changes
 */
export function listenToOnlineStatus(callback: { (online: any): void; (arg0: boolean): void }) {
  if (typeof window === "undefined") return () => {}

  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener("online", handleOnline)
  window.addEventListener("offline", handleOffline)

  // Initial status
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
    try {
      // Generate a new document ID
      console.log("Attempting to get docsRef...");
      const docsRef = ref(database, "documents")
      console.log("docsRef obtained. Attempting to push newDocRef...");
      const newDocRef = push(docsRef)
      const newId = newDocRef.key
      console.log(`newDocRef pushed, newId: ${newId}. Attempting to set newDoc...`);

      // Create the document
      const newDoc = {
        content: "Initial content"
      }

      await set(newDocRef, newDoc)
      console.log("newDoc set successfully. Returning newId.");

      return newId
    } catch (error) {
      console.error("Error in createNewDocument Firebase operations:", error)
      return null
    }

  } catch (error) {
    console.error("Error creating new document:", error)
    return null
  }
}

