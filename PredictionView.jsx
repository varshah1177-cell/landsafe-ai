import React, { useState } from 'react'
import { Brain, Loader2, Sparkles, TriangleAlert } from 'lucide-react'
import api from '../services/api.js'

const SOIL_TYPES = ['CLAY', 'SANDY', 'LOAMY', 'ROCKY', 'SILTY']
const VEGETATION_LEVELS = ['DENSE', 'MODERATE', 'SPARSE', 'NONE']

const PRESETS = {
  LOW: { rainfall_24h: 25, rainfall_72h: 55, slope_deg: 12, elevation_m: 550, soil_moisture: 28, soil_type: 'ROCKY', vegetation_level: 'DENSE', history_landslide: false },
  MEDIUM: { rainfall_24h: 75, rainfall_72h: 160, slope_deg: 24, elevation_m: 750, soil_moisture: 52, soil_type: 'LOAMY', vegetation_level: 'MODERATE', history_landslide: false },
  HIGH: { rainfall_24h: 135, rainfall_72h: 300, slope_deg: 34, elevation_m: 880, soil_moisture: 74, soil_type: 'CLAY', vegetation_level: 'SPARSE', history_landslide: true },
  CRITICAL: { rainfall_24h: 190, rainfall_72h: 420, slope_deg: 44, elevation_m: 1000, soil_moisture: 89, soil_type: 'CLAY', vegetation_level: 'NONE', history_landslide: true },
}

const RISK_COLORS = {
  LOW: 'var(--risk-low)', MEDIUM: 'var(--risk-medium)', HIGH: 'var(--risk-high)', CRITICAL: 'var(--risk-critical)',
}

export default function PredictionView() {
  const [form, setForm] = useState(PRESETS.MEDIUM)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const applyPreset = (name) => setForm(PRESETS[name])

  const runPrediction = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.predict(form)
      setResult(res)
    } catch (e) {
      setError(e.message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
      <div className="card">
        <div className="card-title"><Sparkles size={15} /> Scenario Presets</div>
        <div className="btn-group mb-12">
          {Object.keys(PRESETS).map((p) => (
            <button key={p} className="preset-btn" style={{ color: RISK_COLORS[p] }} onClick={() => applyPreset(p)}>
              {p} SCENARIO
            </button>
          ))}
        </div>

        <div className="card-title" style={{ marginTop: 8 }}><Brain size={15} /> Site Parameters</div>

        <SliderField label="24-Hour Rainfall (mm)" value={form.rainfall_24h} min={0} max={260}
          onChange={(v) => update('rainfall_24h', v)} />
        <SliderField label="72-Hour Rainfall (mm)" value={form.rainfall_72h} min={0} max={550}
          onChange={(v) => update('rainfall_72h', v)} />
        <SliderField label="Slope (degrees)" value={form.slope_deg} min={0} max={60}
          onChange={(v) => update('slope_deg', v)} />
        <SliderField label="Soil Moisture (%)" value={form.soil_moisture} min={0} max={100}
          onChange={(v) => update('soil_moisture', v)} />

        <div className="field">
          <label>Elevation (m)</label>
          <input type="number" value={form.elevation_m} onChange={(e) => update('elevation_m', Number(e.target.value))} />
        </div>

        <div className="grid grid-2">
          <div className="field">
            <label>Soil Type</label>
            <select value={form.soil_type} onChange={(e) => update('soil_type', e.target.value)}>
              {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Vegetation Level</label>
            <select value={form.vegetation_level} onChange={(e) => update('vegetation_level', e.target.value)}>
              {VEGETATION_LEVELS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>
            <input type="checkbox" checked={form.history_landslide}
              onChange={(e) => update('history_landslide', e.target.checked)}
              style={{ marginRight: 8 }} />
            Previous landslide recorded at this site
          </label>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={runPrediction} disabled={loading}>
          {loading ? <Loader2 className="spinner" size={14} /> : <Brain size={14} />} PREDICT RISK
        </button>
      </div>

      <div className="card" style={{ minHeight: 420 }}>
        <div className="card-title"><TriangleAlert size={15} /> AI Prediction Result</div>

        {error && <div className="error-state">{error}</div>}

        {!result && !error && (
          <div className="empty-state">Set parameters and click PREDICT RISK to see the AI assessment.</div>
        )}

        {result && (
          <div>
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <div>
                <div className="text-secondary" style={{ fontSize: 12 }}>PREDICTED RISK LEVEL</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: RISK_COLORS[result.risk_level], fontFamily: 'Space Grotesk, sans-serif' }}>
                  {result.risk_level}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="text-secondary" style={{ fontSize: 12 }}>CONFIDENCE</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{result.confidence}%</div>
              </div>
            </div>

            <div className="text-secondary" style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>PROBABILITY DISTRIBUTION</div>
            {Object.entries(result.probabilities).map(([lvl, pct]) => (
              <div key={lvl} style={{ marginBottom: 8 }}>
                <div className="flex-between" style={{ fontSize: 12 }}>
                  <span>{lvl}</span><span>{pct}%</span>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, background: RISK_COLORS[lvl], height: '100%' }} />
                </div>
              </div>
            ))}

            <div className="text-secondary" style={{ fontSize: 12, fontWeight: 700, margin: '16px 0 8px' }}>AI CONTRIBUTING FACTORS</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              {result.contributing_factors.map((f, i) => <li key={i} style={{ marginBottom: 4 }}>{f}</li>)}
            </ul>

            <div className="text-secondary" style={{ fontSize: 12, fontWeight: 700, margin: '16px 0 8px' }}>RECOMMENDED EMERGENCY ACTIONS</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              {result.recommended_actions.map((a, i) => <li key={i} style={{ marginBottom: 4 }}>{a}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function SliderField({ label, value, min, max, onChange }) {
  return (
    <div className="field">
      <div className="flex-between">
        <label>{label}</label>
        <span className="mono" style={{ fontSize: 12 }}>{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}
