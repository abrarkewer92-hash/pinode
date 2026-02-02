"use client"

import { useEffect, useState } from 'react'
import { useTelegramWebApp, TelegramWebApp } from '@/lib/telegram-webapp'

interface TelegramWebAppProviderProps {
  children: React.ReactNode
}

export default function TelegramWebAppProvider({ children }: TelegramWebAppProviderProps) {
  const { isInTelegram, theme, themeParams } = useTelegramWebApp()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (isInTelegram) {
      const webApp = TelegramWebApp.getInstance()
      
      // Apply Telegram theme colors
      if (themeParams.bg_color) {
        document.documentElement.style.setProperty('--telegram-bg-color', themeParams.bg_color)
      }
      if (themeParams.text_color) {
        document.documentElement.style.setProperty('--telegram-text-color', themeParams.text_color)
      }
      if (themeParams.button_color) {
        document.documentElement.style.setProperty('--telegram-button-color', themeParams.button_color)
      }
      if (themeParams.button_text_color) {
        document.documentElement.style.setProperty('--telegram-button-text-color', themeParams.button_text_color)
      }

      // Set header and background colors
      webApp.setHeaderColor(themeParams.bg_color || '#0c0818')
      webApp.setBackgroundColor(themeParams.bg_color || '#0c0818')

      // Add Telegram-specific styles
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        // Prevent zoom on iOS
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
        }

        // Add Telegram Web App script if not already loaded
        if (!document.querySelector('script[src*="telegram-web-app"]')) {
          const script = document.createElement('script')
          script.src = 'https://telegram.org/js/telegram-web-app.js'
          script.async = true
          document.head.appendChild(script)
        }
      }
    }
  }, [isInTelegram, theme, themeParams])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <div
      className={isInTelegram ? 'telegram-webapp' : ''}
      style={{
        minHeight: isInTelegram ? '100vh' : undefined,
        backgroundColor: isInTelegram ? themeParams.bg_color || '#0c0818' : undefined,
      }}
    >
      {children}
    </div>
  )
}
