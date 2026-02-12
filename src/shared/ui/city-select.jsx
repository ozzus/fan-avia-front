import { useEffect, useMemo, useRef, useState } from 'react'

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

function CitySelect({
  value,
  options,
  onChange,
  label = 'Origin city',
  placeholder = 'Москва',
  inputId,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentClick)
    return () => document.removeEventListener('mousedown', handleDocumentClick)
  }, [])

  const filteredOptions = useMemo(() => {
    const query = normalize(value)
    if (!query) {
      return options
    }

    return options.filter((item) => {
      const city = normalize(item.city)
      const iata = normalize(item.iata)
      return city.includes(query) || iata.includes(query)
    })
  }, [options, value])

  function handleSelect(option) {
    onChange(option.city)
    setIsOpen(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setIsOpen(false)
      return
    }

    if (event.key === 'Enter' && isOpen && filteredOptions.length > 0) {
      event.preventDefault()
      handleSelect(filteredOptions[0])
    }
  }

  return (
    <label className="field city-select-field">
      <span>{label}</span>

      <div ref={rootRef} className={`city-select${isOpen ? ' open' : ''}`}>
        <input
          id={inputId}
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />

        {isOpen ? (
          <ul className="city-select-menu" role="listbox" aria-label={label}>
            {filteredOptions.slice(0, 10).map((option) => (
              <li key={option.iata}>
                <button
                  type="button"
                  className="city-option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option)}
                >
                  <span>{option.city}</span>
                  <small>{option.iata}</small>
                </button>
              </li>
            ))}

            {!filteredOptions.length ? (
              <li className="city-select-empty">No matches for city</li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </label>
  )
}

export default CitySelect
