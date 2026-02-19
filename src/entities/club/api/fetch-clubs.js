import { requestJSON } from '../../../shared/api/request-json'

export async function fetchClubs() {
  const payload = await requestJSON('/v1/clubs')
  if (!Array.isArray(payload?.clubs)) {
    return []
  }

  return payload.clubs
}
