import { useEffect, useMemo, useState } from 'react'
import AirfareTable from '../entities/airfare/ui/airfare-table'
import { fetchAirfareByMatch } from '../entities/airfare/api/fetch-airfare-by-match'
import { fetchMatchById } from '../entities/match/api/fetch-match-by-id'
import { pickBestAirfareOption } from '../shared/lib/airfare-offer'
import { saveAviasalesRoute } from '../shared/lib/save-aviasales-route'
import { originCities } from '../shared/config/origin-cities'
import { getDefaultOrigin, resolveOriginInput } from '../shared/lib/origin'
import { getClubName } from '../shared/lib/club'
import { useI18n } from '../shared/i18n/use-i18n'
import CitySelect from '../shared/ui/city-select'
import LanguageSwitcher from '../shared/ui/language-switcher'

function getInitialOrigin() {
  const params = new URLSearchParams(window.location.search)
  const defaultOrigin = getDefaultOrigin()

  return (
    resolveOriginInput({
      city: params.get('origin_city'),
      iata: params.get('origin_iata'),
    }) || defaultOrigin
  )
}

function updateOriginQuery(matchId, origin) {
  const params = new URLSearchParams(window.location.search)
  params.set('origin_city', origin.city)
  params.set('origin_iata', origin.iata)
  window.history.replaceState(null, '', `/matches/${matchId}?${params.toString()}`)
}

function formatPrice(value, locale) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function MatchPage({ matchId }) {
  const { locale, t } = useI18n()
  const initialOrigin = getInitialOrigin()
  const [originCity, setOriginCity] = useState(initialOrigin.city)

  const [match, setMatch] = useState(null)
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchError, setMatchError] = useState('')

  const [airfareData, setAirfareData] = useState(null)
  const [airfareLoading, setAirfareLoading] = useState(false)
  const [airfareError, setAirfareError] = useState('')

  const resolvedOrigin = useMemo(() => resolveOriginInput({ city: originCity }), [originCity])

  const bestOption = useMemo(
    () => pickBestAirfareOption(airfareData, resolvedOrigin?.iata, match?.destination_airport_iata),
    [airfareData, match?.destination_airport_iata, resolvedOrigin],
  )
  const homeClubName = getClubName(match?.club_home_id, locale)
  const awayClubName = getClubName(match?.club_away_id, locale)

  async function loadAirfare(currentMatchId, origin) {
    setAirfareLoading(true)
    setAirfareError('')

    try {
      const data = await fetchAirfareByMatch(currentMatchId, origin.iata)
      setAirfareData(data)
      updateOriginQuery(currentMatchId, origin)
    } catch (error) {
      setAirfareData(null)
      setAirfareError(error.message)
    } finally {
      setAirfareLoading(false)
    }
  }

  useEffect(() => {
    async function bootstrap() {
      setMatchLoading(true)
      setMatchError('')
      setAirfareData(null)
      setAirfareError('')

      try {
        const data = await fetchMatchById(matchId)
        setMatch(data)

        if (resolvedOrigin) {
          await loadAirfare(matchId, resolvedOrigin)
        }
      } catch (error) {
        setMatch(null)
        setMatchError(error.message)
      } finally {
        setMatchLoading(false)
      }
    }

    void bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId])

  async function onAirfareSubmit(event) {
    event.preventDefault()

    if (!resolvedOrigin) {
      setAirfareData(null)
      setAirfareError(t('errors.selectOriginFromList'))
      return
    }

    await loadAirfare(matchId, resolvedOrigin)
  }

  return (
    <main className="page page-detail">
      <div className="top-nav">
        <a href="/" className="back-link">
          &larr; {t('matchPage.backToMatches')}
        </a>
        <LanguageSwitcher />
      </div>

      {matchLoading ? <p className="muted">{t('matchPage.loadingMatch')}</p> : null}
      {matchError ? <p className="error">{matchError}</p> : null}

      {match ? (
        <>
          <section className="hero hero-match">
            <p className="eyebrow">{t('matchPage.matchNumber', { id: match.match_id })}</p>
            <h1>
              {match.city || t('matchPage.unknownCity')} • {match.stadium || t('matchPage.unknownStadium')}
            </h1>
            <div className="match-meta">
              <span className="match-pill">
                {t('matchPage.kickoff')}: {new Date(match.kickoff_utc).toLocaleString(locale)}
              </span>
              <span className="match-pill">
                {t('matchPage.airport')}: {match.destination_airport_iata || t('common.na')}
              </span>
              <span className="match-pill">
                {t('matchPage.clubs')}: {homeClubName || t('common.na')} / {awayClubName || t('common.na')}
              </span>
            </div>

            <div className="hero-actions">
              {match.tickets_link ? (
                <a href={match.tickets_link} className="ticket-link" target="_blank" rel="noreferrer">
                  {t('matchPage.buyMatchTicket')}
                </a>
              ) : null}

              {bestOption?.link ? (
                <a
                  href={bestOption.link}
                  className="hero-cta"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    saveAviasalesRoute({
                      originIata: bestOption.originIata,
                      destinationIata: bestOption.destinationIata,
                      departDate: bestOption.date,
                      source: 'best-fare',
                    })
                  }
                >
                  {t('matchPage.bestFare', { price: formatPrice(bestOption.price, locale) })}
                </a>
              ) : null}
            </div>

            {bestOption ? (
              <p className="hero-cta-note">{t('matchPage.slotDate', { slot: bestOption.slot, date: bestOption.date })}</p>
            ) : null}
          </section>

          <section className="panel">
            <form className="search-form" onSubmit={onAirfareSubmit}>
              <CitySelect
                value={originCity}
                options={originCities}
                onChange={setOriginCity}
                label={t('search.originCityLabel')}
                placeholder={t('search.originPlaceholder')}
                emptyText={t('citySelect.noResults')}
                inputId="origin-city-detail"
              />

              <button type="submit" disabled={airfareLoading}>
                {airfareLoading ? t('search.loading') : t('search.refreshAirfare')}
              </button>
            </form>

            <AirfareTable
              data={airfareData}
              loading={airfareLoading}
              error={airfareError}
              originIata={resolvedOrigin?.iata}
              destinationIata={match.destination_airport_iata}
            />
          </section>
        </>
      ) : null}
    </main>
  )
}

export default MatchPage

