function formatPrice(value) {
  return `${new Intl.NumberFormat('ru-RU').format(Number(value))} RUB`
}

function MatchList({ items, selectedMatchId, onSelect, originCity }) {
  if (!items.length) {
    return <p className="muted">No matches loaded yet.</p>
  }

  return (
    <div className="match-list">
      {items.map((item, index) => {
        const match = item.match
        if (!match) {
          return null
        }

        const isActive = String(selectedMatchId) === String(match.match_id)
        const detailsLink = `/matches/${match.match_id}?origin_city=${encodeURIComponent(originCity || 'Москва')}`

        return (
          <article key={match.match_id} className={`match-card${isActive ? ' active' : ''}`} style={{ animationDelay: `${index * 70}ms` }}>
            <button type="button" className="match-card-head" onClick={() => onSelect(match.match_id)}>
              <strong>Match #{match.match_id}</strong>
              <span>{new Date(match.kickoff_utc).toLocaleString()}</span>
            </button>

            <div className="match-card-body">
              <p><b>City:</b> {match.city || '-'}</p>
              <p><b>Stadium:</b> {match.stadium || '-'}</p>
              <p><b>Destination airport:</b> {match.destination_airport_iata || '-'}</p>
              <p><b>Home/Away:</b> {match.club_home_id || '-'} / {match.club_away_id || '-'}</p>

              {item.airfare_error ? (
                <p className="muted"><b>Airfare:</b> {item.airfare_error}</p>
              ) : Number.isFinite(Number(item.min_price)) ? (
                <p className="muted"><b>Best airfare:</b> from {formatPrice(item.min_price)} ({item.best_date || '-'})</p>
              ) : (
                <p className="muted"><b>Airfare:</b> no prices yet</p>
              )}

              <div className="match-actions">
                <a href={detailsLink} className="inline-link">
                  Open details
                </a>

                {match.tickets_link ? (
                  <a href={match.tickets_link} target="_blank" rel="noreferrer" className="ticket-link">
                    Buy match ticket
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
