import { useEffect, useState } from 'react'
import { getDefaultOrigin } from '../../../shared/lib/origin'
import { useI18n } from '../../../shared/i18n/use-i18n'
import { isSameCityAirfareError } from '../../../shared/lib/airfare-slot-label'
import { getClubName, normalizeClubId } from '../../../shared/lib/club'
import { buildAviasalesLink } from '../../../shared/lib/build-aviasales-link'
import { saveAviasalesRoute } from '../../../shared/lib/save-aviasales-route'
import ClubLogo from '../../../shared/ui/club-logo'
import { fetchAirfareByMatch } from '../../airfare/api/fetch-airfare-by-match'

const slotDayOffset = {
  FARE_SLOT_OUT_D_MINUS_2: -2,
  FARE_SLOT_OUT_D_MINUS_1: -1,
  FARE_SLOT_OUT_D0_ARRIVE_BY: 0,
  FARE_SLOT_RET_D0_DEPART_AFTER: 0,
  FARE_SLOT_RET_D_PLUS_1: 1,
  FARE_SLOT_RET_D_PLUS_2: 2,
}

const outboundSlotSelector = ['FARE_SLOT_OUT_D_MINUS_2', 'FARE_SLOT_OUT_D_MINUS_1', 'FARE_SLOT_OUT_D0_ARRIVE_BY']
const returnSlotSelector = ['FARE_SLOT_RET_D0_DEPART_AFTER', 'FARE_SLOT_RET_D_PLUS_1', 'FARE_SLOT_RET_D_PLUS_2']
const slotToTimelineKey = {
  FARE_SLOT_OUT_D_MINUS_2: 'outDMinus2',
  FARE_SLOT_OUT_D_MINUS_1: 'outDMinus1',
  FARE_SLOT_OUT_D0_ARRIVE_BY: 'outD0',
  FARE_SLOT_RET_D0_DEPART_AFTER: 'retD0',
  FARE_SLOT_RET_D_PLUS_1: 'retDPlus1',
  FARE_SLOT_RET_D_PLUS_2: 'retDPlus2',
}
const defaultSlotState = {
  outboundSlot: 'FARE_SLOT_OUT_D_MINUS_2',
  returnSlot: 'FARE_SLOT_RET_D0_DEPART_AFTER',
  fareDirection: 'outbound',
}

function collectSlotMinPrices(airfareData) {
  const slots = Array.isArray(airfareData?.slots) ? airfareData.slots : []
  const result = {}

  for (const slot of slots) {
    const slotKey = String(slot?.slot || '').trim()
    if (!slotKey) {
      continue
    }

    const prices = Array.isArray(slot?.prices)
      ? slot.prices.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0)
      : []
    if (!prices.length) {
      continue
    }

    const minPrice = Math.min(...prices)
    if (!Number.isFinite(minPrice) || minPrice <= 0) {
      continue
    }

    const prev = result[slotKey]
    result[slotKey] = Number.isFinite(prev) ? Math.min(prev, minPrice) : minPrice
  }

  return result
}

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

function formatShortDate(value, locale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Moscow',
  }).format(date)
}

function getMatchTitle(match, clubNamesById, t) {
  const homeClub = getClubName(match.club_home_id, clubNamesById)
  const awayClub = getClubName(match.club_away_id, clubNamesById)

  if (homeClub && awayClub) {
    return `${homeClub} vs ${awayClub}`
  }

  return t('matchList.matchFallback', { id: match.match_id })
}

function toUserAirfareError(errorMessage, t) {
  if (isSameCityAirfareError(errorMessage)) {
    return t('matchList.sameCityMessage')
  }

  return errorMessage
}

function buildStayLinks(city) {
  const query = encodeURIComponent(String(city || '').trim())
  const booking = query ? `https://www.booking.com/searchresults.ru.html?ss=${query}` : 'https://www.booking.com/'
  const sutochno = query ? `https://sutochno.ru/search?q=${query}` : 'https://sutochno.ru/'

  return { booking, sutochno }
}

function getDirectionalPrice(item, direction) {
  if (direction === 'return') {
    const returnPrice = Number(item.best_return_price)
    return Number.isFinite(returnPrice) && returnPrice > 0 ? returnPrice : null
  }

  const outboundPrice = Number(item.best_outbound_price)
  return Number.isFinite(outboundPrice) && outboundPrice > 0 ? outboundPrice : null
}

function resolveDateBySlot(match, slotKey) {
  const kickoff = new Date(match?.kickoff_utc)
  if (Number.isNaN(kickoff.getTime())) {
    return ''
  }

  const dayOffset = slotDayOffset[slotKey]
  if (!Number.isFinite(dayOffset)) {
    return ''
  }

  const utcDate = new Date(Date.UTC(kickoff.getUTCFullYear(), kickoff.getUTCMonth(), kickoff.getUTCDate()))
  utcDate.setUTCDate(utcDate.getUTCDate() + dayOffset)

  return utcDate.toISOString().slice(0, 10)
}

