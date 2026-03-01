const slotTitleMap = {
  FARE_SLOT_OUT_D_MINUS_2: 'airfare.slots.FARE_SLOT_OUT_D_MINUS_2',
  FARE_SLOT_OUT_D_MINUS_1: 'airfare.slots.FARE_SLOT_OUT_D_MINUS_1',
  FARE_SLOT_OUT_D0_ARRIVE_BY: 'airfare.slots.FARE_SLOT_OUT_D0_ARRIVE_BY',
  FARE_SLOT_RET_D0_DEPART_AFTER: 'airfare.slots.FARE_SLOT_RET_D0_DEPART_AFTER',
  FARE_SLOT_RET_D_PLUS_1: 'airfare.slots.FARE_SLOT_RET_D_PLUS_1',
  FARE_SLOT_RET_D_PLUS_2: 'airfare.slots.FARE_SLOT_RET_D_PLUS_2',
}

export function getAirfareSlotTitleKey(slot) {
  return slotTitleMap[slot] || ''
}

export function getAirfareSlotTitle(slot, t) {
  const key = getAirfareSlotTitleKey(slot)
  return key ? t(key) : String(slot || '')
}

export function isSameCityAirfareError(message) {
  const normalized = String(message || '').trim().toLowerCase()
  if (!normalized) {
    return false
  }

  return normalized.includes('origin_iata') && normalized.includes('destination_iata') && normalized.includes('must differ')
}
