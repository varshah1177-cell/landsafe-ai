import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Marker } from 'react-leaflet'
import L from 'leaflet'
import { Search, Loader2 } from 'lucide-react'
import api from '../services/api.js'

const RISK_COLOR = { LOW: '#1f9d55', MEDIUM: '#c99a12', HIGH: '#d9711f', CRITICAL: '#c8351f' }
const ROAD_COLOR = { PASSABLE: '#1f9d55', 'AT RISK': '#c99a12', BLOCKED: '#c8351f' }
const FILTERS = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const villageIcon = L.divIcon({
  className: '',
  html: `<div style="width:12px;height:12px;border-radius:2px;background:#17283f;border:2px solid white;box-shadow:0 0 0 1px #17283f"></div>`,
  iconSize: [12, 12],
})

export default function RiskMapView() {
  const [zones, setZones] = useState([])
  const [roads, setRoads] = useState([])
  const [villages, setVillages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([api.zones(), api.roads(), api.villages()])
      .then(([z, r, v]) => { setZones(z); setRoads(r); setVillages(v) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const nodeCoords = useMemo(() => {
    const map = {}
    zones.forEach((z) => { map[z.name] = [z.latitude, z.longitude] })
    villages.forEach((v) => { if (!map[v.name]) map[v.name] = [v.latitude, v.longitude] })
    return map
  }, [zones, villages])

  const filteredZones = zones.filter((z) => {
    const matchesFilter = filter === 'ALL' || z.risk_level === filter
    const matchesSearch = z.name.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) return <div className="loading-state"><Loader2 className="spinner" size={16} />Loading GIS map...</div>
  if (error) return <div className="error-state">Failed to load map data: {error}</div>

  const center = zones.length ? [zones[0].latitude, zones[0].longitude] : [11.55, 76.12]

  return (
    <div className="grid" style={{ gridTemplateColumns: '260px 1fr', alignItems: 'start' }}>
      <div className="card">
        <div className="card-title">Filters</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {FILTERS.map((f) => (
            <button key={f} className="nav-item" style={{
              color: filter === f ? 'var(--accent)' : 'var(--text-primary)',
              background: filter === f ? 'var(--accent-dim)' : 'transparent',
              border: '1px solid var(--border)',
            }} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        <div className="field">
          <label><Search size={12} style={{ verticalAlign: -2 }} /> Search zone</label>
          <input placeholder="e.g. Meppadi" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="card-title" style={{ marginTop: 12 }}>Risk Legend</div>
        {Object.entries(RISK_COLOR).map(([k, c]) => (
          <div className="legend-row" key={k}><span className="legend-dot" style={{ background: c }} />{k}</div>
        ))}

        <div className="card-title" style={{ marginTop: 12 }}>Road Status</div>
        {Object.entries(ROAD_COLOR).map(([k, c]) => (
          <div className="legend-row" key={k}><span style={{ width: 16, height: 3, background: c, display: 'inline-block' }} />{k}</div>
        ))}
      </div>

      <div className="card" style={{ padding: 8 }}>
        <MapContainer center={center} zoom={12} style={{ height: 560, width: '100%', borderRadius: 8 }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {roads.map((r) => {
            const a = nodeCoords[r.start_node]
            const b = nodeCoords[r.end_node]
            if (!a || !b) return null
            return (
              <Polyline key={r.id} positions={[a, b]} pathOptions={{ color: ROAD_COLOR[r.status] || '#999', weight: 4, dashArray: r.status === 'BLOCKED' ? '6 6' : null }}>
                <Popup>
                  <strong>{r.name}</strong><br />
                  Status: {r.status}<br />
                  Distance: {r.distance_km} km<br />
                  Blockage risk: {r.blockage_risk}%
                </Popup>
              </Polyline>
            )
          })}

          {filteredZones.map((z) => (
            <CircleMarker key={z.id} center={[z.latitude, z.longitude]} radius={11}
              pathOptions={{ color: RISK_COLOR[z.risk_level], fillColor: RISK_COLOR[z.risk_level], fillOpacity: 0.55, weight: 2 }}>
              <Popup>
                <strong>{z.name}</strong> — <span style={{ color: RISK_COLOR[z.risk_level] }}>{z.risk_level}</span><br />
                24h Rainfall: {z.rainfall_24h} mm<br />
                72h Rainfall: {z.rainfall_72h} mm<br />
                Slope: {z.slope_deg}°<br />
                Soil Moisture: {z.soil_moisture}%<br />
                Elevation: {z.elevation_m} m<br />
                Confidence: {z.confidence}%
              </Popup>
            </CircleMarker>
          ))}

          {villages.map((v) => (
            <Marker key={v.id} position={[v.latitude, v.longitude]} icon={villageIcon}>
              <Popup>
                <strong>{v.name}</strong><br />
                Population: {v.population.toLocaleString()}<br />
                Households: {v.households}<br />
                Status: {v.isolation_status}<br />
                Risk: {v.risk_level}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
