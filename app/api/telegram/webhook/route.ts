import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage, getUserByTelegramId, getUserStats, linkTelegramAccount, TelegramUpdate } from '@/lib/telegram-bot-helper'
import { getUserByEmail, createUser, getUserByReferralCode, createReferral } from '@/lib/supabase-client'
import { supabase } from '@/lib/supabase'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8049598586:AAH5cF_tyF3M1Lr3gTYfXSoa2jvdMb_Q9Yk"

/**
 * Handle Telegram webhook updates
 */
export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()

    // Handle message updates
    if (update.message) {
      const message = update.message
      const chatId = message.chat.id
      const text = message.text || ''
      const from = message.from

      // Ignore bot messages
      if (from.is_bot) {
        return NextResponse.json({ ok: true })
      }

      // Handle commands
      if (text.startsWith('/')) {
        const command = text.split(' ')[0].toLowerCase()
        const args = text.split(' ').slice(1)

        switch (command) {
          case '/start':
            await handleStartCommand(chatId, from, args)
            break
          case '/app':
          case '/webapp':
            await handleWebAppCommand(chatId, from, args)
            break
          case '/referral':
            await handleReferralCommand(chatId, from)
            break
          case '/balance':
            await handleBalanceCommand(chatId, from)
            break
          case '/stats':
            await handleStatsCommand(chatId, from)
            break
          case '/help':
            await handleHelpCommand(chatId, from)
            break
          case '/link':
            await handleLinkCommand(chatId, from, args)
            break
          default:
            await sendTelegramMessage(
              chatId,
              '❓ Unknown command. Use /help to see available commands.'
            )
        }
      } else {
        // Handle regular messages (could be email for linking)
        await sendTelegramMessage(
          chatId,
          '👋 Hi! Use /help to see available commands.\n\nTo link your account, use: /link your@email.com'
        )
      }
    }

    // Handle callback queries (button presses)
    if (update.callback_query) {
      const callback = update.callback_query
      const chatId = callback.from.id
      const data = callback.data

      if (data === 'get_referral_link') {
        await handleReferralCommand(chatId, callback.from)
      } else if (data === 'get_balance') {
        await handleBalanceCommand(chatId, callback.from)
      } else if (data === 'get_stats') {
        await handleStatsCommand(chatId, callback.from)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Handle /start command
 */
async function handleStartCommand(chatId: number, from: any, args: string[]) {
  const welcomeMessage = `
👋 <b>Welcome to PiNode Labs Bot!</b>

I'm @pinodelabsbot, your assistant for PiNode mining and referrals.

<b>Available Commands:</b>
/start - Show this welcome message
/referral - Get your referral link and stats
/balance - Check your balances
/stats - View detailed statistics
/link - Link your Telegram to your account
/help - Show help message

<b>Quick Actions:</b>
Use the buttons below to get started!
  `.trim()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minety.com'
    const webAppUrl = `${baseUrl}?tgWebAppStartParam=${from.id}`
    
    // Get user to check if they have referral code
    const user = await getUserByTelegramId(chatId)
    let startParam = from.id.toString()
    
    if (user && user.referral_code) {
      startParam = user.referral_code
    }

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📱 Open Web App',
            web_app: { url: `${baseUrl}?tgWebAppStartParam=${startParam}` },
          },
        ],
        [
          { text: '📊 My Stats', callback_data: 'get_stats' },
          { text: '💰 Balance', callback_data: 'get_balance' },
        ],
        [
          { text: '🎁 Referral Link', callback_data: 'get_referral_link' },
        ],
      ],
    }

  // Check if user has referral code in start command
  if (args.length > 0) {
    const referralCode = args[0]
    const user = await getUserByTelegramId(chatId)
    
    if (!user) {
      // User doesn't exist, prompt them to link account first
      await sendTelegramMessage(
        chatId,
        `🔗 <b>Referral Code Detected!</b>\n\nTo use this referral code, please link your account first:\n\n/link your@email.com\n\nThen register on our website with this referral code: <code>${referralCode}</code>`,
        { reply_markup: keyboard }
      )
      return
    }
  }

  await sendTelegramMessage(chatId, welcomeMessage, { reply_markup: keyboard })
}

