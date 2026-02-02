import { supabase } from './supabase'
import { getUserById, getUserByReferralCode, getReferrals, getMiningSession } from './supabase-client'

// Bot token: 8049598586:AAH5cF_tyF3M1Lr3gTYfXSoa2jvdMb_Q9Yk
// Bot username: @pinodelabsbot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8049598586:AAH5cF_tyF3M1Lr3gTYfXSoa2jvdMb_Q9Yk"
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface TelegramMessage {
  message_id: number
  from: TelegramUser
  chat: {
    id: number
    type: string
  }
  date: number
  text?: string
  entities?: Array<{
    type: string
    offset: number
    length: number
  }>
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: {
    id: string
    from: TelegramUser
    message?: TelegramMessage
    data?: string
  }
}

/**
 * Send message to Telegram user
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options?: {
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
    reply_markup?: any
  }
): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parse_mode || 'HTML',
        reply_markup: options?.reply_markup,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Telegram API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
    return false
  }
}

/**
 * Get or create user by Telegram ID
 */
export async function getUserByTelegramId(telegramId: number) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId.toString())
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to get user by Telegram ID:', error)
    return null
  }
}

/**
 * Link Telegram account to existing user
 */
export async function linkTelegramAccount(userId: string, telegramId: number, telegramUsername?: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        telegram_id: telegramId.toString(),
        telegram_username: telegramUsername || null,
      })
      .eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to link Telegram account:', error)
    return false
  }
}

/**
 * Send referral notification to referrer
 */
export async function notifyReferralSuccess(referrerId: string, referredEmail: string) {
  try {
    const referrer = await getUserById(referrerId)
    if (!referrer || !referrer.telegram_id) return false

    const referrals = await getReferrals(referrerId)
    const activeReferrals = referrals.filter(r => r.status === 'active')
    const pendingBonus = referrals.filter(r => r.status === 'active' && Number(r.bonus_earned || 0) === 0).length * 100

    const message = `
🎉 <b>New Referral!</b>

Someone joined using your referral link!

📧 Email: <code>${referredEmail}</code>
👥 Total Referrals: ${referrals.length}
✅ Active Referrals: ${activeReferrals.length}
💰 Pending Bonus: ${pendingBonus} PiNode (≈ ${(pendingBonus / 20).toFixed(2)} PI)

Claim your bonus on the website!
    `.trim()

    return await sendTelegramMessage(referrer.telegram_id, message)
  } catch (error) {
    console.error('Failed to send referral notification:', error)
    return false
  }
}

/**
 * Send mining claim notification
 */
export async function notifyMiningClaim(userId: string, amount: number) {
  try {
    const user = await getUserById(userId)
    if (!user || !user.telegram_id) return false

    const message = `
✅ <b>Mining Claimed!</b>

You've successfully claimed <b>${amount.toFixed(4)} PI</b>

Keep mining to earn more! 🚀
    `.trim()

    return await sendTelegramMessage(user.telegram_id, message)
  } catch (error) {
    console.error('Failed to send mining claim notification:', error)
    return false
  }
}

/**
 * Send balance update notification
 */
export async function notifyBalanceUpdate(userId: string, type: 'mining' | 'referral' | 'exchange', amount: number) {
  try {
    const user = await getUserById(userId)
    if (!user || !user.telegram_id) return false

    const messages = {
      mining: `⛏️ Mining Balance Updated: +${amount.toFixed(4)} PI`,
      referral: `🎁 Referral Bonus: +${amount} PiNode (≈ ${(amount / 20).toFixed(2)} PI)`,
      exchange: `💱 Exchange Completed: ${amount.toFixed(4)} PI Network`,
    }

    return await sendTelegramMessage(user.telegram_id, messages[type])
  } catch (error) {
    console.error('Failed to send balance update notification:', error)
    return false
  }
}

/**
 * Get user stats for Telegram bot
 */
export async function getUserStats(userId: string) {
  try {
    const user = await getUserById(userId)
    if (!user) return null

    const referrals = await getReferrals(userId)
    const activeReferrals = referrals.filter(r => r.status === 'active')
    const totalBonusEarned = referrals.reduce((sum, r) => sum + Number(r.bonus_earned || 0), 0)
    const pendingBonus = referrals.filter(r => r.status === 'active' && Number(r.bonus_earned || 0) === 0).length * 100

    const miningSession = await getMiningSession(userId)

    return {
      user,
      referrals: {
        total: referrals.length,
        active: activeReferrals.length,
        totalBonusEarned,
        pendingBonus,
      },
      mining: {
        balance: Number(miningSession?.mining_balance || 0),
        totalMined: Number(miningSession?.total_mined || 0),
      },
      balances: {
        piNetwork: Number(user.usdt_balance || 0),
        piNode: Number(user.bxt_balance || 0),
      },
    }
  } catch (error) {
    console.error('Failed to get user stats:', error)
    return null
  }
}
