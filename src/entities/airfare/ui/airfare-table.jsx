import { buildAviasalesLink } from '../../../shared/lib/build-aviasales-link'
import { resolveRouteByDirection } from '../../../shared/lib/airfare-offer'
import { saveAviasalesRoute } from '../../../shared/lib/save-aviasales-route'
import { useI18n } from '../../../shared/i18n/use-i18n'

const slotTitleMap = {
  FARE_SLOT_OUT_D_MINUS_2: 'airfare.slots.FARE_SLOT_OUT_D_MINUS_2',
  FARE_SLOT_OUT_D_MINUS_1: 'airfare.slots.FARE_SLOT_OUT_D_MINUS_1',
  FARE_SLOT_OUT_D0_ARRIVE_BY: 'airfare.slots.FARE_SLOT_OUT_D0_ARRIVE_BY',
  FARE_SLOT_RET_D0_DEPART_AFTER: 'airfare.slots.FARE_SLOT_RET_D0_DEPART_AFTER',
  FARE_SLOT_RET_D_PLUS_1: 'airfare.slots.FARE_SLOT_RET_D_PLUS_1',
  FARE_SLOT_RET_D_PLUS_2: 'airfare.slots.FARE_SLOT_RET_D_PLUS_2',
}

function formatPrice(value, locale) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Number(value))
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

      <div className="slots-grid">
        {data.slots.map((slot, index) => {
          const route = resolveRouteByDirection(slot.direction, originIata, destinationIata)
          const buyLink = route
            ? buildAviasalesLink({
                originIata: route.origin,
                destinationIata: route.destination,
                departDate: slot.date,
              })
            : ''

          const slotTitleKey = slotTitleMap[slot.slot]

          return (
            <article key={`${slot.slot}_${slot.date}`} className="slot-card" style={{ animationDelay: `${index * 60}ms` }}>
              <h4>{slotTitleKey ? t(slotTitleKey) : slot.slot}</h4>
              <p className="muted">{slot.date}</p>
              <p className="price">{slot.prices?.length ? formatPrice(Math.min(...slot.prices.map(Number)), locale) : t('airfare.noPrices')}</p>
              <small>{slot.prices?.length ? `${t('airfare.options')}: ${slot.prices.map((item) => formatPrice(item, locale)).join(' • ')}` : ''}</small>

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
        })}
      </div>
    </div>
  )
}

export default AirfareTable

