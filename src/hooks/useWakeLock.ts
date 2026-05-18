import { useEffect, useRef } from 'react'

export function useWakeLock() {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  async function acquire() {
    if (!('wakeLock' in navigator)) return
    try {
      lockRef.current = await navigator.wakeLock.request('screen')
    } catch {
      // User denied or browser doesn't support it — silently ignore
    }
  }

  useEffect(() => {
    acquire()

    // Wake lock is released automatically when the tab is hidden.
    // Re-acquire it when the user returns to the tab.
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') acquire()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }
  }, [])
}
