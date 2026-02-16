import CitySelect from '../../../shared/ui/city-select'
import { useI18n } from '../../../shared/i18n/use-i18n'

function MatchSearchForm({ originCityValue, cityOptions, onOriginCityChange, onSubmit, loading }) {
  const { t } = useI18n()

  return (
    <form className="search-form" onSubmit={onSubmit}>
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
  )
}

export default MatchSearchForm

