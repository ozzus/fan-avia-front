import { rplClubs } from '../config/rpl-clubs'

const CLUB_STORAGE_KEY = 'fan-avia.club-id'

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

export function getClubOptions(locale = 'ru') {
  const isRu = locale === 'ru'
  return rplClubs.map((club) => ({
    value: club.id,
    label: isRu ? club.nameRu : club.nameEn,
  }))
}

export function getClubName(clubId, locale = 'ru') {
  const normalized = normalizeClubId(clubId)
  if (!normalized) {
    return ''
  }

  const club = rplClubs.find((item) => item.id === normalized)
  if (!club) {
    return `#${normalized}`
  }

  return locale === 'ru' ? club.nameRu : club.nameEn
}

export function readStoredClubId() {
  try {
    return normalizeClubId(window.localStorage.getItem(CLUB_STORAGE_KEY))
  } catch {
    return ''
  }
}

export function writeStoredClubId(clubId) {
  const normalized = normalizeClubId(clubId)

  try {
    if (normalized) {
      window.localStorage.setItem(CLUB_STORAGE_KEY, normalized)
      return
    }

    window.localStorage.removeItem(CLUB_STORAGE_KEY)
  } catch {
    // Ignore localStorage write errors.
  }
}
