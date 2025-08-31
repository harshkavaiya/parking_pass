import { db, type DeviceConfig } from "./db"

export interface Staff {
  id: string
  name: string
  phone: string
  role: "entry" | "exit" | "admin"
  pin: string
  isActive: boolean
  createdAt: string
}

export interface AuthSession {
  staffId: string
  staffName: string
  role: "entry" | "exit" | "admin"
  deviceId: string
  loginTime: string
  expiresAt: string
}

// Simple in-memory staff database (in production, this would come from server)
const DEMO_STAFF: Staff[] = [
  {
    id: "staff001",
    name: "John Entry",
    phone: "9876543210",
    role: "entry",
    pin: "1234",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "staff002",
    name: "Jane Exit",
    phone: "9876543211",
    role: "exit",
    pin: "5678",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "staff003",
    name: "Admin User",
    phone: "9876543212",
    role: "admin",
    pin: "9999",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
]

export class AuthService {
  private static SESSION_KEY = "parking_auth_session"
  private static DEVICE_KEY = "parking_device_config"

  // Authenticate staff with phone and PIN
  static async authenticateStaff(
    phone: string,
    pin: string,
  ): Promise<{ success: boolean; staff?: Staff; error?: string }> {
    try {
      // In production, this would be an API call
      const staff = DEMO_STAFF.find((s) => s.phone === phone && s.pin === pin && s.isActive)

      if (!staff) {
        return { success: false, error: "Invalid phone number or PIN" }
      }

      return { success: true, staff }
    } catch (error) {
      return { success: false, error: "Authentication failed" }
    }
  }

  // Create session after successful authentication
  static async createSession(staff: Staff, deviceId: string): Promise<AuthSession> {
    const session: AuthSession = {
      staffId: staff.id,
      staffName: staff.name,
      role: staff.role,
      deviceId,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
    }

    // Store session in localStorage for offline access
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session))

    // Update device config with last login
    await this.updateDeviceLastLogin(deviceId)

    return session
  }

  // Get current session
  static getCurrentSession(): AuthSession | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY)
      if (!sessionData) return null

      const session: AuthSession = JSON.parse(sessionData)

      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        this.logout()
        return null
      }

      return session
    } catch (error) {
      console.error("Failed to get current session:", error)
      return null
    }
  }

  // Logout and clear session
  static logout(): void {
    localStorage.removeItem(this.SESSION_KEY)
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return this.getCurrentSession() !== null
  }

  // Get device configuration
  static async getDeviceConfig(): Promise<DeviceConfig | null> {
    try {
      const configs = await db.deviceConfig.toArray()
      return configs.length > 0 ? configs[0] : null
    } catch (error) {
      console.error("Failed to get device config:", error)
      return null
    }
  }

  // Register new device
  static async registerDevice(deviceName: string, role: "entry" | "exit" | "admin"): Promise<DeviceConfig> {
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    const deviceKey = this.generateDeviceKey()

    const config: DeviceConfig = {
      deviceId,
      name: deviceName,
      role,
      key: deviceKey,
      lastSync: new Date().toISOString(),
      isOnline: navigator.onLine,
    }

    // Clear existing device configs (one device per app instance)
    await db.deviceConfig.clear()
    await db.deviceConfig.add(config)

    return config
  }

  // Generate device key for signing
  private static generateDeviceKey(): string {
    // In production, this would be provided by the server during device registration
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  }

  // Update device last login time
  private static async updateDeviceLastLogin(deviceId: string): Promise<void> {
    try {
      await db.deviceConfig.where("deviceId").equals(deviceId).modify({
        lastSync: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to update device last login:", error)
    }
  }

  // Check if device is registered
  static async isDeviceRegistered(): Promise<boolean> {
    try {
      const config = await this.getDeviceConfig()
      return config !== null
    } catch (error) {
      return false
    }
  }

  // Get staff by role (for demo purposes)
  static getStaffByRole(role: "entry" | "exit" | "admin"): Staff[] {
    return DEMO_STAFF.filter((staff) => staff.role === role && staff.isActive)
  }
}
