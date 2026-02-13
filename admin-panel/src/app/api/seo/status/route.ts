/**
 * SEO Status API
 * GET /api/seo/status
 * 
 * Returns real status of all sitemap files, last generation time, 
 * page counts, and cron status.
 */

import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const STOREFRONT_PUBLIC = '/var/www/carphacom/current/nextjs-storefront/public'
const STATUS_FILE = '/var/www/carphacom/current/admin-panel/.sitemap-status.json'
const SITE_URL = 'https://YOUR_PNI_USERNAMEtrafic.ro'

interface SitemapFileInfo {
  name: string
  exists: boolean
  size: number
  lastModified: string
  urlCount: number
  url: string
}

async function getSitemapInfo(filename: string): Promise<SitemapFileInfo> {
  const filePath = path.join(STOREFRONT_PUBLIC, filename)
  try {
    const stat = await fs.stat(filePath)
    const content = await fs.readFile(filePath, 'utf-8')
    const urlCount = filename === 'sitemap.xml'
      ? (content.match(/<sitemap>/g) || []).length
      : (content.match(/<url>/g) || []).length

    return {
      name: filename,
      exists: true,
      size: stat.size,
      lastModified: stat.mtime.toISOString(),
      urlCount,
      url: `${SITE_URL}/${filename}`,
    }
  } catch {
    return {
      name: filename,
      exists: false,
      size: 0,
      lastModified: '',
      urlCount: 0,
      url: `${SITE_URL}/${filename}`,
    }
  }
}

async function getCronStatus(): Promise<{ active: boolean; schedule: string; nextRun: string }> {
  try {
    const { execSync } = require('child_process')
    const crontab = execSync('crontab -l 2>/dev/null', { encoding: 'utf-8' })
    const sitemapLine = crontab.split('\n').find((l: string) => l.includes('generate-sitemap') && !l.startsWith('#'))
    
    if (sitemapLine) {
      const parts = sitemapLine.trim().split(/\s+/)
      const schedule = parts.slice(0, 5).join(' ')
      return { active: true, schedule, nextRun: getNextCronRun(schedule) }
    }
  } catch {}
  
  return { active: false, schedule: '', nextRun: '' }
}

function getNextCronRun(schedule: string): string {
  // Simple parser for "0 4 * * *" style (daily at 4am)
  const parts = schedule.split(' ')
  const now = new Date()
  const next = new Date()
  
  if (parts[0] !== '*') next.setMinutes(parseInt(parts[0]))
  if (parts[1] !== '*') next.setHours(parseInt(parts[1]))
  
  if (next <= now) next.setDate(next.getDate() + 1)
  return next.toISOString()
}

export async function GET() {
  try {
    const sitemapFiles = [
      'sitemap.xml',
      'sitemap-products.xml',
      'sitemap-categories.xml',
      'sitemap-blog.xml',
      'sitemap-pages.xml',
    ]

    const [sitemaps, cronStatus, savedStatus] = await Promise.all([
      Promise.all(sitemapFiles.map(f => getSitemapInfo(f))),
      getCronStatus(),
      fs.readFile(STATUS_FILE, 'utf-8').then(JSON.parse).catch(() => null),
    ])

    // Check robots.txt
    let robotsTxt = ''
    try {
      robotsTxt = await fs.readFile(path.join(STOREFRONT_PUBLIC, 'robots.txt'), 'utf-8')
    } catch {}

    return NextResponse.json({
      success: true,
      sitemaps,
      cron: cronStatus,
      lastGeneration: savedStatus,
      robotsTxt,
      siteUrl: SITE_URL,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Eroare: ${error instanceof Error ? error.message : 'Unknown'}`,
    }, { status: 500 })
  }
}
