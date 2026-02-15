import { buildAviasalesLink } from './build-aviasales-link'

export function resolveRouteByDirection(direction, originIata, destinationIata) {
  if (!originIata || !destinationIata) {
    return null
  }

  if (direction === 'FARE_DIRECTION_RETURN') {
    return {
      origin: destinationIata,
      destination: originIata,
    }
  }

  return {
    origin: originIata,
    destination: destinationIata,
  }
}

export function pickBestAirfareOption(airfareData, originIata, destinationIata) {
  const slots = airfareData?.slots || []
  if (!slots.length) {
    return null
  }

  let best = null

  for (const slot of slots) {
    const route = resolveRouteByDirection(slot.direction, originIata, destinationIata)
    if (!route || !Array.isArray(slot.prices) || !slot.prices.length) {
      continue
    }

    for (const rawPrice of slot.prices) {
      const price = Number(rawPrice)
      if (!Number.isFinite(price) || price <= 0) {
        continue
      }

      if (!best || price < best.price) {
        best = {
          price,
          slot: slot.slot,
          direction: slot.direction,
          date: slot.date,
          originIata: route.origin,
          destinationIata: route.destination,
          link: buildAviasalesLink({
            originIata: route.origin,
            destinationIata: route.destination,
            departDate: slot.date,
          }),
        }
      }
    }
  }

  return best
}
