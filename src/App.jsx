import { useEffect, useMemo, useState } from 'react'
import './App.css'
import HomePage from './pages/home-page'
import MatchPage from './pages/match-page'

function resolveRoute(pathname) {
  const match = pathname.match(/^\/matches\/(\d+)\/?$/)
  if (match) {
    return { type: 'match', matchId: match[1] }
  }

  return { type: 'home' }
}

function App() {
  const [locationTick, setLocationTick] = useState(0)

  useEffect(() => {
    const onPopstate = () => setLocationTick((value) => value + 1)
    window.addEventListener('popstate', onPopstate)
    return () => window.removeEventListener('popstate', onPopstate)
  }, [])

  const route = useMemo(() => resolveRoute(window.location.pathname), [locationTick])

  if (route.type === 'match') {
    return <MatchPage matchId={route.matchId} />
  }

  return <HomePage />
}

export default App
