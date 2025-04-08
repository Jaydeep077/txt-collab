"use client"

import { useEffect, useState, useRef, SetStateAction } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Download, Share, Wifi, WifiOff, Menu, Save } from "lucide-react"
import { SimpleEditor } from "@/components/simple-editor"
import {
  getDocument,
  updateDocument,
  subscribeToDocument,
  listenToOnlineStatus,
  isOnline,
} from "@/lib/firebase-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useMobile } from "@/hooks/use-mobile"
import { MobileMenu } from "./mobile-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { toast } from "sonner"
// No change needed here, the import is correct

export default function DocumentPage() {
  const router = useRouter()
  const { id } = useParams()
  const documentId = Array.isArray(id) ? id[0] : id ?? ""


  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)


  const lastChangeRef = useRef(Date.now())
  const isUpdatingRef = useRef(false)
  const isMobile = useMobile()

  // Listen for online/offline status
  useEffect(() => {
    const cleanup = listenToOnlineStatus((online) => {
      console.log("Online status changed:", online)
      setIsConnected(online)

      if (online && offlineMode) {
        toast.success("You're back online", {
          description: "Syncing your changes...",
        })

        syncChanges()
      }
    })

    return cleanup
  }, [offlineMode, documentId])

  // Sync changes to server
  const syncChanges = async () => {
    if (!content && content !== "") return

    try {
      setIsSaving(true)
      await updateDocument(documentId, content)
      setOfflineMode(false)
      setLastSaved(new Date())

      toast.success("Changes synced", {
        description: "Your changes have been saved to the server.",
      })
    } catch (error) {
      console.error("Error syncing changes:", error)
      toast.error("Sync failed", {
        description: "Could not sync your changes. Will try again later.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Load document
  useEffect(() => {
    async function loadDoc() {
      try {
        setIsLoading(true)
        setError(null)

        console.log("Loading document:", documentId)
        const doc = await getDocument(documentId)

        if (doc) {
          console.log("Document loaded:", documentId)
          setContent(doc.content)

          if (!isOnline()) {
            setOfflineMode(true)
            toast.warning("Offline mode", {
              description: "You're working offline. Changes will be saved locally.",
            })
          }
        }
      } catch (err) {
        console.error("Error loading document:", err)
        setError("Failed to load document. Please try again.")

        // Try to get from local storage
        const localData = localStorage.getItem(`document_${documentId}`)
        if (localData) {
          try {
            const parsed = JSON.parse(localData)
            setContent(parsed.content)
            setOfflineMode(true)

            toast.warning("Using offline version", {
              description: "You're viewing a locally saved version.",
            })
          } catch (e) {
            console.error("Error parsing local data:", e)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadDoc()

    // Subscribe to changes
    const unsubscribe = subscribeToDocument(documentId, (newContent) => {
      if (newContent !== undefined && !isUpdatingRef.current && !offlineMode) {
        setContent(newContent)
      }
    })

    return () => {
      unsubscribe()
      // Clear any pending save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [documentId])

  // Handle content changes
  const handleContentChange = (newContent: SetStateAction<string>) => {
    // Set the content state
    setContent(newContent)
    lastChangeRef.current = Date.now()
    isUpdatingRef.current = true

    // Save to local storage immediately
    const localData = localStorage.getItem(`document_${documentId}`)
    const docData = {
      content: newContent,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    if (localData) {
      try {
        const parsed = JSON.parse(localData)
        docData.createdAt = parsed.createdAt || docData.createdAt
      } catch (e) {
        console.error("Error parsing local data:", e)
      }
    }

    localStorage.setItem(`document_${documentId}`, JSON.stringify(docData))

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set a new timeout for saving to server
    saveTimeoutRef.current = setTimeout(() => {
      // Only save if it's been at least 500ms since the last change
      if (Date.now() - lastChangeRef.current >= 500) {
        saveToServer(newContent)
        isUpdatingRef.current = false
      }
    }, 1000)
  }

  // Save to server
  const saveToServer = async (contentToSave: SetStateAction<string> | undefined) => {
    if (offlineMode || !isConnected) {
      setLastSaved(new Date())
      return
    }

    try {
      setIsSaving(true)
    
      const resolvedContent =
        typeof contentToSave === "function"
          ? contentToSave(content)
          : contentToSave ?? content
    
      await updateDocument(documentId, resolvedContent)
      setLastSaved(new Date())
    } catch (error) {
      console.error("Error saving document:", error)
      setOfflineMode(true)
      toast.error("Switched to offline mode", {
        description: "Your changes are saved locally but couldn't be synced.",
      })
    } finally {
      setIsSaving(false)
    }
    
  }

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/document/${documentId}`
    navigator.clipboard.writeText(shareUrl)
    toast.success("Link copied!", {
      description: "Share this link with others to collaborate.",
    })
  }

  const downloadDocument = () => {
    const element = document.createElement("a")
    const file = new Blob([content], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `document-${documentId}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const createNewDocument = () => {
    router.push("/new")
  }

  const forceSave = () => {
    saveToServer(content)
    toast.info("Saving...", {
      description: "Attempting to save your document.",
    })
  }
  

  const clearDocument = () => {
    handleContentChange("")
    toast.success("Document cleared", {
      description: "All content has been cleared.",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading document...</p>
        </div>
      </div>
    )
  }

  const renderDesktopHeader = () => (
    <div className="container flex items-center justify-between h-14 px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">TextCollab</h1>
        <div className="text-xs text-muted-foreground hidden sm:block">Document ID: {documentId}</div>
        {isSaving ? (
          <div className="text-xs text-muted-foreground flex items-center">
            <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
            Saving...
          </div>
        ) : lastSaved ? (
          <div className="text-xs text-muted-foreground">Last saved: {lastSaved.toLocaleTimeString()}</div>
        ) : null}
        <div className="text-xs flex items-center">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-green-500 mr-1" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500 mr-1" />
          )}
          {isConnected ? (offlineMode ? "Local Only" : "Online") : "Offline"}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="outline" size="sm" onClick={createNewDocument}>
          New Document
        </Button>
        <Button variant="outline" size="sm" onClick={copyShareLink}>
          <Share className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" size="sm" onClick={downloadDocument}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button variant="outline" size="sm" onClick={clearDocument}>
          Clear
        </Button>
        {!isSaving && (
          <Button variant="default" size="sm" onClick={forceSave}>
            Save Now
          </Button>
        )}
      </div>
    </div>
  )

  const renderMobileHeader = () => (
    <div className="container flex items-center justify-between h-14 px-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">TextCollab</h1>
        {isSaving ? (
          <div className="text-xs text-muted-foreground flex items-center ml-2">
            <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full mr-1"></div>
          </div>
        ) : null}
        <div className="text-xs flex items-center ml-2">
          {isConnected ? <Wifi className="h-3 w-3 text-green-500" /> : <WifiOff className="h-3 w-3 text-red-500" />}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={forceSave} disabled={isSaving}>
          <Save className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b">{isMobile ? renderMobileHeader() : renderDesktopHeader()}</header>

      {/* Mobile menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        setIsOpen={setMobileMenuOpen}
        documentId={documentId}
        isConnected={isConnected}
        offlineMode={offlineMode}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onNewDocument={createNewDocument}
        onShare={copyShareLink}
        onDownload={downloadDocument}
        onClear={clearDocument}
        onSave={forceSave}
      />

      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {(offlineMode || !isConnected) && (
        <Alert variant="warning" className="mx-4 mt-4 mb-2">
          <AlertTitle>{offlineMode ? "Local Only Mode" : "You're offline"}</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            {offlineMode
              ? "You're working with a local copy. Changes are saved on your device but not synced to the server."
              : "You can still edit the document, but changes won't be saved to the server until you're back online."}
            {isConnected && offlineMode && (
              <Button variant="outline" size="sm" className="mt-2" onClick={syncChanges}>
                Try to Sync Now
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 overflow-hidden">
        <SimpleEditor value={content} onChange={handleContentChange} />
      </div>
    </div>
  )
}

