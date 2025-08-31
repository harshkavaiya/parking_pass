"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Smartphone, LogIn, Wifi, WifiOff } from "lucide-react"
import { AuthService } from "@/lib/auth"

export default function LoginPage() {
  const [phone, setPhone] = useState("")
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isOnline, setIsOnline] = useState(true)
  const [deviceRegistered, setDeviceRegistered] = useState(false)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check if device is registered
    checkDeviceRegistration()

    // Check if already authenticated
    if (AuthService.isAuthenticated()) {
      window.location.href = "/"
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const checkDeviceRegistration = async () => {
    const registered = await AuthService.isDeviceRegistered()
    setDeviceRegistered(registered)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Check if device is registered
      if (!deviceRegistered) {
        setError("Device not registered. Please setup device first.")
        setLoading(false)
        return
      }

      // Authenticate staff
      const authResult = await AuthService.authenticateStaff(phone, pin)

      if (!authResult.success) {
        setError(authResult.error || "Authentication failed")
        setLoading(false)
        return
      }

      // Get device config
      const deviceConfig = await AuthService.getDeviceConfig()
      if (!deviceConfig) {
        setError("Device configuration not found")
        setLoading(false)
        return
      }

      // Create session
      await AuthService.createSession(authResult.staff!, deviceConfig.deviceId)

      // Redirect to appropriate page based on role
      const role = authResult.staff!.role
      window.location.href = role === "admin" ? "/admin" : `/${role}`
    } catch (error) {
      console.error("Login error:", error)
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Smartphone className="h-6 w-6 text-primary" />
            <CardTitle>Staff Login</CardTitle>
          </div>
          <CardDescription>Enter your phone number and PIN to continue</CardDescription>

          {/* Status indicators */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center gap-1">
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? "Online" : "Offline"}
            </Badge>
            <Badge variant={deviceRegistered ? "default" : "destructive"}>
              {deviceRegistered ? "Device Ready" : "Setup Required"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {!deviceRegistered ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>Device not registered. Please setup your device first.</AlertDescription>
              </Alert>
              <Button onClick={() => (window.location.href = "/setup")} className="w-full">
                Setup Device
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
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
                    <LogIn className="h-4 w-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Demo credentials */}
          <div className="mt-6 p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium mb-2">Demo Credentials:</p>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>Entry: 9876543210 / 1234</div>
              <div>Exit: 9876543211 / 5678</div>
              <div>Admin: 9876543212 / 9999</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
