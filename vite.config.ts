import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// Shared logic used by both the dev middleware and api/ug-chords.ts
function slugifyCifra(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function extractCifraChords(html: string): string | null {
  const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/)
  if (!preMatch) return null
  const raw = preMatch[1]
  if (!raw.includes('<b>')) return null
  return raw
    .replace(/<b>([^<]+)<\/b>/g, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .trim()
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Gitarren-Lieder',
        short_name: 'GitarrenApp',
        description: 'Deine persönliche Liederbibliothek für Gitarristen',
        theme_color: '#18181b',
        background_color: '#09090b',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/itunes\.apple\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'itunes-cache', expiration: { maxEntries: 100, maxAgeSeconds: 604800 } },
          },
        ],
      },
    }),
    // Dev-only: handle /api/ug-chords locally without needing `vercel dev`
    {
      name: 'dev-chords-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/api/ug-chords')) return next()

          const url = new URL(req.url, 'http://localhost')
          const artist = url.searchParams.get('artist') ?? ''
          const title = url.searchParams.get('title') ?? ''

          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')

          if (!artist || !title) {
            res.statusCode = 400
            return res.end(JSON.stringify({ error: 'artist and title required' }))
          }

          const pageUrl = `https://www.cifraclub.com/${slugifyCifra(artist)}/${slugifyCifra(title)}/`
          try {
            const r = await fetch(pageUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'en-US,en;q=0.9',
              },
            })
            if (!r.ok) {
              res.statusCode = 404
              return res.end(JSON.stringify({ error: 'Song not found' }))
            }
            const html = await r.text()
            const chords = extractCifraChords(html)
            if (!chords) {
              res.statusCode = 404
              return res.end(JSON.stringify({ error: 'No guitar chords found for this song' }))
            }
            res.statusCode = 200
            return res.end(JSON.stringify({ chords, source: pageUrl }))
          } catch {
            res.statusCode = 502
            return res.end(JSON.stringify({ error: 'Fetch failed' }))
          }
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/deezer': {
        target: 'https://api.deezer.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deezer/, ''),
      },
    },
  },
})
