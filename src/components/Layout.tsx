import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Guitar, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Layout() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const isPractice = location.pathname.includes('/practice')

  function toggleLang() {
    const next = i18n.language === 'de' ? 'en' : 'de'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {!isPractice && (
        <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Guitar className="h-6 w-6 text-amber-500" />
              <span className="font-bold text-zinc-100 text-lg">{t('app.name')}</span>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={toggleLang} title="Switch language">
              <Globe className="h-4 w-4" />
              <span className="text-xs uppercase">{i18n.language}</span>
            </Button>
          </div>
        </header>
      )}

      <main className={isPractice ? 'px-4 py-4 max-w-3xl mx-auto' : 'px-4 py-6 max-w-3xl mx-auto'}>
        <Outlet />
      </main>
    </div>
  )
}
