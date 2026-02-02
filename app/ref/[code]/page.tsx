"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import LoadingScreen from "@/components/loading-screen"

export default function ReferralPage() {
  const params = useParams()
  const router = useRouter()
  const referralCode = params?.code as string
  const [isRedirecting, setIsRedirecting] = useState(true)

  useEffect(() => {
    // Immediate redirect without delay for better UX
    const redirect = () => {
      if (referralCode) {
        // Store referral code in localStorage
        localStorage.setItem("referral_code", referralCode)
      }
      
      // Use replace instead of push to avoid adding to history
      router.replace("/")
    }

    // Use requestAnimationFrame for smoother transition
    const rafId = requestAnimationFrame(() => {
      redirect()
      // Hide loading after a brief moment
      setTimeout(() => setIsRedirecting(false), 100)
    })

    return () => cancelAnimationFrame(rafId)
  }, [referralCode, router])

  // Show lightweight loading screen while redirecting
  return <LoadingScreen size="medium" showLogo={true} />
}

