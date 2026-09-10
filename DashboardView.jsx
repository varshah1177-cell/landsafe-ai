import React, { useEffect, useState } from 'react'
import { Bell, Mountain, Route as RouteIcon, Users, CloudRain, CheckCircle2, Loader2 } from 'lucide-react'
import api from '../services/api.js'

const KPI_META = [
  { key: 'active_alerts', label: 'Active Alerts', icon: Bell, color: '#c8351f', bg: '#fbe6e2' },
  { key: 'high_critical_zones', label: 'High / Critical Zones', icon: Mountain, color: '#d9711f', bg: '#fdece1' },
  { key: 'roads_at_risk', label: 'Roads At Risk', icon: RouteIcon, color: '#c99a12', bg: '#fbf1d9' },
  { key: 'population_at_risk', label: 'Population At Risk', icon: Users, color: '#1f6fd6', bg: '#e7f0fd' },
]

export default function DashboardView() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboardSummary()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><Loader2 className="spinner" size={16} />Loading dashboard...</div>
  if (error) return <div className="error-state">Failed to load dashboard: {error}</div>
  if (!data) return null

  return (
    <div>
      <div className="grid grid-4 mb-12">
        {KPI_META.map((k) => (
          <div className="kpi-card" key={k.key}>
            <div className="kpi-icon" style={{ background: k.bg, color: k.color }}>
              <k.icon size={17} />
            </div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">
              {k.key === 'population_at_risk' ? data[k.key].toLocaleString() : data[k.key]}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2 mt-16">
        <div className="card">
          <div className="card-title"><Bell size={15} /> Recent Alerts</div>
          {data.recent_alerts.length === 0 && <div className="empty-state">No active alerts.</div>}
          {data.recent_alerts.map((a) => (
            <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="flex-between">
                <strong style={{ fontSize: 13 }}>{a.title}</strong>
                <span className={`badge badge-${a.severity}`}>{a.severity}</span>
              </div>
              <div className="text-secondary" style={{ fontSize: 12.5, marginTop: 4 }}>{a.message}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title"><Mountain size={15} /> High Risk Zones</div>
          {data.high_risk_zones.length === 0 && <div className="empty-state">No high risk zones.</div>}
          <table>
            <thead>
              <tr><th>Zone</th><th>Risk</th><th>Confidence</th></tr>
            </thead>
            <tbody>
              {data.high_risk_zones.map((z) => (
                <tr key={z.id}>
                  <td>{z.name}</td>
                  <td><span className={`badge badge-${z.risk_level}`}>{z.risk_level}</span></td>
                  <td>{z.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2 mt-16">
        <div className="card">
          <div className="card-title"><CloudRain size={15} /> Rainfall Monitoring</div>
          <table>
            <thead>
              <tr><th>Zone</th><th>24h (mm)</th><th>72h (mm)</th></tr>
            </thead>
            <tbody>
              {data.rainfall_monitoring.map((r) => (
                <tr key={r.zone}>
                  <td>{r.zone}</td>
                  <td>{r.rainfall_24h}</td>
                  <td>{r.rainfall_72h}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-title"><CheckCircle2 size={15} /> System Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <StatusRow label="Backend API" value={data.system_status.backend} />
            <StatusRow label="ML Model" value={data.system_status.ml_model} />
            <StatusRow label="Database" value={data.system_status.database} />
            <StatusRow label="Mode" value={data.system_status.mode} muted />
          </div>
          <div className="text-secondary" style={{ fontSize: 12, marginTop: 12 }}>
            {data.system_status.notice}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusRow({ label, value, muted }) {
  return (
    <div className="flex-between">
      <span className="text-secondary" style={{ fontSize: 13 }}>{label}</span>
      <span className={`badge ${muted ? 'badge-MEDIUM' : 'badge-LOW'}`}>{value}</span>
    </div>
  )
}
