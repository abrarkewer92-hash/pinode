"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import NodeNetworkBackground from "@/components/node-network-background"
import { useTelegramWebApp } from "@/lib/telegram-webapp"

interface LoginFormProps {
  // Ke depan, login hanya melalui Telegram bot.
  // onLogin dibiarkan untuk kompatibilitas, tapi tidak digunakan di UI ini.
  onLogin: (userData: any) => void
  isSignUp?: boolean
  onBack?: () => void
}

export default function LoginForm({}: LoginFormProps) {
  const { isInTelegram } = useTelegramWebApp()
  const telegramUrl = "https://t.me/pinodelabsbot"

  return (
    <div
      className="min-h-screen relative overflow-x-hidden flex flex-col items-stretch"
      style={{
        backgroundImage: "url('/pi/pibg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark Overlay untuk kontras */}
      <div 
        className="fixed inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(10, 14, 26, 0.85) 0%, rgba(11, 7, 23, 0.9) 50%, rgba(5, 3, 11, 0.95) 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 pt-6 pb-8 flex-1 flex flex-col items-center justify-center">
        <div className="w-full relative">
            {/* Main Container */}
          <div 
            className="relative rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_18px_40px_rgba(0,0,0,0.8)] hover:border-yellow-400/40"
            style={{
              background: "rgba(27, 18, 51, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
            }}
          >
            
            {/* Content */}
            <div className="relative z-10 p-5 sm:p-6">
              {/* Header */}
              <div className="text-center mb-5">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <img
                    src="/pi/pinetwork.png"
                    alt="Pi Network"
                    className="w-14 h-14 object-contain"
                    style={{
                      filter: "drop-shadow(0 0 18px rgba(251,191,36,0.8))",
                    }}
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-white tracking-wide">
                      PiNode Labs
                    </span>
                    <span className="text-[11px] text-[#a5b4fc]">
                      Login with Telegram
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4 text-center">
                <p className="text-xs sm:text-sm text-[#a5b4fc]">
                  Akses PiNode Labs sekarang hanya melalui <span className="font-semibold text-yellow-300">@pinodelabsbot</span> di Telegram.
                  Akun akan dibuat dan login otomatis setelah kamu kirim <span className="font-semibold">/start</span> di bot.
                </p>
                <p className="text-[11px] text-[#a5b4fc]">
                  {isInTelegram
                    ? "Kamu membuka halaman ini di dalam Telegram, tapi belum terautentikasi. Silakan kembali ke bot dan gunakan tombol \"Open Web App\"."
                    : "Buka Telegram, cari @pinodelabsbot, lalu kirim /start atau /app untuk mulai."}
                </p>

                <Button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.open(telegramUrl, "_blank", "noopener,noreferrer")
                    }
                  }}
                  className="w-full bg-gradient-to-r from-[#24A1DE] to-[#0088cc] hover:from-[#2bb2f3] hover:to-[#0099dd] text-white font-bold py-2.5 rounded-lg shadow-lg text-sm transition-all duration-300"
                  style={{
                    backgroundSize: "200% 100%",
                    boxShadow: "0 4px 15px rgba(56, 189, 248, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.16)",
                  }}
                >
                  Buka @pinodelabsbot di Telegram
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
