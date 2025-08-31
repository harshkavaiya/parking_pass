import { db, dbHelpers, type Ticket, type SyncEvent } from "./db"
import { generateTicketId, createTicketPayload, parseQRPayload, verifySignature, type TicketPayload } from "./crypto"
import { AuthService } from "./auth"

export interface CreateTicketRequest {
  vehicleNo: string
  phone: string
  payment: {
    method: "cash" | "upi"
    amount: number
    txnId?: string
  }
  notes?: string
}

export interface TicketValidationResult {
  valid: boolean
  ticket?: Ticket
  payload?: TicketPayload
  reason?: string
}

export class TicketService {
  // Create new parking ticket
  static async createTicket(
    request: CreateTicketRequest,
  ): Promise<{ success: boolean; ticket?: Ticket; qrData?: string; error?: string }> {
    try {
      const session = AuthService.getCurrentSession()
      const deviceConfig = await AuthService.getDeviceConfig()

      if (!session || !deviceConfig) {
        return { success: false, error: "Authentication required" }
      }

      // Generate ticket ID and payload
      const ticketId = generateTicketId()
      const payload = createTicketPayload(ticketId, request.vehicleNo, deviceConfig.deviceId, deviceConfig.key)

      // Create ticket record
      const ticket: Ticket = {
        ticketId,
        vehicleNo: request.vehicleNo.toUpperCase(),
        phone: request.phone,
        entryTime: new Date().toISOString(),
        createdByDevice: deviceConfig.deviceId,
        createdByStaffId: session.staffId,
        status: navigator.onLine ? "synced" : "pending",
        signature: payload.sig!,
        payment: request.payment,
        notes: request.notes,
        syncedAt: navigator.onLine ? new Date().toISOString() : undefined,
      }

      // Save to local database
      await db.tickets.add(ticket)

      // Create sync event for offline processing
      const syncEvent: SyncEvent = {
        ticketId,
        type: "create",
        timestamp: new Date().toISOString(),
        deviceId: deviceConfig.deviceId,
        staffId: session.staffId,
        synced: navigator.onLine,
        data: ticket,
      }

      await db.syncEvents.add(syncEvent)

      // Add audit log
      await dbHelpers.addAuditLog({
        ticketId,
        action: "create",
        actor: session.staffId,
        timestamp: new Date().toISOString(),
        deviceInfo: { deviceId: deviceConfig.deviceId, deviceName: deviceConfig.name },
        meta: { vehicleNo: request.vehicleNo, payment: request.payment },
      })

      // Encode payload for QR
      const qrData = btoa(JSON.stringify(payload))

      return { success: true, ticket, qrData }
    } catch (error) {
      console.error("Failed to create ticket:", error)
      return { success: false, error: "Failed to create ticket" }
    }
  }

  // Validate ticket from QR code
  static async validateTicket(qrData: string): Promise<TicketValidationResult> {
    try {
      // Parse QR payload
      const payload = parseQRPayload(qrData)
      if (!payload) {
        return { valid: false, reason: "Invalid QR code format" }
      }

      // Get device config for signature verification
      const deviceConfig = await AuthService.getDeviceConfig()
      if (!deviceConfig) {
        return { valid: false, reason: "Device not configured" }
      }

      // Verify signature
      if (!verifySignature(payload, deviceConfig.key)) {
        return { valid: false, reason: "Invalid ticket signature" }
      }

      // Check expiry
      if (new Date() > new Date(payload.expiry)) {
        return { valid: false, reason: "Ticket expired" }
      }

      // Check local database for ticket status
      const dbValidation = await dbHelpers.validateTicket(payload.ticketId)
      if (!dbValidation.valid) {
        return { valid: false, reason: dbValidation.reason, ticket: dbValidation.ticket }
      }

      return { valid: true, ticket: dbValidation.ticket, payload }
    } catch (error) {
      console.error("Ticket validation error:", error)
      return { valid: false, reason: "Validation failed" }
    }
  }

  // Process ticket exit
  static async processExit(ticketId: string): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
    try {
      const session = AuthService.getCurrentSession()
      const deviceConfig = await AuthService.getDeviceConfig()

      if (!session || !deviceConfig) {
        return { success: false, error: "Authentication required" }
      }

      // Get ticket from database
      const ticket = await db.tickets.get(ticketId)
      if (!ticket) {
        return { success: false, error: "Ticket not found" }
      }

      if (ticket.status === "exited") {
        return { success: false, error: "Ticket already used" }
      }

      // Update ticket status
      const exitTime = new Date().toISOString()
      await db.tickets.update(ticketId, {
        exitTime,
        status: "exited",
      })

      // Create sync event
      const syncEvent: SyncEvent = {
        ticketId,
        type: "exit",
        timestamp: exitTime,
        deviceId: deviceConfig.deviceId,
        staffId: session.staffId,
        synced: navigator.onLine,
        data: { exitTime, processedBy: session.staffId },
      }

      await db.syncEvents.add(syncEvent)

      // Add audit log
      await dbHelpers.addAuditLog({
        ticketId,
        action: "exit",
        actor: session.staffId,
        timestamp: exitTime,
        deviceInfo: { deviceId: deviceConfig.deviceId, deviceName: deviceConfig.name },
        meta: { vehicleNo: ticket.vehicleNo },
      })

      // Get updated ticket
      const updatedTicket = await db.tickets.get(ticketId)

      return { success: true, ticket: updatedTicket }
    } catch (error) {
      console.error("Failed to process exit:", error)
      return { success: false, error: "Failed to process exit" }
    }
  }

  // Get active tickets
  static async getActiveTickets(): Promise<Ticket[]> {
    return await dbHelpers.getActiveTickets()
  }

  // Get ticket by ID
  static async getTicketById(ticketId: string): Promise<Ticket | undefined> {
    return await db.tickets.get(ticketId)
  }

  // Search tickets
  static async searchTickets(query: string): Promise<Ticket[]> {
    const upperQuery = query.toUpperCase()
    return await db.tickets
      .where("vehicleNo")
      .startsWithIgnoreCase(upperQuery)
      .or("ticketId")
      .startsWithIgnoreCase(upperQuery)
      .or("phone")
      .startsWith(query)
      .toArray()
  }

  // Get tickets by date range
  static async getTicketsByDateRange(startDate: string, endDate: string): Promise<Ticket[]> {
    return await db.tickets.where("entryTime").between(startDate, endDate, true, true).toArray()
  }

  // Calculate parking duration
  static calculateParkingDuration(entryTime: string, exitTime?: string): string {
    const entry = new Date(entryTime)
    const exit = exitTime ? new Date(exitTime) : new Date()
    const diffMs = exit.getTime() - entry.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    return `${diffMinutes}m`
  }

  // Format currency
  static formatCurrency(amount: number): string {
    return `₹${amount.toFixed(2)}`
  }
}
