"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { QRScanner } from "@/components/qr-scanner"
import { TicketService, type TicketValidationResult } from "@/lib/ticket-service"
import { QrCode, Camera, CheckCircle, XCircle, Clock, Car, Keyboard } from "lucide-react"

export default function ExitPage() {
  const [qrInput, setQrInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<TicketValidationResult | null>(null)
  const [processedTicket, setProcessedTicket] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("scan")

  const handleValidateTicket = async (qrData: string) => {
    setLoading(true)
    setValidationResult(null)
    setProcessedTicket(null)

    try {
      const result = await TicketService.validateTicket(qrData)
      setValidationResult(result)

      if (result.valid && result.ticket) {
        // Auto-process exit if ticket is valid
        const exitResult = await TicketService.processExit(result.ticket.ticketId)
        if (exitResult.success) {
          setProcessedTicket(exitResult.ticket)
        }
      }
    } catch (error) {
      console.error("Validation error:", error)
      setValidationResult({ valid: false, reason: "Validation failed" })
    } finally {
      setLoading(false)
    }
  }

  const handleManualInput = (e: React.FormEvent) => {
    e.preventDefault()
    if (qrInput.trim()) {
      handleValidateTicket(qrInput.trim())
    }
  }

  const handleQRScan = (data: string) => {
    console.log("QR Code scanned:", data)
    handleValidateTicket(data)
  }

  const handleScanError = (error: string) => {
    console.error("QR Scan error:", error)
  }

  const handleNewScan = () => {
    setQrInput("")
    setValidationResult(null)
    setProcessedTicket(null)
    setActiveTab("scan")
  }

  const renderTicketDetails = (ticket: any) => (
    <div className="bg-muted p-4 rounded-lg space-y-2">
      <div className="flex justify-between">
        <span className="font-medium">Ticket ID:</span>
        <span className="font-mono">{ticket.ticketId}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium">Vehicle:</span>
        <span className="font-mono font-bold">{ticket.vehicleNo}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium">Entry Time:</span>
        <span>{new Date(ticket.entryTime).toLocaleString()}</span>
      </div>
      {ticket.exitTime && (
        <div className="flex justify-between">
          <span className="font-medium">Exit Time:</span>
          <span>{new Date(ticket.exitTime).toLocaleString()}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="font-medium">Duration:</span>
        <span>{TicketService.calculateParkingDuration(ticket.entryTime, ticket.exitTime)}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium">Amount Paid:</span>
        <span>{TicketService.formatCurrency(ticket.payment.amount)}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium">Status:</span>
        <Badge variant={ticket.status === "exited" ? "default" : "secondary"}>{ticket.status.toUpperCase()}</Badge>
      </div>
    </div>
  )

  return (
    <AuthGuard requiredRole="exit">
      <div className="min-h-screen bg-background">
        <Header title="Exit Gate" subtitle="Scan and validate parking tickets" />

        <div className="p-4 max-w-2xl mx-auto space-y-6">
          {!validationResult ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  <CardTitle>Validate Parking Ticket</CardTitle>
                </div>
                <CardDescription>Scan QR code or enter ticket data manually</CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="scan" className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Camera Scan
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                      <Keyboard className="h-4 w-4" />
                      Manual Entry
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="scan" className="space-y-4">
                    <QRScanner onScan={handleQRScan} onError={handleScanError} />
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-4">
                    <form onSubmit={handleManualInput} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="qrInput">QR Code Data</Label>
                        <Input
                          id="qrInput"
                          type="text"
                          placeholder="Paste QR code data here..."
                          value={qrInput}
                          onChange={(e) => setQrInput(e.target.value)}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                          <>
                            <QrCode className="h-4 w-4 mr-2 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            <QrCode className="h-4 w-4 mr-2" />
                            Validate Ticket
                          </>
                        )}
                      </Button>
                    </form>

                    {/* Demo QR Codes */}
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">Demo QR Codes (for testing):</p>
                      <div className="space-y-2 text-xs">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start font-mono text-xs"
                          onClick={() =>
                            setQrInput(
                              "eyJ2IjoxLCJ0aWNrZXRJZCI6IlRDSzEyMzQ1IiwidmVoaWNsZU5vIjoiR0owNUFCMTIzNCIsImVudHJ5VGltZSI6IjIwMjUtMDEtMjZUMTA6MDA6MDBaIiwiZXhwaXJ5IjoiMjAyNS0wMS0yN1QxMDowMDowMFoiLCJkZXZpY2VJZCI6ImRldmljZV8xIiwic2lnIjoiYWJjZGVmZ2hpamtsbW5vcCJ9",
                            )
                          }
                        >
                          Valid Demo Ticket
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <div
                  className={`mx-auto mb-4 p-3 rounded-full w-fit ${
                    validationResult.valid ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
                  }`}
                >
                  {validationResult.valid ? (
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <CardTitle>{validationResult.valid ? "Ticket Valid - Exit Processed" : "Invalid Ticket"}</CardTitle>
                <CardDescription>
                  {validationResult.valid
                    ? "Vehicle can exit the parking area"
                    : validationResult.reason || "Ticket validation failed"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {validationResult.valid && (processedTicket || validationResult.ticket) && (
                  <>
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                      <Car className="h-5 w-5" />
                      <span className="font-medium">Exit Authorized</span>
                    </div>

                    {renderTicketDetails(processedTicket || validationResult.ticket)}

                    {processedTicket && (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          Total parking duration:{" "}
                          {TicketService.calculateParkingDuration(processedTicket.entryTime, processedTicket.exitTime)}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}

                {!validationResult.valid && validationResult.ticket && (
                  <>
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{validationResult.reason}</AlertDescription>
                    </Alert>

                    {renderTicketDetails(validationResult.ticket)}
                  </>
                )}

                <Button onClick={handleNewScan} className="w-full">
                  Scan Next Ticket
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
