import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/marketing/db'
import { getCaptchaStats, resetCaptchaStats } from '@/lib/marketing/captcha-solver'

export const dynamic = 'force-dynamic'

/**
 * GET /api/marketing/scrape/config
 * Returns scraper configuration, CAPTCHA solver stats, search engine status
 */
export async function GET() {
  try {
    const pool = getPool()

    // Get Google Maps API key from settings (if saved)
    let gmapsKey = ''
    try {
      const { rows } = await pool.query(
        `SELECT value FROM mkt_settings WHERE key = 'google_maps_api_key' LIMIT 1`
      )
      gmapsKey = rows[0]?.value || ''
    } catch {
      // Table may not exist yet
    }

    // Get CAPTCHA solver capabilities
    const captchaSystems = [
      { id: 'math', name: 'Math CAPTCHA Solver', desc: 'Solves mathematical CAPTCHAs (3+7=?)', status: 'active', canToggle: false },
      { id: 'honeypot', name: 'Honeypot Bypass', desc: 'Detects and avoids hidden honeypot fields', status: 'active', canToggle: false },
      { id: 'pattern', name: 'Pattern Match OCR', desc: 'Extracts text from URL/headers (simple CAPTCHAs)', status: 'active', canToggle: false },
      { id: 'audio_whisper', name: 'reCAPTCHA Audio → Groq Whisper', desc: 'Downloads audio challenge, sends to Whisper AI for transcription', status: 'active', canToggle: true },
      { id: 'recaptcha_detect', name: 'reCAPTCHA v2/v3 Detection', desc: 'Detects and skips sites with reCAPTCHA → next proxy', status: 'active', canToggle: false },
      { id: 'hcaptcha_detect', name: 'hCaptcha Detection', desc: 'Detects hCaptcha → switch proxy + backoff', status: 'active', canToggle: false },
      { id: 'cloudflare_detect', name: 'Cloudflare Challenge', desc: 'Detects Cloudflare Turnstile → 30s backoff + proxy switch', status: 'active', canToggle: false },
      { id: 'slider_detect', name: 'Slider CAPTCHA Detection', desc: 'Detects slider CAPTCHA → skip + proxy switch', status: 'active', canToggle: false },
    ]

    // Search engine status
    const searchEngines = [
      { id: 'brave', name: 'Brave Search', url: 'https://search.brave.com', status: 'primary', desc: 'Primary engine — works without JS, 20+ results/query' },
      { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com', status: 'blocked', desc: 'BLOCKED — returns CAPTCHA with puzzle' },
      { id: 'bing', name: 'Bing', url: 'https://www.bing.com', status: 'blocked', desc: 'BLOCKED — results are JS-rendered, cannot extract' },
      { id: 'googlemaps_api', name: 'Google Maps API', url: 'https://console.cloud.google.com', status: gmapsKey ? 'configured' : 'not_configured', desc: gmapsKey ? 'API Key configured' : 'Requires API Key from Google Cloud Console' },
    ]

    // Proxy sources
    const proxySources = [
      { id: 'proxyscrape', name: 'ProxyScrape', url: 'https://proxyscrape.com', desc: 'Free JSON API, hundreds of proxies' },
      { id: 'geonode', name: 'GeoNode', url: 'https://proxylist.geonode.com', desc: 'Free JSON API, verified proxies' },
      { id: 'freeproxylist', name: 'Free Proxy List', url: 'https://free-proxy-list.net', desc: 'HTML scraping, updated list' },
      { id: 'proxynova', name: 'ProxyNova', url: 'https://www.proxynova.com', desc: 'Text list, free proxies' },
      { id: 'spysone', name: 'Spys.one', url: 'https://spys.one', desc: 'Text list, includes elite proxies' },
      { id: 'proxyscan', name: 'ProxyScan', url: 'https://proxyscan.io', desc: 'API, auto-scanned proxies' },
    ]

    const captchaStats = getCaptchaStats()

    return NextResponse.json({
      captchaSystems,
      captchaStats,
      searchEngines,
      proxySources,
      gmapsKey: gmapsKey ? `${gmapsKey.slice(0, 8)}...${gmapsKey.slice(-4)}` : '',
      gmapsConfigured: !!gmapsKey,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/marketing/scrape/config
 * Save settings (Google Maps API key, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body
    const pool = getPool()

    // Ensure settings table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mkt_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    if (action === 'save_gmaps_key') {
      const { api_key } = body
      if (!api_key) return NextResponse.json({ error: 'API key required' }, { status: 400 })

      await pool.query(
        `INSERT INTO mkt_settings (key, value, updated_at) VALUES ('google_maps_api_key', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
        [api_key]
      )
      return NextResponse.json({ success: true, message: 'Google Maps API Key saved' })
    }

    if (action === 'test_brave') {
      // Test Brave Search connectivity using stealth fetch (same as real scraping)
      try {
        const { stealthBraveSearch } = await import('@/lib/marketing/stealth-fetch')
        const results = await stealthBraveSearch('transport bucuresti contact email')
        // stealthBraveSearch returns string[] of URLs
        const urlsFound = Array.isArray(results) ? results.length : 0
        const hasResults = urlsFound > 3
        return NextResponse.json({
          success: true,
          test: {
            status: 200,
            hasResults,
            blocked: !hasResults,
            urlsFound,
            message: hasResults
              ? `✅ Brave Search is working! (${urlsFound} URLs found)`
              : `❌ Brave Search returned no results`,
          },
        })
      } catch (e: any) {
        return NextResponse.json({
          success: false,
          test: { status: 0, htmlSize: 0, hasResults: false, blocked: false, message: `❌ Error: ${e.message}` },
        })
      }
    }

    if (action === 'test_gmaps') {
      // Test Google Maps API key
      let gmapsKey = ''
      try {
        const { rows } = await pool.query(`SELECT value FROM mkt_settings WHERE key = 'google_maps_api_key'`)
        gmapsKey = rows[0]?.value || ''
      } catch { /* */ }

      if (!gmapsKey) return NextResponse.json({ success: false, test: { message: '❌ No API Key configured' } })

      // Try Places API (New) first, then fall back to legacy
      try {
        // ─── Places API (New) — https://places.googleapis.com/v1/places:searchText ───
        const newResp = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': gmapsKey,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri',
          },
          body: JSON.stringify({ textQuery: 'restaurant bucuresti', maxResultCount: 5 }),
          signal: AbortSignal.timeout(15000),
        })

        if (newResp.ok) {
          const data = await newResp.json()
          const count = data.places?.length || 0
          if (count > 0) {
            const sample = data.places[0]
            return NextResponse.json({
              success: true,
              test: {
                message: `✅ Places API (New) is working! ${count} results. E.g.: "${sample.displayName?.text || '?'}" — ${sample.nationalPhoneNumber || 'no phone'}`,
                results: count, apiVersion: 'new',
              },
            })
          }
          return NextResponse.json({
            success: true,
            test: { message: `⚠️ Places API (New) responded but 0 results. Check billing.`, results: 0, apiVersion: 'new' },
          })
        }

        // If New API returns error, parse it
        const errBody = await newResp.json().catch(() => ({}))
        const errMsg = errBody.error?.message || errBody.error?.status || `HTTP ${newResp.status}`

        // ─── Fallback: try legacy Places API ───
        const legacyResp = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurant+bucuresti&key=${gmapsKey}`,
          { signal: AbortSignal.timeout(10000) }
        )
        const legacyData = await legacyResp.json()
        if (legacyData.status === 'OK') {
          return NextResponse.json({
            success: true,
            test: { message: `✅ Places API (Legacy) is working! ${legacyData.results?.length || 0} results`, results: legacyData.results?.length || 0, apiVersion: 'legacy' },
          })
        }

        // Both failed — report new API error (more helpful)
        return NextResponse.json({
          success: false,
          test: {
            message: `❌ Places API (New): ${errMsg}. Enable "Places API (New)" in Google Cloud Console → APIs & Services → Library → search "Places API (New)" → Enable`,
            apiVersion: 'none',
          },
        })
      } catch (e: any) {
        return NextResponse.json({ success: false, test: { message: `❌ Connection error: ${e.message}` } })
      }
    }

    if (action === 'reset_captcha_stats') {
      resetCaptchaStats()
      return NextResponse.json({ success: true, message: 'CAPTCHA statistics reset' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
