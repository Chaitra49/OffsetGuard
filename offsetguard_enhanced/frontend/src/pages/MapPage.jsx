import React, { useEffect, useRef, useState } from 'react'

/**
 * MapPage
 * - Uses Leaflet (loaded globally via CDN in index.html)
 * - Uses Leaflet.Draw for shape tools (rectangle, polygon, edit, delete)
 * - Auto-centers on lat/lng from claim form
 * - Captures drawn polygon/rectangle coordinates
 * - "Navigate in Google Maps" button
 * - Downloads the drawn area as GeoJSON for the YOLO pipeline
 */

export default function MapPage({ claimData, drawnShape, setDrawnShape, navigate }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const drawnItemsRef = useRef(null)
  const [shapeInfo, setShapeInfo] = useState(drawnShape || null)
  const [downloading, setDownloading] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  const centerLat = parseFloat(claimData?.lat) || 12.97
  const centerLng = parseFloat(claimData?.lng) || 77.59

  useEffect(() => {
    // Leaflet and Leaflet.Draw are loaded as globals via CDN
    const L = window.L
    if (!L || mapInstanceRef.current) return

    // Init map
    const map = L.map(mapRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: true,
    })

    // Satellite tile layer (ESRI World Imagery)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles © Esri — Source: Esri, USGS, NOAA',
        maxZoom: 19,
      }
    ).addTo(map)

    // Labels overlay
    L.tileLayer(
      'https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png',
      { opacity: 0.5, maxZoom: 19 }
    ).addTo(map)

    // FeatureGroup to store drawn items
    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)
    drawnItemsRef.current = drawnItems

    // Draw control — Rectangle + Polygon + Edit + Delete
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
        edit: { shapeOptions: { color: '#00ff88', weight: 2 } },
        remove: true,
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: '#00ff88', weight: 2, fillOpacity: 0.15 },
        },
        rectangle: {
          showArea: true,
          shapeOptions: { color: '#00ff88', weight: 2, fillOpacity: 0.15 },
        },
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
    })
    map.addControl(drawControl)

    // Add center marker if lat/lng provided
    if (claimData?.lat && claimData?.lng) {
      const marker = L.circleMarker([centerLat, centerLng], {
        radius: 8,
        color: '#00ff88',
        fillColor: '#00ff88',
        fillOpacity: 0.8,
        weight: 2,
      }).addTo(map)
      marker.bindPopup(
        `<div style="font-family:monospace;font-size:12px;color:#00ff88;background:#0d1a18;padding:8px;border-radius:6px;">
          <b>${claimData?.company || 'Plantation Site'}</b><br/>
          ${centerLat.toFixed(5)}, ${centerLng.toFixed(5)}
        </div>`
      )
    }

    // Restore existing shape if any
    if (drawnShape?.geojson) {
      try {
        const layer = L.geoJSON(drawnShape.geojson, {
          style: { color: '#00ff88', weight: 2, fillOpacity: 0.15 }
        })
        layer.eachLayer(l => drawnItems.addLayer(l))
      } catch (_) {}
    }

    // Event: shape drawn
    map.on(L.Draw.Event.CREATED, (e) => {
      drawnItems.clearLayers()
      drawnItems.addLayer(e.layer)
      const geojson = drawnItems.toGeoJSON()
      const bounds = e.layer.getBounds()
      const sw = bounds.getSouthWest()
      const ne = bounds.getNorthEast()
      const info = {
        geojson,
        type: e.layerType,
        bounds: { sw: [sw.lat, sw.lng], ne: [ne.lat, ne.lng] },
        polygon: geojson.features[0]?.geometry?.coordinates || [],
        area: computeArea(bounds),
      }
      setShapeInfo(info)
      setDrawnShape(info)
    })

    // Event: shape edited
    map.on(L.Draw.Event.EDITED, () => {
      const geojson = drawnItems.toGeoJSON()
      if (geojson.features.length > 0) {
        const layer = drawnItems.getLayers()[0]
        const bounds = layer.getBounds()
        const sw = bounds.getSouthWest()
        const ne = bounds.getNorthEast()
        const info = {
          geojson,
          type: shapeInfo?.type || 'polygon',
          bounds: { sw: [sw.lat, sw.lng], ne: [ne.lat, ne.lng] },
          polygon: geojson.features[0]?.geometry?.coordinates || [],
          area: computeArea(bounds),
        }
        setShapeInfo(info)
        setDrawnShape(info)
      }
    })

    // Event: shape deleted
    map.on(L.Draw.Event.DELETED, () => {
      setShapeInfo(null)
      setDrawnShape(null)
    })

    mapInstanceRef.current = map
    setMapReady(true)

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Compute approximate area in sq km from bounds
  const computeArea = (bounds) => {
    const latDiff = Math.abs(bounds.getNorth() - bounds.getSouth())
    const lngDiff = Math.abs(bounds.getEast() - bounds.getWest())
    const latKm = latDiff * 111
    const lngKm = lngDiff * 111 * Math.cos((bounds.getCenter().lat * Math.PI) / 180)
    return (latKm * lngKm).toFixed(4)
  }

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${centerLat},${centerLng}&z=14`
    window.open(url, '_blank')
  }

  const openGoogleEarth = () => {
    const url = `https://earth.google.com/web/@${centerLat},${centerLng},400a,2000d,35y,0h,45t,0r`
    window.open(url, '_blank')
  }

  const downloadGeoJSON = () => {
    if (!shapeInfo?.geojson) return
    setDownloading(true)
    const blob = new Blob([JSON.stringify(shapeInfo.geojson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plantation_boundary_${claimData?.claimId || 'claim'}.geojson`
    a.click()
    URL.revokeObjectURL(url)
    setTimeout(() => setDownloading(false), 1000)
  }

  const downloadPolygonJSON = () => {
    if (!shapeInfo) return
    // Download polygon in the format expected by the GEE Python pipeline
    const payload = {
      claimId: claimData?.claimId,
      company: claimData?.company,
      polygon: shapeInfo.polygon,
      bounds: shapeInfo.bounds,
      area_sq_km: shapeInfo.area,
      center: [centerLat, centerLng],
      timestamp: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gee_pipeline_input_${claimData?.claimId || 'claim'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
      {/* Sidebar */}
      <div style={{
        width: 320,
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: 1, marginBottom: 6 }}>
            STEP 2 — MAP & BOUNDARY
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Draw Plantation Area</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
            Use the toolbar on the map to draw a rectangle or polygon around your plantation.
          </p>
        </div>

        {/* Claim info */}
        {claimData && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 1, marginBottom: 10 }}>CLAIM DETAILS</p>
            {[
              ['ID', claimData.claimId],
              ['Company', claimData.company],
              ['Trees', claimData.treesPlanted ? (+claimData.treesPlanted).toLocaleString() : '—'],
              ['Species', claimData.species || '—'],
              ['GPS', `${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', maxWidth: 180, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Drawing tools guide */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 1, marginBottom: 12 }}>DRAWING TOOLS</p>
          {[
            { icon: '▬', label: 'Rectangle', desc: 'Draw a rectangular boundary' },
            { icon: '⬠', label: 'Polygon', desc: 'Draw custom irregular shape' },
            { icon: '✎', label: 'Edit', desc: 'Modify drawn shapes' },
            { icon: '🗑', label: 'Delete', desc: 'Remove selected shapes' },
          ].map(tool => (
            <div key={tool.label} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, minWidth: 24, color: 'var(--accent)' }}>{tool.icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{tool.label}</p>
                <p style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>{tool.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Drawn shape info */}
        {shapeInfo && (
          <div style={{
            margin: '16px 20px',
            background: 'rgba(0,255,136,0.06)',
            border: '1px solid rgba(0,255,136,0.2)',
            borderRadius: 'var(--radius)',
            padding: '14px',
          }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: 1, marginBottom: 8 }}>
              ✅ SHAPE CAPTURED
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
              Type: <span style={{ color: 'var(--accent)' }}>{shapeInfo.type?.toUpperCase()}</span>
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
              Area: <span style={{ color: 'var(--accent)' }}>~{shapeInfo.area} km²</span>
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
              SW: {shapeInfo.bounds?.sw?.map(n => n.toFixed(4)).join(', ')}
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
              NE: {shapeInfo.bounds?.ne?.map(n => n.toFixed(4)).join(', ')}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
          <button onClick={openGoogleMaps} style={{
            background: '#1a73e8', color: '#fff',
            borderRadius: 'var(--radius)', padding: '10px 16px', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            🗺 Navigate in Google Maps
          </button>

          <button onClick={openGoogleEarth} style={{
            background: '#0f9d58', color: '#fff',
            borderRadius: 'var(--radius)', padding: '10px 16px', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            🌍 View in Google Earth
          </button>

          {shapeInfo && (
            <>
              <button onClick={downloadGeoJSON} style={{
                background: 'var(--bg2)', color: 'var(--text)',
                border: '1px solid var(--border2)',
                borderRadius: 'var(--radius)', padding: '10px 16px', fontSize: 13, fontWeight: 700,
              }}>
                ⬇ Download GeoJSON
              </button>
              <button onClick={downloadPolygonJSON} style={{
                background: 'var(--bg2)', color: 'var(--text)',
                border: '1px solid var(--border2)',
                borderRadius: 'var(--radius)', padding: '10px 16px', fontSize: 13, fontWeight: 700,
              }}>
                ⬇ Download GEE Pipeline Input
              </button>
              <button onClick={() => navigate('verify')} style={{
                background: 'var(--accent)', color: '#060b0e',
                borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 14, fontWeight: 800,
              }}>
                Next → Run AI Verification
              </button>
            </>
          )}

          {!shapeInfo && (
            <div style={{
              background: 'rgba(255,184,0,0.06)',
              border: '1px solid rgba(255,184,0,0.2)',
              borderRadius: 'var(--radius)', padding: '12px',
              fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--warn)', textAlign: 'center',
            }}>
              ⚠ Draw a shape on the map to continue
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {!mapReady && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg2)', zIndex: 999,
          }}>
            <p style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', animation: 'pulse 1.5s ease infinite' }}>
              Loading satellite map…
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
