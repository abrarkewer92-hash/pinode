"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Check, Wallet, ArrowUpRight } from "lucide-react"
import { createTransaction, getTransactions, getMinWithdraw } from "@/lib/supabase-client"
import DepositHistory from "./deposit-history"

interface WalletSectionProps {
  userId?: string
  currentUSDTBalance: number
  onBalanceUpdate: (newBalance: number) => void
  onBalanceRefresh?: () => void
  onNavigateToDeposit?: () => void
}

export default function WalletSection({ userId = "user-1", currentUSDTBalance, onBalanceUpdate, onBalanceRefresh, onNavigateToDeposit }: WalletSectionProps) {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [withdrawalAddress, setWithdrawalAddress] = useState("")
  const [transactions, setTransactions] = useState<any[]>([])
  const [minWithdraw, setMinWithdraw] = useState(100) // Default minimum PI Network withdrawal

  // Load minimum withdraw setting and transactions
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load minimum withdraw from database
        const minWithdrawValue = await getMinWithdraw()
        // Ensure minimum is at least 100 PI
        const finalMinWithdraw = minWithdrawValue >= 100 ? minWithdrawValue : 100
        setMinWithdraw(finalMinWithdraw)
        
        // If database value is less than 100, update it to 100
        if (minWithdrawValue < 100) {
          const { setMinWithdraw } = await import("@/lib/supabase-client")
          await setMinWithdraw(100)
        }
        
        // Load transactions
        const txs = await getTransactions(userId, 10)
        setTransactions(txs)
      } catch (error) {
        console.error("Failed to load data:", error)
        // On error, ensure we use 100 as minimum
        setMinWithdraw(100)
      }
    }
    loadData()
  }, [userId])

  const handleWithdrawSubmit = async () => {
    setError("")
    setSuccess("")

    const amount = Number.parseFloat(withdrawalAmount)
    
    // Validation
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount")
      return
    }
    try {
      // Refresh balance first to get latest state
      if (onBalanceRefresh) {
        await onBalanceRefresh()
      }
      
      // Fetch fresh balance from database
      const { getUserById } = await import("@/lib/supabase-client")
      const userData = await getUserById(userId)
      const freshBalance = Number(userData.usdt_balance || 0)
      
      if (amount > freshBalance) {
        setError("Insufficient balance. Please refresh and try again.")
        return
      }

      if (amount < minWithdraw) {
        setError(`Minimum withdrawal is ${minWithdraw} PI`)
        return
      }

      if (!withdrawalAddress || withdrawalAddress.trim().length < 10) {
        setError("Please enter a valid PI Network address.")
        return
      }
      
      // Check for existing pending withdrawal transactions to prevent duplicates
      const existingTransactions = await getTransactions(userId, 50)
      const hasPendingWithdraw = existingTransactions.some(
        (tx: any) => 
          tx.type === 'withdraw' && 
          tx.status === 'pending' &&
          tx.amount === amount &&
          new Date(tx.created_at).getTime() > Date.now() - 60000 // Within last minute
      )
      
      if (hasPendingWithdraw) {
        setError("A similar withdrawal request is already pending. Please wait for approval.")
        return
      }
      
      // Create withdrawal transaction with pending status (PI Network only)
      const transaction = await createTransaction({
        user_id: userId,
        type: 'withdraw',
        amount,
        amount_received: amount,
        currency: 'USDT',
        status: 'pending',
        description: `Withdraw ${amount} PI to ${withdrawalAddress} (PI Network)`,
        network: null,
      })
      
      setSuccess(
        `Withdrawal request submitted. Please wait for admin approval. Amount: ${amount.toFixed(
          2,
        )} PI to ${withdrawalAddress.substring(0, 6)}... Transaction ID: ${transaction.id.substring(
          0,
          8,
        )}...`,
      )
      
      // Refresh balance after transaction creation
      if (onBalanceRefresh) {
        setTimeout(() => onBalanceRefresh(), 1000)
      }
      
      // Reset form
      setTimeout(() => {
        setSuccess("")
        setWithdrawalAmount("")
        setWithdrawalAddress("")
      }, 5000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to process withdrawal")
    }
  }

  return (
    <div className="space-y-4">
      {/* Header – menyatu satu latar */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#0d2818] flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Wallet</h2>
            <p className="text-xs text-[#a5b4fc]">
              Withdraw PI Network to your wallet
            </p>
          </div>
        </div>
        <div className="pt-3">
          <p className="text-[10px] text-[#a5b4fc] mb-1">PI Network Balance</p>
          <p className="text-lg font-semibold text-white">
            {currentUSDTBalance.toFixed(4)}{" "}
            <span className="text-sm text-[#a5b4fc]">PI</span>
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl bg-red-500/10 p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs font-medium text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-500/10 p-3">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-xs font-medium text-emerald-400">{success}</p>
          </div>
        </div>
      )}

      {/* Withdraw PI Network – menyatu latar */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <ArrowUpRight className="w-4 h-4 text-[#a5b4fc]" />
          <p className="text-sm font-semibold text-white">Withdraw PI Network</p>
        </div>
        <p className="text-xs text-[#a5b4fc] mb-3">
          Enter the PI amount and your PI Network address to request a withdrawal.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Amount (PI)
            </label>
            <input
              type="number"
              min={minWithdraw}
              step="0.01"
              placeholder={`Minimum ${minWithdraw} PI`}
              value={withdrawalAmount}
              onChange={(e) => {
                setWithdrawalAmount(e.target.value)
                setError("")
              }}
              className="w-full px-3 py-2 rounded-xl bg-white/5 text-xs text-white placeholder-[#a7a3ff] focus:outline-none focus:ring-2 focus:ring-[#10b981]/40"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-[#a5b4fc]">
                Min: {minWithdraw} PI
              </span>
              <span className="text-[11px] text-[#a5b4fc]">
                Balance: <span className="text-white font-semibold">{currentUSDTBalance.toFixed(4)} PI</span>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              PI Network address
            </label>
            <input
              type="text"
              placeholder="Enter your PI Network mainnet address"
              value={withdrawalAddress}
              onChange={(e) => {
                setWithdrawalAddress(e.target.value)
                setError("")
              }}
              className="w-full px-3 py-2 rounded-xl bg-white/5 text-[11px] text-white placeholder-[#a7a3ff] focus:outline-none focus:ring-2 focus:ring-[#10b981]/40 font-mono"
            />
            <p className="text-[10px] text-[#a5b4fc] mt-1">
              Make sure this address belongs to your official PI Network wallet. Withdrawals
              cannot be reversed.
            </p>
          </div>
        </div>

        <Button
          onClick={handleWithdrawSubmit}
          disabled={
            !withdrawalAmount ||
            !withdrawalAddress ||
            Number.parseFloat(withdrawalAmount || "0") < minWithdraw ||
            Number.parseFloat(withdrawalAmount || "0") > currentUSDTBalance
          }
          className="w-full bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#10b981] text-white text-xs font-semibold py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Request withdrawal
        </Button>
      </div>

      {/* Withdraw-only Transaction History (simple) */}
      <DepositHistory userId={userId} mode="withdraw" />
    </div>
  )
}
