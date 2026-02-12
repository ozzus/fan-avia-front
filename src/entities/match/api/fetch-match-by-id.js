import { requestJSON } from '../../../shared/api/request-json'

export async function fetchMatchById(matchId) {
  const payload = await requestJSON(`/v1/matches/${matchId}`)
  return payload?.match || payload
}
