import CitySelect from '../../../shared/ui/city-select'

function MatchSearchForm({ originCityValue, cityOptions, onOriginCityChange, onSubmit, loading }) {
  return (
    <form className="search-form" onSubmit={onSubmit}>
      <CitySelect
        value={originCityValue}
        options={cityOptions}
        onChange={onOriginCityChange}
        label="Origin city"
        placeholder="Москва"
        inputId="origin-city-home"
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Reload matches'}
      </button>
    </form>
  )
}

export default MatchSearchForm
