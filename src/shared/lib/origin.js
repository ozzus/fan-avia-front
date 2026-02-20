import { originCities } from '../config/origin-cities'
import { deleteCookie, readCookie, writeCookie } from './cookie'

const DEFAULT_ORIGIN = originCities[0]
const ORIGIN_CITY_COOKIE_KEY = 'fan_avia_origin_city'

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase()
}

export function resolveOriginByCity(city) {
  const normalizedCity = normalizeValue(city)
  if (!normalizedCity) {
    return null
  }

  return originCities.find((item) => normalizeValue(item.city) === normalizedCity) || null
}

export function resolveOriginByIata(iata) {
  const normalizedIata = String(iata || '').trim().toUpperCase()
  if (normalizedIata.length !== 3) {
    return null
  }

  return originCities.find((item) => item.iata === normalizedIata) || null
}

export function resolveOriginInput({ city, iata }) {
  return resolveOriginByCity(city) || resolveOriginByIata(iata) || null
}

export function getDefaultOrigin() {
  return DEFAULT_ORIGIN
}

export function readStoredOriginCity() {
  const resolved = resolveOriginByCity(readCookie(ORIGIN_CITY_COOKIE_KEY))
  return resolved?.city || ''
}

export function writeStoredOriginCity(city) {
  const resolved = resolveOriginByCity(city)
  if (resolved?.city) {
    writeCookie(ORIGIN_CITY_COOKIE_KEY, resolved.city)
    return
  }

  deleteCookie(ORIGIN_CITY_COOKIE_KEY)
}
