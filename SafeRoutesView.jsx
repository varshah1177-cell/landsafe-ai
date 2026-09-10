import React, { useState } from 'react'
import { Route, Loader2, ShieldCheck, Ban } from 'lucide-react'
import api from '../services/api.js'

const LOCATIONS = ['Chooralmala', 'Mundakkai', 'Meppadi', 'Attamala', 'Vythiri', 'Kalpetta']

export default function SafeRoutesView() {
  const [start, setStart] = useState('Meppadi')
  const [end, setEnd] = useState('Kalpetta')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const calculate = async () => {
    if (start === end) {
      setError('Start and destination must be different locations.')
      setResult(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.safeRoute(start, end)
      setResult(res)
    } catch (e) {
      setError(e.message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '340px 1fr', alignItems: 'start' }}>
      <div className="card">
        <div className="card-title"><Route size={15} /> Plan a Safe Route</div>

        <div className="field">
          <label>Start Location</label>
          <select value={start} onChange={(e) => setStart(e.target.value)}>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Destination</label>
          <select value={end} onChange={(e) => setEnd(e.target.value)}>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={calculate} disabled={loading}>
          {loading ? <Loader2 className="spinner" size={14} /> : <Route size={14} />} CALCULATE SAFE ROUTE
        </button>

        <div className="text-secondary" style={{ fontSize: 12, marginTop: 12 }}>
          Routing uses live road status from the network graph and automatically avoids roads marked BLOCKED.
        </div>
      </div>

      <div className="card" style={{ minHeight: 320 }}>
        <div className="card-title"><ShieldCheck size={15} /> Route Result</div>

        {error && (
          <div className="error-state" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ban size={14} /> {error}
          </div>
        )}

        {!result && !error && <div className="empty-state">Choose a start and destination, then calculate a route.</div>}

        {result && (
          <div>
            <div className="flex-between mb-12">
              <span className="badge badge-LOW" style={{ fontSize: 12 }}>SAFE ALTERNATIVE ROUTE</span>
              <span className={`badge ${result.route_risk === 'LOW' ? 'badge-LOW' : 'badge-MEDIUM'}`}>{result.route_risk} RISK</span>
            </div>

            <div className="grid grid-3 mb-12">
              <Metric label="Distance" value={`${result.total_distance_km} km`} />
              <Metric label="Est. Time" value={`${result.estimated_time_minutes} min`} />
              <Metric label="Route Risk" value={result.route_risk} />
            </div>

            <div className="card-title" style={{ marginTop: 8 }}>Recommended Route</div>
            <div className="flex gap-8" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
              {result.route.map((node, i) => (
                <React.Fragment key={node}>
                  <span className="badge badge-LOW">{node}</span>
                  {i < result.route.length - 1 && <span className="text-secondary">→</span>}
                </React.Fragment>
              ))}
            </div>

            <table className="mb-12">
              <thead><tr><th>Segment</th><th>Road</th><th>Distance</th><th>Status</th></tr></thead>
              <tbody>
                {result.segments.map((s, i) => (
                  <tr key={i}>
                    <td>{s.from} → {s.to}</td>
                    <td>{s.name}</td>
                    <td>{s.distance_km} km</td>
                    <td><span className={`badge badge-${s.status.replace(' ', '')}`}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="card-title">Avoided Roads</div>
            {result.avoided_roads.length === 0
              ? <div className="text-secondary">No blocked roads in the current network.</div>
              : (
                <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                  {result.avoided_roads.map((r) => <span key={r} className="badge badge-CRITICAL">{r}</span>)}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ fontSize: 20 }}>{value}</div>
    </div>
  )
}
