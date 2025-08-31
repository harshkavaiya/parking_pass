"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QRCodeDisplay } from "@/components/qr-code-display"
import { DeviceService, type DeviceConfig, type DeviceRegistration, type DeviceStatus } from "@/lib/device-service"
import { AuthGuard } from "@/components/auth-guard"
import {
  Smartphone,
  Wifi,
  WifiOff,
  Plus,
  RotateCcw,
  Trash2,
  Battery,
  MapPin,
  Shield,
  AlertTriangle,
} from "lucide-react"

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceConfig[]>([])
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, DeviceStatus>>({})
  const [loading, setLoading] = useState(true)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [newDeviceRegistration, setNewDeviceRegistration] = useState<DeviceRegistration | null>(null)

  useEffect(() => {
    loadDevices()
    loadDeviceStatuses()
  }, [])

  const loadDevices = async () => {
    try {
      const deviceList = await DeviceService.getAllDevices()
      setDevices(deviceList)
    } catch (error) {
      console.error("Failed to load devices:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadDeviceStatuses = async () => {
    try {
      const deviceList = await DeviceService.getAllDevices()
      const statuses: Record<string, DeviceStatus> = {}

      for (const device of deviceList) {
        const status = await DeviceService.getDeviceStatus(device.deviceId)
        if (status) {
          statuses[device.deviceId] = status
        }
      }

      setDeviceStatuses(statuses)
    } catch (error) {
      console.error("Failed to load device statuses:", error)
    }
  }

  const handleAddDevice = async (name: string, role: "entry" | "exit" | "admin") => {
    try {
      const registration = await DeviceService.generateDeviceRegistration(name, role, "admin")
      setNewDeviceRegistration(registration)
      await loadDevices()
    } catch (error) {
      console.error("Failed to add device:", error)
    }
  }

  const handleRevokeDevice = async (deviceId: string) => {
    if (!confirm("Are you sure you want to revoke this device? This action cannot be undone.")) {
      return
    }

    try {
      await DeviceService.revokeDevice(deviceId, "Revoked by admin")
      await loadDevices()
      await loadDeviceStatuses()
    } catch (error) {
      console.error("Failed to revoke device:", error)
    }
  }

  const handleRotateKey = async (deviceId: string) => {
    if (!confirm("Are you sure you want to rotate the key for this device? The device will need to be reconfigured.")) {
      return
    }

    try {
      const newKey = await DeviceService.rotateDeviceKey(deviceId)
      if (newKey) {
        alert("Key rotated successfully. Device will need to be reconfigured with the new key.")
        await loadDevices()
      }
    } catch (error) {
      console.error("Failed to rotate key:", error)
    }
  }

  if (loading) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading devices...</span>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Device Management</h1>
            <p className="text-muted-foreground">Manage parking system devices and access control</p>
          </div>

          <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Device</DialogTitle>
              </DialogHeader>
              <AddDeviceForm onAdd={handleAddDevice} onClose={() => setShowAddDevice(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Device Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Devices</p>
                  <p className="text-2xl font-bold">{devices.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Online</p>
                  <p className="text-2xl font-bold">{devices.filter((d) => d.isOnline).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Offline</p>
                  <p className="text-2xl font-bold">{devices.filter((d) => !d.isOnline).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Admin Devices</p>
                  <p className="text-2xl font-bold">{devices.filter((d) => d.role === "admin").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Device List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => {
            const status = deviceStatuses[device.deviceId]
            return (
              <Card key={device.deviceId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                    <Badge variant={device.isOnline ? "default" : "secondary"}>
                      {device.isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                      {device.isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Device ID:</span>
                      <span className="font-mono text-xs">{device.deviceId.slice(-8)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant="outline">{device.role}</Badge>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Seen:</span>
                      <span>{device.lastSync ? new Date(device.lastSync).toLocaleString() : "Never"}</span>
                    </div>

                    {status && (
                      <>
                        {status.batteryLevel && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Battery:</span>
                            <div className="flex items-center gap-1">
                              <Battery className="h-3 w-3" />
                              <span>{status.batteryLevel}%</span>
                            </div>
                          </div>
                        )}

                        {status.location && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Location:</span>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{status.location}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRotateKey(device.deviceId)}
                      className="flex-1"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Rotate Key
                    </Button>

                    <Button variant="destructive" size="sm" onClick={() => handleRevokeDevice(device.deviceId)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {devices.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Devices Registered</h3>
              <p className="text-muted-foreground mb-4">Add your first device to start managing the parking system.</p>
              <Button onClick={() => setShowAddDevice(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Device Registration QR */}
        {newDeviceRegistration && (
          <Dialog open={!!newDeviceRegistration} onOpenChange={() => setNewDeviceRegistration(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Device Registration</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Scan this QR code with the device to complete registration. Keep this secure!
                  </AlertDescription>
                </Alert>

                <div className="text-center">
                  <QRCodeDisplay value={DeviceService.generateSetupQR(newDeviceRegistration)} size={200} />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Device Name:</span>
                    <span>{newDeviceRegistration.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <Badge variant="outline">{newDeviceRegistration.role}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Device ID:</span>
                    <span className="font-mono text-xs">{newDeviceRegistration.deviceId.slice(-8)}</span>
                  </div>
                </div>

                <Button onClick={() => setNewDeviceRegistration(null)} className="w-full">
                  Done
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AuthGuard>
  )
}

function AddDeviceForm({
  onAdd,
  onClose,
}: {
  onAdd: (name: string, role: "entry" | "exit" | "admin") => void
  onClose: () => void
}) {
  const [name, setName] = useState("")
  const [role, setRole] = useState<"entry" | "exit" | "admin">("entry")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onAdd(name.trim(), role)
      onClose()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="device-name">Device Name</Label>
        <Input
          id="device-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Main Gate Entry"
          required
        />
      </div>

      <div>
        <Label htmlFor="device-role">Device Role</Label>
        <Select value={role} onValueChange={(value: "entry" | "exit" | "admin") => setRole(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="entry">Entry Staff</SelectItem>
            <SelectItem value="exit">Exit Staff</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Add Device
        </Button>
      </div>
    </form>
  )
}
