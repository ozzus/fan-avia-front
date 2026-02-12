export const affiliateConfig = {
  marker: (import.meta.env.VITE_TP_MARKER || '').trim() || '688168',
  baseUrl: (import.meta.env.VITE_AVIASALES_BASE_URL || 'https://search.aviasales.com/flights/').trim(),
  locale: (import.meta.env.VITE_AVIASALES_LOCALE || 'ru').trim() || 'ru',
  currency: ((import.meta.env.VITE_AVIASALES_CURRENCY || 'RUB').trim() || 'RUB').toUpperCase(),
}
