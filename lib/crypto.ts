import crypto from "crypto"

// Ticket payload interface
export interface TicketPayload {
  v: number
  ticketId: string
  vehicleNo: string
  entryTime: string
  expiry: string
  deviceId: string
  sig?: string
}

// Generate HMAC signature for ticket payload
export function signPayload(payload: Omit<TicketPayload, "sig">, key: string): string {
  const canonical = `${payload.ticketId}|${payload.vehicleNo}|${payload.entryTime}|${payload.expiry}|${payload.deviceId}`
  return crypto.createHmac("sha256", key).update(canonical).digest("hex")
}

// Verify HMAC signature
export function verifySignature(payload: TicketPayload, key: string): boolean {
  if (!payload.sig) return false
  const expectedSig = signPayload(payload, key)
  return expectedSig === payload.sig
}

// Generate unique ticket ID
export function generateTicketId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `TCK${timestamp}${random}`.toUpperCase()
}

// Create signed ticket payload
export function createTicketPayload(
  ticketId: string,
  vehicleNo: string,
  deviceId: string,
  key: string,
  hoursValid = 24,
): TicketPayload {
  const now = new Date()
  const expiry = new Date(now.getTime() + hoursValid * 60 * 60 * 1000)

  const payload: Omit<TicketPayload, "sig"> = {
    v: 1,
    ticketId,
    vehicleNo,
    entryTime: now.toISOString(),
    expiry: expiry.toISOString(),
    deviceId,
  }

  const signature = signPayload(payload, key)

  return {
    ...payload,
    sig: signature,
  }
}

// Parse and validate QR payload
export function parseQRPayload(qrData: string): TicketPayload | null {
  try {
    const decoded = atob(qrData)
    const payload = JSON.parse(decoded) as TicketPayload

    // Basic validation
    if (!payload.v || !payload.ticketId || !payload.sig) {
      return null
    }

    return payload
  } catch (error) {
    console.error("Failed to parse QR payload:", error)
    return null
  }
}

// Encode payload to base64 for QR
export function encodePayloadForQR(payload: TicketPayload): string {
  return btoa(JSON.stringify(payload))
}
