import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, CloudOff } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { useSongStore } from '@/store/songStore'
import { useSetStore } from '@/store/setStore'
import { cn } from '@/lib/utils'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { t } = useTranslation()
  const { signIn, signUp, sync } = useAuthStore()
  const { loadSongs } = useSongStore()
  const { loadSets } = useSetStore()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        await sync(async () => { await Promise.all([loadSongs(), loadSets()]) })
        onOpenChange(false)
      } else {
        await signUp(email, password)
        setSuccess(true)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(() => {
      setEmail(''); setPassword(''); setError(null); setSuccess(false); setMode('signin')
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-4 text-center space-y-3">
            <p className="text-sm text-zinc-300">{t('auth.checkEmail')}</p>
            <Button variant="outline" onClick={handleClose}>{t('form.cancel')}</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t('auth.email')}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('auth.password')}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2">
                <CloudOff className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
            </Button>

            <p className="text-center text-sm text-zinc-500">
              {mode === 'signin' ? t('auth.noAccount') : t('auth.hasAccount')}
              {' '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
                className={cn('text-amber-400 hover:text-amber-300 transition-colors')}
              >
                {mode === 'signin' ? t('auth.signUp') : t('auth.signIn')}
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
