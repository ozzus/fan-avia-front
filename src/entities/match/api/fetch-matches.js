import { requestJSON } from '../../../shared/api/request-json'
import { normalizeClubId } from '../../../shared/lib/club'

export async function fetchMatches({ limit = 12, originIata = 'MOW', clubId = '' } = {}) {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('origin_iata', originIata.toUpperCase())

  const normalizedClubId = normalizeClubId(clubId)
  if (normalizedClubId) {
    params.set('club_id', normalizedClubId)
  }

  return requestJSON(`/v1/matches/upcoming-with-airfare?${params.toString()}`)
}
