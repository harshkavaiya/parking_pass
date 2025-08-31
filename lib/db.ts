import Dexie, { type Table } from "dexie"

// Database interfaces
export interface Ticket {
  ticketId: string
  vehicleNo: string
  phone: string
  entryTime: string
  exitTime?: string
  createdByDevice: string
  createdByStaffId: string
  status: "pending" | "synced" | "exited" | "cancelled"
  signature: string
  payment: {
    method: "cash" | "upi"
    txnId?: string
    amount?: number
  }
  syncedAt?: string
  notes?: string
}

export interface SyncEvent {
  id?: number
  ticketId: string
  type: "create" | "exit" | "sync" | "manualOverride"
  timestamp: string
  deviceId: string
  staffId: string
  synced: boolean
  data: any
}

export interface DeviceConfig {
  deviceId: string
  name: string
  role: "entry" | "exit" | "admin"
  key: string
  lastSync?: string
  isOnline: boolean
}

export interface AuditLog {
  id?: number
  ticketId: string
  action: string
  actor: string
  timestamp: string
  deviceInfo: any
  meta: any
}

// Database class
export class ParkingDB extends Dexie {
  tickets!: Table<Ticket>
  syncEvents!: Table<SyncEvent>
  deviceConfig!: Table<DeviceConfig>
  auditLogs!: Table<AuditLog>

  constructor() {
    super("ParkingPassDB")

    this.version(1).stores({
      tickets: "ticketId, vehicleNo, phone, entryTime, status, createdByDevice, syncedAt",
      syncEvents: "++id, ticketId, type, timestamp, deviceId, synced",
      deviceConfig: "deviceId, role, name, lastSync",
      auditLogs: "++id, ticketId, action, actor, timestamp",
    })
  }
}

export const db = new ParkingDB()

// Database helper functions
export const dbHelpers = {
  // Get pending sync events
  async getPendingSyncEvents(): Promise<SyncEvent[]> {
    return await db.syncEvents.where("synced").equals(false).toArray()
  },

  // Mark sync events as completed
  async markSyncEventsCompleted(eventIds: number[]): Promise<void> {
    await db.syncEvents.where("id").anyOf(eventIds).modify({ synced: true })
  },

  // Get active tickets (not exited)
  async getActiveTickets(): Promise<Ticket[]> {
    return await db.tickets.where("status").anyOf(["pending", "synced"]).toArray()
  },

  // Check if ticket exists and is valid
  async validateTicket(ticketId: string): Promise<{ valid: boolean; ticket?: Ticket; reason?: string }> {
    const ticket = await db.tickets.get(ticketId)

    if (!ticket) {
      return { valid: false, reason: "Ticket not found" }
    }

    if (ticket.status === "exited") {
      return { valid: false, reason: "Ticket already used", ticket }
    }

    if (ticket.status === "cancelled") {
      return { valid: false, reason: "Ticket cancelled", ticket }
    }

    return { valid: true, ticket }
  },

  // Add audit log
  async addAuditLog(log: Omit<AuditLog, "id">): Promise<void> {
    await db.auditLogs.add(log)
  },
}
