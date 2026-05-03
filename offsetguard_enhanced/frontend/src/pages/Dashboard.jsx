import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const stats = [
  { label: 'Total Claims', value: '1,284', delta: '+12%', color: '#00ff88' },
  { label: 'Verified CO₂ Offset', value: '48,230 t', delta: '+8.4%', color: '#00cc6a' },
  { label: 'Trees Counted (AI)', value: '2.4M', delta: '+22%', color: '#00ff88' },
  { label: 'Avg NDVI Score', value: '0.72', delta: '+0.05', color: '#ffb800' },
]

const chartData = [
  { month: 'Jul', claims: 120, offset: 4200 },
  { month: 'Aug', claims: 145, offset: 5100 },
  { month: 'Sep', claims: 132, offset: 4800 },
  { month: 'Oct', claims: 168, offset: 6200 },
  { month: 'Nov', claims: 190, offset: 7100 },
  { month: 'Dec', claims: 225, offset: 8400 },
  { month: 'Jan', claims: 304, offset: 12400 },
]

const recentClaims = [
  { id: 'CLM-2847', company: 'GreenTech Solutions', trees: 12400, ndvi: 0.78, status: 'verified', offset: '820 t' },
  { id: 'CLM-2846', company: 'EcoFuture Pvt Ltd', trees: 8200, ndvi: 0.65, status: 'pending', offset: '542 t' },
  { id: 'CLM-2845', company: 'CarbonCare Inc.', trees: 21000, ndvi: 0.81, status: 'verified', offset: '1,380 t' },
  { id: 'CLM-2844', company: 'Verdant Corp', trees: 4800, ndvi: 0.44, status: 'flagged', offset: '318 t' },
  { id: 'CLM-2843', company: 'SkyGreen Ltd', trees: 15600, ndvi: 0.73, status: 'verified', offset: '1,020 t' },
]

const STATUS_COLORS = {
  verified: '#00ff88',
  pending: '#ffb800',
  flagged: '#ff4444',
}

export default function Dashboard({ navigate }) {
  return (
    <div style={{ padding: '32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>
          Carbon Offset Registry
        </h1>
        <p style={{ color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 13 }}>
          AI-powered verification dashboard — Real-time satellite + YOLO tree counting
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div key={i} className="animate-in" style={{
            animationDelay: `${i * 0.08}s`,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius2)',
            padding: '20px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`
            }} />
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginBottom: 8, letterSpacing: 1 }}>
              {s.label.toUpperCase()}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: s.color }}>{s.delta} this month</p>
          </div>
        ))}
      </div>

      {/* Chart + Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Chart */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius2)',
          padding: '24px',
        }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: 1, marginBottom: 16 }}>
            MONTHLY CLAIMS & CO₂ OFFSET (tonnes)
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorOffset" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#5a8a72" tick={{ fontFamily: 'Space Mono', fontSize: 11 }} />
              <YAxis stroke="#5a8a72" tick={{ fontFamily: 'Space Mono', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#0d1a18', border: '1px solid #1e3d30', borderRadius: 8, fontFamily: 'Space Mono', fontSize: 12 }}
                labelStyle={{ color: '#00ff88' }}
              />
              <Area type="monotone" dataKey="offset" stroke="#00ff88" strokeWidth={2} fill="url(#colorOffset)" name="CO₂ Offset (t)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius2)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: 1, marginBottom: 4 }}>
            QUICK ACTIONS
          </p>
          {[
            { label: '+ Submit New Claim', action: 'claim', accent: true },
            { label: '🗺 Draw Plantation Area', action: 'map', accent: false },
            { label: '🔬 Run AI Verification', action: 'verify', accent: false },
            { label: '⛓ Mint NFT Certificate', action: 'blockchain', accent: false, blockchain: true },
          ].map((btn, i) => (
            <button key={i} onClick={() => navigate(btn.action)} style={{
              background: btn.accent ? 'var(--accent)' : btn.blockchain ? 'rgba(0,255,136,0.06)' : 'var(--bg2)',
              color: btn.accent ? '#060b0e' : btn.blockchain ? 'var(--accent)' : 'var(--text)',
              border: '1px solid ' + (btn.accent ? 'transparent' : btn.blockchain ? 'rgba(0,255,136,0.25)' : 'var(--border)'),
              borderRadius: 'var(--radius)',
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 700,
              textAlign: 'left',
              letterSpacing: '-0.3px',
            }}>
              {btn.label}
            </button>
          ))}

          <div style={{
            marginTop: 'auto',
            background: 'rgba(0,255,136,0.05)',
            border: '1px solid rgba(0,255,136,0.15)',
            borderRadius: 'var(--radius)',
            padding: '12px',
          }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', marginBottom: 4 }}>
              PIPELINE STATUS
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)' }}>
              GEE: ✅ Connected<br/>
              YOLO: ✅ Ready<br/>
              NDVI: ✅ Active<br/>
              Chain: ✅ Online
            </p>
          </div>
        </div>
      </div>

      {/* Recent Claims Table */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius2)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: 1 }}>
            RECENT CLAIMS
          </p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg2)' }}>
              {['Claim ID', 'Company', 'Trees (AI)', 'NDVI', 'CO₂ Offset', 'Status'].map(h => (
                <th key={h} style={{
                  padding: '12px 24px',
                  textAlign: 'left',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--text3)',
                  fontWeight: 400,
                  letterSpacing: 0.5,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentClaims.map((c, i) => (
              <tr key={c.id} style={{
                borderTop: '1px solid var(--border)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 24px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)' }}>{c.id}</td>
                <td style={{ padding: '14px 24px', fontSize: 14, fontWeight: 600 }}>{c.company}</td>
                <td style={{ padding: '14px 24px', fontFamily: 'var(--mono)', fontSize: 13 }}>{c.trees.toLocaleString()}</td>
                <td style={{ padding: '14px 24px', fontFamily: 'var(--mono)', fontSize: 13, color: c.ndvi > 0.6 ? 'var(--accent)' : 'var(--warn)' }}>{c.ndvi}</td>
                <td style={{ padding: '14px 24px', fontFamily: 'var(--mono)', fontSize: 13 }}>{c.offset}</td>
                <td style={{ padding: '14px 24px' }}>
                  <span style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    color: STATUS_COLORS[c.status],
                    background: STATUS_COLORS[c.status] + '18',
                    border: `1px solid ${STATUS_COLORS[c.status]}44`,
                    borderRadius: 4,
                    padding: '3px 10px',
                    letterSpacing: 1,
                  }}>
                    {c.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
