import { useEffect, useMemo, useState } from 'react'
import AirfareTable from '../entities/airfare/ui/airfare-table'
import { fetchAirfareByMatch } from '../entities/airfare/api/fetch-airfare-by-match'
import { fetchMatchById } from '../entities/match/api/fetch-match-by-id'
import { pickBestAirfareOption } from '../shared/lib/airfare-offer'
import { saveAviasalesRoute } from '../shared/lib/save-aviasales-route'
import { originCities } from '../shared/config/origin-cities'
import { getDefaultOrigin, resolveOriginInput } from '../shared/lib/origin'
import CitySelect from '../shared/ui/city-select'

function getInitialOrigin() {
  const params = new URLSearchParams(window.location.search)
  const defaultOrigin = getDefaultOrigin()

  return resolveOriginInput({
    city: params.get('origin_city'),
    iata: params.get('origin_iata'),
  }) || defaultOrigin
}

function updateOriginQuery(matchId, origin) {
  const params = new URLSearchParams(window.location.search)
  params.set('origin_city', origin.city)
  params.set('origin_iata', origin.iata)
  window.history.replaceState(null, '', `/matches/${matchId}?${params.toString()}`)
}

function formatPrice(value) {
  return `${new Intl.NumberFormat('ru-RU').format(Number(value))} RUB`
}

function MatchPage({ matchId }) {
  const initialOrigin = getInitialOrigin()
  const [originCity, setOriginCity] = useState(initialOrigin.city)

  const [match, setMatch] = useState(null)
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchError, setMatchError] = useState('')

  const [airfareData, setAirfareData] = useState(null)
  const [airfareLoading, setAirfareLoading] = useState(false)
  const [airfareError, setAirfareError] = useState('')

  const resolvedOrigin = useMemo(
    () => resolveOriginInput({ city: originCity }),
    [originCity],
  )

  const bestOption = useMemo(
    () => pickBestAirfareOption(airfareData, resolvedOrigin?.iata, match?.destination_airport_iata),
    [airfareData, match?.destination_airport_iata, resolvedOrigin],
  )

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
      setAirfareError('Select origin city from list')
      return
    }

    await loadAirfare(matchId, resolvedOrigin)
  }

  return (
    <main className="page page-detail">
      <div className="top-nav">
        <a href="/" className="back-link">&larr; Back to matches</a>
      </div>

      {matchLoading ? <p className="muted">Loading match...</p> : null}
      {matchError ? <p className="error">{matchError}</p> : null}

      {match ? (
        <>
          <section className="hero hero-match">
            <p className="eyebrow">Match #{match.match_id}</p>
            <h1>{match.city || 'Unknown city'} • {match.stadium || 'Unknown stadium'}</h1>
            <div className="match-meta">
              <span className="match-pill">Kickoff: {new Date(match.kickoff_utc).toLocaleString()}</span>
              <span className="match-pill">Airport: {match.destination_airport_iata || '-'}</span>
              <span className="match-pill">Clubs: {match.club_home_id || '-'} / {match.club_away_id || '-'}</span>
            </div>

            <div className="hero-actions">
              {match.tickets_link ? (
                <a href={match.tickets_link} className="ticket-link" target="_blank" rel="noreferrer">
                  Buy match ticket
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
                  Best fare: {formatPrice(bestOption.price)}
                </a>
              ) : null}
            </div>

            {bestOption ? (
              <p className="hero-cta-note">
                Slot: {bestOption.slot} • Date: {bestOption.date}
              </p>
            ) : null}
          </section>

          <section className="panel">
            <form className="search-form" onSubmit={onAirfareSubmit}>
              <CitySelect
                value={originCity}
                options={originCities}
                onChange={setOriginCity}
                label="Origin city"
                placeholder="Москва"
                inputId="origin-city-detail"
              />

              <button type="submit" disabled={airfareLoading}>
                {airfareLoading ? 'Loading...' : 'Refresh airfare'}
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
