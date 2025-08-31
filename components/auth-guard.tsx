"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AuthService, type AuthSession } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "entry" | "exit" | "admin"
  fallback?: React.ReactNode
}

export function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentSession = AuthService.getCurrentSession()
      setSession(currentSession)

      // Redirect to login if not authenticated
      if (!currentSession) {
        window.location.href = "/login"
        return
      }

      // Check role permission
      if (requiredRole && currentSession.role !== requiredRole && currentSession.role !== "admin") {
        window.location.href = "/"
        return
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      window.location.href = "/login"
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return fallback || null
  }

  return <>{children}</>
}
