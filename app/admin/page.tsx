"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { SyncStatusDisplay } from "@/components/sync-status"
import { AdminService, type DashboardStats, type HourlyStats } from "@/lib/admin-service"
import { TicketService } from "@/lib/ticket-service"
import type { Ticket } from "@/lib/db"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { BarChart3, Users, Car, DollarSign, Download, Search, RefreshCw, CheckCircle, Clock } from "lucide-react"

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [dashboardStats, hourlyData, recentTickets, currentlyParked] = await Promise.all([
        AdminService.getDashboardStats(),
        AdminService.getHourlyStats(),
        AdminService.searchTickets({ query: "", startDate: "", endDate: "" }),
        AdminService.getActiveTickets(),
      ])

      setStats(dashboardStats)
      setHourlyStats(hourlyData)
      setTickets(recentTickets.slice(0, 50)) // Show recent 50 tickets
      setActiveTickets(currentlyParked)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      const results = await AdminService.searchTickets({
        query: searchQuery,
        status: statusFilter === "all" ? undefined : statusFilter,
        paymentMethod: paymentFilter === "all" ? undefined : paymentFilter,
      })
      setTickets(results)
    } catch (error) {
      console.error("Search failed:", error)
    }
  }

  const handleExportCSV = async () => {
    try {
      const today = new Date()
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()

      const csvData = await AdminService.exportToCSV(startDate, endDate)
      const blob = new Blob([csvData], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `parking-report-${today.toISOString().split("T")[0]}.csv`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  const handleTicketOverride = async (ticketId: string, action: "cancel" | "force_exit") => {
    const reason = prompt(`Enter reason for ${action.replace("_", " ")}:`)
    if (!reason) return

    try {
      const success = await AdminService.overrideTicket(ticketId, action, reason)
      if (success) {
        await loadDashboardData() // Refresh data
      }
    } catch (error) {
      console.error("Override failed:", error)
    }
  }

  if (loading) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen bg-background">
          <Header title="Admin Dashboard" subtitle="Loading..." />
          <div className="p-4 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </AuthGuard>
    )
  }

  const pieData = stats
    ? [
        { name: "Active", value: stats.today.activeTickets, color: "#22c55e" },
        { name: "Exited", value: stats.today.totalExits, color: "#3b82f6" },
      ]
    : []

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-background">
        <Header title="Admin Dashboard" subtitle="System overview and management" />

        <div className="p-4 max-w-7xl mx-auto space-y-6">
          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Entries</CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.today.totalEntries}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.today.totalExits} exits, {stats.today.activeTickets} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.today.revenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Week: ₹{stats.thisWeek.revenue.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Currently Parked</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.today.activeTickets}</div>
                  <p className="text-xs text-muted-foreground">Vehicles in parking area</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.thisMonth.totalEntries}</div>
                  <p className="text-xs text-muted-foreground">₹{stats.thisMonth.revenue.toFixed(2)} revenue</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="active">Currently Parked</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly Traffic Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Traffic</CardTitle>
                    <CardDescription>Hourly entries and exits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={hourlyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="entries" fill="#22c55e" name="Entries" />
                        <Bar dataKey="exits" fill="#3b82f6" name="Exits" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Status</CardTitle>
                    <CardDescription>Current parking status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-4">
                      {pieData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-sm">
                            {entry.name}: {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-4">
              {/* Search and Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Search Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by ticket ID, vehicle number, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="synced">Synced</SelectItem>
                        <SelectItem value="exited">Exited</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payment</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleSearch}>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tickets List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Tickets</CardTitle>
                    <Button onClick={handleExportCSV} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.ticketId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-medium">{ticket.ticketId}</span>
                            <Badge variant="outline">{ticket.vehicleNo}</Badge>
                            <Badge
                              variant={
                                ticket.status === "exited"
                                  ? "default"
                                  : ticket.status === "cancelled"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {ticket.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            {ticket.status !== "exited" && ticket.status !== "cancelled" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleTicketOverride(ticket.ticketId, "force_exit")}
                                >
                                  Force Exit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleTicketOverride(ticket.ticketId, "cancel")}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Entry:</span> {new Date(ticket.entryTime).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Exit:</span>{" "}
                            {ticket.exitTime ? new Date(ticket.exitTime).toLocaleString() : "Still parked"}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span>{" "}
                            {TicketService.calculateParkingDuration(ticket.entryTime, ticket.exitTime)}
                          </div>
                          <div>
                            <span className="font-medium">Amount:</span> ₹{ticket.payment.amount} (
                            {ticket.payment.method})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Currently Parked Vehicles</CardTitle>
                  <CardDescription>{activeTickets.length} vehicles currently in parking area</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeTickets.map((ticket) => (
                      <div key={ticket.ticketId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-medium">{ticket.ticketId}</span>
                            <Badge variant="outline">{ticket.vehicleNo}</Badge>
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              {TicketService.calculateParkingDuration(ticket.entryTime)}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTicketOverride(ticket.ticketId, "force_exit")}
                          >
                            Force Exit
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Entry:</span> {new Date(ticket.entryTime).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span> {ticket.phone}
                          </div>
                          <div>
                            <span className="font-medium">Amount:</span> ₹{ticket.payment.amount}
                          </div>
                        </div>
                      </div>
                    ))}
                    {activeTickets.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No vehicles currently parked</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Reconciliation</CardTitle>
                  <CardDescription>Generate and download daily reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Input type="date" className="w-48" />
                      <Button>Generate Report</Button>
                      <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Today's Data
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Reports include entry/exit reconciliation, revenue breakdown, and discrepancy analysis.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SyncStatusDisplay showDetails />

                <Card>
                  <CardHeader>
                    <CardTitle>System Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Database Status:</span>
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Healthy
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sync Status:</span>
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Storage Usage:</span>
                      <span className="text-sm text-muted-foreground">2.3 MB / 50 MB</span>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" onClick={loadDashboardData}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
