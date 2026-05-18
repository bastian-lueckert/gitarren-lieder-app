import type { VercelRequest, VercelResponse } from '@vercel/node'

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

export function slugifyCifra(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function extractCifraChords(html: string): string | null {
  const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/)
  if (!preMatch) return null
  const raw = preMatch[1]
  if (!raw.includes('<b>')) return null // not a chord page
  return raw
    .replace(/<b>([^<]+)<\/b>/g, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')

  const { artist, title } = req.query
  if (!artist || !title) {
    return res.status(400).json({ error: 'artist and title are required' })
  }

  const artistStr = Array.isArray(artist) ? artist[0] : artist
  const titleStr = Array.isArray(title) ? title[0] : title

  const pageUrl = `https://www.cifraclub.com/${slugifyCifra(artistStr)}/${slugifyCifra(titleStr)}/`

  try {
    const r = await fetch(pageUrl, { headers: FETCH_HEADERS })
    if (!r.ok) return res.status(404).json({ error: 'Song not found' })
    const html = await r.text()
    const chords = extractCifraChords(html)
    if (!chords) return res.status(404).json({ error: 'No guitar chords found for this song' })
    return res.status(200).json({ chords, source: pageUrl })
  } catch {
    return res.status(502).json({ error: 'Fetch failed' })
  }
}
