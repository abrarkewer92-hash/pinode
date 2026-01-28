"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTransaction } from "@/lib/supabase-client"
import DepositHistory from "./deposit-history"
import { ArrowLeftRight, Wallet, Coins } from "lucide-react"

interface ExchangeSectionProps {
  bxtBalance: number
  usdtBalance: number
  onExchange: (bxtAmount: number, usdtReceived: number) => void | Promise<void>
  userId?: string
}

// Simple PiNode → PI Network exchange, following the clean card style from Friends / Referral section
export default function ExchangeSection({
  bxtBalance: pinodeBalance,
  usdtBalance: piNetworkWalletBalance,
  onExchange,
  userId = "user-1",
}: ExchangeSectionProps) {
  const [amountInput, setAmountInput] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isExchanging, setIsExchanging] = useState(false)

  // 20 PiNode ≈ 1 PI Network (sejalan dengan 100 PiNode ≈ 5 PI Network di Friends)
  const CONVERSION_RATE = 20

  const piAmount = useMemo(() => {
    const num = Number.parseFloat(amountInput || "0")
    if (!Number.isFinite(num) || num <= 0) return 0
    return num / CONVERSION_RATE
  }, [amountInput])

  const handleExchange = async () => {
    setError("")
    setSuccess("")

    const amount = Number.parseFloat(amountInput || "0")

    if (!amount || amount <= 0) {
      setError("Please enter a valid PiNode amount.")
      return
    }

    if (!Number.isInteger(amount)) {
      setError("PiNode amount must be a whole number.")
      return
    }

    // Minimum 20 PiNode (≈ 1 PI Network)
    if (amount < 20) {
      setError("Minimum exchange is 20 PiNode (≈ 1 PI Network).")
      return
    }

    if (amount > pinodeBalance) {
      setError("Insufficient PiNode balance.")
      return
    }

    setIsExchanging(true)

    try {
      const piReceived = piAmount

      await createTransaction({
        user_id: userId,
        type: "exchange",
        amount: amount,
        amount_received: piReceived,
        currency: "GOLD", // keep old schema, only UI/logic uses PiNode / PI wording
        status: "completed",
        description: `Exchanged ${amount} PiNode for ${piReceived.toFixed(4)} PI Network`,
        network: null,
      })

      // Notify parent so MiningDashboard can update balances consistently
      await onExchange(amount, piReceived)

      setSuccess(
        `Successfully exchanged ${Math.floor(amount).toLocaleString()} PiNode into ${piReceived.toFixed(
          4,
        )} PI Network.`,
      )
      setAmountInput("")
    } catch (error) {
      console.error("Exchange error:", error)
      setError("Failed to process exchange. Please try again shortly.")
    } finally {
      setIsExchanging(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-4 space-y-3 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#8b5cf6] flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Swap PiNode</h2>
            <p className="text-xs text-[#c9c3ff]">
              Convert PiNode to PI Network
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
          <div>
            <p className="text-[10px] text-[#a7a3ff] mb-1">PiNode Balance</p>
            <p className="text-sm font-semibold text-white">
              {Math.floor(pinodeBalance).toLocaleString()}{" "}
              <span className="text-xs text-[#a7a3ff]">PiNode</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#a7a3ff] mb-1">PI Network Wallet</p>
            <p className="text-sm font-semibold text-white">
              {piNetworkWalletBalance.toFixed(4)}{" "}
              <span className="text-xs text-[#a7a3ff]">PI</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Alerts */}
      {error && (
        <Card className="border border-red-500/40 bg-red-500/10 backdrop-blur-2xl p-3 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
          <p className="text-xs font-medium text-red-400">{error}</p>
        </Card>
      )}

      {success && (
        <Card className="border border-emerald-500/40 bg-emerald-500/10 backdrop-blur-2xl p-3 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
          <p className="text-xs font-medium text-emerald-400">{success}</p>
        </Card>
      )}

      {/* Main swap form - match Swap PiNode modal style */}
      <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-4 space-y-3 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-[#c9c3ff]" />
          <p className="text-sm font-semibold text-white">
            Swap PiNode to PI Network
          </p>
        </div>
        <p className="text-xs text-[#c9c3ff] mb-3">
          Convert your mined PiNode into PI Network balance in your wallet.
        </p>

        <div className="space-y-4">
          {/* FROM card */}
          <div className="space-y-2 rounded-2xl bg-black/40 border border-white/10 px-4 py-3">
            <div className="flex items-center justify-between text-[11px] text-[#a7a3ff] mb-1">
              <span>From</span>
              <span className="flex items-center gap-1">
                Balance:
                <span className="text-white font-semibold">
                  {Math.floor(pinodeBalance).toLocaleString()} PiNode
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#0b1220] border border-white/10 flex items-center justify-center">
                  <img
                    src="/pi/pinodelabs.png"
                    alt="PiNode"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white">PiNode</span>
                  <span className="text-[10px] text-[#6b7280]">PINODE</span>
                </div>
              </div>
              <div className="flex-1 text-right">
                <Input
                  type="number"
                  min={0}
                  value={amountInput}
                  onChange={(e) => {
                    setAmountInput(e.target.value)
                    setError("")
                    setSuccess("")
                  }}
                  placeholder="0.0"
                  className="w-full bg-transparent border-none text-right text-lg font-semibold text-white placeholder:text-[#6b7280] focus-visible:ring-0 focus-visible:outline-none"
                />
                <div className="mt-1 flex justify-end gap-2 text-[10px] text-[#a7a3ff]">
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10"
                    onClick={() => {
                      setAmountInput(String(Math.floor(pinodeBalance)))
                      setError("")
                      setSuccess("")
                    }}
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Center swap icon */}
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white text-sm">
              ↕
            </div>
          </div>

          {/* TO card */}
          <div className="space-y-2 rounded-2xl bg-black/40 border border-white/10 px-4 py-3">
            <div className="flex items-center justify-between text-[11px] text-[#a7a3ff] mb-1">
              <span>To</span>
              <span className="flex items-center gap-1">
                Wallet:
                <span className="text-white font-semibold">
                  {piNetworkWalletBalance.toFixed(4)} PI
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#0b1220] border border-white/10 flex items-center justify-center">
                  <img
                    src="/pi/pinetwork.png"
                    alt="PI Network"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white">PI Network</span>
                  <span className="text-[10px] text-[#6b7280]">PI</span>
                </div>
              </div>
              <div className="flex-1 text-right">
                <div className="text-lg font-semibold text-white">
                  {piAmount > 0 ? piAmount.toFixed(4) : "0.0000"}
                </div>
                <div className="mt-1 text-[10px] text-[#a7a3ff]">Estimated output</div>
              </div>
            </div>
          </div>

          {/* Swap button */}
          <Button
            onClick={handleExchange}
            disabled={
              isExchanging ||
              !amountInput ||
              Number.parseFloat(amountInput || "0") < 20 ||
              Number.parseFloat(amountInput || "0") > pinodeBalance
            }
            className="w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#22c55e]/90 hover:to-[#16a34a]/90 text-white text-xs font-semibold py-2.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(34,197,94,0.45)] hover:shadow-[0_0_35px_rgba(34,197,94,0.8)]"
          >
            {isExchanging ? "Processing swap..." : "Swap now"}
          </Button>
        </div>
      </Card>

      {/* How it works */}
      <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-4 space-y-2 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
        <h4 className="text-sm font-semibold text-white">How this swap works</h4>
        <div className="space-y-1.5">
          <p className="text-xs text-[#c9c3ff]">
            1. Enter the amount of PiNode you want to swap (minimum 20 PiNode).
          </p>
          <p className="text-xs text-[#c9c3ff]">
            2. 20 PiNode ≈ 1 PI Network (100 PiNode ≈ 5 PI Network).
          </p>
          <p className="text-xs text-[#c9c3ff]">
            3. After a successful swap, your PI Network wallet balance increases and your PiNode balance decreases.
          </p>
        </div>
      </Card>

      {/* Swap history – simple list following same card style */}
      <DepositHistory userId={userId} mode="swap" />
    </div>
  )
}
