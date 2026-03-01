import { getClubBrand } from '../config/club-brand'
import { clubLogosById } from '../config/club-logos'

function ClubLogo({ clubId, clubName, size = 28, compact = false }) {
  const brand = getClubBrand(clubId, clubName)
  const logoSrc = clubLogosById[String(clubId || '')]

  if (logoSrc) {
    return (
      <span
        className={`club-logo-image${compact ? ' compact' : ''}`}
        aria-hidden="true"
        style={{ width: `${size}px`, height: `${size}px` }}
        title={clubName || `#${clubId}`}
      >
        <img src={logoSrc} alt="" loading="lazy" />
      </span>
    )
  }

  return (
    <span
      className={`club-logo${compact ? ' compact' : ''}`}
      aria-hidden="true"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: brand.bg,
      }}
      title={clubName || `#${clubId}`}
    >
      {brand.abbr}
    </span>
  )
}

export default ClubLogo
