import { affiliateConfig } from '../config/affiliate'

export function buildAviasalesLink({ originIata, destinationIata, departDate }) {
  if (!originIata || !destinationIata || !departDate) {
    return ''
  }

  const url = new URL(affiliateConfig.baseUrl)
  url.searchParams.set('origin_iata', originIata.toUpperCase())
  url.searchParams.set('destination_iata', destinationIata.toUpperCase())
  url.searchParams.set('depart_date', departDate)
  url.searchParams.set('one_way', 'true')
  url.searchParams.set('adults', '1')
  url.searchParams.set('children', '0')
  url.searchParams.set('infants', '0')
  url.searchParams.set('trip_class', '0')
  url.searchParams.set('locale', affiliateConfig.locale)
  url.searchParams.set('currency', affiliateConfig.currency)

  if (affiliateConfig.marker) {
    url.searchParams.set('marker', affiliateConfig.marker)
  }

  return url.toString()
}
