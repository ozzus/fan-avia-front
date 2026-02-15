import { buildAviasalesLink } from '../../../shared/lib/build-aviasales-link'
import { resolveRouteByDirection } from '../../../shared/lib/airfare-offer'
import { saveAviasalesRoute } from '../../../shared/lib/save-aviasales-route'

const slotTitleMap = {
  FARE_SLOT_OUT_D_MINUS_2: 'Outbound: 2 days before',
  FARE_SLOT_OUT_D_MINUS_1: 'Outbound: 1 day before',
  FARE_SLOT_OUT_D0_ARRIVE_BY: 'Outbound: match day',
  FARE_SLOT_RET_D0_DEPART_AFTER: 'Return: match day',
  FARE_SLOT_RET_D_PLUS_1: 'Return: next day',
  FARE_SLOT_RET_D_PLUS_2: 'Return: +2 days',
}

function formatPrice(value) {
  return `${new Intl.NumberFormat('ru-RU').format(Number(value))} RUB`
}

function AirfareTable({ data, loading, error, originIata, destinationIata }) {
  if (loading) {
    return <p className="muted">Loading airfare...</p>
  }

  if (error) {
    return <p className="error">{error}</p>
  }

  if (!data?.slots?.length) {
    return <p className="muted">Select a match to load airfare slots.</p>
  }

  return (
    <div className="airfare-box">
      <div className="airfare-head">
        <h3>Airfare slots</h3>
        {data.ticketsLink ? (
          <a href={data.ticketsLink} target="_blank" rel="noreferrer" className="ticket-link">
            Match tickets
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

          return (
            <article key={`${slot.slot}_${slot.date}`} className="slot-card" style={{ animationDelay: `${index * 60}ms` }}>
              <h4>{slotTitleMap[slot.slot] || slot.slot}</h4>
              <p className="muted">{slot.date}</p>
              <p className="price">{slot.prices?.length ? formatPrice(Math.min(...slot.prices.map(Number))) : 'No prices'}</p>
              <small>{slot.prices?.length ? `Options: ${slot.prices.map((item) => formatPrice(item)).join(' • ')}` : ''}</small>

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
                  Buy via Aviasales
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
