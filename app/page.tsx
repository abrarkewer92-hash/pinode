"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import LoadingScreen from "@/components/loading-screen"
import { getUserById } from "@/lib/supabase-client"
import { getUserByTelegramId, linkTelegramAccount } from "@/lib/telegram-bot-helper"
import { useTelegramWebApp } from "@/lib/telegram-webapp"

// Lazy load heavy components for faster initial render
const MiningDashboard = dynamic(() => import("@/components/mining-dashboard"), {
  loading: () => <LoadingScreen size="large" showLogo={true} />,
  ssr: false,
})

const LoginForm = dynamic(() => import("@/components/auth/login-form"), {
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

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Preload critical images immediately
  useEffect(() => {
    const preloadImages = () => {
      const images = [
        "/pi/pinetwork.png",
        "/pi/pinode.png",
        "/pi/pinodelabs.png"
      ]
      images.forEach(src => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = src
        document.head.appendChild(link)
      })
    }
    preloadImages()
  }, [])

  // Check Telegram Web App
  const { isInTelegram, userId: telegramUserId, startParam } = useTelegramWebApp()

  // Check if user is already logged in on mount - optimized with early return
  useEffect(() => {
    const loadUser = async () => {
      // If opened from Telegram Web App, try to auto-link
      if (isInTelegram && telegramUserId) {
        try {
          const telegramUser = await getUserByTelegramId(telegramUserId)
          if (telegramUser) {
            // User found, auto-login
            setUser({
              id: telegramUser.id,
              email: telegramUser.email,
              username: (telegramUser as any).username || null,
              usdt_balance: Number(telegramUser.usdt_balance),
              bxt_balance: Number(telegramUser.bxt_balance),
              referral_code: telegramUser.referral_code,
              created_at: telegramUser.created_at,
              is_admin: (telegramUser as any).is_admin || false,
            })
            setIsAuthenticated(true)
            localStorage.setItem("bxt_user_id", telegramUser.id)
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.warn("Telegram user not found, continuing with normal flow:", error)
        }
      }

      const storedUserId = localStorage.getItem("bxt_user_id")
      if (!storedUserId) {
        setIsLoading(false)
        return
      }

      try {
        const userData = await getUserById(storedUserId)
        if (userData) {
          // If in Telegram and not linked, try to link
          if (isInTelegram && telegramUserId && !(userData as any).telegram_id) {
            try {
              await linkTelegramAccount(userData.id, telegramUserId)
            } catch (linkError) {
              console.warn("Failed to link Telegram account:", linkError)
            }
          }

          setUser({
            id: userData.id,
            email: userData.email,
            username: (userData as any).username || null,
            usdt_balance: Number(userData.usdt_balance),
            bxt_balance: Number(userData.bxt_balance),
            referral_code: userData.referral_code,
            created_at: userData.created_at,
            is_admin: (userData as any).is_admin || false,
          })
          setIsAuthenticated(true)
        } else {
          // User not found in database (migrated from old Supabase)
          localStorage.removeItem("bxt_user_id")
        }
      } catch (error) {
        // Only log actual errors, not "not found" cases
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'PGRST116') {
          console.error("Failed to load user:", error)
        }
        localStorage.removeItem("bxt_user_id")
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [isInTelegram, telegramUserId])

  const handleLogin = (userData: User) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem("bxt_user_id", userData.id)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem("bxt_user_id")
  }

  const updateUserBalance = async (newBalance: number) => {
    if (user) {
      try {
        const updatedUser = await getUserById(user.id)
        if (updatedUser) {
          const updated = {
            ...user,
            usdt_balance: Number(updatedUser.usdt_balance),
            bxt_balance: Number(updatedUser.bxt_balance),
          }
          setUser(updated)
        }
      } catch (error) {
        console.error("Failed to update balance:", error)
      }
    }
  }

  if (isLoading) {
    return <LoadingScreen size="large" showLogo={true} />
  }

  if (!isAuthenticated || !user) {
    return <LoginForm onLogin={handleLogin} />
  }

  // Regular users see mining dashboard (full-screen, tanpa Navbar lama)
  // Admins should go to /admin route
  return (
    <div className="min-h-screen bg-background">
      <MiningDashboard
        user={user}
        onUpdateBalance={updateUserBalance}
        onLogout={handleLogout}
      />
    </div>
  )
}
