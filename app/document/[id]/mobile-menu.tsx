"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Download, Share, Save, Plus, X, Wifi, WifiOff } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface MobileMenuProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  documentId: string
  isConnected: boolean
  offlineMode: boolean
  isSaving: boolean
  lastSaved: Date | null
  onNewDocument: () => void
  onShare: () => void
  onDownload: () => void
  onClear: () => void
  onSave: () => void
}

export function MobileMenu({
  isOpen,
  setIsOpen,
  documentId,
  isConnected,
  offlineMode,
  isSaving,
  lastSaved,
  onNewDocument,
  onShare,
  onDownload,
  onClear,
  onSave,
}: MobileMenuProps) {
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-[250px] sm:w-[300px] p-0">
        <div className="flex flex-col h-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Theme</span>
              <ThemeToggle />
            </div>
            <Button
              onClick={() => {
                onNewDocument()
                setIsOpen(false)
              }}
              className="justify-start"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
            <Button
              onClick={() => {
                onShare()
                setIsOpen(false)
              }}
              className="justify-start"
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={() => {
                onDownload()
                setIsOpen(false)
              }}
              className="justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={() => {
                onClear()
                setIsOpen(false)
              }}
              className="justify-start"
            >
              Clear Document
            </Button>
            <Button
              onClick={() => {
                onSave()
                setIsOpen(false)
              }}
              className="justify-start"
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Now
            </Button>
          </div>
          <div className="mt-auto pt-4 border-t">
            <div className="text-xs text-muted-foreground mb-2">Document ID: {documentId}</div>
            {lastSaved && (
              <div className="text-xs text-muted-foreground">Last saved: {lastSaved.toLocaleTimeString()}</div>
            )}
            <div className="text-xs flex items-center mt-2">
              {isConnected ? (
                <Wifi className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500 mr-1" />
              )}
              {isConnected ? (offlineMode ? "Local Only" : "Online") : "Offline"}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

