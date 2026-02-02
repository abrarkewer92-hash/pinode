import type React from "react"
import type { Metadata } from "next"
import { Roboto_Condensed } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import TelegramWebAppProvider from "@/components/telegram-webapp-provider"
import "./globals.css"

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "PiNode Labs",
  description: "PiNode Labs — Pi cloud mining dashboard",
  generator: "pinode-labs",
  icons: {
    icon: "/pi/pinetwork.png",
    apple: "/pi/pinetwork.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body
        className={`${robotoCondensed.className} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <TelegramWebAppProvider>
          {children}
        </TelegramWebAppProvider>
        <Analytics />
      </body>
    </html>
  )
}
