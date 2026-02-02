"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getUserById, updateUserBalance, createTransaction, getTransactions, getUserMissions, upsertUserMission } from "@/lib/supabase-client"
import { ExternalLink, CheckCircle2, Twitter, MessageCircle } from "lucide-react"

interface Mission {
  id: string
  title: string
  description: string
  reward: number
  url: string
  type: "twitter_follow" | "telegram_channel" | "telegram_group" | "twitter_retweet"
  icon: React.ReactNode
}

interface MissionsSectionProps {
  userId: string
  onBonusEarned?: (bonus: number) => void
}

const MISSIONS: Mission[] = [
  {
    id: "follow_twitter",
    title: "Follow Twitter",
    description: "Follow @pinodelabs on Twitter",
    reward: 200,
    url: "https://x.com/pinodelabs",
    type: "twitter_follow",
    icon: <Twitter className="w-5 h-5" />,
  },
  {
    id: "join_telegram_channel",
    title: "Join Telegram Channel",
    description: "Join PiNode Labs Telegram Channel",
    reward: 200,
    url: "https://t.me/pinodelabscn",
    type: "telegram_channel",
    icon: <MessageCircle className="w-5 h-5" />,
  },
  {
    id: "join_telegram_group",
    title: "Join Telegram Group",
    description: "Join PiNode Labs Telegram Group",
    reward: 200,
    url: "https://t.me/pinodelabs",
    type: "telegram_group",
    icon: <MessageCircle className="w-5 h-5" />,
  },
  {
    id: "retweet_twitter_1",
    title: "Retweet Twitter Post",
    description: "Retweet our latest announcement",
    reward: 150,
    url: "https://x.com/pinodelabs/status/2016374488703893759",
    type: "twitter_retweet",
    icon: <Twitter className="w-5 h-5" />,
  },
  {
    id: "retweet_twitter_2",
    title: "Retweet Twitter Post",
    description: "Retweet our community update",
    reward: 150,
    url: "https://x.com/pinodelabs/status/2016375862661361799",
    type: "twitter_retweet",
    icon: <Twitter className="w-5 h-5" />,
  },
]

