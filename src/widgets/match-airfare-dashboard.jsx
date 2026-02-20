import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchMatches } from '../entities/match/api/fetch-matches'
import { fetchClubs } from '../entities/club/api/fetch-clubs'
import { fetchAirfareByMatch } from '../entities/airfare/api/fetch-airfare-by-match'
import MatchList from '../entities/match/ui/match-list'
import AirfareTable from '../entities/airfare/ui/airfare-table'
import MatchSearchForm from '../features/match-search/ui/match-search-form'
import { originCities } from '../shared/config/origin-cities'
import { getDefaultOrigin, readStoredOriginCity, resolveOriginInput, writeStoredOriginCity } from '../shared/lib/origin'
import {
  buildClubNameMap,
  buildClubOptions,
  normalizeClubId,
  readStoredClubId,
  writeStoredClubId,
} from '../shared/lib/club'
import { useI18n } from '../shared/i18n/use-i18n'

const DEFAULT_LIMIT = 12

function getInitialParams() {
  const params = new URLSearchParams(window.location.search)
  const defaultOrigin = getDefaultOrigin()
  const storedOriginCity = readStoredOriginCity()
  const resolvedOrigin =
    resolveOriginInput({
      city: params.get('origin_city'),
      iata: params.get('origin_iata'),
    }) ||
    resolveOriginInput({ city: storedOriginCity }) ||
    defaultOrigin

  const clubFromQuery = normalizeClubId(params.get('club_id'))
  const storedClub = readStoredClubId()

  return {
    originCity: resolvedOrigin.city,
    selected: params.get('match_id') || '',
    clubId: clubFromQuery || storedClub || '',
  }
}

function pickDefaultMatchId(items) {
  return items[0]?.match?.match_id || ''
}

function updateQuery(originCity, originIata, selectedMatchId, clubId) {
  const params = new URLSearchParams()
  params.set('origin_city', originCity)
  params.set('origin_iata', originIata)

  const normalizedClubId = normalizeClubId(clubId)
  if (normalizedClubId) {
    params.set('club_id', normalizedClubId)
  }

  if (selectedMatchId) {
    params.set('match_id', selectedMatchId)
  }

  const next = `${window.location.pathname}?${params.toString()}`
  window.history.replaceState(null, '', next)
}

function MatchAirfareDashboard() {
  const { locale, t } = useI18n()
  const initial = getInitialParams()

  const [originCity, setOriginCity] = useState(initial.originCity)
  const [clubId, setClubId] = useState(initial.clubId)
  const [clubs, setClubs] = useState([])
  const [items, setItems] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState(initial.selected)
  const [loadError, setLoadError] = useState('')

  const [airfareData, setAirfareData] = useState(null)
  const [airfareError, setAirfareError] = useState('')

  const [matchesLoading, setMatchesLoading] = useState(false)
  const [airfareLoading, setAirfareLoading] = useState(false)
  const isFirstClubRender = useRef(true)

  const selectedItem = useMemo(
    () => items.find((item) => String(item.match?.match_id) === String(selectedMatchId)),
    [items, selectedMatchId],
  )

  const selectedMatch = selectedItem?.match || null

  const resolvedOrigin = useMemo(() => resolveOriginInput({ city: originCity }), [originCity])
  const clubOptions = useMemo(() => buildClubOptions(clubs, locale), [clubs, locale])
  const clubNamesById = useMemo(() => buildClubNameMap(clubs, locale), [clubs, locale])

  async function loadAirfare(matchId, originIata, currentOriginCity = originCity, currentClubId = clubId) {
    setAirfareLoading(true)
    setAirfareError('')

    try {
      const data = await fetchAirfareByMatch(matchId, originIata)
      setAirfareData(data)
      writeStoredOriginCity(currentOriginCity)
      writeStoredClubId(currentClubId)
      updateQuery(currentOriginCity, originIata, String(matchId), currentClubId)
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
    const normalizedClubId = normalizeClubId(clubId)
    writeStoredClubId(normalizedClubId)

    if (!origin) {
      setItems([])
      setSelectedMatchId('')
      setLoadError(t('errors.selectOriginFromList'))
      setMatchesLoading(false)
      return
    }

    writeStoredOriginCity(origin.city)

    try {
      const data = await fetchMatches({
        limit: DEFAULT_LIMIT,
        originIata: origin.iata,
        clubId: normalizedClubId,
      })

      const loadedItems = data?.items || []
      setItems(loadedItems)

      const fallbackId = pickDefaultMatchId(loadedItems)
      const preferredId = loadedItems.find((item) => String(item.match?.match_id) === String(selectedMatchId))
        ? selectedMatchId
        : fallbackId

      setSelectedMatchId(preferredId)
      updateQuery(origin.city, origin.iata, preferredId, normalizedClubId)

      if (preferredId) {
        await loadAirfare(preferredId, origin.iata, origin.city, normalizedClubId)
      }
    } catch (error) {
      setItems([])
      setSelectedMatchId('')
      setLoadError(error.message)
      updateQuery(origin.city, origin.iata, '', normalizedClubId)
    } finally {
      setMatchesLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadClubs() {
      try {
        const loaded = await fetchClubs()
        if (!cancelled) {
          setClubs(loaded)
        }
      } catch {
        if (!cancelled) {
          setClubs([])
        }
      }
    }

    void loadClubs()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    void loadMatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isFirstClubRender.current) {
      isFirstClubRender.current = false
      return
    }

    void loadMatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId])

  function handleClubIdChange(nextClubId) {
    const normalized = normalizeClubId(nextClubId)
    setClubId(normalized)
    setSelectedMatchId('')
    setAirfareData(null)
    setAirfareError('')
    writeStoredClubId(normalized)
  }

  async function handleSelectMatch(matchId) {
    setSelectedMatchId(matchId)

    if (!resolvedOrigin) {
      setAirfareData(null)
      setAirfareError(t('errors.selectOriginFromList'))
      return
    }

    await loadAirfare(matchId, resolvedOrigin.iata, resolvedOrigin.city, clubId)
  }

  return (
    <>
      <MatchSearchForm
        originCityValue={originCity}
        cityOptions={originCities}
        onOriginCityChange={setOriginCity}
        clubIdValue={clubId}
        clubOptions={clubOptions}
        onClubIdChange={handleClubIdChange}
        onSubmit={loadMatches}
        loading={matchesLoading}
      />

      {loadError ? <p className="error">{loadError}</p> : null}

      <section className="content-grid">
        <div>
          <h2>{t('dashboard.upcomingMatches')}</h2>
          <MatchList
            items={items}
            selectedMatchId={selectedMatchId}
            onSelect={handleSelectMatch}
            originCity={originCity}
            originIata={resolvedOrigin?.iata}
            clubId={clubId}
            clubNamesById={clubNamesById}
          />
        </div>

        <div>
          <h2>{t('dashboard.airfare')}</h2>
          {selectedMatch ? <p className="muted">{t('dashboard.selectedMatch', { id: selectedMatch.match_id })}</p> : null}
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
