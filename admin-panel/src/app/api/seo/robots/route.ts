/**
 * Robots.txt Management API
 * GET  /api/seo/robots — Read current robots.txt
 * POST /api/seo/robots — Save updated robots.txt
 */

import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const ROBOTS_PATH = '/var/www/carphacom/current/nextjs-storefront/public/robots.txt'

export async function GET() {
  try {
    const content = await fs.readFile(ROBOTS_PATH, 'utf-8')
    return NextResponse.json({ success: true, content })
  } catch {
    return NextResponse.json({
      success: true,
      content: `User-agent: *\nAllow: /\nSitemap: https://YOUR_PNI_USERNAMEtrafic.ro/sitemap.xml\n`,
    })
  }
}

export async function POST(request: Request) {
  try {
    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ success: false, error: 'robots.txt content is required' }, { status: 400 })
    }

    // Backup old file
    try {
      const old = await fs.readFile(ROBOTS_PATH, 'utf-8')
      await fs.writeFile(ROBOTS_PATH + '.bak', old, 'utf-8')
    } catch {}

    await fs.writeFile(ROBOTS_PATH, content, 'utf-8')

    return NextResponse.json({ success: true, message: 'robots.txt saved successfully' })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Error saving: ${error instanceof Error ? error.message : 'Unknown'}`,
    }, { status: 500 })
  }
}
