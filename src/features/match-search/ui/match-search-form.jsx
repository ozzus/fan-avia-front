import CitySelect from '../../../shared/ui/city-select'
import { useI18n } from '../../../shared/i18n/use-i18n'
import ClubLogo from '../../../shared/ui/club-logo'

function MatchSearchForm({
  originCityValue,
  cityOptions,
  onOriginCityChange,
  clubIdValue,
  clubOptions,
  onClubIdChange,
  onSubmit,
  loading,
}) {
  const { t } = useI18n()

  return (
    <div className="search-shell">
      <form className="search-toolbar" onSubmit={onSubmit}>
        <CitySelect
          value={originCityValue}
          options={cityOptions}
          onChange={onOriginCityChange}
          label={t('search.originCityLabel')}
          placeholder={t('search.originPlaceholder')}
          emptyText={t('citySelect.noResults')}
          inputId="origin-city-home"
        />

        <button type="submit" disabled={loading}>
          {loading ? t('search.loading') : t('search.reloadMatches')}
        </button>
      </form>

      <div className="club-filter-strip">
        <span className="club-filter-title">{t('search.clubLabel')}</span>
        <div className="club-tabs" role="tablist" aria-label={t('search.clubLabel')}>
          <button
            type="button"
            className={`club-tab${!clubIdValue ? ' active' : ''}`}
            onClick={() => onClubIdChange('')}
          >
            <span className="club-tab-mark">*</span>
            {t('search.allClubs')}
          </button>

          {clubOptions.map((club) => (
            <button
              key={club.value}
              type="button"
              className={`club-tab${String(clubIdValue) === String(club.value) ? ' active' : ''}`}
              onClick={() => onClubIdChange(club.value)}
            >
              <ClubLogo clubId={club.value} clubName={club.label} size={22} compact />
              {club.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MatchSearchForm