export default function MissionsSection({ userId, onBonusEarned }: MissionsSectionProps) {
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set())
  const [claimedMissions, setClaimedMissions] = useState<Set<string>>(new Set())
  const [isClaiming, setIsClaiming] = useState<string | null>(null)

  // Load mission progress from Supabase (source of truth),
  // fallback ke localStorage hanya jika DB belum punya data (untuk user lama).
  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const rows = await getUserMissions(userId)
        if (rows && rows.length > 0) {
          const completed = new Set<string>()
          const claimed = new Set<string>()
          for (const row of rows as any[]) {
            if (row.status === "completed") {
              completed.add(row.mission_id)
            }
            if (row.status === "claimed") {
              completed.add(row.mission_id)
              claimed.add(row.mission_id)
            }
          }

          if (!isMounted) return

          setCompletedMissions(completed)
          setClaimedMissions(claimed)

          // Sync localStorage agar konsisten lintas device / reload
          localStorage.setItem(
            `missions_completed_${userId}`,
            JSON.stringify(Array.from(completed)),
          )
          localStorage.setItem(
            `missions_claimed_${userId}`,
            JSON.stringify(Array.from(claimed)),
          )

          return
        }
      } catch (e) {
        console.warn("Failed to load user missions from Supabase:", e)
      }

      // Jika DB belum punya data, biarkan semua misi dianggap belum dikerjakan
      if (!isMounted) return
    }

    load()

    return () => {
      isMounted = false
    }
  }, [userId])

  const handleMissionClick = (mission: Mission) => {
    // Open mission URL in new tab
    window.open(mission.url, "_blank", "noopener,noreferrer")
    
    // Mark as completed after a short delay (user needs to actually complete the action)
    setTimeout(() => {
      const newCompleted = new Set(completedMissions)
      newCompleted.add(mission.id)
      setCompletedMissions(newCompleted)

      // Persist to Supabase (best-effort, non-blocking)
      upsertUserMission(userId, mission.id, "completed", mission.reward).catch((e) =>
        console.warn("Failed to upsert user mission (completed):", e),
      )
    }, 1000)
  }

  const handleClaimReward = async (mission: Mission) => {
    setIsClaiming(mission.id)

    try {
      // Extra safety: check in database if this mission has already been claimed before.
      // This prevents re-claim from other devices / after localStorage is cleared.
      const recentTx = await getTransactions(userId, 100)
      const alreadyClaimedInDb = recentTx.some(
        (tx: any) =>
          tx.type === "claim" &&
          typeof tx.description === "string" &&
          tx.description.includes(`mission:${mission.id}`)
      )

      if (alreadyClaimedInDb || claimedMissions.has(mission.id)) {
        // Sync local state supaya UI terkunci sebagai claimed.
        const syncedClaimed = new Set(claimedMissions)
        syncedClaimed.add(mission.id)
        setClaimedMissions(syncedClaimed)

        // Feedback minimal via console; UI sudah mengunci tombol menjadi "Claimed"
        return
      }

      // Get current user balance
      const user = await getUserById(userId)
      if (!user) {
        throw new Error("User not found")
      }

      // Update PiNode balance
      const currentBxtBalance = Number(user.bxt_balance || 0)
      const newBxtBalance = currentBxtBalance + mission.reward

      await updateUserBalance(userId, undefined, newBxtBalance)

      // Create transaction record
      await createTransaction({
        user_id: userId,
        type: "claim",
        amount: mission.reward,
        amount_received: mission.reward,
        currency: "GOLD", // Database uses "GOLD" for PiNode/BXT
        status: "completed",
        // Include mission ID in description for idempotent checks later
        description: `mission:${mission.id} | Claimed ${mission.reward} PiNode for completing: ${mission.title}`,
        network: null,
      })

      // Mark as claimed
      const newClaimed = new Set(claimedMissions)
      newClaimed.add(mission.id)
      setClaimedMissions(newClaimed)

      // Persist claimed status to Supabase
      const nowIso = new Date().toISOString()
      await upsertUserMission(userId, mission.id, "claimed", mission.reward, nowIso)

      // Notify parent component
      if (onBonusEarned) {
        onBonusEarned(mission.reward)
      }

    } catch (error) {
      console.error("Failed to claim reward:", error)
    } finally {
      setIsClaiming(null)
    }
  }

  const completedCount = completedMissions.size
  const claimedCount = claimedMissions.size

  return (
    <div className="space-y-4">
      {/* Header – menyatu satu latar */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#0c1f2e] flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">PiNode Airdrop Missions</h2>
            <p className="text-xs text-[#a5b4fc]">
              Complete tasks and earn free PiNode rewards
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-3">
          <div>
            <p className="text-[10px] text-[#a5b4fc] mb-1">Completed</p>
            <p className="text-sm font-semibold text-white">
              {completedCount}/{MISSIONS.length}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#a5b4fc] mb-1">Claimed</p>
            <p className="text-sm font-semibold text-white">{claimedCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#a5b4fc] mb-1">Pending</p>
            <p className="text-sm font-semibold text-[#7dd3fc]">
              {MISSIONS.length - claimedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Missions List – menyatu latar */}
      <div className="space-y-3">
        {MISSIONS.map((mission) => {
          const isCompleted = completedMissions.has(mission.id)
          const isClaimed = claimedMissions.has(mission.id)
          const canClaim = isCompleted && !isClaimed

          return (
            <div
              key={mission.id}
              className="p-4"
            >
              <div className="flex items-start gap-3">
                {/* Mission Icon */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? "bg-emerald-600"
                      : "bg-[#1a1530]"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <div className="text-white">{mission.icon}</div>
                  )}
                </div>

                {/* Mission Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white mb-1">
                        {mission.title}
                      </h3>
                      <p className="text-xs text-[#a5b4fc] mb-2">
                        {mission.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-[#7dd3fc]">
                        +{mission.reward}
                      </p>
                      <p className="text-[10px] text-[#a5b4fc]">PiNode</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    {!isCompleted ? (
                      <Button
                        onClick={() => handleMissionClick(mission)}
                        className="flex-1 bg-gradient-to-r from-[#7dd3fc] to-[#0ea5e9] hover:from-[#93d5fd] hover:to-[#38bdf8] text-white text-xs font-semibold h-8"
                      >
                        <ExternalLink className="w-3 h-3 mr-1.5" />
                        Complete Task
                      </Button>
                    ) : canClaim ? (
                      <Button
                        onClick={() => handleClaimReward(mission)}
                        disabled={isClaiming === mission.id}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-semibold h-8"
                      >
                        {isClaiming === mission.id ? "Claiming..." : "Claim Reward"}
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="flex-1 bg-gray-600/50 text-gray-400 text-xs font-semibold h-8 cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1.5" />
                        Claimed
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info – menyatu latar */}
      <div className="p-4 space-y-2">
        <h4 className="text-sm font-semibold text-white">How it works</h4>
        <div className="space-y-1.5">
          <p className="text-xs text-[#a5b4fc]">
            1. Click "Complete Task" to open the social media link
          </p>
          <p className="text-xs text-[#a5b4fc]">
            2. Follow, join, or retweet as instructed
          </p>
          <p className="text-xs text-[#a5b4fc]">
            3. Return to the app and claim your PiNode reward
          </p>
          <p className="text-xs text-[#a5b4fc] mt-2">
            <span className="font-semibold text-[#7dd3fc]">
              100 PiNode ≈ 5 PI Network
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
