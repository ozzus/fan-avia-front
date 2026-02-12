import { requestJSON } from '../../../shared/api/request-json'

export async function fetchAirfareByMatch(matchId, originIata) {
  return requestJSON(`/v1/matches/${matchId}/airfare?origin_iata=${encodeURIComponent(originIata)}`)
}
