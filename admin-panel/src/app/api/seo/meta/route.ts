/**
 * Meta Tags Management API
 * GET  /api/seo/meta — Read saved meta tag settings
 * POST /api/seo/meta — Save meta tag settings
 * 
 * Persists global meta tag configuration to a JSON file.
 */

import { NextResponse } from 'next/server'
import fs from 'fs/promises'

const META_FILE = '/var/www/carphacom/current/admin-panel/.seo-meta.json'

const DEFAULT_META = {
  siteTitle: 'CarphaCom - Radio Stations, Electronics and Accessories',
  siteDescription: 'CarphaCom online store - Radio stations, electronics, security, professional equipment and accessories. Fast delivery across Romania.',
  ogImage: 'https://YOUR_PNI_USERNAMEtrafic.ro/og-image.jpg',
  twitterCard: 'summary_large_image',
  locale: 'ro_RO',
  canonicalBase: 'https://YOUR_PNI_USERNAMEtrafic.ro',
  titleTemplate: '{page} | CarphaCom',
  jsonLd: {
    organization: {
      name: 'CarphaCom',
      url: 'https://YOUR_PNI_USERNAMEtrafic.ro',
      logo: 'https://YOUR_PNI_USERNAMEtrafic.ro/logo.png',
    },
  },
  hreflang: [
    { lang: 'ro', url: 'https://YOUR_PNI_USERNAMEtrafic.ro/ro' },
  ],
}

export async function GET() {
  try {
    const content = await fs.readFile(META_FILE, 'utf-8')
    return NextResponse.json({ success: true, meta: JSON.parse(content) })
  } catch {
    return NextResponse.json({ success: true, meta: DEFAULT_META })
  }
}

export async function POST(request: Request) {
  try {
    const { meta } = await request.json()

    if (!meta || typeof meta !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid meta data' }, { status: 400 })
    }

    await fs.writeFile(META_FILE, JSON.stringify(meta, null, 2), 'utf-8')

    return NextResponse.json({ success: true, message: 'Meta tags saved successfully' })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Error saving: ${error instanceof Error ? error.message : 'Unknown'}`,
    }, { status: 500 })
  }
}
