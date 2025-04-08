"use client"

import type React from "react"

import { useEffect, useRef } from "react"

interface SimpleEditorProps {
  value: string
  onChange: (value: string) => void
}

export function SimpleEditor({ value, onChange }: SimpleEditorProps) {
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

  return (
    <div className="w-full h-full overflow-auto p-4">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[calc(100vh-120px)] resize-none focus:outline-none font-mono text-sm sm:text-base dark:bg-background dark:text-foreground"
        placeholder="Start typing here..."
        spellCheck="false"
        style={{
          overflowY: "hidden", // Hide scrollbar as we're auto-expanding
        }}
      />
    </div>
  )
}

