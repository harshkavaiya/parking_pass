const CACHE_NAME = "parking-pass-v1"
const urlsToCache = ["/", "/entry", "/exit", "/admin", "/offline", "/manifest.json"]

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching app shell")
      return cache.addAll(urlsToCache)
    }),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request).catch(() => {
          // If both cache and network fail, show offline page
          if (event.request.destination === "document") {
            return caches.match("/offline")
          }
        })
      )
    }),
  )
})

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-tickets") {
    event.waitUntil(syncPendingTickets())
  }
})

async function syncPendingTickets() {
  console.log("[SW] Background sync triggered")

  try {
    // Open IndexedDB to get pending events
    const db = await openDB()
    const transaction = db.transaction(["syncEvents"], "readonly")
    const store = transaction.objectStore("syncEvents")
    const pendingEvents = await getAllPending(store)

    console.log(`[SW] Found ${pendingEvents.length} pending events to sync`)

    if (pendingEvents.length === 0) {
      return
    }

    // Attempt to sync with server
    const syncResult = await fetch("/api/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        events: pendingEvents,
        deviceId: await getDeviceId(),
      }),
    })

    if (syncResult.ok) {
      const result = await syncResult.json()
      console.log("[SW] Sync successful:", result)

      // Mark events as synced
      await markEventsSynced(db, result.syncedEventIds)

      // Notify main thread
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SYNC_COMPLETE",
            data: result,
          })
        })
      })
    } else {
      console.error("[SW] Sync failed:", syncResult.status)
    }
  } catch (error) {
    console.error("[SW] Background sync error:", error)
  }
}

// Helper functions for IndexedDB operations
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ParkingPassDB", 1)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function getAllPending(store) {
  return new Promise((resolve, reject) => {
    const request = store.index("synced").getAll(false)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getDeviceId() {
  try {
    const db = await openDB()
    const transaction = db.transaction(["deviceConfig"], "readonly")
    const store = transaction.objectStore("deviceConfig")
    const configs = await new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    return configs.length > 0 ? configs[0].deviceId : null
  } catch (error) {
    console.error("[SW] Failed to get device ID:", error)
    return null
  }
}

async function markEventsSynced(db, eventIds) {
  const transaction = db.transaction(["syncEvents"], "readwrite")
  const store = transaction.objectStore("syncEvents")

  for (const eventId of eventIds) {
    const request = store.get(eventId)
    request.onsuccess = () => {
      const event = request.result
      if (event) {
        event.synced = true
        store.put(event)
      }
    }
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TRIGGER_SYNC") {
    console.log("[SW] Manual sync triggered")
    syncPendingTickets()
  }
})
