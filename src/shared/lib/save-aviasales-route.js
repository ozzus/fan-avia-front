const STORAGE_KEY = 'fan_avia_last_aviasales_route'

export function saveAviasalesRoute(route) {
  if (typeof window === 'undefined' || !route) {
    return
  }

  const payload = {
    originIata: route.originIata || '',
    destinationIata: route.destinationIata || '',
    departDate: route.departDate || '',
    source: route.source || 'unknown',
    savedAt: new Date().toISOString(),
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage write errors to avoid blocking navigation.
  }
}

export { STORAGE_KEY as AVIASALES_ROUTE_STORAGE_KEY }
