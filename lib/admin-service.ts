import { db, dbHelpers, type Ticket, type AuditLog } from "./db"
import { TicketService } from "./ticket-service"

export interface DashboardStats {
  today: {
    totalEntries: number
    totalExits: number
    activeTickets: number
    revenue: number
  }
  thisWeek: {
    totalEntries: number
    totalExits: number
    revenue: number
  }
  thisMonth: {
    totalEntries: number
    totalExits: number
    revenue: number
  }
}

export interface RevenueByPaymentMethod {
  cash: number
  upi: number
}

export interface HourlyStats {
  hour: number
  entries: number
  exits: number
}

export interface ReconciliationReport {
  date: string
  totalEntries: number
  totalExits: number
  unmatchedEntries: Ticket[]
  unmatchedExits: Ticket[]
  revenue: RevenueByPaymentMethod
  discrepancies: string[]
}

export class AdminService {
  // Get dashboard statistics
  static async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const allTickets = await db.tickets.toArray()

    // Today's stats
    const todayTickets = allTickets.filter((t) => new Date(t.entryTime) >= todayStart)
    const todayEntries = todayTickets.length
    const todayExits = todayTickets.filter((t) => t.exitTime).length
    const activeTickets = todayTickets.filter((t) => !t.exitTime && t.status !== "cancelled").length
    const todayRevenue = todayTickets.reduce((sum, t) => sum + (t.payment.amount || 0), 0)

    // Week's stats
    const weekTickets = allTickets.filter((t) => new Date(t.entryTime) >= weekStart)
    const weekEntries = weekTickets.length
    const weekExits = weekTickets.filter((t) => t.exitTime).length
    const weekRevenue = weekTickets.reduce((sum, t) => sum + (t.payment.amount || 0), 0)

    // Month's stats
    const monthTickets = allTickets.filter((t) => new Date(t.entryTime) >= monthStart)
    const monthEntries = monthTickets.length
    const monthExits = monthTickets.filter((t) => t.exitTime).length
    const monthRevenue = monthTickets.reduce((sum, t) => sum + (t.payment.amount || 0), 0)

