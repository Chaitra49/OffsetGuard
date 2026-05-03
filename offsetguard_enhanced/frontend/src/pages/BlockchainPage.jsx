import React, { useState, useEffect } from 'react'

// ─── Helpers ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const generateTxHash = () =>
  '0x' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')

const generateTokenId = () =>
  Math.floor(Math.random() * 999999) + 100000

const generateVerificationHash = (data) => {
  const str = JSON.stringify(data) + Date.now()
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0').slice(0, 64)
}

const MOCK_CONTRACT = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
const MOCK_CHAIN = 'Polygon Mumbai Testnet'
const MOCK_EXPLORER = 'https://mumbai.polygonscan.com/tx/'

// ─── Pre-seeded certificates (mock existing registry) ────────────────────────
const SEED_CERTIFICATES = [
  {
    tokenId: 421847,
    company: 'GreenTech Solutions',
    claimId: 'CLM-2845',
    offsetAmount: '1,380 t CO₂/yr',
    ndvi: 0.81,
    trees: 21000,
    score: 92,
    status: 'VERIFIED',
    txHash: '0x3f8a2b91c4e6d047a1f95b8c3e72d4a09f1b6c8e2d5a7f3b9c1e4d6a8f0b2c4e',
    verificationHash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    mintedAt: '2025-12-14T09:22:11Z',
    explorerUrl: 'https://mumbai.polygonscan.com/tx/0x3f8a2b91c4',
    contractAddress: MOCK_CONTRACT,
    chain: MOCK_CHAIN,
    iotVerified: true,
    aiVerified: true,
    satelliteVerified: true,
  },
  {
    tokenId: 387291,
    company: 'SkyGreen Ltd',
    claimId: 'CLM-2843',
    offsetAmount: '1,020 t CO₂/yr',
    ndvi: 0.73,
    trees: 15600,
    score: 85,
    status: 'VERIFIED',
    txHash: '0x9c2d4e6f8a0b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1',
    verificationHash: '0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    mintedAt: '2025-12-10T14:45:33Z',
    explorerUrl: 'https://mumbai.polygonscan.com/tx/0x9c2d4e6f8a',
    contractAddress: MOCK_CONTRACT,
    chain: MOCK_CHAIN,
    iotVerified: true,
    aiVerified: true,
    satelliteVerified: true,
  },
  {
    tokenId: 302944,
    company: 'CarbonCare Inc.',
    claimId: 'CLM-2840',
    offsetAmount: '820 t CO₂/yr',
    ndvi: 0.67,
    trees: 12400,
    score: 78,
    status: 'VERIFIED',
    txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    verificationHash: '0xf1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    mintedAt: '2025-12-05T11:02:55Z',
    explorerUrl: 'https://mumbai.polygonscan.com/tx/0x1a2b3c4d5e',
    contractAddress: MOCK_CONTRACT,
    chain: MOCK_CHAIN,
    iotVerified: true,
    aiVerified: false,
    satelliteVerified: true,
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ text, color, size = 11 }) {
  return (
    <span style={{
      fontFamily: 'var(--mono)',
      fontSize: size,
      color,
      background: color + '18',
      border: `1px solid ${color}44`,
      borderRadius: 4,
      padding: '3px 10px',
      letterSpacing: 0.8,
      whiteSpace: 'nowrap',
    }}>{text}</span>
  )
}

function VerificationBadge({ label, ok }) {
  const color = ok ? 'var(--accent)' : 'var(--text3)'
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--mono)',
      fontSize: 11,
      color,
    }}>
      <span style={{ fontSize: 13 }}>{ok ? '✅' : '⬜'}</span>
      {label}
    </div>
  )
}

