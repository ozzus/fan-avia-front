import { getDefaultOrigin } from '../../../shared/lib/origin'
import { useI18n } from '../../../shared/i18n/use-i18n'
import { getClubName, normalizeClubId } from '../../../shared/lib/club'

function formatPrice(value, locale) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formatKickoffMsk(value, locale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Moscow',
  }).format(date)
}

function MatchList({ items, selectedMatchId, onSelect, originCity, originIata, clubId, clubNamesById }) {
  const { locale, t } = useI18n()

  if (!items.length) {
    return <p className="muted">{t('matchList.empty')}</p>
  }

  return (
    <div className="match-list">
      {items.map((item, index) => {
        const match = item.match
        if (!match) {
          return null
        }

        const isActive = String(selectedMatchId) === String(match.match_id)
        const fallbackOrigin = getDefaultOrigin()
        const detailsParams = new URLSearchParams()
        detailsParams.set('origin_city', originCity || fallbackOrigin.city)
        detailsParams.set('origin_iata', String(originIata || fallbackOrigin.iata).toUpperCase())

        const normalizedClubId = normalizeClubId(clubId)
        if (normalizedClubId) {
          detailsParams.set('club_id', normalizedClubId)
        }

        const detailsLink = `/matches/${match.match_id}?${detailsParams.toString()}`
        const homeClub = getClubName(match.club_home_id, clubNamesById)
        const awayClub = getClubName(match.club_away_id, clubNamesById)

        const hasRoundTrip = Number.isFinite(Number(item.best_round_trip_price))

        return (
          <article key={match.match_id} className={`match-card${isActive ? ' active' : ''}`} style={{ animationDelay: `${index * 70}ms` }}>
            <button type="button" className="match-card-head" onClick={() => onSelect(match.match_id)}>
              <strong>{t('matchList.matchNumber', { id: match.match_id })}</strong>
              <span>
                {formatKickoffMsk(match.kickoff_utc, locale)} MSK
              </span>
            </button>

            <div className="match-card-body">
              <p>
                <b>{t('matchList.city')}:</b> {match.city || t('common.na')}
              </p>
              <p>
                <b>{t('matchList.stadium')}:</b> {match.stadium || t('common.na')}
              </p>
              <p>
                <b>{t('matchList.destinationAirport')}:</b> {match.destination_airport_iata || t('common.na')}
              </p>
              <p>
                <b>{t('matchList.homeAway')}:</b> {homeClub || t('common.na')} / {awayClub || t('common.na')}
              </p>

              {item.airfare_error ? (
                <p className="muted">
                  <b>{t('matchList.airfare')}:</b> {item.airfare_error}
                </p>
              ) : hasRoundTrip ? (
                <p className="muted">
                  <b>{t('matchList.bestAirfare')}:</b> {formatPrice(item.best_round_trip_price, locale)}
                  {' ('}
                  {locale === 'ru' ? 'туда' : 'outbound'}: {formatPrice(item.best_outbound_price, locale)},{' '}
                  {locale === 'ru' ? 'обратно' : 'return'}: {formatPrice(item.best_return_price, locale)}
                  {')'}
                </p>
              ) : Number.isFinite(Number(item.min_price)) ? (
                <p className="muted">
                  <b>{t('matchList.bestAirfare')}:</b> {t('matchList.from')} {formatPrice(item.min_price, locale)} ({item.best_date || t('common.na')})
                </p>
              ) : (
                <p className="muted">
                  <b>{t('matchList.airfare')}:</b> {t('matchList.noPrices')}
                </p>
              )}

              <div className="match-actions">
                <a href={detailsLink} className="inline-link">
                  {t('matchList.openDetails')}
                </a>

                {match.tickets_link ? (
                  <a href={match.tickets_link} target="_blank" rel="noreferrer" className="ticket-link">
                    {t('matchList.buyMatchTicket')}
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default MatchList
