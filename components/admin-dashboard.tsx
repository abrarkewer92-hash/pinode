"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, TrendingUp, Zap, Settings, LogOut, CreditCard, RefreshCw } from "lucide-react"
import AdminTransactions from "./admin-transactions"
import { getAdminStats, getMinWithdraw, setMinWithdraw } from "@/lib/supabase-client"

interface AdminDashboardProps {
  onLogout?: () => void
}

interface AdminStats {
  totalUsers: number
  activeMiners: number
  totalMined: number
  totalExchanged: number
  totalReferrals: number
  platformFee: number
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "mining" | "transactions" | "settings">("transactions")
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeMiners: 0,
    totalMined: 0,
    totalExchanged: 0,
    totalReferrals: 0,
    platformFee: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true)
        const adminStats = await getAdminStats()
        setStats(adminStats)
      } catch (error) {
        console.error("Failed to load admin stats:", error)
      } finally {
        setStatsLoading(false)
      }
    }

    loadStats()
    
    // Refresh stats when switching to overview tab
    if (activeTab === "overview") {
      loadStats()
    }

    // Auto-refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [activeTab])

  return (
    <div 
      className="min-h-screen relative overflow-x-hidden"
      style={{
        background: "radial-gradient(circle at top, #151226 0%, #070415 45%, #02010a 100%)",
      }}
    >
      {/* Soft animated background pattern */}
      <div
        className="fixed inset-0 opacity-15"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(251, 191, 36, 0.18) 0%, transparent 55%),
            radial-gradient(circle at 80% 80%, rgba(96, 165, 250, 0.16) 0%, transparent 55%)
          `,
          backgroundSize: "120% 120%",
          animation: "gradient-shift 18s ease-in-out infinite",
        }}
      />

      {/* Admin Navbar */}
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur-2xl sticky top-0 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.65)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/pi/pinode.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Admin Portal</span>
                <span className="text-[10px] text-[#a5b4fc]">PiNode Labs Management</span>
              </div>
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              className="gap-2 bg-black/40 border-white/10 hover:bg-black/60 text-white"
            >
              <LogOut className="w-4 h-4" />
              Exit Admin
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Admin Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
          {[
            { id: "transactions", label: "Transactions", icon: CreditCard },
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Users", icon: Users },
            { id: "mining", label: "Mining", icon: Zap },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[#fbbf24]/20 to-[#f59e0b]/20 text-[#fbbf24] border-b-2 border-[#fbbf24]"
                    : "text-[#a5b4fc] hover:text-white hover:bg-black/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "transactions" && <AdminTransactions />}
        {activeTab === "overview" && <AdminOverview stats={stats} isLoading={statsLoading} onRefresh={() => {
          getAdminStats().then(setStats).catch(console.error)
        }} />}
        {activeTab === "users" && <AdminUsers stats={stats} />}
        {activeTab === "mining" && <AdminMining stats={stats} />}
        {activeTab === "settings" && <AdminSettings />}
      </main>
    </div>
  )
}

function AdminOverview({
  stats,
  isLoading,
  onRefresh,
}: {
  stats: {
    totalUsers: number
    activeMiners: number
    totalMined: number
    totalExchanged: number
    totalReferrals: number
    platformFee: number
  }
  isLoading: boolean
  onRefresh: () => void
}) {
  const participationRate = stats.totalUsers > 0 
    ? ((stats.activeMiners / stats.totalUsers) * 100).toFixed(1)
    : "0"

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Overview</h2>
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="gap-2 bg-black/40 border-white/10 hover:bg-black/60 text-white"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-6 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#a5b4fc] uppercase font-medium">Total Users</span>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7dd3fc] to-[#0ea5e9] flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          {isLoading ? (
            <div className="text-3xl font-bold text-white">-</div>
          ) : (
            <>
              <div className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-[#a5b4fc] mt-2">Registered users (excluding admin)</div>
            </>
          )}
        </Card>

        <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-6 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#a5b4fc] uppercase font-medium">Active Miners</span>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>
          {isLoading ? (
            <div className="text-3xl font-bold text-white">-</div>
          ) : (
            <>
              <div className="text-3xl font-bold text-white">{stats.activeMiners.toLocaleString()}</div>
              <div className="text-xs text-[#a5b4fc] mt-2">{participationRate}% participation</div>
            </>
          )}
        </Card>

        <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-6 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#a5b4fc] uppercase font-medium">Total Mined</span>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          {isLoading ? (
            <div className="text-3xl font-bold text-white">-</div>
          ) : (
            <>
              <div className="text-3xl font-bold text-white">
                {stats.totalMined >= 1000000 
                  ? `${(stats.totalMined / 1000000).toFixed(2)}M`
                  : stats.totalMined >= 1000
                  ? `${(stats.totalMined / 1000).toFixed(1)}K`
                  : stats.totalMined.toFixed(0)
                } PiNode
              </div>
              <div className="text-xs text-[#a5b4fc] mt-2">Total from all miners</div>
            </>
          )}
        </Card>

        <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-6 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#a5b4fc] uppercase font-medium">Exchanged Volume</span>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#8b5cf6] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
          </div>
          {isLoading ? (
            <div className="text-3xl font-bold text-white">-</div>
          ) : (
            <>
              <div className="text-3xl font-bold text-white">
                {stats.totalExchanged >= 1000000
                  ? `${(stats.totalExchanged / 1000000).toFixed(2)}M`
                  : stats.totalExchanged >= 1000
                  ? `${(stats.totalExchanged / 1000).toFixed(1)}K`
                  : stats.totalExchanged.toFixed(2)
                } PI
              </div>
              <div className="text-xs text-[#a5b4fc] mt-2">Completed exchanges</div>
            </>
          )}
        </Card>

        <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-6 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#a5b4fc] uppercase font-medium">Total Referrals</span>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ec4899] to-[#be185d] flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          {isLoading ? (
            <div className="text-3xl font-bold text-white">-</div>
          ) : (
            <>
              <div className="text-3xl font-bold text-white">{stats.totalReferrals.toLocaleString()}</div>
              <div className="text-xs text-[#a5b4fc] mt-2">Active referral links</div>
            </>
          )}
        </Card>

        <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-6 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#a5b4fc] uppercase font-medium">Platform Revenue</span>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          {isLoading ? (
            <div className="text-3xl font-bold text-white">-</div>
          ) : (
            <>
              <div className="text-3xl font-bold text-white">
                {stats.platformFee >= 1000000
                  ? `${(stats.platformFee / 1000000).toFixed(2)}M`
                  : stats.platformFee >= 1000
                  ? `${(stats.platformFee / 1000).toFixed(1)}K`
                  : stats.platformFee.toFixed(2)
                } PiNode
              </div>
              <div className="text-xs text-[#a5b4fc] mt-2">Estimated from withdrawals</div>
            </>
          )}
        </Card>
      </div>

      {/* Charts Area */}
      <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-6 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
        <h3 className="text-lg font-semibold mb-4 text-white">Platform Activity</h3>
        <div className="h-64 bg-black/60 rounded-lg flex items-center justify-center border border-white/10">
          <p className="text-[#a5b4fc]">Real-time data displayed above. Charts can be added here.</p>
        </div>
      </Card>
    </div>
  )
}

function AdminUsers({ stats }: { stats: any }) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        const { getAllUsers } = await import("@/lib/supabase-client")
        const allUsers = await getAllUsers()
        // Filter out admin users
        const regularUsers = allUsers.filter((u: any) => !u.is_admin)
        setUsers(regularUsers)
      } catch (error) {
        console.error("Failed to load users:", error)
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.email?.toLowerCase().includes(query) ||
      user.id?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <div className="text-sm text-[#a5b4fc]">
          Total: {users.length} users
        </div>
      </div>

      {/* Search */}
      <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-4 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
        <input
          type="text"
          placeholder="Search by email, ID, or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-black/60 border border-white/10 text-white placeholder-[#a7a3ff] focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/40"
        />
      </Card>

      <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Users List</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-[#a5b4fc]">Loading users...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[#a5b4fc]">No users found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-[#a5b4fc]">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a5b4fc]">PI Balance</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a5b4fc]">PiNode Balance</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a5b4fc]">Joined</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a5b4fc]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-black/40 transition-colors">
                      <td className="px-4 py-3 text-white">{user.email || "N/A"}</td>
                      <td className="px-4 py-3 text-[#fbbf24] font-semibold">
                        {Number(user.usdt_balance || 0).toFixed(4)} PI
                      </td>
                      <td className="px-4 py-3 text-[#7dd3fc] font-semibold">
                        {Math.floor(Number(user.bxt_balance || 0)).toLocaleString()} PiNode
                      </td>
                      <td className="px-4 py-3 text-[#a5b4fc] text-xs">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function AdminMining({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Mining Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-6 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
          <h3 className="text-lg font-semibold mb-4 text-white">Mining Overview</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-black/60 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[#a5b4fc]">Active Miners</span>
                <span className="text-xl font-bold text-white">{stats.activeMiners.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#a5b4fc]">Total Mined</span>
                <span className="text-lg font-semibold text-[#fbbf24]">
                  {stats.totalMined >= 1000000 
                    ? `${(stats.totalMined / 1000000).toFixed(2)}M`
                    : stats.totalMined >= 1000
                    ? `${(stats.totalMined / 1000).toFixed(1)}K`
                    : stats.totalMined.toFixed(0)
                  } PiNode
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-black/60 border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#a5b4fc]">Participation Rate</span>
                <span className="text-lg font-semibold text-[#7dd3fc]">
                  {stats.totalUsers > 0 
                    ? `${((stats.activeMiners / stats.totalUsers) * 100).toFixed(1)}%`
                    : "0%"
                  }
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-6 shadow-[0_16px_45px_rgba(0,0,0,0.65)]">
          <h3 className="text-lg font-semibold mb-4 text-white">Platform Metrics</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-3 rounded-lg bg-black/60 border border-white/10">
              <span className="text-[#a5b4fc]">Total Users</span>
              <span className="text-white font-semibold">{stats.totalUsers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-black/60 border border-white/10">
              <span className="text-[#a5b4fc]">Total Referrals</span>
              <span className="text-white font-semibold">{stats.totalReferrals.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-black/60 border border-white/10">
              <span className="text-[#a5b4fc]">Exchanged Volume</span>
              <span className="text-[#fbbf24] font-semibold">
                {stats.totalExchanged >= 1000000
                  ? `${(stats.totalExchanged / 1000000).toFixed(2)}M`
                  : stats.totalExchanged >= 1000
                  ? `${(stats.totalExchanged / 1000).toFixed(1)}K`
                  : stats.totalExchanged.toFixed(2)
                } PI
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-black/60 border border-white/10">
              <span className="text-[#a5b4fc]">Platform Revenue</span>
              <span className="text-[#7dd3fc] font-semibold">
                {stats.platformFee >= 1000000
                  ? `${(stats.platformFee / 1000000).toFixed(2)}M`
                  : stats.platformFee >= 1000
                  ? `${(stats.platformFee / 1000).toFixed(1)}K`
                  : stats.platformFee.toFixed(2)
                } PiNode
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function AdminSettings() {
  const [settings, setSettings] = useState({
    minWithdraw: 100,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Load minimum withdraw from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        const minWithdraw = await getMinWithdraw()
        setSettings(prev => ({ ...prev, minWithdraw: minWithdraw >= 100 ? minWithdraw : 100 }))
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    if (settings.minWithdraw < 100) {
      setSaveMessage({ type: 'error', text: 'Minimum withdrawal must be at least 100 PI' })
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    try {
      setIsSaving(true)
      setSaveMessage(null)
      
      // Save minimum withdraw
      await setMinWithdraw(settings.minWithdraw)
      
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' })
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Platform Settings</h2>
      
      <Card className="border border-white/10 bg-black/40 backdrop-blur-2xl p-6 shadow-[0_16px_45px_rgba(0,0,0,0.65)] max-w-2xl">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-[#a5b4fc]">Loading settings...</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Minimum Withdraw (PI Network)
              </label>
              <input
                type="number"
                step="0.01"
                min="100"
                value={settings.minWithdraw}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 100
                  setSettings(prev => ({ ...prev, minWithdraw: value < 100 ? 100 : value }))
                }}
                className="w-full px-4 py-2 rounded-lg bg-black/60 border border-white/10 text-white placeholder-[#a7a3ff] focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/40"
                placeholder="Enter minimum withdraw amount (minimum 100 PI)"
              />
              <p className="text-xs text-[#a5b4fc] mt-2">
                Current minimum withdrawal amount in PI Network. Users cannot withdraw less than this amount. 
                <span className="block mt-1 font-semibold text-[#fbbf24]">Minimum allowed: 100 PI</span>
              </p>
            </div>
            
            {saveMessage && (
              <div className={`p-4 rounded-lg border ${
                saveMessage.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                  : 'bg-red-500/10 border-red-500/50 text-red-400'
              }`}>
                {saveMessage.text}
              </div>
            )}
            
            <Button 
              onClick={handleSave}
              disabled={isSaving || settings.minWithdraw < 100}
              className="w-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#fcd34d] hover:to-[#fbbf24] text-white font-semibold py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