function MintProgressLog({ log, stage }) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '16px',
      minHeight: 180,
      maxHeight: 260,
      overflowY: 'auto',
      fontFamily: 'var(--mono)',
      fontSize: 12,
    }}>
      {log.length === 0 && (
        <p style={{ color: 'var(--text3)', textAlign: 'center', paddingTop: 40 }}>
          Ready to mint. Click "Mint NFT Certificate" to begin.
        </p>
      )}
      {log.map((entry, i) => (
        <div key={i} style={{
          display: 'flex', gap: 12, marginBottom: 8,
          color: entry.type === 'success' ? 'var(--accent)'
            : entry.type === 'warn' ? 'var(--warn)'
              : entry.type === 'error' ? 'var(--danger)'
                : 'var(--text2)',
        }}>
          <span style={{ color: 'var(--text3)', minWidth: 60 }}>{entry.time}</span>
          <span>{entry.msg}</span>
        </div>
      ))}
      {stage === 'minting' && (
        <span style={{ color: 'var(--accent)', animation: 'pulse 1s ease infinite' }}>▌</span>
      )}
    </div>
  )
}

function NFTCard({ cert, onDownload }) {
  const [flipped, setFlipped] = useState(false)
  const [copied, setCopied] = useState(null)

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div
      className="animate-in"
      style={{
        background: 'var(--nft-gradient)',
        border: '1px solid var(--nft-border)',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,255,136,0.15)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Top accent bar with gradient */}
      <div style={{
        height: 3,
        background: 'linear-gradient(90deg, transparent, var(--accent), #00aaff, var(--accent), transparent)',
        animation: 'shimmer 3s ease infinite',
        backgroundSize: '200% 100%',
      }} />

      {/* NFT Header */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--accent)',
              background: 'rgba(0,255,136,0.1)',
              border: '1px solid rgba(0,255,136,0.2)',
              borderRadius: 4,
              padding: '2px 8px',
              letterSpacing: 1,
            }}>NFT #{cert.tokenId}</span>
            <Badge text="VERIFIED" color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            {cert.company}
          </h3>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            {cert.claimId} · {new Date(cert.mintedAt).toLocaleDateString()}
          </p>
        </div>
        {/* NFT Icon */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,170,255,0.1))',
          border: '1px solid rgba(0,255,136,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          animation: 'float 4s ease infinite',
        }}>
          🌿
        </div>
      </div>

      {/* Core data */}
      <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { label: 'CO₂ OFFSET', value: cert.offsetAmount, color: 'var(--accent)' },
          { label: 'NDVI SCORE', value: cert.ndvi.toFixed(2), color: cert.ndvi > 0.7 ? 'var(--accent)' : 'var(--warn)' },
          { label: 'TREES', value: cert.trees.toLocaleString(), color: 'var(--text)' },
        ].map(m => (
          <div key={m.label} style={{
            background: 'var(--bg2)',
            borderRadius: 8,
            padding: '10px 12px',
            textAlign: 'center',
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: 1, marginBottom: 4 }}>{m.label}</p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Verification modules */}
      <div style={{
        padding: '10px 20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: 16,
      }}>
        <VerificationBadge label="IoT Sensors" ok={cert.iotVerified} />
        <VerificationBadge label="AI / YOLO" ok={cert.aiVerified} />
        <VerificationBadge label="Satellite" ok={cert.satelliteVerified} />
      </div>

      {/* Hash details */}
      <div style={{ padding: '10px 20px 0', borderTop: '1px solid var(--border)' }}>
        {[
          { label: 'TX HASH', value: cert.txHash, key: 'tx' },
          { label: 'VERIFY HASH', value: cert.verificationHash, key: 'vh' },
          { label: 'CONTRACT', value: cert.contractAddress, key: 'ct' },
        ].map(row => (
          <div key={row.key} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 0',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', minWidth: 80 }}>{row.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, overflow: 'hidden' }}>
              <span style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--text2)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}>
                {row.value.slice(0, 20)}…{row.value.slice(-8)}
              </span>
              <button
                onClick={() => copy(row.value, row.key)}
                title="Copy"
                style={{
                  background: 'var(--bg2)',
                  color: copied === row.key ? 'var(--accent)' : 'var(--text3)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 10,
                  fontFamily: 'var(--mono)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {copied === row.key ? '✓' : 'copy'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Chain info + Actions */}
      <div style={{ padding: '12px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 10 }}>⛓</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>{cert.chain}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>·</span>
          <span style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--accent)',
            background: 'rgba(0,255,136,0.08)',
            border: '1px solid rgba(0,255,136,0.15)',
            borderRadius: 4,
            padding: '1px 6px',
          }}>IMMUTABLE</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onDownload(cert)}
            style={{
              flex: 1,
              background: 'var(--accent)',
              color: 'var(--bg)',
              borderRadius: 'var(--radius)',
              padding: '9px 0',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--sans)',
            }}
          >
            ⬇ Download Cert
          </button>
          <a
            href={cert.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              background: 'var(--bg2)',
              color: 'var(--text2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '9px 0',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--sans)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            🔗 Explorer
          </a>
        </div>
      </div>
    </div>
  )
}

