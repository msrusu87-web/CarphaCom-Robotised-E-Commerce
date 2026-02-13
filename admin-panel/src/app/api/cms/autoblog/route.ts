import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

const { Pool } = require('pg')
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'medusa_store',
  user: process.env.DB_USER || 'medusa',
  password: process.env.DB_PASSWORD || 'YOUR_DB_PASSWORD',
})

const AUTOBLOG_API = 'http://localhost:8000/api/blog/generate'
const AUTOBLOG_TOKEN = 'CBRadio2026GeneratorKey'
const LOG_FILE = '/home/ubuntu/autoblog_generate.log'
const CRON_CHECK = '/var/run/autoblog.lock'

// GET - Get autoblog status, config, and recent logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'status'

    if (action === 'status') {
      // Get config from DB
      const configResult = await pool.query('SELECT * FROM cms_autoblog_config ORDER BY created_at DESC LIMIT 1')
      const config = configResult.rows[0] || {
        cron_schedule: '0 */3 * * *',
        ai_model: 'groq/llama-3.3-70b',
        language: 'ro',
        auto_publish: true,
        max_posts_per_day: 5,
        categories: ['Comparisons', 'Guides', 'Reviews', 'Tips & Tricks', 'News'],
        keywords: [],
        is_active: true,
      }

      // Get recent auto-generated posts as logs
      const recentPosts = await pool.query(`
        SELECT id, title, slug, category, status, created_at, is_auto_generated
        FROM blog_posts
        WHERE is_auto_generated = true
        ORDER BY created_at DESC
        LIMIT 20
      `)

      // Read actual log file if it exists
      let logContent = ''
      try {
        if (existsSync(LOG_FILE)) {
          logContent = await readFile(LOG_FILE, 'utf-8')
        }
      } catch { /* ignore */ }

      // Parse logs into structured format
      const recentLogs = recentPosts.rows.map((p: any) => ({
        date: new Date(p.created_at).toLocaleString('en-US'),
        status: 'success',
        blog: p.title,
        postId: p.id,
        category: p.category,
      }))

      // Parse log file for errors
      if (logContent) {
        const errorLines = logContent.split('\n')
          .filter(l => l.includes('ERROR') || l.includes('error') || l.includes('FAIL'))
          .slice(-10)
        for (const line of errorLines) {
          const dateMatch = line.match(/\[(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})\]/)
          recentLogs.push({
            date: dateMatch ? dateMatch[1] : 'Unknown',
            status: 'error',
            blog: line.replace(/\[.*?\]\s*/, '').substring(0, 200),
            postId: null,
            category: null,
          })
        }
        recentLogs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }

      // Check cron status
      let cronStatus = 'unknown'
      try {
        const { exec } = require('child_process')
        const cronCheck = await new Promise<string>((resolve) => {
          exec('crontab -l 2>/dev/null | grep autoblog', (error: any, stdout: string) => {
            resolve(stdout || '')
          })
        })
        cronStatus = cronCheck.includes('autoblog') ? 'active' : 'inactive'
      } catch {
        cronStatus = config.is_active ? 'active' : 'inactive'
      }

      // Stats
      const [todayCount, totalAutoCount] = await Promise.all([
        pool.query("SELECT COUNT(*) as count FROM blog_posts WHERE is_auto_generated = true AND created_at >= CURRENT_DATE"),
        pool.query("SELECT COUNT(*) as count FROM blog_posts WHERE is_auto_generated = true"),
      ])

      // Get available product categories for targeting
      const productCategories = await pool.query(`
        SELECT id, name, handle FROM product_category WHERE is_active = true ORDER BY name LIMIT 50
      `)

      return NextResponse.json({
        config: {
          cron_schedule: config.cron_schedule,
          ai_model: config.ai_model,
          language: config.language,
          auto_publish: config.auto_publish,
          max_posts_per_day: config.max_posts_per_day,
          categories: config.categories,
          keywords: config.keywords || [],
          product_category_ids: config.product_category_ids || [],
          is_active: config.is_active,
        },
        cron: {
          status: cronStatus,
          schedule: config.cron_schedule,
        },
        stats: {
          today: parseInt(todayCount.rows[0].count),
          total_auto: parseInt(totalAutoCount.rows[0].count),
          max_per_day: config.max_posts_per_day,
        },
        recentLogs,
        productCategories: productCategories.rows,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Autoblog GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Trigger manual generation or update config
export async function POST(request: NextRequest) {
  try {
    let body: any = {}
    try { body = await request.json() } catch { /* empty body = trigger generation */ }

    const action = body.action || 'generate'

    // Update config
    if (action === 'update_config') {
      const { cron_schedule, ai_model, auto_publish, max_posts_per_day, categories, keywords, product_category_ids, is_active } = body

      const existingConfig = await pool.query('SELECT id FROM cms_autoblog_config LIMIT 1')
      
      if (existingConfig.rows.length > 0) {
        await pool.query(
          `UPDATE cms_autoblog_config SET
            cron_schedule = COALESCE($1, cron_schedule),
            ai_model = COALESCE($2, ai_model),
            auto_publish = COALESCE($3, auto_publish),
            max_posts_per_day = COALESCE($4, max_posts_per_day),
            categories = COALESCE($5, categories),
            keywords = COALESCE($6, keywords),
            product_category_ids = COALESCE($7, product_category_ids),
            is_active = COALESCE($8, is_active),
            updated_at = NOW()
           WHERE id = $9`,
          [cron_schedule, ai_model, auto_publish, max_posts_per_day, categories, keywords, product_category_ids, is_active, existingConfig.rows[0].id]
        )
      } else {
        await pool.query(
          `INSERT INTO cms_autoblog_config (cron_schedule, ai_model, auto_publish, max_posts_per_day, categories, keywords, product_category_ids, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [cron_schedule || '0 */3 * * *', ai_model || 'groq/llama-3.3-70b', auto_publish !== false, max_posts_per_day || 5, categories || ['Guides'], keywords || [], product_category_ids || [], is_active !== false]
        )
      }

      // Update cron if schedule changed
      if (cron_schedule || is_active !== undefined) {
        try {
          const { exec } = require('child_process')
          if (is_active === false) {
            // Remove cron
            exec('crontab -l 2>/dev/null | grep -v autoblog | crontab -')
          } else {
            const schedule = cron_schedule || '0 */3 * * *'
            exec(`(crontab -l 2>/dev/null | grep -v autoblog; echo "${schedule} /home/ubuntu/autoblog_generate.sh >> /home/ubuntu/autoblog_generate.log 2>&1") | crontab -`)
          }
        } catch { /* cron update failed, not critical */ }
      }

      return NextResponse.json({ success: true, message: 'Configuration updated' })
    }

    // Trigger manual generation
    if (action === 'generate' || !action) {
      // Check daily limit
      const config = await pool.query('SELECT * FROM cms_autoblog_config LIMIT 1')
      const maxPerDay = config.rows[0]?.max_posts_per_day || 5
      const todayCount = await pool.query("SELECT COUNT(*) as count FROM blog_posts WHERE is_auto_generated = true AND created_at >= CURRENT_DATE")
      
      if (parseInt(todayCount.rows[0].count) >= maxPerDay) {
        return NextResponse.json({ 
          success: false, 
          message: `Daily limit of ${maxPerDay} auto-generated articles has been reached` 
        }, { status: 429 })
      }

      // Call the storefront blog generator API
      const mode = body.mode || 'auto'
      const response = await fetch(AUTOBLOG_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTOBLOG_TOKEN}`,
        },
        body: JSON.stringify({
          mode,
          topic: body.topic,
          category: body.category,
          keywords: body.keywords,
          tone: body.tone || 'informative',
          length: body.length || 'medium',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        return NextResponse.json({ 
          success: false, 
          message: result.error || 'Error generating article',
          details: result,
        }, { status: response.status })
      }

      return NextResponse.json({
        success: true,
        message: `Article generated successfully: "${result.blogTitle || result.title}"`,

        postId: result.postId,
        title: result.blogTitle || result.title,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Autoblog POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
