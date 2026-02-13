/**
 * SEO Sitemap Generator API
 * POST /api/seo/generate-sitemap
 * 
 * Generates real XML sitemaps by querying Medusa DB for products, categories, blog posts.
 * Writes files directly to the storefront's public/ directory so Nginx serves them.
 */

import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import fs from 'fs/promises'
import path from 'path'

const SITE_URL = 'https://YOUR_PNI_USERNAMEtrafic.ro'
const STOREFRONT_PUBLIC = '/var/www/carphacom/current/nextjs-storefront/public'
const STATUS_FILE = '/var/www/carphacom/current/admin-panel/.sitemap-status.json'

function getPool() {
  return new Pool({
    host: 'localhost',
    database: 'medusa_store',
    user: 'medusa',
    password: 'YOUR_DB_PASSWORD',
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

function buildUrlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

function wrapSitemap(entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>`
}

function buildSitemapIndex(sitemaps: { loc: string; lastmod: string }[]): string {
  const entries = sitemaps.map(s => `  <sitemap>
    <loc>${escapeXml(s.loc)}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`)

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</sitemapindex>`
}

export async function POST() {
  const startTime = Date.now()
  const pool = getPool()
  const results: Record<string, { pages: number; file: string }> = {}

  try {
    // ─── 1. Products Sitemap ────────────────────────────────────────
    const productsRes = await pool.query(`
      SELECT handle, updated_at 
      FROM product 
      WHERE deleted_at IS NULL AND status = 'published' AND handle IS NOT NULL
      ORDER BY updated_at DESC
    `)
    
    const productEntries = productsRes.rows.map(row =>
      buildUrlEntry(
        `${SITE_URL}/ro/products/${row.handle}`,
        formatDate(row.updated_at),
        'daily',
        '0.8'
      )
    )
    
    const productsSitemap = wrapSitemap(productEntries)
    await fs.writeFile(path.join(STOREFRONT_PUBLIC, 'sitemap-products.xml'), productsSitemap, 'utf-8')
    results['sitemap-products.xml'] = { pages: productsRes.rows.length, file: 'sitemap-products.xml' }

    // ─── 2. Categories Sitemap ──────────────────────────────────────
    const categoriesRes = await pool.query(`
      SELECT handle, updated_at 
      FROM product_category 
      WHERE deleted_at IS NULL AND is_active = true AND handle IS NOT NULL
      ORDER BY updated_at DESC
    `)
    
    const categoryEntries = categoriesRes.rows.map(row =>
      buildUrlEntry(
        `${SITE_URL}/ro/categories/${row.handle}`,
        formatDate(row.updated_at),
        'weekly',
        '0.7'
      )
    )
    
    const categoriesSitemap = wrapSitemap(categoryEntries)
    await fs.writeFile(path.join(STOREFRONT_PUBLIC, 'sitemap-categories.xml'), categoriesSitemap, 'utf-8')
    results['sitemap-categories.xml'] = { pages: categoriesRes.rows.length, file: 'sitemap-categories.xml' }

    // ─── 3. Blog Sitemap ────────────────────────────────────────────
    const blogRes = await pool.query(`
      SELECT slug, updated_at 
      FROM blog_posts 
      WHERE status = 'published' AND slug IS NOT NULL
      ORDER BY updated_at DESC
    `)
    
    const blogEntries = [
      // Blog index
      buildUrlEntry(`${SITE_URL}/ro/blog`, formatDate(new Date()), 'daily', '0.6'),
      // Individual posts
      ...blogRes.rows.map(row =>
        buildUrlEntry(
          `${SITE_URL}/ro/blog/${row.slug}`,
          formatDate(row.updated_at),
          'weekly',
          '0.6'
        )
      ),
    ]
    
    const blogSitemap = wrapSitemap(blogEntries)
    await fs.writeFile(path.join(STOREFRONT_PUBLIC, 'sitemap-blog.xml'), blogSitemap, 'utf-8')
    results['sitemap-blog.xml'] = { pages: blogRes.rows.length + 1, file: 'sitemap-blog.xml' }

    // ─── 4. Static Pages Sitemap ────────────────────────────────────
    const staticPages = [
      { path: '', changefreq: 'daily', priority: '1.0' },
      { path: '/store', changefreq: 'daily', priority: '0.9' },
      { path: '/categories', changefreq: 'weekly', priority: '0.8' },
      { path: '/brands', changefreq: 'weekly', priority: '0.7' },
      { path: '/contact', changefreq: 'monthly', priority: '0.5' },
      { path: '/despre-noi', changefreq: 'monthly', priority: '0.4' },
      { path: '/livrare', changefreq: 'monthly', priority: '0.4' },
      { path: '/retur', changefreq: 'monthly', priority: '0.4' },
      { path: '/garantie', changefreq: 'monthly', priority: '0.4' },
      { path: '/plata', changefreq: 'monthly', priority: '0.4' },
      { path: '/termeni', changefreq: 'monthly', priority: '0.3' },
      { path: '/confidentialitate', changefreq: 'monthly', priority: '0.3' },
      { path: '/cookies', changefreq: 'monthly', priority: '0.3' },
    ]
    
    const today = formatDate(new Date())
    const staticEntries = staticPages.map(p =>
      buildUrlEntry(`${SITE_URL}/ro${p.path}`, today, p.changefreq, p.priority)
    )
    
    const pagesSitemap = wrapSitemap(staticEntries)
    await fs.writeFile(path.join(STOREFRONT_PUBLIC, 'sitemap-pages.xml'), pagesSitemap, 'utf-8')
    results['sitemap-pages.xml'] = { pages: staticPages.length, file: 'sitemap-pages.xml' }

    // ─── 5. Sitemap Index (master sitemap.xml) ──────────────────────
    const sitemapIndex = buildSitemapIndex([
      { loc: `${SITE_URL}/sitemap-products.xml`, lastmod: today },
      { loc: `${SITE_URL}/sitemap-categories.xml`, lastmod: today },
      { loc: `${SITE_URL}/sitemap-blog.xml`, lastmod: today },
      { loc: `${SITE_URL}/sitemap-pages.xml`, lastmod: today },
    ])
    
    await fs.writeFile(path.join(STOREFRONT_PUBLIC, 'sitemap.xml'), sitemapIndex, 'utf-8')
    results['sitemap.xml'] = { pages: 4, file: 'sitemap.xml (index)' }

    // ─── 6. AI/LLM Discovery Files ─────────────────────────────────
    // llms.txt for AI crawlers to find the site
    const llmsTxt = `# CarphaCom - ${SITE_URL}
# Online store with radio stations, electronics, security and accessories
# Romanian e-commerce store

> Site: ${SITE_URL}
> Products: ${productsRes.rows.length}
> Categories: ${categoriesRes.rows.length}
> Blog Articles: ${blogRes.rows.length}

## Main Pages
- Homepage: ${SITE_URL}/ro
- Store: ${SITE_URL}/ro/store
- Categories: ${SITE_URL}/ro/categories
- Brands: ${SITE_URL}/ro/brands
- Blog: ${SITE_URL}/ro/blog
- Contact: ${SITE_URL}/ro/contact

## Sitemaps
- Products: ${SITE_URL}/sitemap-products.xml
- Categories: ${SITE_URL}/sitemap-categories.xml
- Blog: ${SITE_URL}/sitemap-blog.xml
- Pages: ${SITE_URL}/sitemap-pages.xml
`
    await fs.writeFile(path.join(STOREFRONT_PUBLIC, 'llms.txt'), llmsTxt, 'utf-8')
    await fs.writeFile(path.join(STOREFRONT_PUBLIC, '.well-known', 'llms.txt'), llmsTxt, 'utf-8').catch(async () => {
      await fs.mkdir(path.join(STOREFRONT_PUBLIC, '.well-known'), { recursive: true })
      await fs.writeFile(path.join(STOREFRONT_PUBLIC, '.well-known', 'llms.txt'), llmsTxt, 'utf-8')
    })

    const totalPages = Object.values(results).reduce((sum, r) => sum + r.pages, 0)
    const duration = Date.now() - startTime

    // Save status for the admin UI
    const status = {
      lastGenerated: new Date().toISOString(),
      duration,
      totalPages,
      sitemaps: results,
      products: productsRes.rows.length,
      categories: categoriesRes.rows.length,
      blogPosts: blogRes.rows.length,
    }
    await fs.writeFile(STATUS_FILE, JSON.stringify(status, null, 2), 'utf-8')

    await pool.end()

    return NextResponse.json({
      success: true,
      message: `Sitemaps generated successfully`,
      duration: `${duration}ms`,
      totalPages,
      sitemaps: results,
    })
  } catch (error) {
    await pool.end().catch(() => {})
    console.error('Sitemap generation error:', error)
    return NextResponse.json({
      success: false,
      error: `Error generating sitemap: ${error instanceof Error ? error.message : 'Unknown'}`,
    }, { status: 500 })
  }
}

// GET also triggers generation (for cron)
export async function GET() {
  return POST()
}
