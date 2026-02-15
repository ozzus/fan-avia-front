import { affiliateConfig } from '../config/affiliate'

const DEFAULT_AVIASALES_SEARCH_URL = 'https://www.aviasales.ru/'

function formatRouteDate(dateIso) {
  const date = new Date(`${dateIso}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${day}${month}`
}

function resolveBaseUrl() {
  const raw = (affiliateConfig.baseUrl || '').trim() || DEFAULT_AVIASALES_SEARCH_URL

  try {
    const parsed = new URL(raw)
    // Keep deep-link generation stable: always use aviasales search path format.
    parsed.protocol = 'https:'
    parsed.host = 'www.aviasales.ru'
    parsed.pathname = '/'
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return DEFAULT_AVIASALES_SEARCH_URL
  }
}

export function buildAviasalesLink({ originIata, destinationIata, departDate }) {
  if (!originIata || !destinationIata || !departDate) {
    return ''
  }

  const routeDate = formatRouteDate(departDate)
  if (!routeDate) {
    return ''
  }

  const origin = originIata.toUpperCase()
  const destination = destinationIata.toUpperCase()
  const routeToken = `${origin}${routeDate}${destination}1`

  const url = new URL(resolveBaseUrl())
  url.pathname = `/search/${routeToken}`
  url.searchParams.set('locale', affiliateConfig.locale)
  url.searchParams.set('currency', affiliateConfig.currency)

  if (affiliateConfig.marker) {
    url.searchParams.set('marker', affiliateConfig.marker)
  }

  return url.toString()
}
