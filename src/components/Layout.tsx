import { Outlet, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Guitar, Globe, User, Cloud, CloudOff, Loader2, LogOut, RefreshCw, Zap, ZapOff } from 'lucide-react'
import { useState, useEffect } from 'react'
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

  const { user, syncing, lastSync, syncError, autoSync, autoSyncPending, sync, setAutoSync, setReload } = useAuthStore()
  const { loadSongs } = useSongStore()
  const { loadSets } = useSetStore()

  const [showAuth, setShowAuth] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const reload = async () => { await Promise.all([loadSongs(), loadSets()]) }

  useEffect(() => {
    setReload(reload)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleLang() {
    const next = i18n.language === 'de' ? 'en' : 'de'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  async function handleSync() {
    await sync(reload)
    setShowUserMenu(false)
  }

  async function handleSignOut() {
    await signOut()
    setShowUserMenu(false)
  }

  const { signOut } = useAuthStore()
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
                    {/* Cloud icon with status */}
                    <span className="relative">
                      {syncing ? (
                        <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                      ) : syncError ? (
                        <CloudOff className="h-4 w-4 text-red-400" />
                      ) : (
                        <Cloud className={cn('h-4 w-4', lastSync ? 'text-green-500' : 'text-zinc-500')} />
                      )}
                      {/* Pending dot */}
                      {autoSyncPending && !syncing && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </span>
                    <span className="text-zinc-300 max-w-[100px] truncate">{shortEmail}</span>
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl py-1">
                        {/* User info */}
                        <div className="px-3 py-2 border-b border-zinc-800">
                          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                          {syncing && (
                            <p className="text-xs text-amber-400 mt-0.5">{t('sync.syncing')}</p>
                          )}
                          {autoSyncPending && !syncing && (
                            <p className="text-xs text-amber-400/70 mt-0.5">{t('sync.autoSyncPending')}</p>
                          )}
                          {!syncing && !autoSyncPending && lastSync && (
                            <p className="text-xs text-zinc-600 mt-0.5">
                              {t('sync.synced')}: {lastSync.toLocaleTimeString()}
                            </p>
                          )}
                          {syncError && (
                            <p className="text-xs text-red-400 mt-0.5">{t('sync.error')}</p>
                          )}
                        </div>

                        {/* Manual sync */}
                        <button
                          onClick={handleSync}
                          disabled={syncing}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                        >
                          <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
                          {syncing ? t('sync.syncing') : t('sync.syncNow')}
                        </button>

                        {/* Auto-sync toggle */}
                        <button
                          onClick={() => setAutoSync(!autoSync)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-zinc-800 transition-colors"
                        >
                          <span className="flex items-center gap-2 text-zinc-300">
                            {autoSync
                              ? <Zap className="h-4 w-4 text-amber-400" />
                              : <ZapOff className="h-4 w-4 text-zinc-500" />
                            }
                            {t('sync.autoSync')}
                          </span>
                          {/* Toggle pill */}
                          <span className={cn(
                            'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors',
                            autoSync ? 'bg-amber-500' : 'bg-zinc-700',
                          )}>
                            <span className={cn(
                              'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                              autoSync ? 'translate-x-4' : 'translate-x-0',
                            )} />
                          </span>
                        </button>

                        <div className="border-t border-zinc-800 mt-1">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            {t('auth.signOut')}
                          </button>
                        </div>
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
