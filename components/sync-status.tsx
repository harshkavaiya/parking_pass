"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { SyncService, type SyncStatus } from "@/lib/sync-service"
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertTriangle, Clock, Database, TrendingUp } from "lucide-react"

interface SyncStatusDisplayProps {
  compact?: boolean
  showDetails?: boolean
}

export function SyncStatusDisplay({ compact = false, showDetails = false }: SyncStatusDisplayProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncStats, setSyncStats] = useState<any>(null)

  useEffect(() => {
    loadSyncStatus()
    loadSyncStats()

    // Subscribe to sync status changes
    const unsubscribe = SyncService.onSyncStatusChange((status) => {
      setSyncStatus(status)
      setSyncing(status.syncInProgress)
    })

    // Refresh status periodically
    const interval = setInterval(loadSyncStatus, 30000) // Every 30 seconds

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const loadSyncStatus = async () => {
    try {
      const status = await SyncService.getSyncStatus()
      setSyncStatus(status)
      setSyncing(status.syncInProgress)
    } catch (error) {
      console.error("Failed to load sync status:", error)
    }
  }

  const loadSyncStats = async () => {
    try {
      const stats = await SyncService.getSyncStatistics()
      setSyncStats(stats)
    } catch (error) {
      console.error("Failed to load sync stats:", error)
    }
  }

  const handleForceSync = async () => {
    setSyncing(true)
    try {
      const result = await SyncService.forceSyncNow()
      if (result.success) {
        await loadSyncStatus()
        await loadSyncStats()
      }
    } catch (error) {
      console.error("Force sync failed:", error)
    } finally {
      setSyncing(false)
    }
  }

  const handleClearErrors = () => {
    SyncService.clearSyncErrors()
    loadSyncStatus()
  }

  if (!syncStatus) {
    return (
      <Card className={compact ? "p-2" : ""}>
        <CardContent className={compact ? "p-2" : "p-4"}>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading sync status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={syncStatus.isOnline ? "default" : "secondary"} className="flex items-center gap-1">
          {syncStatus.isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {syncStatus.isOnline ? "Online" : "Offline"}
        </Badge>

        {syncStatus.pendingEvents > 0 && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {syncStatus.pendingEvents} pending
          </Badge>
        )}

        {syncStatus.syncInProgress && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Syncing
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sync Status
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleForceSync} disabled={!syncStatus.isOnline || syncing}>
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection:</span>
          <Badge variant={syncStatus.isOnline ? "default" : "secondary"} className="flex items-center gap-1">
            {syncStatus.isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {syncStatus.isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        {/* Last Sync */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Last Sync:</span>
          <span className="text-sm text-muted-foreground">
            {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : "Never"}
          </span>
        </div>

        {/* Pending Events */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Pending Events:</span>
          <Badge variant={syncStatus.pendingEvents > 0 ? "secondary" : "default"}>{syncStatus.pendingEvents}</Badge>
        </div>

        {/* Sync Progress */}
        {syncStatus.syncInProgress && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Synchronizing...</span>
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {/* Sync Error */}
        {syncStatus.lastSyncError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{syncStatus.lastSyncError}</span>
              <Button variant="ghost" size="sm" onClick={handleClearErrors}>
                Clear
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Sync Statistics */}
        {showDetails && syncStats && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Statistics
            </h4>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>Total Tickets:</span>
                <span className="font-medium">{syncStats.totalTickets}</span>
              </div>
              <div className="flex justify-between">
                <span>Synced:</span>
                <span className="font-medium text-green-600">{syncStats.syncedTickets}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending:</span>
                <span className="font-medium text-yellow-600">{syncStats.pendingTickets}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed:</span>
                <span className="font-medium text-red-600">{syncStats.failedSyncs}</span>
              </div>
            </div>

            {/* Sync Health */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sync Health:</span>
              {syncStats.pendingTickets === 0 && syncStats.failedSyncs === 0 ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Healthy
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Needs Attention
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Offline Notice */}
        {!syncStatus.isOnline && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Device is offline. Data will sync automatically when connection is restored.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
