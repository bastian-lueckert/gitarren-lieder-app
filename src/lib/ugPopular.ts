export interface UGTab {
  id: number
  song: string
  artist: string
  rating: number
  votes: number
  url: string
}

export async function fetchUGPopular(): Promise<UGTab[]> {
  try {
    const res = await fetch('/api/ug-popular')
    const data = await res.json() as { tabs?: UGTab[] }
    return data.tabs ?? []
  } catch {
    return []
  }
}
