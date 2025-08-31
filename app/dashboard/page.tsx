"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SyncStatusDisplay } from "@/components/sync-status"
import { SyncService } from "@/lib/sync-service"
import { Smartphone, LogIn, LogOut, Settings } from "lucide-react"
import { db, type DeviceConfig } from "@/lib/db"

export default function HomePage() {
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null)

  useEffect(() => {
    loadDeviceConfig()

    SyncService.startBackgroundSync()
  }, [])

  const loadDeviceConfig = async () => {
    try {
      const configs = await db.deviceConfig.toArray()
      if (configs.length > 0) {
        setDeviceConfig(configs[0])
      }
    } catch (error) {
      console.error("Failed to load device config:", error)
    }
  }

  const handleRoleSelect = (role: "entry" | "exit" | "admin") => {
    window.location.href = `/${role}`
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Smartphone className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Parking Pass</h1>
          </div>
          <p className="text-muted-foreground">Offline-first ticket management</p>

          <div className="flex items-center justify-center">
            <SyncStatusDisplay compact />
          </div>
        </div>

        {/* Role Selection */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-center">Select Your Role</h2>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleRoleSelect("entry")}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <LogIn className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Entry Staff</CardTitle>
                  <CardDescription>Issue parking tickets</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Create new tickets, accept payments, and generate QR codes for vehicles entering the parking area.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleRoleSelect("exit")}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Exit Staff</CardTitle>
                  <CardDescription>Validate and process exits</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Scan QR codes, validate tickets, and process vehicle exits from the parking area.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleRoleSelect("admin")}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Admin</CardTitle>
                  <CardDescription>Manage system and reports</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                View reports, manage devices, reconcile transactions, and configure system settings.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Device Setup */}
        {!deviceConfig && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-center text-sm">Device Not Configured</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => (window.location.href = "/setup")}
              >
                Setup Device
              </Button>
            </CardContent>
          </Card>
        )}

        {deviceConfig && <SyncStatusDisplay showDetails />}
      </div>
    </div>
  )
}
