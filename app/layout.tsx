import "./globals.css"
import { Inter } from "next/font/google"
import { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "TextCollab - Collaborative Text Editor",
  description: "A real-time collaborative text editor for sharing and editing text",
  generator: "v0.dev",
}

// ✅ Define props type
type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="top-right" closeButton richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
