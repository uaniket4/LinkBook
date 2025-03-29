// This is a service worker to enable faster loading of bookmarks

const CACHE_NAME = "linkbook-cache-v1"
const FAVICON_CACHE_NAME = "linkbook-favicons-v1"
const METADATA_CACHE_NAME = "linkbook-metadata-v1"

// Assets to cache immediately on install
const PRECACHE_ASSETS = ["/", "/dashboard", "/manifest.json", "/favicon.ico", "/placeholder.svg"]

// Install event - precache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const currentCaches = [CACHE_NAME, FAVICON_CACHE_NAME, METADATA_CACHE_NAME]
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName))
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete)
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Helper to determine if we should cache this request
function shouldCache(url) {
  // Don't cache API requests
  if (url.pathname.startsWith("/api/")) {
    return false
  }

  // Don't cache Firebase API requests
  if (url.hostname.includes("firebaseio.com") || url.hostname.includes("googleapis.com")) {
    return false
  }

  return true
}

// Helper to determine if this is a favicon request
function isFaviconRequest(url) {
  return (
    url.pathname.includes("favicon.ico") ||
    url.pathname.includes("favicon.png") ||
    url.pathname.includes("apple-touch-icon") ||
    url.href.includes("s2/favicons") ||
    url.hostname.includes("googleusercontent.com")
  )
}

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Special handling for favicons - cache for longer
  if (isFaviconRequest(url)) {
    event.respondWith(
      caches.open(FAVICON_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response
          }

          return fetch(event.request)
            .then((response) => {
              if (response && response.status === 200) {
                const clonedResponse = response.clone()
                cache.put(event.request, clonedResponse)
              }
              return response
            })
            .catch(() => {
              // If favicon fails to load, return a default icon
              return caches.match("/placeholder.svg")
            })
        })
      }),
    )
    return
  }

  // Normal caching strategy - network first, fallback to cache
  if (shouldCache(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const clonedResponse = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse)
            })
          }
          return response
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request)
        }),
    )
  }
})

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_FAVICON") {
    const { url, faviconUrl } = event.data

    if (faviconUrl) {
      fetch(faviconUrl)
        .then((response) => {
          if (response && response.status === 200) {
            caches.open(FAVICON_CACHE_NAME).then((cache) => {
              cache.put(new Request(faviconUrl), response)
            })
          }
        })
        .catch(() => {
          // Ignore favicon fetch errors
        })
    }
  }

  if (event.data && event.data.type === "CACHE_METADATA") {
    const { url, metadata } = event.data

    if (url && metadata) {
      // Store metadata in IndexedDB for faster access
      storeMetadata(url, metadata)
    }
  }
})

// Helper function to store metadata in IndexedDB
function storeMetadata(url, metadata) {
  // Implementation depends on your IndexedDB setup
  // This would normally store metadata like title, description, og:image URL, etc.
}

