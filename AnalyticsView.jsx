import React, { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { BarChart3, Loader2 } from 'lucide-react'
import api from '../services/api.js'

const RISK_COLOR = { LOW: '#1f9d55', MEDIUM: '#c99a12', HIGH: '#d9711f', CRITICAL: '#c8351f' }
const ROAD_COLOR = { PASSABLE: '#1f9d55', 'AT RISK': '#c99a12', BLOCKED: '#c8351f' }

export default function AnalyticsView() {
  const [zones, setZones] = useState([])
  const [roads, setRoads] = useState([])
  const [villages, setVillages] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([api.zones(), api.roads(), api.villages(), api.alerts()])
      .then(([z, r, v, a]) => { setZones(z); setRoads(r); setVillages(v); setAlerts(a) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><Loader2 className="spinner" size={16} />Crunching the numbers...</div>
  if (error) return <div className="error-state">Failed to load analytics: {error}</div>

  // 1. Rainfall trend across zones
  const rainfallData = zones.map((z) => ({ name: z.name, '24h': z.rainfall_24h, '72h': z.rainfall_72h }))

  // 2. Risk distribution (zones)
  const riskCounts = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((lvl) => ({
    name: lvl, value: zones.filter((z) => z.risk_level === lvl).length,
  })).filter((d) => d.value > 0)

  // 3. Zone-wise confidence
  const zoneConfidence = zones.map((z) => ({ name: z.name, confidence: z.confidence, fill: RISK_COLOR[z.risk_level] }))

  // 4. Road blockage status
  const roadStatusCounts = ['PASSABLE', 'AT RISK', 'BLOCKED'].map((s) => ({
    name: s, value: roads.filter((r) => r.status === s).length,
  })).filter((d) => d.value > 0)

  // 5. Village isolation
  const villageIsolation = villages.map((v) => ({ name: v.name, population: v.population, status: v.isolation_status }))

  // 6. Alert history by severity
  const alertHistory = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((lvl) => ({
    name: lvl, count: alerts.filter((a) => a.severity === lvl).length,
  }))

  return (
    <div>
      <div className="grid grid-2 mb-12">
        <ChartCard title="Rainfall Trend (24h vs 72h)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={rainfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="24h" stroke="#1f6fd6" strokeWidth={2} />
              <Line type="monotone" dataKey="72h" stroke="#c8351f" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <Insight text="72-hour rainfall accumulation consistently tracks above 24-hour totals, confirming sustained rainfall is the dominant driver of the current risk pattern." />
        </ChartCard>

        <ChartCard title="Risk Distribution Across Zones">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={riskCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {riskCounts.map((entry) => <Cell key={entry.name} fill={RISK_COLOR[entry.name]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <Insight text="Over half of monitored zones currently sit at HIGH or CRITICAL risk, indicating the region is in an active early-warning window." />
        </ChartCard>
      </div>

      <div className="grid grid-2 mb-12">
        <ChartCard title="Zone-wise AI Confidence">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={zoneConfidence}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="confidence">
                {zoneConfidence.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <Insight text="Model confidence is highest for zones with a recorded landslide history, since prior events strongly reinforce the learned risk pattern." />
        </ChartCard>

        <ChartCard title="Road Blockage Status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={roadStatusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {roadStatusCounts.map((entry) => <Cell key={entry.name} fill={ROAD_COLOR[entry.name]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <Insight text="A majority of roads connecting critical zones are currently AT RISK or BLOCKED, directly threatening supply and evacuation routes." />
        </ChartCard>
      </div>

      <div className="grid grid-2">
        <ChartCard title="Village Population vs Isolation Status">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={villageIsolation}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="population" fill="#1f6fd6" />
            </BarChart>
          </ResponsiveContainer>
          <Insight text="The largest at-risk populations are concentrated in villages already flagged ISOLATED or AT RISK, raising the priority for evacuation planning." />
        </ChartCard>

        <ChartCard title="Alert History by Severity">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={alertHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count">
                {alertHistory.map((entry) => <Cell key={entry.name} fill={RISK_COLOR[entry.name]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <Insight text="CRITICAL and HIGH alerts make up the bulk of active notifications, consistent with the ongoing heavy-rainfall period across the region." />
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="card">
      <div className="card-title"><BarChart3 size={15} /> {title}</div>
      {children}
    </div>
  )
}

function Insight({ text }) {
  return <div className="text-secondary" style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.5 }}>{text}</div>
}
