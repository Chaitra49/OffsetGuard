import React, { useState } from 'react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { id: 'claim', label: 'Submit Claim', icon: '📋' },
  { id: 'map', label: 'Map & Draw', icon: '🗺' },
  { id: 'verify', label: 'Verify', icon: '🔬' },
  { id: 'blockchain', label: 'Blockchain', icon: '⛓', accent: true },
]

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

export default function Navbar({ page, setPage, theme, toggleTheme }) {
  const [hovered, setHovered] = useState(null)
  const isDark = theme === 'dark'

  return (
    <nav style={{
      background: 'var(--nav-bg)',
      borderBottom: '1px solid var(--nav-border)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      height: '60px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontFamily: 'var(--mono)',
          fontWeight: 700,
          fontSize: 18,
          color: 'var(--accent)',
          letterSpacing: '-0.5px',
        }}>
          ⬡ OffsetGuard
        </span>
        <span style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--text3)',
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: '2px 6px',
          letterSpacing: 1,
        }}>AI CARBON VERIFIER</span>
      </div>

      {/* Nav Items */}
      <div style={{ display: 'flex', gap: 3 }}>
        {navItems.map(item => {
          const isActive = page === item.id
          const isHovered = hovered === item.id
          const isBlockchain = item.id === 'blockchain'

          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: isActive
                  ? (isBlockchain ? 'rgba(0,255,136,0.12)' : 'var(--bg3)')
                  : isHovered
                    ? 'var(--bg2)'
                    : 'transparent',
                color: isActive
                  ? (isBlockchain ? 'var(--accent)' : 'var(--accent)')
                  : 'var(--text2)',
                border: isActive
                  ? (isBlockchain
                    ? '1px solid rgba(0,255,136,0.35)'
                    : '1px solid var(--border2)')
                  : '1px solid transparent',
                borderRadius: 'var(--radius)',
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--sans)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                position: 'relative',
                boxShadow: isActive && isBlockchain ? '0 0 12px rgba(0,255,136,0.15)' : 'none',
              }}
            >
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              {item.label}
              {isBlockchain && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 6px var(--accent)',
                  animation: 'pulse 2s ease infinite',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Right: Status + Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* System status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 8px var(--accent)',
            display: 'inline-block',
            animation: 'pulse 2s ease infinite',
          }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
            SYSTEM ONLINE
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            width: 40,
            height: 22,
            borderRadius: 11,
            background: isDark
              ? 'rgba(0,255,136,0.15)'
              : 'rgba(0,136,68,0.15)',
            border: `1px solid ${isDark ? 'rgba(0,255,136,0.3)' : 'rgba(0,136,68,0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            padding: '2px',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isDark ? 'translateX(0px)' : 'translateX(18px)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            color: isDark ? '#060b0e' : '#f0f7f4',
            fontSize: 8,
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}>
            {isDark ? <MoonIcon /> : <SunIcon />}
          </div>
        </button>
      </div>
    </nav>
  )
}
