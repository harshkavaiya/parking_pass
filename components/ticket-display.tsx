"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QRCodeDisplay } from "./qr-code-display"
import { Printer, Download, Share2 } from "lucide-react"

interface TicketDisplayProps {
  ticket: any
  qrData: string
  onPrint?: () => void
  onNewTicket?: () => void
}

export function TicketDisplay({ ticket, qrData, onPrint, onNewTicket }: TicketDisplayProps) {
  const handleDownloadQR = () => {
    // Create a temporary canvas to generate QR code image
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // This would use the QRCode library to generate the image
    // For now, we'll create a simple download
    const link = document.createElement("a")
    link.download = `parking-ticket-${ticket.ticketId}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Parking Ticket",
          text: `Parking ticket for ${ticket.vehicleNo} - ${ticket.ticketId}`,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Share failed:", err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(qrData)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-green-600 dark:text-green-400">Ticket Created Successfully!</CardTitle>
        <p className="text-sm text-muted-foreground">Present this QR code at the exit gate</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Ticket Details */}
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Ticket ID:</span>
            <span className="font-mono text-sm bg-background px-2 py-1 rounded">{ticket.ticketId}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Vehicle:</span>
            <span className="font-mono font-bold">{ticket.vehicleNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Entry Time:</span>
            <span>{new Date(ticket.entryTime).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Amount:</span>
            <span className="font-semibold">₹{ticket.payment.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Payment:</span>
            <Badge variant="outline">{ticket.payment.method.toUpperCase()}</Badge>
          </div>
          {ticket.payment.txnId && (
            <div className="flex justify-between">
              <span className="font-medium">Transaction ID:</span>
              <span className="font-mono text-xs">{ticket.payment.txnId}</span>
            </div>
          )}
        </div>

        {/* QR Code Display */}
        <div className="text-center space-y-4">
          <h3 className="font-medium">QR Code for Exit</h3>
          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
            <QRCodeDisplay data={qrData} size={200} />
          </div>
          <p className="text-sm text-muted-foreground">Scan this QR code at the exit gate or use the printed ticket</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={onPrint} variant="outline" className="bg-transparent">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownloadQR} variant="outline" className="bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleShare} variant="outline" className="bg-transparent">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={onNewTicket} className="bg-primary">
            New Ticket
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
