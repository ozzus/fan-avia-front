import { originCities } from '../config/origin-cities'

const DEFAULT_ORIGIN = originCities[0]

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
