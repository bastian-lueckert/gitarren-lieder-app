import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Guitar, Plus, Download, TrendingUp, ListMusic, CalendarDays,
  Music2, Maximize2, ScrollText, Cloud, Star,
} from 'lucide-react'

interface HelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Feature {
  icon: React.ReactNode
  titleKey: string
  descKey: string
}

const FEATURES: Feature[] = [
  { icon: <Plus className="h-5 w-5 text-amber-400" />, titleKey: 'help.addSong.title', descKey: 'help.addSong.desc' },
  { icon: <Download className="h-5 w-5 text-amber-400" />, titleKey: 'help.import.title', descKey: 'help.import.desc' },
  { icon: <TrendingUp className="h-5 w-5 text-amber-400" />, titleKey: 'help.charts.title', descKey: 'help.charts.desc' },
  { icon: <Star className="h-5 w-5 text-amber-400" />, titleKey: 'help.songOfDay.title', descKey: 'help.songOfDay.desc' },
  { icon: <Music2 className="h-5 w-5 text-amber-400" />, titleKey: 'help.practice.title', descKey: 'help.practice.desc' },
  { icon: <Maximize2 className="h-5 w-5 text-amber-400" />, titleKey: 'help.fullscreen.title', descKey: 'help.fullscreen.desc' },
  { icon: <ScrollText className="h-5 w-5 text-amber-400" />, titleKey: 'help.scroll.title', descKey: 'help.scroll.desc' },
  { icon: <ListMusic className="h-5 w-5 text-amber-400" />, titleKey: 'help.sets.title', descKey: 'help.sets.desc' },
  { icon: <CalendarDays className="h-5 w-5 text-amber-400" />, titleKey: 'help.plan.title', descKey: 'help.plan.desc' },
  { icon: <Cloud className="h-5 w-5 text-amber-400" />, titleKey: 'help.sync.title', descKey: 'help.sync.desc' },
]

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Guitar className="h-5 w-5 text-amber-400" />
            {t('help.title')}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-zinc-400 -mt-1">{t('help.intro')}</p>

        <div className="space-y-4 pt-1">
          {FEATURES.map((f) => (
            <div key={f.titleKey} className="flex gap-3">
              <div className="mt-0.5 shrink-0">{f.icon}</div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">{t(f.titleKey)}</p>
                <p className="text-sm text-zinc-400 leading-relaxed">{t(f.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
