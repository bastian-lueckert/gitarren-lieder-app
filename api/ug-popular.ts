import type { VercelRequest, VercelResponse } from '@vercel/node'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
}

export interface UGTab {
  id: number
  song: string
  artist: string
  rating: number
  votes: number
  url: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600')

  try {
    const r = await fetch(
      'https://www.ultimate-guitar.com/explore?type[]=Chords&order=hitstotal_filtered_aggregate',
      { headers: HEADERS },
    )
    if (!r.ok) throw new Error(`UG status ${r.status}`)

    const html = await r.text()
    const match = html.match(/class="js-store"\s+data-content="([^"]+)"/)
    if (!match) throw new Error('js-store not found')

    const decoded = match[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&#039;/g, "'")

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = JSON.parse(decoded) as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any[] = data?.store?.page?.data?.tabs ?? []

    const tabs: UGTab[] = raw
      .filter((t) => t.type === 'Chords' && t.song_name && t.artist_name)
      .slice(0, 50)
      .map((t) => ({
        id: t.tab_id as number,
        song: t.song_name as string,
        artist: t.artist_name as string,
        rating: parseFloat(t.rating ?? 0),
        votes: parseInt(t.votes ?? 0, 10),
        url: t.tab_url
          ? `https://www.ultimate-guitar.com${t.tab_url}`
          : `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(t.song_name)}`,
      }))

    return res.status(200).json({ tabs })
  } catch (e) {
    return res.status(502).json({ error: String(e), tabs: [] })
  }
}