/**
 * Handle /referral command
 */
async function handleReferralCommand(chatId: number, from: any) {
  const user = await getUserByTelegramId(chatId)

  if (!user) {
    await sendTelegramMessage(
      chatId,
      '❌ Account not linked. Please link your account first:\n\n/link your@email.com'
    )
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minety.com'
  const referralLink = `${baseUrl}/ref/${user.referral_code}`

  const stats = await getUserStats(user.id)
  if (!stats) {
    await sendTelegramMessage(chatId, '❌ Failed to load referral stats.')
    return
  }

  const message = `
🎁 <b>Your Referral Program</b>

🔗 <b>Referral Link:</b>
<code>${referralLink}</code>

📊 <b>Statistics:</b>
👥 Total Referrals: ${stats.referrals.total}
✅ Active Referrals: ${stats.referrals.active}
💰 Total Earned: ${stats.referrals.totalBonusEarned} PiNode
⏳ Pending Bonus: ${stats.referrals.pendingBonus} PiNode (≈ ${(stats.referrals.pendingBonus / 20).toFixed(2)} PI)

💡 <b>How it works:</b>
Share your referral link with friends. Each active friend gives you 100 PiNode (≈ 5 PI Network).

Claim your bonus on the website!
  `.trim()

  await sendTelegramMessage(chatId, message)
}

/**
 * Handle /balance command
 */
async function handleBalanceCommand(chatId: number, from: any) {
  const user = await getUserByTelegramId(chatId)

  if (!user) {
    await sendTelegramMessage(
      chatId,
      '❌ Account not linked. Please link your account first:\n\n/link your@email.com'
    )
    return
  }

  const stats = await getUserStats(user.id)
  if (!stats) {
    await sendTelegramMessage(chatId, '❌ Failed to load balance.')
    return
  }

  const message = `
💰 <b>Your Balances</b>

💎 <b>PI Network:</b> ${stats.balances.piNetwork.toFixed(4)} PI
⛏️ <b>PiNode:</b> ${stats.balances.piNode.toLocaleString()} PiNode

⏳ <b>Mining Balance:</b> ${stats.mining.balance.toFixed(4)} PI
📊 <b>Total Mined:</b> ${stats.mining.totalMined.toFixed(4)} PI

💡 Claim your mining balance on the website!
  `.trim()

  await sendTelegramMessage(chatId, message)
}

/**
 * Handle /stats command
 */
async function handleStatsCommand(chatId: number, from: any) {
  const user = await getUserByTelegramId(chatId)

  if (!user) {
    await sendTelegramMessage(
      chatId,
      '❌ Account not linked. Please link your account first:\n\n/link your@email.com'
    )
    return
  }

  const stats = await getUserStats(user.id)
  if (!stats) {
    await sendTelegramMessage(chatId, '❌ Failed to load stats.')
    return
  }

  const message = `
📊 <b>Your Statistics</b>

<b>💰 Balances:</b>
💎 PI Network: ${stats.balances.piNetwork.toFixed(4)} PI
⛏️ PiNode: ${stats.balances.piNode.toLocaleString()} PiNode

<b>⛏️ Mining:</b>
⏳ Current Balance: ${stats.mining.balance.toFixed(4)} PI
📊 Total Mined: ${stats.mining.totalMined.toFixed(4)} PI

<b>🎁 Referrals:</b>
👥 Total: ${stats.referrals.total}
✅ Active: ${stats.referrals.active}
💰 Earned: ${stats.referrals.totalBonusEarned} PiNode
⏳ Pending: ${stats.referrals.pendingBonus} PiNode

🔗 <b>Referral Code:</b> <code>${stats.user.referral_code}</code>
  `.trim()

  await sendTelegramMessage(chatId, message)
}

/**
 * Handle /link command
 */
async function handleLinkCommand(chatId: number, from: any, args: string[]) {
  if (args.length === 0) {
    await sendTelegramMessage(
      chatId,
      '❌ Please provide your email address:\n\n/link your@email.com'
    )
    return
  }

  const email = args[0].toLowerCase().trim()

  // Basic email validation
  if (!email.includes('@') || !email.includes('.')) {
    await sendTelegramMessage(chatId, '❌ Invalid email format. Please try again.')
    return
  }

  try {
    // Check if user exists
    const existingUser = await getUserByEmail(email)

    if (!existingUser) {
      await sendTelegramMessage(
        chatId,
        `❌ Account not found.\n\nPlease register on our website first, then link your Telegram account.\n\nWebsite: ${process.env.NEXT_PUBLIC_APP_URL || 'https://minety.com'}`
      )
      return
    }

    // Check if Telegram ID is already linked to another account
    const existingTelegramUser = await getUserByTelegramId(chatId)
    if (existingTelegramUser && existingTelegramUser.id !== existingUser.id) {
      await sendTelegramMessage(
        chatId,
        '❌ This Telegram account is already linked to another email address.'
      )
      return
    }

    // Link Telegram account
    const success = await linkTelegramAccount(
      existingUser.id,
      chatId,
      from.username || undefined
    )

    if (success) {
      await sendTelegramMessage(
        chatId,
        `✅ <b>Account Linked Successfully!</b>\n\nYour Telegram account is now linked to:\n<code>${email}</code>\n\nYou'll now receive notifications about your mining, referrals, and more!`
      )
    } else {
      await sendTelegramMessage(chatId, '❌ Failed to link account. Please try again later.')
    }
  } catch (error) {
    console.error('Link account error:', error)
    await sendTelegramMessage(chatId, '❌ An error occurred. Please try again later.')
  }
}

/**
 * Handle /webapp command - Open web app
 */
async function handleWebAppCommand(chatId: number, from: any, args: string[]) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minety.com'
  const webAppUrl = `${baseUrl}?tgWebAppStartParam=${from.id}`
  
  // Get user to check if they have referral code
  const user = await getUserByTelegramId(chatId)
  let startParam = from.id.toString()
  
  if (user && user.referral_code) {
    startParam = user.referral_code
  } else if (args.length > 0) {
    // Allow referral code as parameter
    startParam = args[0]
  }

  const message = `
🚀 <b>Open PiNode Labs Web App</b>

Tap the button below to open the web app in Telegram!

You can:
• Start mining PI
• Check your balances
• Share referral links
• Claim rewards

<a href="${webAppUrl}">📱 Open Web App</a>
  `.trim()

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '📱 Open Web App',
          web_app: { url: webAppUrl },
        },
      ],
      [
        { text: '📊 My Stats', callback_data: 'get_stats' },
        { text: '💰 Balance', callback_data: 'get_balance' },
      ],
    ],
  }

  await sendTelegramMessage(chatId, message, { reply_markup: keyboard })
}

/**
 * Handle /help command
 */
async function handleHelpCommand(chatId: number, from: any) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minety.com'
  const webAppUrl = `${baseUrl}?tgWebAppStartParam=${from.id}`

  const helpMessage = `
📖 <b>PiNode Labs Bot - Help</b>

<b>Available Commands:</b>

/start - Show welcome message and quick actions
/app - Open web app in Telegram
/referral - Get your referral link and statistics
/balance - Check your PI Network and PiNode balances
/stats - View detailed statistics (mining, referrals, balances)
/link - Link your Telegram account to your email
/help - Show this help message

<b>Quick Actions:</b>
<a href="${webAppUrl}">📱 Open Web App</a>

<b>How to get started:</b>
1. Register on our website
2. Use /link your@email.com to link your Telegram
3. Start mining and sharing your referral link!

<b>Need more help?</b>
Visit our website: ${baseUrl}
  `.trim()

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '📱 Open Web App',
          web_app: { url: webAppUrl },
        },
      ],
    ],
  }

  await sendTelegramMessage(chatId, helpMessage, { reply_markup: keyboard })
}

/**
 * GET handler for webhook verification (Telegram requires this)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Telegram webhook endpoint',
    bot: '@pinodelabsbot'
  })
}