    return {
      today: {
        totalEntries: todayEntries,
        totalExits: todayExits,
        activeTickets,
        revenue: todayRevenue,
      },
      thisWeek: {
        totalEntries: weekEntries,
        totalExits: weekExits,
        revenue: weekRevenue,
      },
      thisMonth: {
        totalEntries: monthEntries,
        totalExits: monthExits,
        revenue: monthRevenue,
      },
    }
  }

  // Get hourly statistics for today
  static async getHourlyStats(): Promise<HourlyStats[]> {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const allTickets = await db.tickets.toArray()
    const todayTickets = allTickets.filter((t) => {
      const entryTime = new Date(t.entryTime)
      return entryTime >= todayStart && entryTime <= now
    })

    const hourlyData: HourlyStats[] = []

    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(todayStart.getTime() + hour * 60 * 60 * 1000)
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)

      const entries = todayTickets.filter((t) => {
        const entryTime = new Date(t.entryTime)
        return entryTime >= hourStart && entryTime < hourEnd
      }).length

      const exits = todayTickets.filter((t) => {
        if (!t.exitTime) return false
        const exitTime = new Date(t.exitTime)
        return exitTime >= hourStart && exitTime < hourEnd
      }).length

      hourlyData.push({ hour, entries, exits })
    }

    return hourlyData
  }

  // Get revenue breakdown by payment method
  static async getRevenueByPaymentMethod(startDate: string, endDate: string): Promise<RevenueByPaymentMethod> {
    const allTickets = await db.tickets.toArray()
    const tickets = allTickets.filter((t) => {
      const entryTime = new Date(t.entryTime)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return entryTime >= start && entryTime <= end
    })

    const revenue = tickets.reduce(
      (acc, ticket) => {
        const amount = ticket.payment.amount || 0
        if (ticket.payment.method === "cash") {
          acc.cash += amount
        } else if (ticket.payment.method === "upi") {
          acc.upi += amount
        }
        return acc
      },
      { cash: 0, upi: 0 },
    )

    return revenue
  }

  // Generate daily reconciliation report
  static async generateReconciliationReport(date: string): Promise<ReconciliationReport> {
    const startDate = new Date(date)
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000)

    const allTickets = await db.tickets.toArray()
    const dayTickets = allTickets.filter((t) => {
      const entryTime = new Date(t.entryTime)
      return entryTime >= startDate && entryTime < endDate
    })

    const totalEntries = dayTickets.length
    const totalExits = dayTickets.filter((t) => t.exitTime).length

    const unmatchedEntries = dayTickets.filter((t) => !t.exitTime && t.status !== "cancelled")
    const unmatchedExits: Ticket[] = [] // In a real system, you'd check for exits without matching entries

    const revenue = await this.getRevenueByPaymentMethod(startDate.toISOString(), endDate.toISOString())

    const discrepancies: string[] = []
    if (unmatchedEntries.length > 0) {
      discrepancies.push(`${unmatchedEntries.length} vehicles still parked`)
    }
    if (totalEntries !== totalExits + unmatchedEntries.length) {
      discrepancies.push("Entry/exit count mismatch detected")
    }

    return {
      date,
      totalEntries,
      totalExits,
      unmatchedEntries,
      unmatchedExits,
      revenue,
      discrepancies,
    }
  }

  // Search tickets with filters
  static async searchTickets(filters: {
    query?: string
    status?: string
    paymentMethod?: string
    startDate?: string
    endDate?: string
  }): Promise<Ticket[]> {
    let tickets = await db.tickets.toArray()

    // Apply filters
    if (filters.query) {
      const query = filters.query.toLowerCase()
      tickets = tickets.filter(
        (t) =>
          t.ticketId.toLowerCase().includes(query) ||
          t.vehicleNo.toLowerCase().includes(query) ||
          t.phone.includes(query),
      )
    }

    if (filters.status) {
      tickets = tickets.filter((t) => t.status === filters.status)
    }

    if (filters.paymentMethod) {
      tickets = tickets.filter((t) => t.payment.method === filters.paymentMethod)
    }

    if (filters.startDate) {
      tickets = tickets.filter((t) => new Date(t.entryTime) >= new Date(filters.startDate!))
    }

    if (filters.endDate) {
      tickets = tickets.filter((t) => new Date(t.entryTime) <= new Date(filters.endDate!))
    }

    // Sort by entry time (newest first)
    return tickets.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
  }

  // Get audit logs
  static async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    return await db.auditLogs.orderBy("timestamp").reverse().limit(limit).toArray()
  }

  // Manual ticket override
  static async overrideTicket(ticketId: string, action: "cancel" | "force_exit", reason: string): Promise<boolean> {
    try {
      const ticket = await db.tickets.get(ticketId)
      if (!ticket) return false

      if (action === "cancel") {
        await db.tickets.update(ticketId, {
          status: "cancelled",
          notes: (ticket.notes || "") + `\nCANCELLED: ${reason}`,
        })
      } else if (action === "force_exit") {
        await db.tickets.update(ticketId, {
          exitTime: new Date().toISOString(),
          status: "exited",
          notes: (ticket.notes || "") + `\nFORCE EXIT: ${reason}`,
        })
      }

      // Add audit log
      await dbHelpers.addAuditLog({
        ticketId,
        action: `manual_${action}`,
        actor: "admin",
        timestamp: new Date().toISOString(),
        deviceInfo: { source: "admin_dashboard" },
        meta: { reason, originalStatus: ticket.status },
      })

      return true
    } catch (error) {
      console.error("Failed to override ticket:", error)
      return false
    }
  }

  // Export data to CSV
  static async exportToCSV(startDate: string, endDate: string): Promise<string> {
    const allTickets = await db.tickets.toArray()
    const tickets = allTickets.filter((t) => {
      const entryTime = new Date(t.entryTime)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return entryTime >= start && entryTime <= end
    })

    const headers = [
      "Ticket ID",
      "Vehicle Number",
      "Phone",
      "Entry Time",
      "Exit Time",
      "Duration",
      "Status",
      "Payment Method",
      "Amount",
      "Transaction ID",
      "Created By Device",
      "Notes",
    ]

    const rows = tickets.map((ticket) => [
      ticket.ticketId,
      ticket.vehicleNo,
      ticket.phone,
      new Date(ticket.entryTime).toLocaleString(),
      ticket.exitTime ? new Date(ticket.exitTime).toLocaleString() : "",
      ticket.exitTime ? TicketService.calculateParkingDuration(ticket.entryTime, ticket.exitTime) : "",
      ticket.status,
      ticket.payment.method,
      (ticket.payment.amount || 0).toString(),
      ticket.payment.txnId || "",
      ticket.createdByDevice,
      ticket.notes || "",
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    return csvContent
  }

  // Get active tickets (currently parked)
  static async getActiveTickets(): Promise<Ticket[]> {
    return await db.tickets
      .where("status")
      .anyOf(["pending", "synced"])
      .and((ticket) => !ticket.exitTime)
      .toArray()
  }
}
