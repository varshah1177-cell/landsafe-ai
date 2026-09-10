const BASE_URL = 'http://127.0.0.1:8000/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch (e) {
      /* ignore parse error */
    }
    throw new Error(detail)
  }
  return res.json()
}

export const api = {
  health: () => request('/health'),
  dashboardSummary: () => request('/dashboard/summary'),
  zones: () => request('/zones'),
  roads: () => request('/roads'),
  villages: () => request('/villages'),
  alerts: () => request('/alerts'),
  reports: () => request('/reports'),
  createReport: (payload) =>
    request('/reports', { method: 'POST', body: JSON.stringify(payload) }),
  predict: (payload) =>
    request('/predict', { method: 'POST', body: JSON.stringify(payload) }),
  spatialGraph: () => request('/spatial/graph'),
  spatialAnalysis: () => request('/spatial/analysis'),
  safeRoute: (start, end) =>
    request(`/routes/safe?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
}

export default api
