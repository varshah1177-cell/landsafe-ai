import React, { useEffect, useState } from 'react'
import { MessageSquareWarning, Loader2, CheckCircle2, Send } from 'lucide-react'
import api from '../services/api.js'

const REPORT_TYPES = ['Crack', 'Rockfall', 'Road Blockage', 'Water Seepage', 'Slope Failure', 'Other']
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const EMPTY_FORM = { location: '', latitude: '', longitude: '', report_type: 'Crack', description: '', severity: 'MEDIUM' }

export default function CitizenReportsView() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [toast, setToast] = useState(null)

  const load = () => {
    setLoading(true)
    api.reports().then(setReports).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.location.trim() || !form.description.trim() || form.latitude === '' || form.longitude === '') {
      setSubmitError('Please fill in location, coordinates, and description.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await api.createReport({
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      })
      setForm(EMPTY_FORM)
      setToast('Report submitted successfully.')
      load()
    } catch (e) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '360px 1fr', alignItems: 'start' }}>
      <div className="card">
        <div className="card-title"><MessageSquareWarning size={15} /> Submit Field Report</div>
        <form onSubmit={submit}>
          <div className="field">
            <label>Location</label>
            <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. Meppadi" />
          </div>
          <div className="grid grid-2">
            <div className="field">
              <label>Latitude</label>
              <input type="number" step="any" value={form.latitude} onChange={(e) => update('latitude', e.target.value)} placeholder="11.56" />
            </div>
            <div className="field">
              <label>Longitude</label>
              <input type="number" step="any" value={form.longitude} onChange={(e) => update('longitude', e.target.value)} placeholder="76.14" />
            </div>
          </div>
          <div className="field">
            <label>Report Type</label>
            <select value={form.report_type} onChange={(e) => update('report_type', e.target.value)}>
              {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)}
              placeholder="Describe what you observed..." />
          </div>
          <div className="field">
            <label>Severity</label>
            <select value={form.severity} onChange={(e) => update('severity', e.target.value)}>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {submitError && <div className="error-state mb-12">{submitError}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
            {submitting ? <Loader2 className="spinner" size={14} /> : <Send size={14} />} SUBMIT REPORT
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-title"><MessageSquareWarning size={15} /> Submitted Reports</div>
        {loading && <div className="loading-state"><Loader2 className="spinner" size={16} />Loading reports...</div>}
        {error && <div className="error-state">{error}</div>}
        {!loading && !error && reports.length === 0 && <div className="empty-state">No reports submitted yet.</div>}
        {!loading && !error && reports.length > 0 && (
          <table>
            <thead>
              <tr><th>Location</th><th>Type</th><th>Severity</th><th>Status</th><th>Reported</th></tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.location}</td>
                  <td>{r.report_type}</td>
                  <td><span className={`badge badge-${r.severity}`}>{r.severity}</span></td>
                  <td>{r.status}</td>
                  <td className="text-secondary">{new Date(r.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && (
        <div className="toast"><CheckCircle2 size={15} /> {toast}</div>
      )}
    </div>
  )
}
