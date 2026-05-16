import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Strip /api/deezer prefix to get the Deezer API path
  const deezerPath = (req.url ?? '').replace(/^\/api\/deezer/, '') || '/search'
  const deezerUrl = `https://api.deezer.com${deezerPath}`

  const response = await fetch(deezerUrl)
  if (!response.ok) {
    return res.status(response.status).json({ error: 'Deezer request failed' })
  }

  const data = await response.json()
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  res.status(200).json(data)
}
