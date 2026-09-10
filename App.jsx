import React, { useState } from 'react'
import {
  LayoutDashboard, Brain, Map, GitBranch, Route, Bell, MessageSquareWarning,
  BarChart3, Mountain, AlertTriangle,
} from 'lucide-react'

import DashboardView from './views/DashboardView.jsx'
import PredictionView from './views/PredictionView.jsx'
import RiskMapView from './views/RiskMapView.jsx'
import ImpactAnalysisView from './views/ImpactAnalysisView.jsx'
import SafeRoutesView from './views/SafeRoutesView.jsx'
import AlertsView from './views/AlertsView.jsx'
import CitizenReportsView from './views/CitizenReportsView.jsx'
import AnalyticsView from './views/AnalyticsView.jsx'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'prediction', label: 'Risk Prediction', icon: Brain },
  { key: 'map', label: 'GIS Risk Map', icon: Map },
  { key: 'impact', label: 'Impact Analysis', icon: GitBranch },
  { key: 'routes', label: 'Safe Routes', icon: Route },
  { key: 'alerts', label: 'Alerts', icon: Bell },
  { key: 'reports', label: 'Citizen Reports', icon: MessageSquareWarning },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
]

const TITLES = {
  dashboard: ['Dashboard', 'Regional overview of active landslide risk'],
  prediction: ['Risk Prediction', 'AI-based landslide risk assessment for a given site'],
  map: ['GIS Risk Map', 'Live map of landslide zones, roads and villages'],
  impact: ['Impact Analysis', 'Cascading impact from landslide to emergency response'],
  routes: ['Safe Routes', 'Network-aware routing that avoids blocked roads'],
  alerts: ['Alerts', 'Active early-warning alerts across the region'],
  reports: ['Citizen Reports', 'Field reports submitted by residents and field teams'],
  analytics: ['Analytics', 'Trends across rainfall, risk, roads and alerts'],
}

export default function App() {
  const [active, setActive] = useState('dashboard')
  const [title, subtitle] = TITLES[active]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Mountain size={18} /></div>
          <div>
            <div className="brand-name">LANDSAFE AI</div>
            <div className="brand-tag">DISASTER INTELLIGENCE</div>
          </div>
        </div>

        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${active === item.key ? 'active' : ''}`}
            onClick={() => setActive(item.key)}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}

        <div className="sidebar-footer">
          SIH26001 · North Eastern Region<br />
          Landslide Early Warning
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
            <div className="topbar-sub">{subtitle}</div>
          </div>
          <div className="status-pills">
            <span className="pill live"><span className="pill-dot" />SYSTEM LIVE</span>
            <span className="pill proto"><AlertTriangle size={12} />PROTOTYPE MODE</span>
          </div>
        </header>

        <div className="content">
          <div className="prototype-banner">
            <AlertTriangle size={14} />
            Prototype Mode — Data is simulated for demonstration.
          </div>

          {active === 'dashboard' && <DashboardView />}
          {active === 'prediction' && <PredictionView />}
          {active === 'map' && <RiskMapView />}
          {active === 'impact' && <ImpactAnalysisView />}
          {active === 'routes' && <SafeRoutesView />}
          {active === 'alerts' && <AlertsView />}
          {active === 'reports' && <CitizenReportsView />}
          {active === 'analytics' && <AnalyticsView />}
        </div>
      </div>
    </div>
  )
}
