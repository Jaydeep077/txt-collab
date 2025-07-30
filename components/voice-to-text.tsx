"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface VoiceToTextProps {
  onTextReceived: (text: string) => void
  disabled?: boolean
}

export function VoiceToText({ onTextReceived, disabled = false }: VoiceToTextProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Simple support check
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      setIsSupported(!!SpeechRecognition)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = () => {
    if (!isSupported || isListening) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    // Simple configuration
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
      console.log("Started listening")
      toast({
        title: "🎤 Listening",
        description: "Speak now...",
      })
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      console.log("Got result:", transcript)

      if (transcript && transcript.trim()) {
        onTextReceived(transcript + " ")
        toast({
          title: "✅ Voice Captured",
          description: `"${transcript}"`,
        })
      }
    }

    recognition.onerror = (event: any) => {
      console.log("Speech recognition error:", event.error)
      setIsListening(false)

      if (event.error !== "aborted") {
        let message = "Voice recognition failed"
        switch (event.error) {
          case "no-speech":
            message = "No speech detected. Please speak louder and clearer."
            break
          case "network":
            message = "Network error. Speech recognition requires internet connection."
            break
          case "not-allowed":
            message = "Microphone access denied. Please allow microphone access."
            break
        }

        toast({
          title: "Voice Recognition Error",
          description: message,
          variant: "destructive",
        })
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      console.log("Stopped listening")
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  if (!isSupported) {
    return (
      <div className="text-xs text-red-500 p-2 border border-red-200 rounded bg-red-50">
        ❌ Voice recognition not supported. Please use Chrome, Edge, or Safari.
      </div>
    )
  }

  return (
    <Button
      variant={isListening ? "destructive" : "outline"}
      size="sm"
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      className="flex items-center gap-2"
    >
      {isListening ? (
        <>
          <Square className="h-4 w-4" />
          Stop
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          Voice
        </>
      )}
    </Button>
  )
}