function resolveDirectionDate(match, item, fareDirection, selectedOutboundSlot, selectedReturnSlot) {
  if (fareDirection === 'return') {
    return resolveDateBySlot(match, selectedReturnSlot) || item.best_return_date || ''
  }

  return resolveDateBySlot(match, selectedOutboundSlot) || item.best_date || ''
}

function buildDirectionRoute(fareDirection, originIata, destinationIata) {
  if (!originIata || !destinationIata) {
    return null
  }

  if (fareDirection === 'return') {
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

function MatchList({
  items,
  selectedMatchId,
  onSelect,
  originCity,
  originIata,
  clubId,
  clubNamesById,
}) {
  const { locale, t } = useI18n()
  const [slotStateByMatch, setSlotStateByMatch] = useState({})
  const [airfareByMatch, setAirfareByMatch] = useState({})

  useEffect(() => {
    setSlotStateByMatch({})
    setAirfareByMatch({})
  }, [originIata, items])

  function ensureMatchAirfareLoaded(matchId) {
    const key = String(matchId)
    if (!originIata) {
      return
    }

    const current = airfareByMatch[key]
    if (current?.loaded || current?.loading) {
      return
    }

    setAirfareByMatch((prev) => ({
      ...prev,
      [key]: { loaded: false, loading: true, slotPrices: null },
    }))

    void fetchAirfareByMatch(matchId, originIata)
      .then((data) => {
        setAirfareByMatch((prev) => ({
          ...prev,
          [key]: {
            loaded: true,
            loading: false,
            slotPrices: collectSlotMinPrices(data),
          },
        }))
      })
      .catch(() => {
        setAirfareByMatch((prev) => ({
          ...prev,
          [key]: {
            loaded: true,
            loading: false,
            slotPrices: null,
          },
        }))
      })
  }

  if (!items.length) {
    return <p className="muted">{t('matchList.empty')}</p>
  }

  return (
    <div className="match-table-list">
      {items.map((item, index) => {
        const match = item.match
        if (!match) {
          return null
        }

        const matchId = String(match.match_id)
        const isActive = String(selectedMatchId) === matchId
        const slotState = slotStateByMatch[matchId] || defaultSlotState
        const selectedOutboundSlot = slotState.outboundSlot
        const selectedReturnSlot = slotState.returnSlot
        const fareDirection = slotState.fareDirection
        const fallbackOrigin = getDefaultOrigin()
        const detailsParams = new URLSearchParams()
        detailsParams.set('origin_city', originCity || fallbackOrigin.city)
        detailsParams.set('origin_iata', String(originIata || fallbackOrigin.iata).toUpperCase())

        const normalizedClubId = normalizeClubId(clubId)
        if (normalizedClubId) {
          detailsParams.set('club_id', normalizedClubId)
        }

        const detailsLink = `/matches/${match.match_id}?${detailsParams.toString()}`
        const userAirfareError = toUserAirfareError(item.airfare_error, t)
        const selectedOutboundDate = resolveDateBySlot(match, selectedOutboundSlot) || item.best_date || ''
        const selectedReturnDate = resolveDateBySlot(match, selectedReturnSlot) || item.best_return_date || ''
        const fallbackOutboundPrice = getDirectionalPrice(item, 'outbound')
        const fallbackReturnPrice = getDirectionalPrice(item, 'return')
        const slotPrices = airfareByMatch[matchId]?.slotPrices
        const outboundPrice = Number.isFinite(slotPrices?.[selectedOutboundSlot]) ? slotPrices[selectedOutboundSlot] : fallbackOutboundPrice
        const returnPrice = Number.isFinite(slotPrices?.[selectedReturnSlot]) ? slotPrices[selectedReturnSlot] : fallbackReturnPrice
        const outboundRoute = buildDirectionRoute('outbound', originIata, match.destination_airport_iata)
        const returnRoute = buildDirectionRoute('return', originIata, match.destination_airport_iata)
        const outboundDate = resolveDirectionDate(match, item, 'outbound', selectedOutboundSlot, selectedReturnSlot)
        const returnDate = resolveDirectionDate(match, item, 'return', selectedOutboundSlot, selectedReturnSlot)
        const outboundLink =
          outboundRoute && outboundDate
            ? buildAviasalesLink({
                originIata: outboundRoute.origin,
                destinationIata: outboundRoute.destination,
                departDate: outboundDate,
              })
            : ''
        const returnLink =
          returnRoute && returnDate
            ? buildAviasalesLink({
                originIata: returnRoute.origin,
                destinationIata: returnRoute.destination,
                departDate: returnDate,
              })
            : ''

        const { booking, sutochno } = buildStayLinks(match.city)
        const homeClubName = getClubName(match.club_home_id, clubNamesById)
        const awayClubName = getClubName(match.club_away_id, clubNamesById)

        return (
          <article key={match.match_id} className={`match-table-row${isActive ? ' active' : ''}`} style={{ animationDelay: `${index * 70}ms` }}>
            <div className="match-table-cell trip-cell">
              <button type="button" className="trip-select" onClick={() => onSelect(match.match_id)}>
                <div className="trip-club-logos">
                  <ClubLogo clubId={match.club_home_id} clubName={homeClubName} size={28} />
                  <ClubLogo clubId={match.club_away_id} clubName={awayClubName} size={24} compact />
                </div>

                <strong>{getMatchTitle(match, clubNamesById, t)}</strong>
                <span>{(match.city || t('common.na')) + ' | ' + (match.stadium || t('common.na'))}</span>
                <span>{t('matchList.matchNumber', { id: match.match_id })}</span>
                <span>{formatKickoffMsk(match.kickoff_utc, locale)} MSK</span>
              </button>

              <a href={detailsLink} className="inline-link">
                {t('matchList.openDetails')}
              </a>
            </div>

            <div className="match-table-cell timeline-cell">
              <div className="trip-slot-controls">
                <div className="trip-slot-group">
                  <span className="trip-slot-label">{t('matchList.outboundLabel')}</span>
                  <div className="trip-slot-row">
                    {outboundSlotSelector.map((slotKey) => (
                      <button
                        key={`${match.match_id}_${slotKey}`}
                        type="button"
                        className={`trip-slot-btn${selectedOutboundSlot === slotKey ? ' active' : ''}`}
                        aria-pressed={selectedOutboundSlot === slotKey}
                        onClick={() => {
                          ensureMatchAirfareLoaded(match.match_id)
                          setSlotStateByMatch((prev) => ({
                            ...prev,
                            [matchId]: {
                              ...(prev[matchId] || defaultSlotState),
                              outboundSlot: slotKey,
                              fareDirection: 'outbound',
                            },
                          }))
                        }}
                      >
                        {t(`matchList.timeline.${slotToTimelineKey[slotKey]}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="trip-slot-group">
                  <span className="trip-slot-label">{t('matchList.returnLabel')}</span>
                  <div className="trip-slot-row">
                    {returnSlotSelector.map((slotKey) => (
                      <button
                        key={`${match.match_id}_${slotKey}`}
                        type="button"
                        className={`trip-slot-btn${selectedReturnSlot === slotKey ? ' active' : ''}`}
                        aria-pressed={selectedReturnSlot === slotKey}
                        onClick={() => {
                          ensureMatchAirfareLoaded(match.match_id)
                          setSlotStateByMatch((prev) => ({
                            ...prev,
                            [matchId]: {
                              ...(prev[matchId] || defaultSlotState),
                              returnSlot: slotKey,
                              fareDirection: 'return',
                            },
                          }))
                        }}
                      >
                        {t(`matchList.timeline.${slotToTimelineKey[slotKey]}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="trip-dates">
                <span>
                  {t('matchList.outboundLabel')}: {selectedOutboundDate || t('common.na')}
                </span>
                <span>
                  {t('matchList.returnLabel')}: {selectedReturnDate || t('common.na')}
                </span>
              </div>
            </div>

            <div className="match-table-cell price-cell">
              {userAirfareError ? (
                <p className="muted">{userAirfareError}</p>
              ) : (
                <div className="price-dual">
                  <div className={`price-dual-item${fareDirection === 'outbound' ? ' active' : ''}`}>
                    <span className="price-dual-label">{t('matchList.outboundLabel')}</span>
                    {outboundPrice && outboundLink ? (
                      <a
                        href={outboundLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flight-price-btn"
                        onClick={() =>
                          saveAviasalesRoute({
                            originIata: outboundRoute.origin,
                            destinationIata: outboundRoute.destination,
                            departDate: outboundDate,
                            source: 'match-list-outbound-price',
                          })
                        }
                      >
                        {formatPrice(outboundPrice, locale)}
                      </a>
                    ) : (
                      <span className="flight-price-btn disabled">{t('airfare.noPrices')}</span>
                    )}
                    <small className="muted">{outboundDate || t('common.na')}</small>
                  </div>

                  <div className={`price-dual-item${fareDirection === 'return' ? ' active' : ''}`}>
                    <span className="price-dual-label">{t('matchList.returnLabel')}</span>
                    {returnPrice && returnLink ? (
                      <a
                        href={returnLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flight-price-btn"
                        onClick={() =>
                          saveAviasalesRoute({
                            originIata: returnRoute.origin,
                            destinationIata: returnRoute.destination,
                            departDate: returnDate,
                            source: 'match-list-return-price',
                          })
                        }
                      >
                        {formatPrice(returnPrice, locale)}
                      </a>
                    ) : (
                      <span className="flight-price-btn disabled">{t('airfare.noPrices')}</span>
                    )}
                    <small className="muted">{returnDate || t('common.na')}</small>
                  </div>
                </div>
              )}
            </div>

            <div className="match-table-cell stay-cell">
              <a href={booking} target="_blank" rel="noreferrer" className="inline-link">
                Booking.com
              </a>
              <a href={sutochno} target="_blank" rel="noreferrer" className="inline-link">
                Sutochno.ru
              </a>
            </div>

            <div className="match-table-cell ticket-cell">
              {match.tickets_link ? (
                <a href={match.tickets_link} target="_blank" rel="noreferrer" className="ticket-link">
                  {t('matchList.buyMatchTicket')}
                </a>
              ) : (
                <span className="muted">{t('common.na')}</span>
              )}
              <small>{formatShortDate(match.kickoff_utc, locale)}</small>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default MatchList
