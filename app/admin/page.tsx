"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import LoadingScreen from "@/components/loading-screen"
import { getUserById } from "@/lib/supabase-client"

// Lazy load admin dashboard for faster initial render
const AdminDashboard = dynamic(() => import("@/components/admin-dashboard"), {
  loading: () => <LoadingScreen size="medium" showLogo={true} />,
  ssr: false,
})

interface User {
  id: string
  email: string
  username?: string | null
  usdt_balance: number
  bxt_balance: number
  referral_code: string
  created_at: string
  is_admin?: boolean
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAdminAccess = async () => {
      const storedUserId = localStorage.getItem("bxt_user_id")
      
      if (!storedUserId) {
        // Not logged in, redirect to admin login
        router.push("/admin/login")
        return
      }

      try {
        const userData = await getUserById(storedUserId)
        if (userData) {
          const isAdmin = (userData as any).is_admin || false
          
          if (!isAdmin) {
            // Not an admin, redirect to admin login
            router.push("/admin/login")
            return
          }

          // User is admin, allow access
          setUser({
            id: userData.id,
            email: userData.email,
            username: (userData as any).username || null,
            usdt_balance: Number(userData.usdt_balance),
            bxt_balance: Number(userData.bxt_balance),
            referral_code: userData.referral_code,
            created_at: userData.created_at,
            is_admin: true,
          })
          setIsAuthorized(true)
        } else {
          router.push("/admin/login")
        }
      } catch (error) {
        console.error("Failed to verify admin access:", error)
        router.push("/admin/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAccess()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("bxt_user_id")
    router.push("/admin/login")
  }

  if (isLoading) {
    return <LoadingScreen size="medium" showLogo={true} />
  }

  if (!isAuthorized || !user) {
    return null // Will redirect
  }

  return <AdminDashboard onLogout={handleLogout} />
}

