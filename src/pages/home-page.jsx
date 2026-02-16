import MatchAirfareDashboard from '../widgets/match-airfare-dashboard'
import { useI18n } from '../shared/i18n/use-i18n'
import LanguageSwitcher from '../shared/ui/language-switcher'

function HomePage() {
  const { t } = useI18n()

  return (
    <main className="page">
      <div className="top-tools">
        <LanguageSwitcher />
      </div>

      <section className="hero">
        <p className="eyebrow">{t('home.eyebrow')}</p>
        <h1>{t('home.title')}</h1>
        <p className="muted">{t('home.subtitle')}</p>
      </section>

      <MatchAirfareDashboard />
    </main>
  )
}

export default HomePage