function SmartContractPanel() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius2)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          color: 'var(--text)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14 }}>📜</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: 1 }}>
            SMART CONTRACT DETAILS
          </span>
        </div>
        <span style={{ color: 'var(--text3)', fontSize: 12, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            {[
              { label: 'Contract Address', value: MOCK_CONTRACT },
              { label: 'Network', value: MOCK_CHAIN },
              { label: 'Standard', value: 'ERC-721 (Non-Fungible Token)' },
              { label: 'Compiler', value: 'Solidity ^0.8.20' },
              { label: 'Verification', value: 'Source Verified ✅' },
              { label: 'Proxy', value: 'None (Immutable)' },
            ].map(item => (
              <div key={item.label}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 0.8, marginBottom: 4 }}>
                  {item.label.toUpperCase()}
                </p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)' }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 16,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '12px 16px',
          }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 1, marginBottom: 8 }}>
              ABI FUNCTIONS
            </p>
            {[
              'mintCertificate(address to, string claimId, uint256 offsetTonnes, string metadataURI)',
              'verifyCertificate(uint256 tokenId) → (bool valid, string status)',
              'getCertificateData(uint256 tokenId) → (CertData)',
              'burnIfFraud(uint256 tokenId) [onlyOwner]',
            ].map((fn, i) => (
              <div key={i} style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: i === 0 ? 'var(--accent)' : 'var(--text2)',
                padding: '4px 0',
                borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ color: 'var(--text3)' }}>fn </span>{fn}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BlockchainPage({ claimData, verificationResult, navigate }) {
  const [mintStage, setMintStage] = useState('idle') // idle | checking | minting | done | error
  const [mintLog, setMintLog] = useState([])
  const [mintedCert, setMintedCert] = useState(null)
  const [certificates, setCertificates] = useState(SEED_CERTIFICATES)
  const [activeTab, setActiveTab] = useState('mint') // mint | registry
  const [filter, setFilter] = useState('all')

  const addLog = (msg, type = 'info') => {
    setMintLog(l => [...l, { msg, type, time: new Date().toLocaleTimeString() }])
  }

  const canMint = verificationResult?.status === 'VERIFIED' && claimData?.company

  const handleMint = async () => {
    if (!canMint) return
    setMintStage('checking')
    setMintLog([])

    addLog('🔍 Fetching company details from claim registry…', 'info')
    await sleep(700)
    addLog(`✅ Company: ${claimData.company}`, 'success')
    addLog(`📋 Claim ID: ${claimData.claimId}`, 'success')
    await sleep(500)

    addLog('⚙️ Validating IoT sensor data before minting…', 'info')
    await sleep(800)
    addLog(`✅ IoT CO₂ reading: ${claimData.iotCO2 || '12.4'} t/day — confirmed`, 'success')
    await sleep(400)

    addLog('🤖 Cross-referencing with AI verification results…', 'info')
    await sleep(700)
    addLog(`✅ AI Score: ${verificationResult.score}/100 — PASSED`, 'success')
    addLog(`✅ NDVI: ${verificationResult.ndvi} · YOLO Trees: ${verificationResult.yoloTrees?.toLocaleString()}`, 'success')
    await sleep(500)

    addLog('🛰 Satellite verification module — checking…', 'info')
    await sleep(900)
    addLog('✅ Satellite imagery cross-check passed', 'success')
    await sleep(300)

    setMintStage('minting')
    addLog('\n⛓ Initiating blockchain transaction…', 'info')
    await sleep(600)
    addLog(`📡 Broadcasting to ${MOCK_CHAIN}…`, 'info')
    await sleep(1100)
    addLog('⏳ Waiting for block confirmation (1/3)…', 'info')
    await sleep(800)
    addLog('⏳ Block confirmation (2/3)…', 'info')
    await sleep(700)
    addLog('⏳ Block confirmation (3/3)…', 'info')
    await sleep(600)

    // Generate cert
    const tokenId = generateTokenId()
    const txHash = generateTxHash()
    const verificationHash = generateVerificationHash({ claimData, verificationResult })
    const now = new Date().toISOString()

    const newCert = {
      tokenId,
      company: claimData.company,
      claimId: claimData.claimId,
      offsetAmount: `${verificationResult.computedOffset?.toLocaleString() || '820'} t CO₂/yr`,
      ndvi: verificationResult.ndvi,
      trees: verificationResult.yoloTrees || parseInt(claimData.treesPlanted) || 10000,
      score: verificationResult.score,
      status: 'VERIFIED',
      txHash,
      verificationHash,
      mintedAt: now,
      explorerUrl: MOCK_EXPLORER + txHash.slice(0, 20),
      contractAddress: MOCK_CONTRACT,
      chain: MOCK_CHAIN,
      iotVerified: true,
      aiVerified: true,
      satelliteVerified: true,
    }

    addLog(`\n✅ NFT Minted! Token ID: #${tokenId}`, 'success')
    addLog(`🔗 TX: ${txHash.slice(0, 20)}…`, 'success')
    addLog(`🔐 Verification Hash: ${verificationHash.slice(0, 20)}…`, 'success')
    addLog('🎉 Certificate is now permanently recorded on-chain!', 'success')

    setMintedCert(newCert)
    setCertificates(prev => [newCert, ...prev])
    setMintStage('done')
  }

  const handleDownload = (cert) => {
    const certData = {
      certificate: 'CARBON_OFFSET_NFT_CERTIFICATE',
      standard: 'ERC-721',
      network: cert.chain,
      contractAddress: cert.contractAddress,
      tokenId: cert.tokenId,
      claimId: cert.claimId,
      company: cert.company,
      issuedAt: cert.mintedAt,
      offsetAmount: cert.offsetAmount,
      ndviScore: cert.ndvi,
      treesVerified: cert.trees,
      verificationScore: cert.score,
      transactionHash: cert.txHash,
      verificationHash: cert.verificationHash,
      explorerUrl: cert.explorerUrl,
      modules: {
        iotVerified: cert.iotVerified,
        aiVerified: cert.aiVerified,
        satelliteVerified: cert.satelliteVerified,
      },
      signedBy: 'OffsetGuard Blockchain Module v1.0',
      disclaimer: 'This NFT certificate is issued on a testnet for demonstration purposes.',
    }
    const blob = new Blob([JSON.stringify(certData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `NFT_cert_${cert.claimId}_${cert.tokenId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredCerts = filter === 'all'
    ? certificates
    : certificates.filter(c => c.company.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div style={{ padding: '32px', maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--accent)',
              letterSpacing: 1.2,
              background: 'rgba(0,255,136,0.08)',
              border: '1px solid rgba(0,255,136,0.2)',
              borderRadius: 4,
              padding: '3px 10px',
            }}>⛓ BLOCKCHAIN MODULE</span>
            <Badge text={`${certificates.length} CERTS ISSUED`} color="var(--accent)" />
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 6 }}>
            Carbon Credit NFT Registry
          </h1>
          <p style={{ color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 12 }}>
            Blockchain-certified carbon offset certificates · ERC-721 · {MOCK_CHAIN}
          </p>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'Total NFTs', value: certificates.length },
            { label: 'CO₂ Certified', value: '3,220 t' },
            { label: 'Avg Score', value: '85/100' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px 18px',
              textAlign: 'center',
              minWidth: 100,
            }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: 1, marginBottom: 4 }}>
                {s.label.toUpperCase()}
              </p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[
          { id: 'mint', label: '⚡ Mint Certificate', desc: 'Issue new NFT' },
          { id: 'registry', label: '📜 Issued Certificates', desc: `${certificates.length} on-chain` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'var(--card)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text2)',
              border: activeTab === tab.id
                ? '1px solid var(--border)'
                : '1px solid transparent',
              borderBottom: activeTab === tab.id
                ? '1px solid var(--card)'
                : '1px solid transparent',
              borderRadius: '8px 8px 0 0',
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--sans)',
              marginBottom: activeTab === tab.id ? -1 : 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 2,
            }}
          >
            {tab.label}
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: 0.5 }}>
              {tab.desc}
            </span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════ MINT TAB ═══════════════════════ */}
      {activeTab === 'mint' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Left: Company info + Mint panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Company Details Card */}
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius2)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: 1 }}>
                  COMPANY DETAILS
                </p>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {claimData ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Company', value: claimData.company || '—' },
                      { label: 'Claim ID', value: claimData.claimId || '—' },
                      { label: 'Email', value: claimData.contactEmail || '—' },
                      { label: 'Species', value: claimData.species || '—' },
                      { label: 'Trees Planted', value: parseInt(claimData.treesPlanted || 0).toLocaleString() },
                      { label: 'Area (sq.km)', value: claimData.areaSqKm || '—' },
                    ].map(f => (
                      <div key={f.label}>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: 1, marginBottom: 3 }}>
                          {f.label.toUpperCase()}
                        </p>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>
                          {f.value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px',
                    color: 'var(--text3)',
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                  }}>
                    <p style={{ marginBottom: 12 }}>⚠ No active claim data.</p>
                    <button
                      onClick={() => navigate('claim')}
                      style={{
                        background: 'var(--bg2)',
                        color: 'var(--accent)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '8px 20px',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      → Submit a Claim First
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Modules Pre-check */}
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius2)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: 1 }}>
                  PRE-MINT VERIFICATION MODULES
                </p>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  {
                    icon: '📡',
                    label: 'IoT Emissions Data',
                    sub: claimData?.iotCO2 ? `${claimData.iotCO2} t/day reading` : 'No IoT data',
                    ok: !!claimData?.iotCO2,
                  },
                  {
                    icon: '🤖',
                    label: 'AI Verification (YOLO + GEE)',
                    sub: verificationResult ? `Score: ${verificationResult.score}/100 · ${verificationResult.status}` : 'Not run yet',
                    ok: verificationResult?.status === 'VERIFIED',
                  },
                  {
                    icon: '🛰',
                    label: 'Satellite NDVI Analysis',
                    sub: verificationResult ? `NDVI: ${verificationResult.ndvi}` : 'Pending verification',
                    ok: !!verificationResult?.ndvi,
                  },
                  {
                    icon: '⛓',
                    label: 'Smart Contract Ready',
                    sub: `${MOCK_CONTRACT.slice(0, 14)}…`,
                    ok: true,
                  },
                ].map((m, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    background: m.ok ? 'rgba(0,255,136,0.04)' : 'var(--bg2)',
                    border: `1px solid ${m.ok ? 'rgba(0,255,136,0.15)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                  }}>
                    <span style={{ fontSize: 16 }}>{m.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{m.label}</p>
                      <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>{m.sub}</p>
                    </div>
                    <span style={{ fontSize: 16 }}>{m.ok ? '✅' : '⬜'}</span>
                  </div>
                ))}
              </div>
            </div>

            <SmartContractPanel />
          </div>

          {/* Right: Mint control + log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Mint Button Card */}
            <div style={{
              background: 'var(--nft-gradient)',
              border: canMint
                ? '1px solid rgba(0,255,136,0.3)'
                : '1px solid var(--border)',
              borderRadius: 'var(--radius2)',
              padding: '28px 24px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              animation: canMint && mintStage === 'idle' ? 'mintGlow 3s ease infinite' : 'none',
            }}>
              {/* Background hex pattern */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                opacity: 0.03,
                backgroundImage: `repeating-linear-gradient(60deg, var(--accent) 0, var(--accent) 1px, transparent 0, transparent 50%)`,
                backgroundSize: '20px 20px',
                pointerEvents: 'none',
              }} />

              <div style={{ fontSize: 48, marginBottom: 12, animation: 'float 4s ease infinite' }}>🌿</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>
                Mint NFT Certificate
              </h2>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.7 }}>
                {canMint
                  ? `Issue a permanent blockchain certificate for ${claimData?.company}`
                  : 'Complete claim submission and AI verification first to unlock minting'}
              </p>

              {!canMint && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    textAlign: 'left',
                    marginBottom: 16,
                  }}>
                    {[
                      { label: 'Claim submitted', done: !!claimData },
                      { label: 'AI Verification passed', done: verificationResult?.status === 'VERIFIED' },
                    ].map((step, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontFamily: 'var(--mono)',
                        fontSize: 12,
                        color: step.done ? 'var(--accent)' : 'var(--text3)',
                      }}>
                        <span>{step.done ? '✅' : '○'}</span>
                        {step.label}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    {!claimData && (
                      <button
                        onClick={() => navigate('claim')}
                        style={{
                          background: 'var(--bg2)',
                          color: 'var(--text)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          padding: '10px 20px',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        → Submit Claim
                      </button>
                    )}
                    {claimData && verificationResult?.status !== 'VERIFIED' && (
                      <button
                        onClick={() => navigate('verify')}
                        style={{
                          background: 'var(--accent)',
                          color: 'var(--bg)',
                          borderRadius: 'var(--radius)',
                          padding: '10px 20px',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        → Run AI Verification
                      </button>
                    )}
                  </div>
                </div>
              )}

              {canMint && mintStage !== 'done' && (
                <button
                  onClick={handleMint}
                  disabled={mintStage === 'minting' || mintStage === 'checking'}
                  style={{
                    background: (mintStage === 'minting' || mintStage === 'checking')
                      ? 'var(--bg2)' : 'var(--accent)',
                    color: (mintStage === 'minting' || mintStage === 'checking')
                      ? 'var(--text2)' : 'var(--bg)',
                    border: (mintStage === 'minting' || mintStage === 'checking')
                      ? '1px solid var(--border)' : 'none',
                    borderRadius: 'var(--radius)',
                    padding: '14px 36px',
                    fontSize: 15,
                    fontWeight: 800,
                    letterSpacing: '-0.3px',
                    width: '100%',
                  }}
                >
                  {mintStage === 'idle' && '⚡ Mint NFT Certificate'}
                  {mintStage === 'checking' && '🔍 Checking Modules…'}
                  {mintStage === 'minting' && '⛓ Broadcasting to Chain…'}
                </button>
              )}

              {mintStage === 'done' && mintedCert && (
                <div style={{
                  background: 'rgba(0,255,136,0.08)',
                  border: '1px solid rgba(0,255,136,0.25)',
                  borderRadius: 'var(--radius)',
                  padding: '14px',
                  textAlign: 'left',
                }}>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: 1, marginBottom: 8 }}>
                    ✅ MINTED SUCCESSFULLY
                  </p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>
                    Token ID: <span style={{ color: 'var(--accent)' }}>#{mintedCert.tokenId}</span>
                  </p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', marginBottom: 12 }}>
                    TX: {mintedCert.txHash.slice(0, 22)}…
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleDownload(mintedCert)}
                      style={{
                        flex: 1,
                        background: 'var(--accent)',
                        color: 'var(--bg)',
                        borderRadius: 'var(--radius)',
                        padding: '9px',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      ⬇ Download Certificate
                    </button>
                    <button
                      onClick={() => { setMintStage('idle'); setMintLog([]) }}
                      style={{
                        flex: 1,
                        background: 'var(--bg2)',
                        color: 'var(--text2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '9px',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Mint Another
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mint Log */}
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius2)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: 1 }}>
                  MINT TRANSACTION LOG
                </p>
                {(mintStage === 'minting' || mintStage === 'checking') && (
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    border: '2px solid var(--accent)',
                    borderTopColor: 'transparent',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                )}
              </div>
              <div style={{ padding: '16px 20px' }}>
                <MintProgressLog log={mintLog} stage={mintStage} />
              </div>
            </div>

            {/* Chain info strip */}
            <div style={{
              display: 'flex',
              gap: 12,
            }}>
              {[
                { icon: '⛓', label: 'Network', value: MOCK_CHAIN },
                { icon: '📦', label: 'Standard', value: 'ERC-721' },
                { icon: '🔒', label: 'Security', value: 'Immutable' },
              ].map(item => (
                <div key={item.label} style={{
                  flex: 1,
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '10px 14px',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 14, marginBottom: 4 }}>{item.icon}</p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: 0.8, marginBottom: 2 }}>
                    {item.label.toUpperCase()}
                  </p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ REGISTRY TAB ═══════════════════════ */}
      {activeTab === 'registry' && (
        <div>
          {/* Filter bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 24,
            padding: '14px 20px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius2)',
          }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
              FILTER:
            </span>
            <input
              value={filter === 'all' ? '' : filter}
              onChange={e => setFilter(e.target.value || 'all')}
              placeholder="Search by company name…"
              style={{ maxWidth: 320 }}
            />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
              {filteredCerts.length} certificate{filteredCerts.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {/* Summary bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 28,
          }}>
            {[
              { label: 'Total Certificates', value: certificates.length, suffix: '' },
              { label: 'Total CO₂ Offset', value: '3,220', suffix: ' t/yr' },
              { label: 'Total Trees Verified', value: '49,000+', suffix: '' },
              { label: 'Avg Verification Score', value: '85', suffix: '/100' },
            ].map((s, i) => (
              <div key={i} className="animate-in" style={{
                animationDelay: `${i * 0.06}s`,
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius2)',
                padding: '16px 20px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                }} />
                <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 1, marginBottom: 6 }}>
                  {s.label.toUpperCase()}
                </p>
                <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
                  {s.value}<span style={{ fontSize: 14, color: 'var(--text3)' }}>{s.suffix}</span>
                </p>
              </div>
            ))}
          </div>

          {/* NFT Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {filteredCerts.map(cert => (
              <NFTCard key={cert.tokenId} cert={cert} onDownload={handleDownload} />
            ))}
          </div>

          {filteredCerts.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              color: 'var(--text3)',
              fontFamily: 'var(--mono)',
              fontSize: 13,
            }}>
              No certificates match your filter.
            </div>
          )}
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate('verify')}
          style={{
            background: 'transparent',
            color: 'var(--text2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ← Back to Verification
        </button>
        <button
          onClick={() => navigate('dashboard')}
          style={{
            background: 'var(--bg2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Dashboard →
        </button>
      </div>
    </div>
  )
}
