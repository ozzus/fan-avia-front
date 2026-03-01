import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchMatches } from '../entities/match/api/fetch-matches'
import { fetchClubs } from '../entities/club/api/fetch-clubs'
import MatchList from '../entities/match/ui/match-list'
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
  const [matchesLoading, setMatchesLoading] = useState(false)
  const isFirstClubRender = useRef(true)

  const resolvedOrigin = useMemo(() => resolveOriginInput({ city: originCity }), [originCity])
  const clubOptions = useMemo(() => buildClubOptions(clubs, locale), [clubs, locale])
  const clubNamesById = useMemo(() => buildClubNameMap(clubs, locale), [clubs, locale])

  async function loadMatches(event) {
    if (event) {
      event.preventDefault()
    }

    setMatchesLoading(true)
    setLoadError('')

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
      const requestLimit = normalizedClubId ? undefined : DEFAULT_LIMIT

      const data = await fetchMatches({
        limit: requestLimit,
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
    writeStoredClubId(normalized)
  }

  function handleSelectMatch(matchId) {
    setSelectedMatchId(matchId)

    if (resolvedOrigin) {
      updateQuery(resolvedOrigin.city, resolvedOrigin.iata, String(matchId), clubId)
    }
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

      <section className="dashboard-table-box">
        <header className="dashboard-table-head">
          <span>{t('dashboard.headers.trip')}</span>
          <span>{t('dashboard.headers.timeline')}</span>
          <span>{t('dashboard.headers.flight')}</span>
          <span>{t('dashboard.headers.stay')}</span>
          <span>{t('dashboard.headers.tickets')}</span>
        </header>

        <MatchList
          items={items}
          selectedMatchId={selectedMatchId}
          onSelect={handleSelectMatch}
          originCity={originCity}
          originIata={resolvedOrigin?.iata}
          clubId={clubId}
          clubNamesById={clubNamesById}
        />
      </section>
    </>
  )
}

export default MatchAirfareDashboard
