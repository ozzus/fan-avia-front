import { useEffect, useMemo, useState } from 'react'
import { fetchMatches } from '../entities/match/api/fetch-matches'
import { fetchAirfareByMatch } from '../entities/airfare/api/fetch-airfare-by-match'
import MatchList from '../entities/match/ui/match-list'
import AirfareTable from '../entities/airfare/ui/airfare-table'
import MatchSearchForm from '../features/match-search/ui/match-search-form'
import { originCities } from '../shared/config/origin-cities'
import { getDefaultOrigin, resolveOriginInput } from '../shared/lib/origin'

const DEFAULT_LIMIT = 12

function getInitialParams() {
  const params = new URLSearchParams(window.location.search)
  const defaultOrigin = getDefaultOrigin()
  const resolvedOrigin = resolveOriginInput({
    city: params.get('origin_city'),
    iata: params.get('origin_iata'),
  }) || defaultOrigin

  return {
    originCity: resolvedOrigin.city,
    selected: params.get('match_id') || '',
  }
}

function pickDefaultMatchId(items) {
  const withPrices = items.find((item) => !item.airfare_error)
  return withPrices?.match?.match_id || items[0]?.match?.match_id || ''
}

function updateQuery(originCity, originIata, selectedMatchId) {
  const params = new URLSearchParams()
  params.set('origin_city', originCity)
  params.set('origin_iata', originIata)
  if (selectedMatchId) {
    params.set('match_id', selectedMatchId)
  }

  const next = `${window.location.pathname}?${params.toString()}`
  window.history.replaceState(null, '', next)
}

function MatchAirfareDashboard() {
  const initial = getInitialParams()

  const [originCity, setOriginCity] = useState(initial.originCity)
  const [items, setItems] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState(initial.selected)
  const [loadError, setLoadError] = useState('')

  const [airfareData, setAirfareData] = useState(null)
  const [airfareError, setAirfareError] = useState('')

  const [matchesLoading, setMatchesLoading] = useState(false)
  const [airfareLoading, setAirfareLoading] = useState(false)

  const selectedItem = useMemo(
    () => items.find((item) => String(item.match?.match_id) === String(selectedMatchId)),
    [items, selectedMatchId],
  )

  const selectedMatch = selectedItem?.match || null

  const resolvedOrigin = useMemo(
    () => resolveOriginInput({ city: originCity }),
    [originCity],
  )

  async function loadAirfare(matchId, originIata, currentOriginCity = originCity) {
    setAirfareLoading(true)
    setAirfareError('')

    try {
      const data = await fetchAirfareByMatch(matchId, originIata)
      setAirfareData(data)
      updateQuery(currentOriginCity, originIata, String(matchId))
    } catch (error) {
      setAirfareData(null)
      setAirfareError(error.message)
    } finally {
      setAirfareLoading(false)
    }
  }

  async function loadMatches(event) {
    if (event) {
      event.preventDefault()
    }

    setMatchesLoading(true)
    setLoadError('')
    setAirfareData(null)
    setAirfareError('')

    const origin = resolveOriginInput({ city: originCity })
    if (!origin) {
      setMatches([])
      setSelectedMatchId('')
      setLoadError('Select origin city from list')
      setMatchesLoading(false)
      return
    }

    try {
      const data = await fetchMatches({
        limit: DEFAULT_LIMIT,
        originIata: origin.iata,
      })

      const loadedItems = data?.items || []
      setItems(loadedItems)

      const fallbackId = pickDefaultMatchId(loadedItems)
      const preferredId = loadedItems.find((item) => String(item.match?.match_id) === String(selectedMatchId))
        ? selectedMatchId
        : fallbackId

      setSelectedMatchId(preferredId)
      updateQuery(origin.city, origin.iata, preferredId)

      if (preferredId) {
        await loadAirfare(preferredId, origin.iata, origin.city)
      }
    } catch (error) {
      setItems([])
      setSelectedMatchId('')
      setLoadError(error.message)
      updateQuery(origin.city, origin.iata, '')
    } finally {
      setMatchesLoading(false)
    }
  }

  useEffect(() => {
    void loadMatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSelectMatch(matchId) {
    setSelectedMatchId(matchId)

    if (!resolvedOrigin) {
      setAirfareData(null)
      setAirfareError('Select origin city from list')
      return
    }

    await loadAirfare(matchId, resolvedOrigin.iata, resolvedOrigin.city)
  }

  return (
    <>
      <MatchSearchForm
        originCityValue={originCity}
        cityOptions={originCities}
        onOriginCityChange={setOriginCity}
        onSubmit={loadMatches}
        loading={matchesLoading}
      />

      {loadError ? <p className="error">{loadError}</p> : null}

      <section className="content-grid">
        <div>
          <h2>Upcoming matches</h2>
          <MatchList
            items={items}
            selectedMatchId={selectedMatchId}
            onSelect={handleSelectMatch}
            originCity={originCity}
          />
        </div>

        <div>
          <h2>Airfare</h2>
          {selectedMatch ? <p className="muted">Selected match #{selectedMatch.match_id}</p> : null}
          <AirfareTable
            data={airfareData}
            loading={airfareLoading}
            error={airfareError}
            originIata={resolvedOrigin?.iata}
            destinationIata={selectedMatch?.destination_airport_iata}
          />
        </div>
      </section>
    </>
  )
}

export default MatchAirfareDashboard
