import { useCallback, useMemo, useState } from 'react'
import { I18nContext } from './i18n-context'
import { DEFAULT_LOCALE, dictionaries, SUPPORTED_LOCALES } from './dictionaries'

const STORAGE_KEY = 'fan-avia.locale'

function resolveInitialLocale() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && SUPPORTED_LOCALES.includes(stored)) {
      return stored
    }
  } catch {
    // Ignore localStorage read errors.
  }

  const browserLocale = (navigator.language || '').slice(0, 2).toLowerCase()
  if (SUPPORTED_LOCALES.includes(browserLocale)) {
    return browserLocale
  }

  return DEFAULT_LOCALE
}

function getMessage(locale, key) {
  const dict = dictionaries[locale]
  if (!dict) {
    return null
  }

  return key.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return acc[part]
    }

    return null
  }, dict)
}

function interpolate(template, params) {
  if (!params) {
    return template
  }

  return String(template).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token) => {
    if (Object.prototype.hasOwnProperty.call(params, token)) {
      return String(params[token])
    }

    return `{{${token}}}`
  })
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(resolveInitialLocale)

  const changeLocale = useCallback((nextLocale) => {
    const safeLocale = SUPPORTED_LOCALES.includes(nextLocale) ? nextLocale : DEFAULT_LOCALE
    setLocale(safeLocale)

    try {
      window.localStorage.setItem(STORAGE_KEY, safeLocale)
    } catch {
      // Ignore localStorage write errors.
    }
  }, [])

  const t = useCallback(
    (key, params) => {
      const raw = getMessage(locale, key) ?? getMessage(DEFAULT_LOCALE, key) ?? key
      if (typeof raw !== 'string') {
        return key
      }

      return interpolate(raw, params)
    },
    [locale],
  )

  const value = useMemo(
    () => ({
      locale,
      setLocale: changeLocale,
      t,
    }),
    [changeLocale, locale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
