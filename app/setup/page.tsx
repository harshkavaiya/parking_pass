"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QRScanner } from "@/components/qr-scanner"
import { Settings, Smartphone, CheckCircle, QrCode, Keyboard } from "lucide-react"
import { AuthService, type DeviceConfig } from "@/lib/auth"
import { DeviceService } from "@/lib/device-service"

export default function SetupPage() {
  const [deviceName, setDeviceName] = useState("")
  const [deviceRole, setDeviceRole] = useState<"entry" | "exit" | "admin">("entry")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [existingConfig, setExistingConfig] = useState<DeviceConfig | null>(null)
  const [setupMethod, setSetupMethod] = useState<"manual" | "qr">("qr")
  const [deviceKey, setDeviceKey] = useState("")
  const [deviceId, setDeviceId] = useState("")

  useEffect(() => {
    checkExistingConfig()
  }, [])

  const checkExistingConfig = async () => {
    try {
      const config = await AuthService.getDeviceConfig()
      setExistingConfig(config)
      if (config) {
        setDeviceName(config.name)
        setDeviceRole(config.role)
      }
    } catch (error) {
      console.error("Failed to check existing config:", error)
    }
  }

  const handleQRScan = async (qrData: string) => {
    try {
      setError("")
      const registration = DeviceService.parseSetupQR(qrData)

      if (!registration) {
        setError("Invalid setup QR code")
        return
      }

      // Register device with scanned data
      const success = await DeviceService.registerDevice(
        registration.deviceId,
        registration.key,
        registration.name,
        registration.role,
      )

      if (success) {
        setSuccess(true)
        setExistingConfig({
          deviceId: registration.deviceId,
          name: registration.name,
          role: registration.role,
          key: registration.key,
          isOnline: true,
        })

        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = "/login"
        }, 2000)
      } else {
        setError("Failed to register device with scanned data")
      }
    } catch (error) {
      console.error("QR scan error:", error)
      setError("Failed to process QR code")
    }
  }

  const handleManualSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      if (!deviceName.trim()) {
        setError("Device name is required")
        setLoading(false)
        return
      }

      if (!deviceId.trim() || !deviceKey.trim()) {
        setError("Device ID and key are required for manual setup")
        setLoading(false)
        return
      }

      // Register device with manual data
      const success = await DeviceService.registerDevice(
        deviceId.trim(),
        deviceKey.trim(),
        deviceName.trim(),
        deviceRole,
      )

      if (success) {
        setSuccess(true)
        setExistingConfig({
          deviceId: deviceId.trim(),
          name: deviceName.trim(),
          role: deviceRole,
          key: deviceKey.trim(),
          isOnline: true,
        })

        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = "/login"
        }, 2000)
      } else {
        setError("Failed to register device")
      }
    } catch (error) {
      console.error("Manual setup error:", error)
      setError("Failed to setup device. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAutoSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      if (!deviceName.trim()) {
        setError("Device name is required")
        setLoading(false)
        return
      }

      // Register device automatically (for demo purposes)
      const config = await AuthService.registerDevice(deviceName.trim(), deviceRole)

      console.log("Device registered:", config)
      setSuccess(true)
      setExistingConfig(config)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login"
      }, 2000)
    } catch (error) {
      console.error("Auto setup error:", error)
      setError("Failed to setup device. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Setup Complete!</CardTitle>
            <CardDescription>Your device has been successfully configured</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Redirecting to login page...</p>
            <Button onClick={() => (window.location.href = "/login")} className="w-full">
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Settings className="h-6 w-6 text-primary" />
            <CardTitle>Device Setup</CardTitle>
          </div>
          <CardDescription>Configure this device for the parking system</CardDescription>

          {existingConfig && (
            <Badge variant="outline" className="mt-2">
              Current: {existingConfig.name} ({existingConfig.role})
            </Badge>
          )}
        </CardHeader>

        <CardContent>
          <Tabs value={setupMethod} onValueChange={(value) => setSetupMethod(value as "manual" | "qr")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Setup
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Scan the QR code provided by your administrator to automatically configure this device.
                </p>

                <QRScanner onScan={handleQRScan} onError={(error) => setError(error)} />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="text-center">
                <Button variant="outline" onClick={() => setSetupMethod("manual")} className="w-full">
                  Use Manual Setup Instead
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <form onSubmit={handleManualSetup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceName">Device Name</Label>
                  <Input
                    id="deviceName"
                    type="text"
                    placeholder="e.g., Gate-1 Tablet, Entry Office"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceRole">Device Role</Label>
                  <Select
                    value={deviceRole}
                    onValueChange={(value: "entry" | "exit" | "admin") => setDeviceRole(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select device role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Station</SelectItem>
                      <SelectItem value="exit">Exit Gate</SelectItem>
                      <SelectItem value="admin">Admin Terminal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceId">Device ID</Label>
                  <Input
                    id="deviceId"
                    type="text"
                    placeholder="Device ID from administrator"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceKey">Device Key</Label>
                  <Input
                    id="deviceKey"
                    type="password"
                    placeholder="Security key from administrator"
                    value={deviceKey}
                    onChange={(e) => setDeviceKey(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Smartphone className="h-4 w-4 mr-2 animate-spin" />
                      Setting Up...
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Setup Device
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={handleAutoSetup}
                  className="w-full bg-transparent"
                  disabled={loading}
                >
                  Auto Setup (Demo)
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium mb-1">Device Information:</p>
            <p className="text-xs text-muted-foreground">
              This device will be registered with a unique ID and security key for offline ticket validation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
