/**
 * Telegram Web Apps API Integration
 * Documentation: https://core.telegram.org/bots/webapps
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          query_id?: string
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
            is_premium?: boolean
            photo_url?: string
          }
          auth_date: number
          hash: string
          start_param?: string
        }
        version: string
        platform: string
        colorScheme: 'light' | 'dark'
        themeParams: {
          bg_color?: string
          text_color?: string
          hint_color?: string
          link_color?: string
          button_color?: string
          button_text_color?: string
          secondary_bg_color?: string
        }
        isExpanded: boolean
        viewportHeight: number
        viewportStableHeight: number
        headerColor: string
        backgroundColor: string
        isClosingConfirmationEnabled: boolean
        BackButton: {
          isVisible: boolean
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
          show: () => void
          hide: () => void
        }
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          isProgressVisible: boolean
          setText: (text: string) => void
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
          show: () => void
          hide: () => void
          enable: () => void
          disable: () => void
          showProgress: (leaveActive?: boolean) => void
          hideProgress: () => void
          setParams: (params: {
            text?: string
            color?: string
            text_color?: string
            is_active?: boolean
            is_visible?: boolean
          }) => void
        }
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
        CloudStorage: {
          setItem: (key: string, value: string, callback?: (error: Error | null, success: boolean) => void) => void
          getItem: (key: string, callback: (error: Error | null, value: string | null) => void) => void
          getItems: (keys: string[], callback: (error: Error | null, values: Record<string, string>) => void) => void
          removeItem: (key: string, callback?: (error: Error | null, success: boolean) => void) => void
          removeItems: (keys: string[], callback?: (error: Error | null, success: boolean) => void) => void
          getKeys: (callback: (error: Error | null, keys: string[]) => void) => void
        }
        ready: () => void
        expand: () => void
        close: () => void
        sendData: (data: string) => void
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void
        openTelegramLink: (url: string) => void
        openInvoice: (url: string, callback?: (status: string) => void) => void
        showPopup: (params: {
          title?: string
          message: string
          buttons?: Array<{
            id?: string
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
            text: string
          }>
        }, callback?: (id: string) => void) => void
        showAlert: (message: string, callback?: () => void) => void
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void
        showScanQrPopup: (params: {
          text?: string
        }, callback?: (data: string) => void) => void
        closeScanQrPopup: () => void
        readTextFromClipboard: (callback?: (text: string) => void) => void
        requestWriteAccess: (callback?: (granted: boolean) => void) => void
        requestContact: (callback?: (granted: boolean) => void) => void
        onEvent: (eventType: string, eventHandler: () => void) => void
        offEvent: (eventType: string, eventHandler: () => void) => void
      }
    }
  }
}

export interface TelegramWebAppUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

export class TelegramWebApp {
  private static instance: TelegramWebApp | null = null
  private webApp: Window['Telegram']['WebApp'] | null = null
  private isReady = false

  private constructor() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp
      this.webApp.ready()
      this.isReady = true
      
      // Expand viewport
      this.webApp.expand()
      
      // Enable closing confirmation
      this.webApp.enableClosingConfirmation()
    }
  }

  static getInstance(): TelegramWebApp {
    if (!TelegramWebApp.instance) {
      TelegramWebApp.instance = new TelegramWebApp()
    }
    return TelegramWebApp.instance
  }

  /**
   * Check if app is running in Telegram
   */
  isInTelegram(): boolean {
    return this.webApp !== null && this.isReady
  }

  /**
   * Get Telegram user data
   */
  getUser(): TelegramWebAppUser | null {
    return this.webApp?.initDataUnsafe?.user || null
  }

  /**
   * Get Telegram user ID
   */
  getUserId(): number | null {
    return this.getUser()?.id || null
  }

  /**
   * Get start parameter (from deep link)
   */
  getStartParam(): string | null {
    return this.webApp?.initDataUnsafe?.start_param || null
  }

  /**
   * Get theme (light/dark)
   */
  getTheme(): 'light' | 'dark' {
    return this.webApp?.colorScheme || 'dark'
  }

  /**
   * Get theme colors
   */
  getThemeParams() {
    return this.webApp?.themeParams || {}
  }

  /**
   * Show main button
   */
  showMainButton(text: string, onClick: () => void, options?: {
    color?: string
    textColor?: string
  }) {
    if (!this.webApp) return

    this.webApp.MainButton.setText(text)
    if (options?.color) {
      this.webApp.MainButton.setParams({
        color: options.color,
        text_color: options.textColor || '#ffffff',
      })
    }
    this.webApp.MainButton.onClick(onClick)
    this.webApp.MainButton.show()
  }

  /**
   * Hide main button
   */
  hideMainButton() {
    if (!this.webApp) return
    this.webApp.MainButton.hide()
  }

  /**
   * Show back button
   */
  showBackButton(onClick: () => void) {
    if (!this.webApp) return
    this.webApp.BackButton.onClick(onClick)
    this.webApp.BackButton.show()
  }

  /**
   * Hide back button
   */
  hideBackButton() {
    if (!this.webApp) return
    this.webApp.BackButton.hide()
  }

  /**
   * Haptic feedback
   */
  hapticFeedback(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') {
    if (!this.webApp) return
    this.webApp.HapticFeedback.impactOccurred(style)
  }

  /**
   * Show alert
   */
  showAlert(message: string, callback?: () => void) {
    if (!this.webApp) {
      window.alert(message)
      callback?.()
      return
    }
    this.webApp.showAlert(message, callback)
  }

  /**
   * Show confirm dialog
   */
  showConfirm(message: string, callback?: (confirmed: boolean) => void) {
    if (!this.webApp) {
      const confirmed = window.confirm(message)
      callback?.(confirmed)
      return
    }
    this.webApp.showConfirm(message, callback)
  }

  /**
   * Show popup
   */
  showPopup(params: {
    title?: string
    message: string
    buttons?: Array<{
      id?: string
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
      text: string
    }>
  }, callback?: (id: string) => void) {
    if (!this.webApp) {
      window.alert(params.message)
      callback?.('ok')
      return
    }
    this.webApp.showPopup(params, callback)
  }

  /**
   * Open link
   */
  openLink(url: string, options?: { try_instant_view?: boolean }) {
    if (!this.webApp) {
      window.open(url, '_blank')
      return
    }
    this.webApp.openLink(url, options)
  }

  /**
   * Open Telegram link
   */
  openTelegramLink(url: string) {
    if (!this.webApp) {
      window.open(url, '_blank')
      return
    }
    this.webApp.openTelegramLink(url)
  }

  /**
   * Share referral link via Telegram
   */
  shareReferralLink(referralLink: string, referralCode: string) {
    if (!this.webApp) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(referralLink)
      this.showAlert('Referral link copied to clipboard!')
      return
    }

    const message = `🎁 Join PiNode Labs and start mining PI!\n\nUse my referral code: ${referralCode}\n\n${referralLink}`
    
    // Use Telegram's share functionality
    this.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`)
  }

  /**
   * Send data back to bot
   */
  sendData(data: string) {
    if (!this.webApp) return
    this.webApp.sendData(data)
  }

  /**
   * Close web app
   */
  close() {
    if (!this.webApp) return
    this.webApp.close()
  }

  /**
   * Get viewport height
   */
  getViewportHeight(): number {
    return this.webApp?.viewportHeight || window.innerHeight
  }

  /**
   * Set header color
   */
  setHeaderColor(color: string) {
    if (!this.webApp) return
    this.webApp.headerColor = color
  }

  /**
   * Set background color
   */
  setBackgroundColor(color: string) {
    if (!this.webApp) return
    this.webApp.backgroundColor = color
  }
}

/**
 * Hook to use Telegram Web App
 */
export function useTelegramWebApp() {
  if (typeof window === 'undefined') {
    return {
      isInTelegram: false,
      webApp: null,
      user: null,
      theme: 'dark' as const,
    }
  }

  const webApp = TelegramWebApp.getInstance()
  
  return {
    isInTelegram: webApp.isInTelegram(),
    webApp: webApp.isInTelegram() ? webApp : null,
    user: webApp.getUser(),
    userId: webApp.getUserId(),
    theme: webApp.getTheme(),
    themeParams: webApp.getThemeParams(),
    startParam: webApp.getStartParam(),
  }
}
