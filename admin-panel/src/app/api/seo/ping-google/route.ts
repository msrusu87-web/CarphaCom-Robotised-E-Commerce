/**
 * Google Search Console Ping API
 * POST /api/seo/ping-google
 * 
 * Notifies Google about updated sitemaps via the Search Console ping endpoint.
 */

import { NextResponse } from 'next/server'

const SITE_URL = 'https://YOUR_PNI_USERNAMEtrafic.ro'
const SITEMAPS = [
  `${SITE_URL}/sitemap.xml`,
  `${SITE_URL}/sitemap-products.xml`,
  `${SITE_URL}/sitemap-categories.xml`,
  `${SITE_URL}/sitemap-blog.xml`,
  `${SITE_URL}/sitemap-pages.xml`,
]

export async function POST() {
  const results: { url: string; status: string }[] = []

  for (const sitemapUrl of SITEMAPS) {
    try {
      const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      const res = await fetch(pingUrl, { method: 'GET' })
      results.push({
        url: sitemapUrl,
        status: res.ok ? 'success' : `error (${res.status})`,
      })
    } catch (error) {
      results.push({
        url: sitemapUrl,
        status: `failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      })
    }
  }

  // Also ping Bing
  try {
    const bingPing = `https://www.bing.com/ping?sitemap=${encodeURIComponent(`${SITE_URL}/sitemap.xml`)}`
    await fetch(bingPing, { method: 'GET' })
    results.push({ url: 'Bing Index', status: 'success' })
  } catch {
    results.push({ url: 'Bing Index', status: 'failed' })
  }

  const allSuccess = results.every(r => r.status === 'success')

  return NextResponse.json({
    success: allSuccess,
    message: allSuccess
      ? 'Google and Bing notified successfully'
      : 'Some notifications failed',
    results,
  })
}
