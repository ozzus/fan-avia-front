export async function requestJSON(url) {
  const response = await fetch(url)
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
