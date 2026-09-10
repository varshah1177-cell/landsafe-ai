import React, { useEffect, useState } from 'react'
import { Bell, Loader2, Clock } from 'lucide-react'
import api from '../services/api.js'

const FILTERS = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function AlertsView() {
  const [alerts, setAlerts] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.alerts().then(setAlerts).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><Loader2 className="spinner" size={16} />Loading alerts...</div>
  if (error) return <div className="error-state">Failed to load alerts: {error}</div>

  const visible = filter === 'ALL' ? alerts : alerts.filter((a) => a.severity === filter)

  return (
    <div>
      <div className="btn-group mb-12">
        {FILTERS.map((f) => (
          <button key={f} className="btn btn-sm" style={{
            borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
            color: filter === f ? 'var(--accent)' : 'var(--text-primary)',
          }} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {visible.length === 0 && <div className="empty-state">No alerts match this filter.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visible.map((a) => (
          <div key={a.id} className="card" style={{
            borderLeft: `4px solid ${a.severity === 'CRITICAL' ? 'var(--risk-critical)' : a.severity === 'HIGH' ? 'var(--risk-high)' : a.severity === 'MEDIUM' ? 'var(--risk-medium)' : 'var(--risk-low)'}`,
            boxShadow: a.severity === 'CRITICAL' ? '0 2px 12px rgba(200,53,31,0.15)' : 'var(--shadow-card)',
          }}>
            <div className="flex-between mb-12">
              <div>
                <span className="mono text-secondary" style={{ fontSize: 11 }}>{a.alert_id}</span>
                <h3 style={{ fontSize: 16, marginTop: 2 }}>{a.title}</h3>
              </div>
              <span className={`badge badge-${a.severity}`}>{a.severity}</span>
            </div>

            <p style={{ margin: '0 0 12px 0', fontSize: 13.5 }}>{a.message}</p>

            <div className="grid grid-3" style={{ fontSize: 12.5 }}>
              <div><span className="text-secondary">Location: </span>{a.location}</div>
              <div><span className="text-secondary">Status: </span>{a.status}</div>
              <div><span className="text-secondary">Action: </span>{a.recommended_action}</div>
            </div>

            <div className="text-secondary flex gap-12" style={{ fontSize: 11.5, marginTop: 12 }}>
              <span><Clock size={11} style={{ verticalAlign: -1 }} /> Issued: {new Date(a.issued_at).toLocaleString()}</span>
              <span>Valid until: {new Date(a.valid_until).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
