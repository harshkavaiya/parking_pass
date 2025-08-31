import { db, dbHelpers, type Ticket, type SyncEvent, type DeviceConfig } from "./db"
import { AuthService } from "./auth"

export interface SyncStatus {
  isOnline: boolean
  lastSync: string | null
  pendingEvents: number
  syncInProgress: boolean
  lastSyncError: string | null
}

export interface SyncResult {
  success: boolean
  syncedEvents: number
  failedEvents: number
  conflicts: number
  error?: string
}

export interface ConflictResolution {
  ticketId: string
  localVersion: Ticket
  serverVersion: Ticket
  resolution: "local" | "server" | "manual"
  resolvedAt: string
}

export class SyncService {
  private static syncInProgress = false
  private static syncListeners: ((status: SyncStatus) => void)[] = []
  private static retryAttempts = new Map<string, number>()
  private static maxRetries = 3

  // Subscribe to sync status changes
  static onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(callback)
    return () => {
      const index = this.syncListeners.indexOf(callback)
      if (index > -1) {
        this.syncListeners.splice(index, 1)
      }
    }
  }

  // Notify all listeners of sync status changes
  private static notifyListeners(status: SyncStatus): void {
    this.syncListeners.forEach((callback) => callback(status))
  }

  // Get current sync status
  static async getSyncStatus(): Promise<SyncStatus> {
    const pendingEvents = await dbHelpers.getPendingSyncEvents()
    const deviceConfig = await AuthService.getDeviceConfig()

    return {
      isOnline: navigator.onLine,
      lastSync: deviceConfig?.lastSync || null,
      pendingEvents: pendingEvents.length,
      syncInProgress: this.syncInProgress,
      lastSyncError: localStorage.getItem("last_sync_error"),
    }
  }

  // Start background sync process
  static async startBackgroundSync(): Promise<void> {
    // Listen for online events
    window.addEventListener("online", () => {
      console.log("[Sync] Device came online, starting sync...")
      this.syncPendingData()
    })

    // Periodic sync when online
    setInterval(
      async () => {
        if (navigator.onLine && !this.syncInProgress) {
          await this.syncPendingData()
        }
      },
      5 * 60 * 1000,
    ) // Every 5 minutes

    // Initial sync if online
    if (navigator.onLine) {
      await this.syncPendingData()
    }
  }

  // Sync pending data to server
  static async syncPendingData(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, syncedEvents: 0, failedEvents: 0, conflicts: 0, error: "Sync already in progress" }
    }

    this.syncInProgress = true
    localStorage.removeItem("last_sync_error")

    try {
      const pendingEvents = await dbHelpers.getPendingSyncEvents()
      const deviceConfig = await AuthService.getDeviceConfig()

      if (!deviceConfig) {
        throw new Error("Device not configured")
      }

      console.log(`[Sync] Starting sync of ${pendingEvents.length} pending events`)

      let syncedEvents = 0
      let failedEvents = 0
      let conflicts = 0

      // Group events by type for batch processing
      const createEvents = pendingEvents.filter((e) => e.type === "create")
      const exitEvents = pendingEvents.filter((e) => e.type === "exit")

      // Sync create events
      if (createEvents.length > 0) {
        const createResult = await this.syncCreateEvents(createEvents, deviceConfig)
        syncedEvents += createResult.synced
        failedEvents += createResult.failed
        conflicts += createResult.conflicts
      }

      // Sync exit events
      if (exitEvents.length > 0) {
        const exitResult = await this.syncExitEvents(exitEvents, deviceConfig)
        syncedEvents += exitResult.synced
        failedEvents += exitResult.failed
        conflicts += exitResult.conflicts
      }

      // Update device last sync time
      await db.deviceConfig.where("deviceId").equals(deviceConfig.deviceId).modify({
        lastSync: new Date().toISOString(),
      })

      const result: SyncResult = {
        success: failedEvents === 0,
        syncedEvents,
        failedEvents,
        conflicts,
      }

      console.log("[Sync] Sync completed:", result)
      return result
    } catch (error) {
      console.error("[Sync] Sync failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown sync error"
      localStorage.setItem("last_sync_error", errorMessage)

      return {
        success: false,
        syncedEvents: 0,
        failedEvents: 0,
        conflicts: 0,
        error: errorMessage,
      }
    } finally {
      this.syncInProgress = false
      const status = await this.getSyncStatus()
      this.notifyListeners(status)
    }
  }

  // Sync create events to server
  private static async syncCreateEvents(
    events: SyncEvent[],
    deviceConfig: DeviceConfig,
  ): Promise<{ synced: number; failed: number; conflicts: number }> {
    let synced = 0
    let failed = 0
    let conflicts = 0

    for (const event of events) {
      try {
        // In a real implementation, this would be an API call
        const response = await this.mockServerSync("create", event, deviceConfig)

        if (response.success) {
          // Mark event as synced
          await db.syncEvents.where("id").equals(event.id!).modify({ synced: true })

          // Update ticket status
          await db.tickets.where("ticketId").equals(event.ticketId).modify({
            status: "synced",
            syncedAt: new Date().toISOString(),
          })

          synced++
          this.retryAttempts.delete(event.ticketId)
        } else if (response.conflict) {
          // Handle conflict
          await this.handleConflict(event, response.serverData)
          conflicts++
        } else {
          // Handle failure with retry logic
          const retries = this.retryAttempts.get(event.ticketId) || 0
          if (retries < this.maxRetries) {
            this.retryAttempts.set(event.ticketId, retries + 1)
            console.log(`[Sync] Retrying event ${event.ticketId}, attempt ${retries + 1}`)
          } else {
            console.error(`[Sync] Max retries exceeded for event ${event.ticketId}`)
            failed++
          }
        }
      } catch (error) {
        console.error(`[Sync] Failed to sync create event ${event.ticketId}:`, error)
        failed++
      }
    }

    return { synced, failed, conflicts }
  }

  // Sync exit events to server
  private static async syncExitEvents(
    events: SyncEvent[],
    deviceConfig: DeviceConfig,
  ): Promise<{ synced: number; failed: number; conflicts: number }> {
    let synced = 0
    let failed = 0
    let conflicts = 0

    for (const event of events) {
      try {
        const response = await this.mockServerSync("exit", event, deviceConfig)

        if (response.success) {
          await db.syncEvents.where("id").equals(event.id!).modify({ synced: true })
          synced++
          this.retryAttempts.delete(event.ticketId)
        } else if (response.conflict) {
          await this.handleConflict(event, response.serverData)
          conflicts++
        } else {
          const retries = this.retryAttempts.get(event.ticketId) || 0
          if (retries < this.maxRetries) {
            this.retryAttempts.set(event.ticketId, retries + 1)
          } else {
            failed++
          }
        }
      } catch (error) {
        console.error(`[Sync] Failed to sync exit event ${event.ticketId}:`, error)
        failed++
      }
    }

    return { synced, failed, conflicts }
  }

  // Handle sync conflicts
  private static async handleConflict(localEvent: SyncEvent, serverData: any): Promise<void> {
    console.log(`[Sync] Conflict detected for ticket ${localEvent.ticketId}`)

    const localTicket = await db.tickets.get(localEvent.ticketId)
    if (!localTicket) return

    // Simple conflict resolution: server wins for now
    // In production, you'd implement more sophisticated conflict resolution
    const resolution: ConflictResolution = {
      ticketId: localEvent.ticketId,
      localVersion: localTicket,
      serverVersion: serverData,
      resolution: "server",
      resolvedAt: new Date().toISOString(),
    }

    // Update local ticket with server data
    await db.tickets.update(localEvent.ticketId, {
      ...serverData,
      status: "synced",
      syncedAt: new Date().toISOString(),
    })

    // Mark sync event as completed
    await db.syncEvents.where("id").equals(localEvent.id!).modify({ synced: true })

    // Log conflict resolution
    await dbHelpers.addAuditLog({
      ticketId: localEvent.ticketId,
      action: "conflict_resolved",
      actor: "system",
      timestamp: new Date().toISOString(),
      deviceInfo: { resolution },
      meta: { localVersion: localTicket, serverVersion: serverData },
    })
  }

  // Mock server sync (replace with real API calls)
  private static async mockServerSync(
    type: string,
    event: SyncEvent,
    deviceConfig: DeviceConfig,
  ): Promise<{ success: boolean; conflict?: boolean; serverData?: any }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200))

    // Simulate different response scenarios
    const random = Math.random()

    if (random < 0.85) {
      // Success case
      return { success: true }
    } else if (random < 0.95) {
      // Conflict case
      return {
        success: false,
        conflict: true,
        serverData: {
          ...event.data,
          exitTime: new Date().toISOString(),
          status: "exited",
        },
      }
    } else {
      // Failure case
      return { success: false }
    }
  }

  // Force sync now
  static async forceSyncNow(): Promise<SyncResult> {
    if (!navigator.onLine) {
      return {
        success: false,
        syncedEvents: 0,
        failedEvents: 0,
        conflicts: 0,
        error: "Device is offline",
      }
    }

    return await this.syncPendingData()
  }

  // Clear sync errors
  static clearSyncErrors(): void {
    localStorage.removeItem("last_sync_error")
    this.retryAttempts.clear()
  }

  // Get sync statistics
  static async getSyncStatistics(): Promise<{
    totalTickets: number
    syncedTickets: number
    pendingTickets: number
    failedSyncs: number
  }> {
    const allTickets = await db.tickets.toArray()
    const pendingEvents = await dbHelpers.getPendingSyncEvents()

    return {
      totalTickets: allTickets.length,
      syncedTickets: allTickets.filter((t) => t.status === "synced").length,
      pendingTickets: allTickets.filter((t) => t.status === "pending").length,
      failedSyncs: this.retryAttempts.size,
    }
  }
}
