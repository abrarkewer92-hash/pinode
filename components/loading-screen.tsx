'use client'

import React from 'react'
import NodeNetworkBackground from '@/components/node-network-background'

interface LoadingScreenProps {
  size?: 'small' | 'medium' | 'large'
  showLogo?: boolean
}

/**
 * Loading screen component using the smooth turbine animation
 * Optimized for fast rendering with GPU acceleration
 */
const LoadingScreen = React.memo(({ size = 'medium', showLogo = true }: LoadingScreenProps) => {
  const sizeMap = {
    small: 160,
    medium: 208,
    large: 260
  }

  const turbineSize = sizeMap[size]

  return (
    <div 
      className="min-h-screen bg-background flex flex-col items-center justify-center"
      style={{
        willChange: 'contents',
      }}
    >
      <div className="text-center">
        {/* Turbine with Pi Network logo */}
        <div 
          className="mx-auto flex items-center justify-center mb-6"
          style={{
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        >
          <NodeNetworkBackground
            size={turbineSize}
            turbineOnly={true}
            centerLogoUrl={showLogo ? "/pi/pinetwork.png" : undefined}
            className="node-network-loading"
          />
        </div>
        {/* Loading text */}
        <div className="text-[#a5b4fc] text-sm font-medium animate-pulse">
          Loading...
        </div>
      </div>
    </div>
  )
})

LoadingScreen.displayName = 'LoadingScreen'

export default LoadingScreen
