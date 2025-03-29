"use client"

import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { Toaster } from "@/components/ui/toaster"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }) {
  // Register enhanced service worker for faster loading
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", async () => {
        try {
          const registration = await navigator.serviceWorker.register("/service-worker.js", {
            scope: "/",
          })

          console.log("Service Worker registered with scope:", registration.scope)

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing

            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New service worker is installed but waiting to activate
                console.log("New service worker available")

                // Notify user of update
                if (confirm("New version available! Reload to update?")) {
                  window.location.reload()
                }
              }
            })
          })
        } catch (error) {
          console.error("Service Worker registration failed:", error)
        }
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "CACHE_CLEARED") {
          console.log("Caches cleared:", event.data.caches)
        }
      })
    }
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="LinkBook - Organize your bookmarks with ease" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <title>LinkBook</title>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

