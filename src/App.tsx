import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/HomePage'
import { SongDetailPage } from '@/pages/SongDetailPage'
import { PracticePage } from '@/pages/PracticePage'
import { useSongStore } from '@/store/songStore'

export default function App() {
  const loadSongs = useSongStore((s) => s.loadSongs)

  useEffect(() => {
    loadSongs()
  }, [loadSongs])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/songs/:id" element={<SongDetailPage />} />
          <Route path="/songs/:id/practice" element={<PracticePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
