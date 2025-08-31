"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { TicketDisplay } from "@/components/ticket-display"
import { TicketService, type CreateTicketRequest } from "@/lib/ticket-service"
import { Car, CreditCard } from "lucide-react"

interface TicketResult {
  ticket: any
  qrData: string
}

export default function EntryPage() {
  const [vehicleNo, setVehicleNo] = useState("")
  const [phone, setPhone] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi">("cash")
  const [amount, setAmount] = useState("20")
  const [txnId, setTxnId] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [ticketResult, setTicketResult] = useState<TicketResult | null>(null)

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!vehicleNo.trim()) {
        setError("Vehicle number is required")
        setLoading(false)
        return
      }

      if (!phone.trim()) {
        setError("Phone number is required")
        setLoading(false)
        return
      }

      if (paymentMethod === "upi" && !txnId.trim()) {
        setError("Transaction ID is required for UPI payments")
        setLoading(false)
        return
      }

      const request: CreateTicketRequest = {
        vehicleNo: vehicleNo.trim().toUpperCase(),
        phone: phone.trim(),
        payment: {
          method: paymentMethod,
          amount: Number.parseFloat(amount),
          txnId: paymentMethod === "upi" ? txnId.trim() : undefined,
        },
        notes: notes.trim() || undefined,
      }

      const result = await TicketService.createTicket(request)

      if (!result.success) {
        setError(result.error || "Failed to create ticket")
        setLoading(false)
        return
      }

      setTicketResult({
        ticket: result.ticket!,
        qrData: result.qrData!,
      })

      // Reset form
      setVehicleNo("")
      setPhone("")
      setTxnId("")
      setNotes("")
    } catch (error) {
      console.error("Create ticket error:", error)
      setError("Failed to create ticket. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePrintTicket = () => {
    if (!ticketResult) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = `
      <html>
        <head>
          <title>Parking Ticket - ${ticketResult.ticket.ticketId}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              padding: 20px; 
              margin: 0;
              background: white;
            }
            .ticket { 
              border: 3px solid #000; 
              padding: 20px; 
              max-width: 350px; 
              margin: 0 auto;
              background: white;
            }
            .header { 
              text-align: center; 
              font-weight: bold; 
              font-size: 18px;
              margin-bottom: 15px; 
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .qr-section { 
              text-align: center; 
              margin: 20px 0; 
              padding: 15px;
              border: 2px dashed #666;
            }
            .qr-placeholder {
              width: 150px;
              height: 150px;
              border: 2px solid #000;
              margin: 10px auto;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
            }
            .details { 
              margin: 15px 0; 
              line-height: 1.6;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              padding: 5px 0;
              border-bottom: 1px dotted #ccc;
            }
            .detail-label {
              font-weight: bold;
            }
            .footer { 
              text-align: center; 
              font-size: 12px; 
              margin-top: 20px; 
              border-top: 2px solid #000;
              padding-top: 10px;
            }
            .important {
              background: #f0f0f0;
              padding: 10px;
              margin: 10px 0;
              border-left: 4px solid #000;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .ticket { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              🅿️ PARKING TICKET
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Ticket ID:</span>
                <span>${ticketResult.ticket.ticketId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle No:</span>
                <span><strong>${ticketResult.ticket.vehicleNo}</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Entry Time:</span>
                <span>${new Date(ticketResult.ticket.entryTime).toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span><strong>₹${ticketResult.ticket.payment.amount}</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span>${ticketResult.ticket.payment.method.toUpperCase()}</span>
              </div>
              ${
                ticketResult.ticket.payment.txnId
                  ? `
              <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span>${ticketResult.ticket.payment.txnId}</span>
              </div>
              `
                  : ""
              }
            </div>

            <div class="qr-section">
              <div><strong>QR CODE FOR EXIT</strong></div>
              <div class="qr-placeholder">
                QR CODE<br/>
                (Scan at Exit Gate)
              </div>
              <div style="font-size: 8px; word-break: break-all; margin: 10px 0; padding: 5px; background: #f9f9f9;">
                ${ticketResult.qrData}
              </div>
            </div>

            <div class="important">
              <strong>IMPORTANT:</strong><br/>
              • Keep this ticket safe<br/>
              • Present QR code at exit gate<br/>
              • Valid for 24 hours from entry<br/>
              • Lost tickets subject to penalty
            </div>

            <div class="footer">
              Parking Management System<br/>
              For support: Contact Gate Staff<br/>
              Generated: ${new Date().toLocaleString()}
            </div>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const handleNewTicket = () => {
    setTicketResult(null)
    setError("")
  }

  return (
    <AuthGuard requiredRole="entry">
      <div className="min-h-screen bg-background">
        <Header title="Entry Station" subtitle="Create new parking tickets" />

        <div className="p-4 max-w-2xl mx-auto space-y-6">
          {!ticketResult ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  <CardTitle>New Parking Ticket</CardTitle>
                </div>
                <CardDescription>Enter vehicle details and payment information</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicleNo">Vehicle Number *</Label>
                      <Input
                        id="vehicleNo"
                        type="text"
                        placeholder="e.g., GJ05AB1234"
                        value={vehicleNo}
                        onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g., 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method *</Label>
                      <Select value={paymentMethod} onValueChange={(value: "cash" | "upi") => setPaymentMethod(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₹) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>

                    {paymentMethod === "upi" && (
                      <div className="space-y-2">
                        <Label htmlFor="txnId">Transaction ID *</Label>
                        <Input
                          id="txnId"
                          type="text"
                          placeholder="UPI Transaction ID"
                          value={txnId}
                          onChange={(e) => setTxnId(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
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
                        <CreditCard className="h-4 w-4 mr-2 animate-spin" />
                        Creating Ticket...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Create Ticket
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <TicketDisplay
              ticket={ticketResult.ticket}
              qrData={ticketResult.qrData}
              onPrint={handlePrintTicket}
              onNewTicket={handleNewTicket}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
