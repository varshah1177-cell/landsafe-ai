import React, { useEffect, useState } from 'react'
import { GitBranch, Loader2, ArrowDown } from 'lucide-react'
import api from '../services/api.js'

const RECOMMENDATIONS = [
  'Inspect vulnerable roads',
  'Position rescue teams',
  'Prepare shelters',
  'Issue warnings',
  'Allocate emergency resources',
]

export default function ImpactAnalysisView() {
  const [analysis, setAnalysis] = useState(null)
  const [roads, setRoads] = useState([])
  const [villages, setVillages] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([api.spatialAnalysis(), api.roads(), api.villages()])
      .then(([a, r, v]) => {
        setAnalysis(a)
        setRoads(r)
        setVillages(v)
        if (a.cascade_analysis.length) setSelectedZone(a.cascade_analysis[0].zone)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><Loader2 className="spinner" size={16} />Running cascading impact analysis...</div>
  if (error) return <div className="error-state">Failed to load impact analysis: {error}</div>
  if (!analysis || analysis.cascade_analysis.length === 0) return <div className="empty-state">No zone data available.</div>

  const current = analysis.cascade_analysis.find((c) => c.zone === selectedZone)
  const blockedRoadsCount = roads.filter((r) => r.status === 'BLOCKED').length
  const atRiskRoadsCount = current.roads_at_risk.length
  const isolatedVillageDetails = villages.filter((v) => current.isolated_villages.includes(v.name))
  const households = isolatedVillageDetails.reduce((s, v) => s + v.households, 0)

  return (
    <div>
      <div className="card mb-12">
        <div className="card-title"><GitBranch size={15} /> Select Landslide Zone</div>
        <div className="btn-group">
          {analysis.cascade_analysis.map((c) => (
            <button key={c.zone} className="btn" style={{
              borderColor: c.zone === selectedZone ? 'var(--accent)' : 'var(--border)',
              color: c.zone === selectedZone ? 'var(--accent)' : 'var(--text-primary)',
            }} onClick={() => setSelectedZone(c.zone)}>
              {c.zone} <span className={`badge badge-${c.risk_level}`} style={{ marginLeft: 6 }}>{c.risk_level}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-4 mb-12">
        <Metric label="Affected Population" value={current.affected_population_estimate.toLocaleString()} />
        <Metric label="Affected Households" value={households.toLocaleString()} />
        <Metric label="Roads At Risk" value={current.roads_at_risk.length} />
        <Metric label="Blocked Roads" value={current.roads_blocked.length} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Cascading Impact</div>
          <div className="cascade-flow">
            <div className="cascade-step">LANDSLIDE — {current.zone} ({current.risk_level})</div>
            <div className="cascade-arrow"><ArrowDown size={16} /></div>
            <div className="cascade-step">ROAD BLOCKAGE — {current.roads_blocked.length ? current.roads_blocked.join(', ') : 'No roads blocked yet'}</div>
            <div className="cascade-arrow"><ArrowDown size={16} /></div>
            <div className="cascade-step">VILLAGE ISOLATION — {current.isolated_villages.length ? current.isolated_villages.join(', ') : 'No villages isolated'}</div>
            <div className="cascade-arrow"><ArrowDown size={16} /></div>
            <div className="cascade-step">POPULATION IMPACT — {current.affected_population_estimate.toLocaleString()} people</div>
            <div className="cascade-arrow"><ArrowDown size={16} /></div>
            <div className="cascade-step" style={{ borderColor: 'var(--risk-critical)', color: 'var(--risk-critical)' }}>
              EMERGENCY RESPONSE — Priority: {current.emergency_priority}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Villages At Risk</div>
          <table>
            <thead><tr><th>Village</th><th>Population</th><th>Status</th></tr></thead>
            <tbody>
              {isolatedVillageDetails.length === 0 && (
                <tr><td colSpan={3} className="text-secondary">No villages currently isolated by this zone.</td></tr>
              )}
              {isolatedVillageDetails.map((v) => (
                <tr key={v.id}>
                  <td>{v.name}</td>
                  <td>{v.population.toLocaleString()}</td>
                  <td><span className={`badge badge-${v.risk_level}`}>{v.isolation_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="card-title" style={{ marginTop: 18 }}>Recommended Actions</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {RECOMMENDATIONS.map((r, i) => <li key={i} style={{ marginBottom: 5 }}>{r}</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  )
}
