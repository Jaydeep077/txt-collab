"use client"

import type React from "react"
import { VoiceToText } from "./voice-to-text"

import { useEffect, useRef } from "react"

interface SimpleEditorProps {
  value: string
  onChange: (value: string) => void
  onVoiceText?: (text: string) => void
}

export function SimpleEditor({ value, onChange, onVoiceText }: SimpleEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Focus the textarea when the component mounts
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  // Adjust textarea height on content change
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)

    // Adjust height as user types
    e.target.style.height = "auto"
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Ctrl+A and Delete/Backspace
    if ((e.key === "Delete" || e.key === "Backspace") && textareaRef.current) {
      // If all text is selected, clear it immediately
      if (
        textareaRef.current.selectionStart === 0 &&
        textareaRef.current.selectionEnd === textareaRef.current.value.length &&
        textareaRef.current.value.length > 0
      ) {
        e.preventDefault() // Prevent default to handle it ourselves
        onChange("") // Clear the content
      }
    }
  }

  const handleVoiceText = (voiceText: string) => {
    console.log("Received voice text:", voiceText, "Type:", typeof voiceText)

    if (!textareaRef.current) {
      console.log("No textarea ref")
      return
    }

    // Check if voiceText is valid
    if (!voiceText || typeof voiceText !== "string" || voiceText.trim().length === 0) {
      console.log("Invalid voice text:", voiceText)
      return
    }

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    console.log("Cursor position:", start, end)
    console.log("Current value length:", value.length)

    // Insert voice text at cursor position
    const beforeText = value.substring(0, start)
    const afterText = value.substring(end)
    const newValue = beforeText + voiceText + afterText

    console.log("New value:", newValue)
    onChange(newValue)

    // Move cursor to end of inserted text and focus
    setTimeout(() => {
      if (textarea) {
        const newCursorPos = start + voiceText.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()

        // Adjust height after inserting text
        textarea.style.height = "auto"
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, 10)

    if (onVoiceText) {
      onVoiceText(voiceText)
    }
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-3 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Click the microphone and speak clearly. Make sure to allow microphone access.
        </div>
        <VoiceToText onTextReceived={handleVoiceText} />
      </div>
      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[calc(100vh-180px)] resize-none focus:outline-none font-mono text-sm sm:text-base leading-relaxed"
          placeholder="Start typing here or use the microphone button above for voice input..."
          spellCheck="false"
          style={{
            overflowY: "hidden", // Hide scrollbar as we're auto-expanding
          }}
        />
      </div>
    </div>
  )
}
