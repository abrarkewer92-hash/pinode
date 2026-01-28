"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useReferralSystem } from "@/hooks/use-referral-system"
import { Users, Copy, CheckCircle2, Gift } from "lucide-react"

interface ReferralSectionProps {
  userId?: string
  onBonusEarned?: (bonus: number) => void
}

export default function ReferralSection({ userId = "user-1", onBonusEarned }: ReferralSectionProps) {
  const referral = useReferralSystem({ userId })
  const [copied, setCopied] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimMessage, setClaimMessage] = useState("")

  const handleCopy = () => {
    navigator.clipboard.writeText(referral.getReferralLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClaimBonus = async () => {
    setIsClaiming(true)
    setClaimMessage("")
    
    const result = await referral.claimBonus()
    
    if (result.success) {
      setClaimMessage(result.message)
      // Call onBonusEarned callback to update GOLD balance in parent
      if (onBonusEarned && result.bonus) {
        onBonusEarned(result.bonus)
      }
      setTimeout(() => setClaimMessage(""), 5000)
    } else {
      setClaimMessage(result.message)
      setTimeout(() => setClaimMessage(""), 5000)
    }
    
    setIsClaiming(false)
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-4 space-y-3 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Referral Program</h2>
            <p className="text-xs text-[#c9c3ff]">
              Invite friends and earn PiNode rewards
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
          <div>
            <p className="text-[10px] text-[#a7a3ff] mb-1">Total Referrals</p>
            <p className="text-sm font-semibold text-white">
              {referral.totalReferrals}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#a7a3ff] mb-1">PiNode Earned</p>
            <p className="text-sm font-semibold text-white">
              {referral.totalBonusEarned.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#a7a3ff] mb-1">Pending</p>
            <p className="text-sm font-semibold text-[#fbbf24]">
              {referral.pendingBonus.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Referral Link Card */}
      <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-4 space-y-3 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
        <div className="flex items-center gap-2 mb-2">
          <Copy className="w-4 h-4 text-[#c9c3ff]" />
          <p className="text-sm font-semibold text-white">
            Referral Link
          </p>
        </div>
        <p className="text-xs text-[#c9c3ff] mb-3">
          Share this link with your friends. Every active friend gives you{" "}
          <span className="font-semibold text-[#fbbf24]">100 PiNode (≈ 5 PI)</span>.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={referral.getReferralLink()}
            readOnly
            className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white font-mono placeholder-[#a7a3ff] focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/40"
          />
          <Button
            onClick={handleCopy}
            className={`gap-1.5 px-4 text-xs font-semibold h-9 ${
              copied
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                : "bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#fcd34d] hover:to-[#fbbf24] text-white"
            }`}
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Claim PiNode Card */}
      {referral.pendingBonus > 0 && (
        <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-4 space-y-3 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-[#c9c3ff]" />
            <p className="text-sm font-semibold text-white">
              Claim Referral PiNode
            </p>
          </div>
          <p className="text-xs text-[#c9c3ff] mb-3">
            You have{" "}
            <span className="font-semibold text-[#fbbf24]">
              {referral.pendingBonus.toLocaleString()} PiNode
            </span>{" "}
            ready to claim. 100 PiNode ≈ 5 PI Network.
          </p>
          {claimMessage && (
            <p
              className={`text-xs font-semibold ${
                claimMessage.includes("Successfully")
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {claimMessage}
            </p>
          )}
          <Button
            onClick={handleClaimBonus}
            disabled={isClaiming || referral.pendingBonus === 0}
            className="w-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#fcd34d] hover:to-[#fbbf24] text-white text-xs font-semibold py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isClaiming ? "Claiming..." : "Claim PiNode"}
          </Button>
        </Card>
      )}

      {/* How It Works */}
      <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-4 space-y-2 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
        <h4 className="text-sm font-semibold text-white">How it works</h4>
        <div className="space-y-1.5">
          <p className="text-xs text-[#c9c3ff]">
            1. Share your referral link with friends.
          </p>
          <p className="text-xs text-[#c9c3ff]">
            2. Every active friend gives you <span className="font-semibold text-[#fbbf24]">100 PiNode (≈ 5 PI)</span>.
          </p>
          <p className="text-xs text-[#c9c3ff]">
            3. Tap <span className="font-semibold text-[#fbbf24]">Claim PiNode</span> to send rewards to your PiNode balance.
          </p>
        </div>
      </Card>
    </div>
  )
}
