import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/HomePage'
import { SongDetailPage } from '@/pages/SongDetailPage'
import { PracticePage } from '@/pages/PracticePage'
import { SetsPage } from '@/pages/SetsPage'
import { SetDetailPage } from '@/pages/SetDetailPage'
import { PracticePlanPage } from '@/pages/PracticePlanPage'
import { SharedSongPage } from '@/pages/SharedSongPage'
import { SharedSetPage } from '@/pages/SharedSetPage'
import { ChartsPage } from '@/pages/ChartsPage'
import { useSongStore } from '@/store/songStore'
import { useSetStore } from '@/store/setStore'
import { useAuthStore } from '@/store/authStore'
import { usePracticePlanStore } from '@/store/practicePlanStore'

export default function App() {
  const loadSongs = useSongStore((s) => s.loadSongs)
  const loadSets = useSetStore((s) => s.loadSets)
  const initAuth = useAuthStore((s) => s.initAuth)
  const loadPlans = usePracticePlanStore((s) => s.loadPlans)

  useEffect(() => {
    loadSongs()
    loadSets()
    initAuth()
    loadPlans()
  }, [loadSongs, loadSets, initAuth, loadPlans])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/songs/:id" element={<SongDetailPage />} />
          <Route path="/songs/:id/practice" element={<PracticePage />} />
          <Route path="/sets" element={<SetsPage />} />
          <Route path="/sets/:id" element={<SetDetailPage />} />
          <Route path="/practice-plan/:id" element={<PracticePlanPage />} />
          <Route path="/charts" element={<ChartsPage />} />
        </Route>
        {/* Public share pages — standalone, no Layout */}
        <Route path="/share/song/:token" element={<SharedSongPage />} />
        <Route path="/share/set/:token" element={<SharedSetPage />} />
      </Routes>
    </BrowserRouter>
  )
}
