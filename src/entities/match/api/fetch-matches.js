import { requestJSON } from '../../../shared/api/request-json'
import { normalizeClubId } from '../../../shared/lib/club'

export async function fetchMatches({ limit, originIata = 'MOW', clubId = '' } = {}) {
  const params = new URLSearchParams()

  const parsedLimit = Number(limit)
  if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
    params.set('limit', String(Math.trunc(parsedLimit)))
  }

  params.set('origin_iata', originIata.toUpperCase())

  const normalizedClubId = normalizeClubId(clubId)
  if (normalizedClubId) {
    params.set('club_id', normalizedClubId)
  }

  return requestJSON(`/v1/matches/upcoming-with-airfare?${params.toString()}`)
}
