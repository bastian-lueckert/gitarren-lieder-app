import { Outlet, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Guitar, Globe, User, Cloud, CloudOff, Loader2, LogOut, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AuthDialog } from '@/components/AuthDialog'
import { useAuthStore } from '@/store/authStore'
import { useSongStore } from '@/store/songStore'
import { useSetStore } from '@/store/setStore'
import { cn } from '@/lib/utils'

export function Layout() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const isPractice = location.pathname.includes('/practice')

  const { user, syncing, lastSync, syncError, signOut, sync } = useAuthStore()
  const { loadSongs } = useSongStore()
  const { loadSets } = useSetStore()

  const [showAuth, setShowAuth] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  function toggleLang() {
    const next = i18n.language === 'de' ? 'en' : 'de'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  async function handleSync() {
    await sync(async () => { await Promise.all([loadSongs(), loadSets()]) })
    setShowUserMenu(false)
  }

  async function handleSignOut() {
    await signOut()
    setShowUserMenu(false)
  }

  const shortEmail = user?.email ? user.email.split('@')[0] : ''

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      {!isPractice && (
        <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <Guitar className="h-6 w-6 text-amber-500 shrink-0" />
              <span className="font-bold text-zinc-100 text-lg hidden sm:inline">{t('app.name')}</span>
            </Link>

            <div className="flex items-center gap-1">
              {/* Language toggle */}
              <Button variant="ghost" size="icon-sm" onClick={toggleLang} title="Switch language">
                <Globe className="h-4 w-4" />
                <span className="text-xs uppercase">{i18n.language}</span>
              </Button>

              {/* Auth / Account button */}
              {!user ? (
                <Button variant="ghost" size="sm" onClick={() => setShowAuth(true)} className="gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="text-xs">{t('auth.signIn')}</span>
                </Button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu((v) => !v)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-sm"
                  >
                    {syncing ? (
                      <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                    ) : syncError ? (
                      <CloudOff className="h-4 w-4 text-red-400" />
                    ) : (
                      <Cloud className={cn('h-4 w-4', lastSync ? 'text-green-500' : 'text-zinc-500')} />
                    )}
                    <span className="text-zinc-300 max-w-[100px] truncate">{shortEmail}</span>
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl py-1">
                        <div className="px-3 py-2 border-b border-zinc-800">
                          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                          {lastSync && (
                            <p className="text-xs text-zinc-600 mt-0.5">
                              {t('sync.synced')}: {lastSync.toLocaleTimeString()}
                            </p>
                          )}
                          {syncError && (
                            <p className="text-xs text-red-400 mt-0.5">{t('sync.error')}</p>
                          )}
                        </div>
                        <button
                          onClick={handleSync}
                          disabled={syncing}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                        >
                          <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
                          {syncing ? t('sync.syncing') : t('sync.syncNow')}
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          {t('auth.signOut')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      <main
        className={isPractice ? 'px-4 py-4 max-w-3xl mx-auto' : 'px-4 py-6 max-w-3xl mx-auto'}
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}
      >
        <Outlet />
      </main>

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </div>
  )
}
