import React, { useState } from 'react'

const TREE_SPECIES = ['Teak', 'Eucalyptus', 'Neem', 'Bamboo', 'Pine', 'Oak', 'Acacia', 'Mixed Deciduous', 'Other']
const SOIL_TYPES = ['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky', 'Saline']

const generateClaimId = () => 'CLM-' + Math.floor(Math.random() * 9000 + 1000)

const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{
      display: 'block',
      fontFamily: 'var(--mono)',
      fontSize: 11,
      color: 'var(--text3)',
      letterSpacing: 1,
      marginBottom: 8,
    }}>
      {label.toUpperCase()}
      {hint && <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6, fontSize: 10 }}>({hint})</span>}
    </label>
    {children}
  </div>
)

export default function ClaimForm({ claimData, setClaimData, navigate }) {
  const [form, setForm] = useState(claimData || {
    claimId: generateClaimId(),
    company: '',
    contactEmail: '',
    iotCO2: '',
    treesPlanted: '',
    areaSqKm: '',
    species: '',
    ageYears: '',
    rainfallMM: '',
    soilType: '',
    lat: '',
    lng: '',
    mediaFiles: [],
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.company.trim()) e.company = 'Company name required'
    if (!form.contactEmail.includes('@')) e.contactEmail = 'Valid email required'
    if (!form.iotCO2 || isNaN(form.iotCO2)) e.iotCO2 = 'Valid number required'
    if (!form.treesPlanted || isNaN(form.treesPlanted)) e.treesPlanted = 'Valid number required'
    if (!form.areaSqKm || isNaN(form.areaSqKm)) e.areaSqKm = 'Valid number required'
    if (!form.species) e.species = 'Select a species'
    if (!form.soilType) e.soilType = 'Select soil type'
    return e
  }

  const handleNext = () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setClaimData(form)
    navigate('map', form)
  }

  const errStyle = { color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: 11, marginTop: 4 }

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)',
            background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)',
            borderRadius: 4, padding: '4px 10px',
          }}>{form.claimId}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>Auto-generated ID</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>
          Submit Carbon Offset Claim
        </h1>
        <p style={{ color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 12 }}>
          Step 1 of 3 — Company Details & Plantation Data
        </p>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
        {['Company Details', 'Map & Boundary', 'AI Verification'].map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{
              height: 3, borderRadius: 2,
              background: i === 0 ? 'var(--accent)' : 'var(--border)',
              marginBottom: 6,
            }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: i === 0 ? 'var(--accent)' : 'var(--text3)' }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* Left col */}
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: 1, marginBottom: 20, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            COMPANY INFORMATION
          </p>

          <Field label="Company Name">
            <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="e.g. GreenTech Solutions Pvt Ltd" />
            {errors.company && <p style={errStyle}>{errors.company}</p>}
          </Field>

          <Field label="Contact Email">
            <input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="contact@company.com" />
            {errors.contactEmail && <p style={errStyle}>{errors.contactEmail}</p>}
          </Field>

          <Field label="IoT CO₂ Reading" hint="tonnes/day">
            <input type="number" value={form.iotCO2} onChange={e => set('iotCO2', e.target.value)} placeholder="e.g. 12.4" step="0.1" />
            {errors.iotCO2 && <p style={errStyle}>{errors.iotCO2}</p>}
          </Field>

          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: 1, marginBottom: 20, marginTop: 24, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            GPS COORDINATES
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Latitude">
              <input type="number" value={form.lat} onChange={e => set('lat', e.target.value)} placeholder="e.g. 12.97" step="0.0001" />
            </Field>
            <Field label="Longitude">
              <input type="number" value={form.lng} onChange={e => set('lng', e.target.value)} placeholder="e.g. 77.59" step="0.0001" />
            </Field>
          </div>

          {/* Google Maps Button */}
          {form.lat && form.lng && (
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => {
                  const url = `https://www.google.com/maps?q=${form.lat},${form.lng}&z=14`
                  window.open(url, '_blank')
                }}
                style={{
                  background: '#1a73e8',
                  color: '#fff',
                  borderRadius: 'var(--radius)',
                  padding: '10px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                🗺 Navigate in Google Maps
              </button>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', marginTop: 6, textAlign: 'center' }}>
                Opens Google Maps at {parseFloat(form.lat).toFixed(5)}, {parseFloat(form.lng).toFixed(5)}
              </p>
            </div>
          )}
        </div>

        {/* Right col */}
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: 1, marginBottom: 20, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            PLANTATION DETAILS
          </p>

          <Field label="Trees Planted">
            <input type="number" value={form.treesPlanted} onChange={e => set('treesPlanted', e.target.value)} placeholder="e.g. 15000" />
            {errors.treesPlanted && <p style={errStyle}>{errors.treesPlanted}</p>}
          </Field>

          <Field label="Area" hint="sq. km">
            <input type="number" value={form.areaSqKm} onChange={e => set('areaSqKm', e.target.value)} placeholder="e.g. 2.4" step="0.01" />
            {errors.areaSqKm && <p style={errStyle}>{errors.areaSqKm}</p>}
          </Field>

          <Field label="Tree Species">
            <select value={form.species} onChange={e => set('species', e.target.value)}>
              <option value="">Select species…</option>
              {TREE_SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.species && <p style={errStyle}>{errors.species}</p>}
          </Field>

          <Field label="Plantation Age" hint="years">
            <input type="number" value={form.ageYears} onChange={e => set('ageYears', e.target.value)} placeholder="e.g. 3" min="0" />
          </Field>

          <Field label="Annual Rainfall" hint="mm">
            <input type="number" value={form.rainfallMM} onChange={e => set('rainfallMM', e.target.value)} placeholder="e.g. 850" />
          </Field>

          <Field label="Soil Type">
            <select value={form.soilType} onChange={e => set('soilType', e.target.value)}>
              <option value="">Select soil type…</option>
              {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.soilType && <p style={errStyle}>{errors.soilType}</p>}
          </Field>

          <Field label="Supporting Media" hint="GPS + timestamped images/videos">
            <div style={{
              border: '2px dashed var(--border2)',
              borderRadius: 'var(--radius)',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              background: 'var(--bg2)',
            }}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)' }}
            onDragLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            onClick={() => document.getElementById('mediaUpload').click()}
            >
              <input id="mediaUpload" type="file" multiple accept="image/*,video/*" style={{ display: 'none' }}
                onChange={e => set('mediaFiles', Array.from(e.target.files))}
              />
              <p style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                {form.mediaFiles?.length > 0
                  ? `✅ ${form.mediaFiles.length} file(s) selected`
                  : '📁 Click or drag to upload media'}
              </p>
              <p style={{ color: 'var(--text3)', fontSize: 11, marginTop: 4 }}>Images / Videos with EXIF metadata</p>
            </div>
          </Field>
        </div>
      </div>

      {/* Submit */}
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button onClick={() => navigate('dashboard')} style={{
          background: 'transparent',
          color: 'var(--text2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '12px 24px',
          fontSize: 14,
          fontWeight: 600,
        }}>Cancel</button>
        <button onClick={handleNext} style={{
          background: 'var(--accent)',
          color: '#060b0e',
          borderRadius: 'var(--radius)',
          padding: '12px 32px',
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: '-0.3px',
        }}>
          Next → Draw on Map
        </button>
      </div>
    </div>
  )
}
