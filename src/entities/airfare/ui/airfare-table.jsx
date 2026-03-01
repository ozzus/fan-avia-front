import { buildAviasalesLink } from '../../../shared/lib/build-aviasales-link'
import { resolveRouteByDirection } from '../../../shared/lib/airfare-offer'
import { saveAviasalesRoute } from '../../../shared/lib/save-aviasales-route'
import { getAirfareSlotTitle } from '../../../shared/lib/airfare-slot-label'
import { useI18n } from '../../../shared/i18n/use-i18n'

const outboundSlotOrder = ['FARE_SLOT_OUT_D_MINUS_2', 'FARE_SLOT_OUT_D_MINUS_1', 'FARE_SLOT_OUT_D0_ARRIVE_BY']
const returnSlotOrder = ['FARE_SLOT_RET_D0_DEPART_AFTER', 'FARE_SLOT_RET_D_PLUS_1', 'FARE_SLOT_RET_D_PLUS_2']

function formatPrice(value, locale) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function sortSlotsByOrder(slots, order) {
  const mapBySlot = new Map()
  for (const slot of slots) {
    if (slot?.slot) {
      mapBySlot.set(slot.slot, slot)
    }
  }

  return order.map((slotKey) => mapBySlot.get(slotKey)).filter(Boolean)
}

function getNoPricesLabel(slotKind, t) {
  if (slotKind === 'FARE_SLOT_OUT_D0_ARRIVE_BY') {
    return t('airfare.noPricesOutboundMatchDayWindow')
  }

  if (slotKind === 'FARE_SLOT_RET_D0_DEPART_AFTER') {
    return t('airfare.noPricesReturnMatchDayWindow')
  }

  return t('airfare.noPrices')
}

function SlotCard({ slot, index, locale, t, originIata, destinationIata }) {
  const route = resolveRouteByDirection(slot.direction, originIata, destinationIata)
  const buyLink = route
    ? buildAviasalesLink({
        originIata: route.origin,
        destinationIata: route.destination,
        departDate: slot.date,
      })
    : ''

  const prices = Array.isArray(slot.prices) ? slot.prices.map(Number).filter((value) => Number.isFinite(value)) : []
  const minPrice = prices.length ? Math.min(...prices) : null

  return (
    <article key={`${slot.slot}_${slot.date}`} className="slot-card" style={{ animationDelay: `${index * 60}ms` }}>
      <h4>{getAirfareSlotTitle(slot.slot, t)}</h4>
      <p className="muted">{slot.date}</p>
      <p className="price">{minPrice ? formatPrice(minPrice, locale) : getNoPricesLabel(slot.slot, t)}</p>
      <small>{prices.length ? `${t('airfare.options')}: ${prices.map((item) => formatPrice(item, locale)).join(' • ')}` : ''}</small>

      {buyLink ? (
        <a
          href={buyLink}
          target="_blank"
          rel="noreferrer"
          className="buy-flight-link"
          onClick={() =>
            saveAviasalesRoute({
              originIata: route.origin,
              destinationIata: route.destination,
              departDate: slot.date,
              source: 'airfare-slot',
            })
          }
        >
          {t('airfare.buyViaAviasales')}
        </a>
      ) : null}
    </article>
  )
}

function AirfareTable({ data, loading, error, originIata, destinationIata }) {
  const { locale, t } = useI18n()

  if (loading) {
    return <p className="muted">{t('airfare.loading')}</p>
  }

  if (error) {
    return <p className="error">{error}</p>
  }

  if (!data?.slots?.length) {
    return <p className="muted">{t('airfare.selectMatch')}</p>
  }

  const outboundSlots = sortSlotsByOrder(data.slots, outboundSlotOrder)
  const returnSlots = sortSlotsByOrder(data.slots, returnSlotOrder)

  return (
    <div className="airfare-box">
      <div className="airfare-head">
        <h3>{t('airfare.title')}</h3>
        {data.ticketsLink ? (
          <a href={data.ticketsLink} target="_blank" rel="noreferrer" className="ticket-link">
            {t('airfare.matchTickets')}
          </a>
        ) : null}
      </div>

      <div className="slots-columns">
        <section className="slot-group">
          <h4 className="slot-group-title">{t('airfare.direction.outbound')}</h4>
          <p className="slot-group-hint">{t('airfare.outboundHint')}</p>
          <div className="slots-grid">
            {outboundSlots.map((slot, index) => (
              <SlotCard
                key={`${slot.slot}_${slot.date}`}
                slot={slot}
                index={index}
                locale={locale}
                t={t}
                originIata={originIata}
                destinationIata={destinationIata}
              />
            ))}
          </div>
        </section>

        <section className="slot-group">
          <h4 className="slot-group-title">{t('airfare.direction.return')}</h4>
          <p className="slot-group-hint">{t('airfare.returnHint')}</p>
          <div className="slots-grid">
            {returnSlots.map((slot, index) => (
              <SlotCard
                key={`${slot.slot}_${slot.date}`}
                slot={slot}
                index={index}
                locale={locale}
                t={t}
                originIata={originIata}
                destinationIata={destinationIata}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AirfareTable
