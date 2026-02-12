import MatchAirfareDashboard from '../widgets/match-airfare-dashboard'

function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Fan Avia</p>
        <h1>Football weekends + live airfare windows</h1>
        <p className="muted">Choose matches, jump to ticket checkout, and compare outbound/return fares around kickoff time.</p>
      </section>

      <MatchAirfareDashboard />
    </main>
  )
}

export default HomePage
