"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createNewDocument } from "@/lib/firebase-service"
import { nanoid } from "nanoid"
import { toast } from "sonner"
// No change needed here, the import is correct

export default function NewDocumentPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(true)
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function create() {
      try {
        setIsCreating(true)

        // Try to create a document in Firebase
        const newId = await createNewDocument()

        if (newId) {
          // If successful, redirect to the document
          router.push(`/document/${newId}`)
        } else {
          // If Firebase fails, generate a local ID
          const localId = nanoid(10)
          toast.warning("Using local document", {
            description: "Could not connect to server. Creating a local document.",
          })
          router.push(`/document/${localId}`)
        }
      } catch (err) {
        console.error("Error creating document:", err)
        setError("Failed to create a new document. Please try again.")
        setIsCreating(false)
      }
    }

    create()
  }, [router])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button className="px-4 py-2 bg-primary text-white rounded" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Creating your document...</p>
      </div>
    </div>
  )
}

