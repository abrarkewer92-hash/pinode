import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8049598586:AAH5cF_tyF3M1Lr3gTYfXSoa2jvdMb_Q9Yk"
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

/**
 * Set Telegram webhook URL
 * This endpoint should be called once to configure the webhook
 * GET /api/telegram/set-webhook?url=https://yourdomain.com/api/telegram/webhook
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const webhookUrl = searchParams.get('url')

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter. Usage: /api/telegram/set-webhook?url=https://yourdomain.com/api/telegram/webhook' },
        { status: 400 }
      )
    }

    // Validate URL
    try {
      new URL(webhookUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Set webhook via Telegram API
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      return NextResponse.json(
        { error: 'Failed to set webhook', details: result },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook set successfully',
      webhookUrl,
      result,
    })
  } catch (error) {
    console.error('Set webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Get current webhook info
 */
export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`, {
      method: 'GET',
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      webhookInfo: result,
    })
  } catch (error) {
    console.error('Get webhook info error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
