import React, { useState, useEffect } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

/**
 * VerificationPage
 * Simulates the GEE + YOLO pipeline results:
 * - NDVI from Google Earth Engine
 * - Tree count from YOLO model
 * - CO2 offset calculation
 * - Verification score
 * - Certificate generation
 */

function Meter({ label, value, max, color, unit }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: color }}>{value}{unit}</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: pct + '%', background: color,
          borderRadius: 3, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 8px ${color}88`,
        }} />
      </div>
    </div>
  )
}

function Tag({ text, color }) {
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 11,
      color, background: color + '18', border: `1px solid ${color}44`,
      borderRadius: 4, padding: '3px 10px', letterSpacing: 1,
    }}>{text}</span>
  )
}

// Simulate pipeline delay
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

export default function VerificationPage({ claimData, drawnShape, verificationResult, setVerificationResult, navigate }) {
  const [stage, setStage] = useState('idle') // idle | running | done | error
  const [log, setLog] = useState([])
  const [result, setResult] = useState(verificationResult || null)

  const addLog = (msg, type = 'info') => {
    setLog(l => [...l, { msg, type, time: new Date().toLocaleTimeString() }])
  }

  const runPipeline = async () => {
    setStage('running')
    setLog([])
    setResult(null)

    const area = parseFloat(drawnShape?.area || claimData?.areaSqKm || 2.4)
    const claimedTrees = parseInt(claimData?.treesPlanted || 10000)
    const iotCO2 = parseFloat(claimData?.iotCO2 || 10)

    addLog('🚀 Pipeline started — ' + (claimData?.claimId || 'CLM-????'), 'info')
    await sleep(600)
    addLog('🌍 Connecting to Google Earth Engine…', 'info')
    await sleep(900)
    addLog('🛰 Loading Sentinel-2 imagery (2024-01-01 to 2024-12-31)…', 'info')
    await sleep(800)
    addLog('📐 Computing NDVI for drawn boundary…', 'info')
    await sleep(1000)

    // Simulate NDVI based on rainfall + species
    const rainfallFactor = Math.min((parseFloat(claimData?.rainfallMM || 600) / 1200), 1)
    const speciesFactor = { Teak: 0.82, Eucalyptus: 0.78, Neem: 0.74, Bamboo: 0.88, Pine: 0.71, Oak: 0.79, Acacia: 0.69 }
    const ndvi = Math.min(0.35 + rainfallFactor * 0.3 + (speciesFactor[claimData?.species] || 0.7) * 0.2 + Math.random() * 0.05, 0.92).toFixed(3)
    addLog(`✅ NDVI computed: ${ndvi} (satellite-verified)`, 'success')
    await sleep(700)

    addLog('⬇ Downloading satellite image tile for YOLO…', 'info')
    await sleep(1100)
    addLog('🤖 Running YOLO model — tiled inference (640×640 tiles, stride 512)…', 'info')
    await sleep(1400)

    // Simulate YOLO tree count
    const densityFactor = Math.min(parseFloat(ndvi) / 0.9, 1)
    const yoloTrees = Math.round(area * 1000 * densityFactor * (3.5 + Math.random() * 2))
    const confidence = (0.72 + Math.random() * 0.2).toFixed(2)
    addLog(`✅ YOLO detected ${yoloTrees.toLocaleString()} trees (conf: ${confidence})`, 'success')
    await sleep(600)

    addLog('📊 Computing CO₂ offset (species + age + area model)…', 'info')
    await sleep(800)

    // CO2 offset calculation
    const ageFactor = Math.min((parseInt(claimData?.ageYears || 3) / 20), 1)
    const speciesCO2 = { Teak: 65, Eucalyptus: 55, Neem: 50, Bamboo: 80, Pine: 60, Oak: 70, Acacia: 45 }
    const co2PerTree = (speciesCO2[claimData?.species] || 55) * (0.5 + ageFactor * 0.5)
    const computedOffset = Math.round(yoloTrees * co2PerTree / 1000) // tonnes
    addLog(`✅ CO₂ offset: ${computedOffset.toLocaleString()} tonnes/year`, 'success')
    await sleep(700)

    addLog('🔍 Cross-checking claimed vs computed values…', 'info')
    await sleep(800)

    // Mismatch check
    const treeMismatch = Math.abs(yoloTrees - claimedTrees) / claimedTrees
    const mismatchFlag = treeMismatch > 0.25
    if (mismatchFlag) {
      addLog(`⚠ Tree count mismatch: claimed ${claimedTrees.toLocaleString()} vs detected ${yoloTrees.toLocaleString()} (${(treeMismatch * 100).toFixed(1)}%)`, 'warn')
    } else {
      addLog(`✅ Tree count within acceptable range (${(treeMismatch * 100).toFixed(1)}% deviation)`, 'success')
    }
    await sleep(600)

    // GPS / media check
    const hasGPS = !!(claimData?.lat && claimData?.lng)
    addLog(hasGPS ? '✅ GPS coordinates validated' : '⚠ No GPS coordinates provided', hasGPS ? 'success' : 'warn')
    await sleep(500)

    const hasMedia = claimData?.mediaFiles?.length > 0
    addLog(hasMedia ? `✅ ${claimData.mediaFiles.length} media file(s) with EXIF metadata` : '⚠ No supporting media uploaded', hasMedia ? 'success' : 'warn')
    await sleep(600)

    // Final score
    let score = 60
    if (!mismatchFlag) score += 20
    if (parseFloat(ndvi) > 0.6) score += 10
    if (hasGPS) score += 5
    if (hasMedia) score += 5
    score = Math.min(score + Math.round(Math.random() * 5), 100)

    const status = score >= 80 ? 'VERIFIED' : score >= 60 ? 'CONDITIONAL' : 'FLAGGED'
    addLog(`\n🏁 Verification complete — Score: ${score}/100 → ${status}`, status === 'VERIFIED' ? 'success' : status === 'CONDITIONAL' ? 'warn' : 'error')

    const res = {
      ndvi: parseFloat(ndvi),
      yoloTrees,
      claimedTrees,
      treeMismatch: (treeMismatch * 100).toFixed(1),
      computedOffset,
      co2PerTree: co2PerTree.toFixed(1),
      score,
      status,
      mismatchFlag,
      confidence: parseFloat(confidence),
      area,
      timestamp: new Date().toISOString(),
    }
    setResult(res)
    setVerificationResult(res)
    setStage('done')
  }

  const downloadCert = () => {
    if (!result) return
    const cert = {
      certificate: 'CARBON_OFFSET_VERIFICATION',
      claimId: claimData?.claimId,
      company: claimData?.company,
      verificationDate: result.timestamp,
      status: result.status,
      score: result.score,
      yoloTreeCount: result.yoloTrees,
      ndviScore: result.ndvi,
      co2OffsetTonnes: result.computedOffset,
      polygon: drawnShape?.polygon,
      signedBy: 'OffsetGuard AI Verification Engine v1.0',
    }
    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `certificate_${claimData?.claimId || 'claim'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const STATUS_COLOR = { VERIFIED: '#00ff88', CONDITIONAL: '#ffb800', FLAGGED: '#ff4444' }

  const radarData = result ? [
    { subject: 'NDVI', value: Math.round(result.ndvi * 100) },
    { subject: 'Tree Match', value: Math.max(0, 100 - parseFloat(result.treeMismatch)) },
    { subject: 'CO₂ Model', value: Math.round(result.score * 0.9) },
    { subject: 'GPS Valid', value: claimData?.lat ? 100 : 30 },
    { subject: 'Media', value: claimData?.mediaFiles?.length > 0 ? 100 : 30 },
    { subject: 'YOLO Conf', value: Math.round(result.confidence * 100) },
  ] : []

  return (
    <div style={{ padding: '32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: 1, marginBottom: 6 }}>
            STEP 3 — AI VERIFICATION
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>
            GEE + YOLO Pipeline
          </h1>
          <p style={{ color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 12 }}>
            Satellite NDVI · Tree detection · CO₂ offset cross-check
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {stage !== 'running' && (
            <button onClick={runPipeline} style={{
              background: 'var(--accent)', color: '#060b0e',
              borderRadius: 'var(--radius)', padding: '12px 28px',
              fontSize: 14, fontWeight: 800,
              animation: stage === 'idle' ? 'glowPulse 2s ease infinite' : 'none',
            }}>
              {stage === 'idle' ? '▶ Run AI Verification' : '↺ Re-run Pipeline'}
            </button>
          )}
          {stage === 'running' && (
            <button disabled style={{
              background: 'var(--bg2)', color: 'var(--text2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '12px 28px',
              fontSize: 14, fontWeight: 700,
            }}>
              ⏳ Pipeline Running…
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Pipeline Log */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius2)', overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: 1 }}>PIPELINE LOG</p>
            {stage === 'running' && (
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                border: '2px solid var(--accent)', borderTopColor: 'transparent',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite',
              }} />
            )}
          </div>
          <div style={{
            padding: '16px 20px',
            minHeight: 280,
            maxHeight: 400,
            overflowY: 'auto',
            fontFamily: 'var(--mono)',
            fontSize: 12,
          }}>
            {log.length === 0 && (
              <p style={{ color: 'var(--text3)', marginTop: 60, textAlign: 'center' }}>
                {!drawnShape ? '⚠ No boundary drawn. Go to Map & Draw first.' : 'Click "Run AI Verification" to start the pipeline.'}
              </p>
            )}
            {log.map((entry, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, marginBottom: 8,
                color: entry.type === 'success' ? 'var(--accent)' : entry.type === 'warn' ? 'var(--warn)' : entry.type === 'error' ? 'var(--danger)' : 'var(--text2)',
              }}>
                <span style={{ color: 'var(--text3)', minWidth: 60 }}>{entry.time}</span>
                <span>{entry.msg}</span>
              </div>
            ))}
            {stage === 'running' && (
              <span style={{ color: 'var(--accent)', animation: 'pulse 1s ease infinite' }}>▌</span>
            )}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Status Card */}
            <div style={{
              background: `${STATUS_COLOR[result.status]}0d`,
              border: `1px solid ${STATUS_COLOR[result.status]}33`,
              borderRadius: 'var(--radius2)',
              padding: '20px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: 1, marginBottom: 6 }}>VERIFICATION STATUS</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: STATUS_COLOR[result.status] }}>{result.status}</span>
                  <Tag text={`SCORE: ${result.score}/100`} color={STATUS_COLOR[result.status]} />
                </div>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                  {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
              {result.status === 'VERIFIED' && (
                <button onClick={downloadCert} style={{
                  background: 'var(--accent)', color: '#060b0e',
                  borderRadius: 'var(--radius)', padding: '10px 20px',
                  fontSize: 13, fontWeight: 800,
                }}>
                  ⬇ Certificate
                </button>
              )}
            </div>

            {/* Key Metrics */}
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius2)', padding: '20px 24px',
            }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 1, marginBottom: 16 }}>KEY METRICS</p>
              <Meter label="NDVI Score (Satellite)" value={result.ndvi} max={1} color="#00ff88" unit="" />
              <Meter label="YOLO Confidence" value={result.confidence} max={1} color="#00cc6a" unit="" />
              <Meter label="Verification Score" value={result.score} max={100} color={STATUS_COLOR[result.status]} unit="%" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
                {[
                  { label: 'Trees Detected', value: result.yoloTrees.toLocaleString(), color: '#00ff88' },
                  { label: 'CO₂ Offset', value: result.computedOffset.toLocaleString() + ' t/yr', color: '#00cc6a' },
                  { label: 'Tree Mismatch', value: result.treeMismatch + '%', color: parseFloat(result.treeMismatch) > 25 ? 'var(--danger)' : 'var(--warn)' },
                ].map(m => (
                  <div key={m.label} style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '12px',
                    textAlign: 'center',
                  }}>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 0.5, marginBottom: 4 }}>{m.label}</p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Radar chart */}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius2)', padding: '24px',
          }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 1, marginBottom: 16 }}>VERIFICATION RADAR</p>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e3d30" />
                <PolarAngleAxis dataKey="subject" tick={{ fontFamily: 'Space Mono', fontSize: 11, fill: '#9ec9b0' }} />
                <Radar dataKey="value" stroke="#00ff88" fill="#00ff88" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius2)', padding: '24px',
          }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 1, marginBottom: 16 }}>
              CLAIMED vs DETECTED (TREES)
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { name: 'Claimed', value: result.claimedTrees },
                { name: 'YOLO Detected', value: result.yoloTrees },
              ]} barCategoryGap="40%">
                <XAxis dataKey="name" tick={{ fontFamily: 'Space Mono', fontSize: 11, fill: '#9ec9b0' }} stroke="#1e3d30" />
                <YAxis tick={{ fontFamily: 'Space Mono', fontSize: 10, fill: '#9ec9b0' }} stroke="#1e3d30" />
                <Tooltip
                  contentStyle={{ background: '#0d1a18', border: '1px solid #1e3d30', borderRadius: 8, fontFamily: 'Space Mono', fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  <Cell fill="#5a8a72" />
                  <Cell fill={result.mismatchFlag ? '#ff4444' : '#00ff88'} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('map')} style={{
          background: 'transparent', color: 'var(--text2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '10px 20px',
          fontSize: 13, fontWeight: 600,
        }}>← Back to Map</button>
        {result?.status === 'VERIFIED' && (
          <button onClick={() => navigate('dashboard')} style={{
            background: 'var(--accent)', color: '#060b0e',
            borderRadius: 'var(--radius)', padding: '10px 24px',
            fontSize: 13, fontWeight: 800,
          }}>✅ Submit to Registry →</button>
        )}
        {result?.status === 'VERIFIED' && (
          <button onClick={() => navigate('blockchain')} style={{
            background: 'rgba(0,255,136,0.1)', color: 'var(--accent)',
            border: '1px solid rgba(0,255,136,0.3)',
            borderRadius: 'var(--radius)', padding: '10px 24px',
            fontSize: 13, fontWeight: 700,
          }}>⛓ Mint NFT Certificate →</button>
        )}
      </div>
    </div>
  )
}
