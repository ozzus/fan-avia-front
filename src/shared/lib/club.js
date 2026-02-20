import { deleteCookie, readCookie, writeCookie } from './cookie'

const CLUB_COOKIE_KEY = 'fan_avia_club_id'

export function normalizeClubId(value) {
  const raw = String(value || '').trim()
  if (!/^\d+$/.test(raw)) {
    return ''
  }

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return ''
  }

  return String(parsed)
}

function normalizeClubRecord(item) {
  if (!item || typeof item !== 'object') {
    return null
  }

  const clubId = normalizeClubId(item.club_id)
  if (!clubId) {
    return null
  }

  const nameRu = String(item.name_ru || '').trim()
  const nameEn = String(item.name_en || '').trim()

  return {
    club_id: clubId,
    name_ru: nameRu,
    name_en: nameEn,
  }
}

export function buildClubOptions(clubs, locale = 'ru') {
  const safe = Array.isArray(clubs) ? clubs : []

  return safe
    .map(normalizeClubRecord)
    .filter(Boolean)
    .sort((a, b) => {
      const aLabel = locale === 'ru' ? a.name_ru || a.name_en || `#${a.club_id}` : a.name_en || a.name_ru || `#${a.club_id}`
      const bLabel = locale === 'ru' ? b.name_ru || b.name_en || `#${b.club_id}` : b.name_en || b.name_ru || `#${b.club_id}`
      return aLabel.localeCompare(bLabel, locale)
    })
    .map((club) => ({
      value: club.club_id,
      label: locale === 'ru' ? club.name_ru || club.name_en || `#${club.club_id}` : club.name_en || club.name_ru || `#${club.club_id}`,
    }))
}

export function buildClubNameMap(clubs, locale = 'ru') {
  const safe = Array.isArray(clubs) ? clubs : []
  const result = {}

  for (const item of safe) {
    const club = normalizeClubRecord(item)
    if (!club) {
      continue
    }

    const label = locale === 'ru' ? club.name_ru || club.name_en : club.name_en || club.name_ru
    if (!label) {
      continue
    }

    result[club.club_id] = label
  }

  return result
}

export function getClubName(clubId, namesById) {
  const normalized = normalizeClubId(clubId)
  if (!normalized) {
    return ''
  }

  if (namesById && typeof namesById === 'object' && namesById[normalized]) {
    return namesById[normalized]
  }

  return `#${normalized}`
}

export function readStoredClubId() {
  return normalizeClubId(readCookie(CLUB_COOKIE_KEY))
}

export function writeStoredClubId(clubId) {
  const normalized = normalizeClubId(clubId)

  if (normalized) {
    writeCookie(CLUB_COOKIE_KEY, normalized)
    return
  }

  deleteCookie(CLUB_COOKIE_KEY)
}
