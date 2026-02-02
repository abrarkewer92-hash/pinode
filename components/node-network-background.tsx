'use client'

import React, { useState, useEffect } from 'react'

interface NodeNetworkBackgroundProps {
  size?: number
  className?: string
  showCenterLogo?: boolean
  centerLogoUrl?: string
  /** When true, shows only the built-in SVG turbine (no images, no node network). */
  turbineOnly?: boolean
  /** @deprecated Use turbineOnly instead. When set, shows image + optional overlay. */
  imageUrl?: string
  /** @deprecated Use turbineOnly instead. */
  turbineOverlayUrl?: string
}

// Ultra-realistic 3D turbine rotor: industrial mining style, dark purple + silver metallic, sharp edges, studio lighting
const TurbineSvg = React.memo(({ size, cx, cy }: { size: number; cx: number; cy: number }) => {
  const bladeCount = 12
  const innerR = size * 0.085
  const outerR = size * 0.435
  const halfSpan = (Math.PI * 2) / bladeCount * 0.38
  const curveBulge = 1.04

  const blades = React.useMemo(() => {
    return Array.from({ length: bladeCount }, (_, i) => {
      const baseAngle = (i / bladeCount) * Math.PI * 2
      const a1 = baseAngle - halfSpan
      const a2 = baseAngle + halfSpan
      const midAngle = (a1 + a2) / 2
      const c1x = cx + outerR * curveBulge * Math.cos(midAngle)
      const c1y = cy + outerR * curveBulge * Math.sin(midAngle)
      const c2x = cx + innerR * 0.94 * Math.cos(midAngle)
      const c2y = cy + innerR * 0.94 * Math.sin(midAngle)
      const x1 = cx + innerR * Math.cos(a1)
      const y1 = cy + innerR * Math.sin(a1)
      const x2 = cx + innerR * Math.cos(a2)
      const y2 = cy + innerR * Math.sin(a2)
      const x3 = cx + outerR * Math.cos(a2)
      const y3 = cy + outerR * Math.sin(a2)
      const x4 = cx + outerR * Math.cos(a1)
      const y4 = cy + outerR * Math.sin(a1)
      const path = `M ${x1} ${y1} Q ${c2x} ${c2y} ${x2} ${y2} L ${x3} ${y3} Q ${c1x} ${c1y} ${x4} ${y4} Z`
      return { path }
    })
  }, [bladeCount, cx, cy, innerR, outerR, halfSpan, curveBulge])

  return (
    <g 
      className="turbine-spin" 
      style={{ 
        transformOrigin: `${cx}px ${cy}px`,
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      <defs>
        {/* Blade: premium metallic – studio light top-left, silver highlight, dark purple base & shadow */}
        <linearGradient id="turbine-blade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c0c0c8" />
          <stop offset="18%" stopColor="#8b8b9a" />
          <stop offset="40%" stopColor="#4c1d95" />
          <stop offset="70%" stopColor="#2e1060" />
          <stop offset="100%" stopColor="#1a0a3e" />
        </linearGradient>
        {/* Leading edge reflection */}
        <linearGradient id="turbine-blade-edge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8e8f0" />
          <stop offset="30%" stopColor="#a0a0b0" />
          <stop offset="100%" stopColor="#3d3d50" />
        </linearGradient>
        {/* Outer housing: dark purple + silver metallic */}
        <linearGradient id="turbine-housing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b6b7a" />
          <stop offset="45%" stopColor="#3d2d6b" />
          <stop offset="100%" stopColor="#5a5a6a" />
        </linearGradient>
        <radialGradient id="turbine-hub" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#7a7a88" />
          <stop offset="45%" stopColor="#4c1d95" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </radialGradient>
        <radialGradient id="turbine-hub-inner" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2e1060" />
          <stop offset="100%" stopColor="#0d0618" />
        </radialGradient>
        {/* Realistic shadow on blades (studio lighting) */}
        <filter id="turbine-blade-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="#0a0618" floodOpacity="0.65" />
        </filter>
        <filter id="turbine-blade-shadow-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#1e1b4b" floodOpacity="0.4" />
        </filter>
      </defs>
      {/* Outer ring – industrial housing, sharp edge */}
      <circle
        cx={cx}
        cy={cy}
        r={outerR + 2.5}
        fill="none"
        stroke="url(#turbine-housing)"
        strokeWidth={2.2}
        opacity={0.98}
      />
      <circle
        cx={cx}
        cy={cy}
        r={outerR + 0.8}
        fill="none"
        stroke="#9a9aaa"
        strokeWidth={0.5}
        opacity={0.7}
      />
      {/* Blades – smooth aerodynamic, metallic, realistic shadows */}
      {blades.map((blade, i) => (
        <path
          key={i}
          d={blade.path}
          fill="url(#turbine-blade)"
          stroke="url(#turbine-blade-edge)"
          strokeWidth={0.45}
          filter="url(#turbine-blade-shadow)"
        />
      ))}
      {/* Center hub – premium metallic, bevel, dark purple + silver */}
      <circle
        cx={cx}
        cy={cy}
        r={innerR * 1.45}
        fill="url(#turbine-hub)"
        stroke="#6b6b7a"
        strokeWidth={0.9}
      />
      <circle
        cx={cx}
        cy={cy}
        r={innerR * 0.82}
        fill="url(#turbine-hub-inner)"
        stroke="#3d2d6b"
        strokeWidth={0.5}
      />
    </g>
  )
})
TurbineSvg.displayName = 'TurbineSvg'

const NodeNetworkBackground = React.memo(function NodeNetworkBackground({
  size = 260,
  className = '',
  showCenterLogo = false,
  centerLogoUrl = '/pi/pinetwork.png',
  turbineOnly = false,
  imageUrl,
  turbineOverlayUrl
}: NodeNetworkBackgroundProps) {
  const cx = size / 2
  const cy = size / 2
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration mismatch by only rendering turbine on client-side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Turbine-only mode: built-in SVG turbine + Pi Network logo in center
  if (turbineOnly) {
    const logoSize = Math.round(size * 0.22) // fits inside hub
    return (
      <div
        className={`relative node-network-container overflow-hidden rounded-2xl ${className}`}
        style={{
          width: size,
          height: size,
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
        }}
      >
        {isMounted ? (
          <svg
            className="absolute inset-0"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ 
              overflow: 'visible',
              transform: 'translateZ(0)',
            }}
          >
            <TurbineSvg size={size} cx={cx} cy={cy} />
          </svg>
        ) : (
          // Placeholder during SSR to prevent hydration mismatch
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              width: size,
              height: size,
            }}
          />
        )}
        {/* Pi Network logo – perfectly centered di tengah turbin */}
        {isMounted && centerLogoUrl && (
          <img
            src={centerLogoUrl}
            alt="Pi Network"
            className="absolute object-contain pointer-events-none z-10 rounded-full"
            style={{
              width: logoSize,
              height: logoSize,
              left: `${cx - logoSize / 2}px`,
              top: `${cy - logoSize / 2}px`,
              imageRendering: 'auto',
            }}
            loading="eager"
            decoding="async"
          />
        )}
      </div>
    )
  }

  // Legacy image mode (deprecated)
  if (imageUrl) {
    return (
      <div
        className={`relative node-network-container overflow-hidden rounded-2xl ${className}`}
        style={{
          width: size,
          height: size,
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
        }}
      >
        <img
          src={imageUrl}
          alt="Industrial turbine at mining site"
          className="absolute inset-0 w-full h-full object-cover object-center rounded-2xl"
          style={{
            imageRendering: 'auto',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
          }}
          loading="eager"
          decoding="async"
        />
        {turbineOverlayUrl && (
          <img
            src={turbineOverlayUrl}
            alt=""
            role="presentation"
            className="absolute inset-0 m-auto w-[58%] h-[58%] object-contain pointer-events-none turbine-spin"
            style={{
              imageRendering: 'auto',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
            }}
            loading="eager"
            decoding="async"
          />
        )}
      </div>
    )
  }

  // Reduced node count for better performance
  const nodes = React.useMemo(() => {
    const nodeCount = 8
    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.35

    return Array.from({ length: nodeCount }, (_, i) => {
      const angle = (i / nodeCount) * Math.PI * 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      return { x, y, id: i }
    })
  }, [size])

  // Reduced connections - only connect to nearest neighbors
  const connections = React.useMemo(() => {
    const conns: Array<{ from: number; to: number; delay: number }> = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 1; j <= 2; j++) {
        const nextIndex = (i + j) % nodes.length
        conns.push({
          from: i,
          to: nextIndex,
          delay: i * 0.3 + j * 0.15
        })
      }
    }
    return conns
  }, [nodes])

  return (
    <div
      className={`relative node-network-container ${className}`}
      style={{
        width: size,
        height: size,
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform'
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(88, 28, 135, 0.25) 0%, rgba(30, 27, 75, 0.4) 40%, rgba(15, 23, 42, 0.7) 70%, rgba(7, 5, 20, 0.9) 100%)',
        }}
      />

      <svg
        className="absolute inset-0 node-network-svg"
        width={size}
        height={size}
        style={{
          overflow: 'visible',
          transformOrigin: 'center center',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform'
        }}
      >
        {connections.map((conn, idx) => {
          const fromNode = nodes[conn.from]
          const toNode = nodes[conn.to]
          return (
            <line
              key={`${conn.from}-${conn.to}-${idx}`}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke="rgba(147, 51, 234, 0.3)"
              strokeWidth="1"
              className="node-network-line"
              style={{ animationDelay: `${conn.delay}s` }}
            />
          )
        })}
        {nodes.map((node) => (
          <g key={node.id} className="node-network-node-group">
            <circle
              cx={node.x}
              cy={node.y}
              r="4"
              fill="rgba(192, 132, 252, 0.9)"
              className="node-network-main"
              style={{ animationDelay: `${node.id * 0.2}s` }}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r="2"
              fill="rgba(221, 214, 254, 1)"
              className="node-network-core"
              style={{ animationDelay: `${node.id * 0.15}s` }}
            />
          </g>
        ))}
      </svg>

      {showCenterLogo && (
        <img
          src={centerLogoUrl}
          alt="Center logo"
          className="absolute inset-0 m-auto rounded-full object-contain z-10"
          style={{
            width: `${Math.min(size * 0.27, 70)}px`,
            height: `${Math.min(size * 0.27, 70)}px`,
            imageRendering: 'auto',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            transform: 'translate3d(0, 0, 0)',
          }}
        />
      )}
    </div>
  )
})

NodeNetworkBackground.displayName = 'NodeNetworkBackground'

export default NodeNetworkBackground
