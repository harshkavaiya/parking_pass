import { db, type DeviceConfig } from "./db"
import { AuthService } from "./auth"

export interface DeviceRegistration {
  deviceId: string
  name: string
  role: "entry" | "exit" | "admin"
  key: string
  registeredAt: string
  registeredBy: string
}

export interface DeviceStatus {
  deviceId: string
  name: string
  role: string
  isOnline: boolean
  lastSeen: string
  version: string
  batteryLevel?: number
  location?: string
}

export class DeviceService {
  // Generate new device registration
  static async generateDeviceRegistration(
    name: string,
    role: "entry" | "exit" | "admin",
    registeredBy: string,
  ): Promise<DeviceRegistration> {
    const deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const key = this.generateSecureKey()

    const registration: DeviceRegistration = {
      deviceId,
      name,
      role,
      key,
      registeredAt: new Date().toISOString(),
      registeredBy,
    }

    // Store in database
    await db.deviceConfig.add({
      deviceId,
      name,
      role,
      key,
      lastSync: new Date().toISOString(),
      isOnline: false,
    })

    return registration
  }

  // Generate secure device key
  private static generateSecureKey(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }

  // Register current device with provided key
  static async registerDevice(
    deviceId: string,
    key: string,
    name: string,
    role: "entry" | "exit" | "admin",
  ): Promise<boolean> {
    try {
      // Verify key format
      if (!key || key.length !== 64) {
        throw new Error("Invalid device key format")
      }

      // Store device configuration
      await db.deviceConfig.put({
        deviceId,
        name,
        role,
        key,
        lastSync: new Date().toISOString(),
        isOnline: true,
      })

      // Update auth service with device info
      await AuthService.setDeviceConfig({
        deviceId,
        name,
        role,
        key,
        lastSync: new Date().toISOString(),
        isOnline: true,
      })

      return true
    } catch (error) {
      console.error("Device registration failed:", error)
      return false
    }
  }

  // Get all registered devices
  static async getAllDevices(): Promise<DeviceConfig[]> {
    return await db.deviceConfig.toArray()
  }

  // Get device status
  static async getDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
    const device = await db.deviceConfig.get(deviceId)
    if (!device) return null

    return {
      deviceId: device.deviceId,
      name: device.name,
      role: device.role,
      isOnline: device.isOnline,
      lastSeen: device.lastSync || "Never",
      version: "1.0.0", // In real app, this would be dynamic
      batteryLevel: Math.floor(Math.random() * 100), // Mock data
      location: device.role === "entry" ? "Main Gate" : device.role === "exit" ? "Exit Gate" : "Office",
    }
  }

  // Update device status
  static async updateDeviceStatus(deviceId: string, isOnline: boolean): Promise<void> {
    await db.deviceConfig.where("deviceId").equals(deviceId).modify({
      isOnline,
      lastSync: new Date().toISOString(),
    })
  }

  // Revoke device access
  static async revokeDevice(deviceId: string, reason: string): Promise<boolean> {
    try {
      // In a real system, you'd also notify the server to blacklist this device
      await db.deviceConfig.where("deviceId").equals(deviceId).delete()

      // Add audit log
      await db.auditLogs.add({
        ticketId: "SYSTEM",
        action: "device_revoked",
        actor: "admin",
        timestamp: new Date().toISOString(),
        deviceInfo: { deviceId, reason },
        meta: { revokedAt: new Date().toISOString() },
      })

      return true
    } catch (error) {
      console.error("Failed to revoke device:", error)
      return false
    }
  }

  // Rotate device key
  static async rotateDeviceKey(deviceId: string): Promise<string | null> {
    try {
      const newKey = this.generateSecureKey()

      await db.deviceConfig.where("deviceId").equals(deviceId).modify({
        key: newKey,
        lastSync: new Date().toISOString(),
      })

      // Add audit log
      await db.auditLogs.add({
        ticketId: "SYSTEM",
        action: "key_rotated",
        actor: "admin",
        timestamp: new Date().toISOString(),
        deviceInfo: { deviceId },
        meta: { rotatedAt: new Date().toISOString() },
      })

      return newKey
    } catch (error) {
      console.error("Failed to rotate device key:", error)
      return null
    }
  }

  // Get device statistics
  static async getDeviceStatistics(): Promise<{
    totalDevices: number
    onlineDevices: number
    offlineDevices: number
    devicesByRole: Record<string, number>
  }> {
    const devices = await this.getAllDevices()

    const stats = {
      totalDevices: devices.length,
      onlineDevices: devices.filter((d) => d.isOnline).length,
      offlineDevices: devices.filter((d) => !d.isOnline).length,
      devicesByRole: devices.reduce(
        (acc, device) => {
          acc[device.role] = (acc[device.role] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    }

    return stats
  }

  // Generate QR code for device setup
  static generateSetupQR(registration: DeviceRegistration): string {
    const setupData = {
      deviceId: registration.deviceId,
      key: registration.key,
      name: registration.name,
      role: registration.role,
      setupUrl: window.location.origin + "/setup",
    }

    return btoa(JSON.stringify(setupData))
  }

  // Parse setup QR code
  static parseSetupQR(qrData: string): DeviceRegistration | null {
    try {
      const data = JSON.parse(atob(qrData))
      return {
        deviceId: data.deviceId,
        name: data.name,
        role: data.role,
        key: data.key,
        registeredAt: new Date().toISOString(),
        registeredBy: "system",
      }
    } catch (error) {
      console.error("Failed to parse setup QR:", error)
      return null
    }
  }
}
