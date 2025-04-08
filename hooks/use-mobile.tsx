"use client"

import { useState, useEffect } from "react"

export function useMobile(breakpoint = 768): boolean {
  // Start with a reasonable default based on common mobile widths
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window === "undefined") return

    // Function to check if the device is mobile
    const checkMobile = () => {
      return window.innerWidth < breakpoint
    }

    // Set initial value
    setIsMobile(checkMobile())

    // Add event listener for resize
    const handleResize = () => {
      setIsMobile(checkMobile())
    }

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [breakpoint])

  return isMobile
}

