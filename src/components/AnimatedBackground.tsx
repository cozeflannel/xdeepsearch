'use client'

import { useEffect, useState } from 'react'

export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme')
    setIsDark(stored !== 'light')
  }, [])

  if (!mounted) return null

  // Opacity multiplier — higher in dark mode, lower in light mode
  const op = isDark ? 1 : 0.5

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          opacity: isDark ? 0.04 : 0.02,
        }}
      />

      {/* Primary glow orb — bottom left, electric blue */}
      <div
        className="absolute rounded-full"
        style={{
          background: `radial-gradient(circle at center, rgba(29,155,240,${0.28 * op}) 0%, rgba(29,155,240,${0.10 * op}) 40%, transparent 70%)`,
          width: '700px',
          height: '700px',
          bottom: '-250px',
          left: '-150px',
          animation: 'floatOrb1 18s ease-in-out infinite',
          filter: 'blur(50px)',
        }}
      />

      {/* Secondary glow orb — top right, indigo/purple */}
      <div
        className="absolute rounded-full"
        style={{
          background: `radial-gradient(circle at center, rgba(121,75,196,${0.22 * op}) 0%, rgba(121,75,196,${0.08 * op}) 40%, transparent 70%)`,
          width: '600px',
          height: '600px',
          top: '-180px',
          right: '-100px',
          animation: 'floatOrb2 24s ease-in-out infinite',
          filter: 'blur(60px)',
        }}
      />

      {/* Tertiary glow — center-right, electric blue accent */}
      <div
        className="absolute rounded-full"
        style={{
          background: `radial-gradient(circle at center, rgba(29,155,240,${0.14 * op}) 0%, transparent 70%)`,
          width: '500px',
          height: '500px',
          top: '30%',
          right: '10%',
          animation: 'floatOrb3 16s ease-in-out infinite',
          filter: 'blur(70px)',
        }}
      />

      {/* Subtle grid — very faint, dark only */}
      {isDark && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />
      )}

      <style>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -40px) scale(1.06); }
          66% { transform: translate(-30px, 25px) scale(0.96); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-60px, 40px) scale(1.1); }
          70% { transform: translate(30px, -25px) scale(0.94); }
        }
        @keyframes floatOrb3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -20px); }
        }
      `}</style>
    </div>
  )
}
