import { requestJSON } from '../../../shared/api/request-json'

export async function fetchMatches({ limit = 12, originIata = 'MOW' } = {}) {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('origin_iata', originIata.toUpperCase())

  return requestJSON(`/v1/matches/upcoming-with-airfare?${params.toString()}`)
}
