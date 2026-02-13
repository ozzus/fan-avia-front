const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')

function buildRequestUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  if (!API_BASE_URL) {
    return path
  }

  return path.startsWith('/') ? `${API_BASE_URL}${path}` : `${API_BASE_URL}/${path}`
}

export async function requestJSON(path) {
  const response = await fetch(buildRequestUrl(path))
  const raw = await response.text()

  let payload = null
  try {
    payload = raw ? JSON.parse(raw) : null
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message = payload?.error || raw || `Request failed with ${response.status}`
    throw new Error(message)
  }

  return payload
}
