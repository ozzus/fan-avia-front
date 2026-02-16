import { SUPPORTED_LOCALES } from '../i18n/dictionaries'
import { useI18n } from '../i18n/use-i18n'

function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="language-switcher" role="group" aria-label={t('language.label')}>
      {SUPPORTED_LOCALES.map((item) => (
        <button
          key={item}
          type="button"
          className={`language-switcher-btn${item === locale ? ' active' : ''}`}
          onClick={() => setLocale(item)}
          aria-pressed={item === locale}
        >
          {t(`language.short.${item}`)}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher

