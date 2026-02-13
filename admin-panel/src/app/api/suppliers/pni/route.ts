import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const CONFIG_FILE = '/var/www/carphacom/config/supplier_sync.json'
const MYPNI_API_BASE = 'https://b2b.mypni.com/api/v1'

async function loadConfig(): Promise<any> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return { pni: {} }
  }
}

async function saveConfig(config: any): Promise<void> {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))
}

async function refreshToken(config: any): Promise<{ token: string; expires_at: string; error?: string }> {
  const username = config.pni?.b2b_username
  const password = config.pni?.b2b_password

  if (!username || !password) {
    return { token: '', expires_at: '', error: 'B2B credentials missing. Set username and password.' }
  }

  try {
    const resp = await fetch(`${MYPNI_API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await resp.json()

    if (data.status === 1 && data.data?.token) {
      config.pni.api_token = data.data.token
      config.pni.token_expires_at = data.data.expires_at
      config.pni.last_error = null
      await saveConfig(config)
      return { token: data.data.token, expires_at: data.data.expires_at }
    }
    return { token: '', expires_at: '', error: data.message || 'Authentication failed' }
  } catch (e: any) {
    return { token: '', expires_at: '', error: `Connection error: ${e.message}` }
  }
}

async function testApiConnection(token: string): Promise<{ connected: boolean; message: string; productCount: number }> {
  if (!token) {
    return { connected: false, message: 'API token missing', productCount: 0 }
  }

  try {
    const response = await fetch(`${MYPNI_API_BASE}/products?page=1&limit=1`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    })
    const data = await response.json()

    if (data.status === 1) {
      return {
        connected: true,
        message: 'Connected to PNI API',
        productCount: data.data?.pagination?.total || 0
      }
    }

    // Rate limit is not a connection failure - API is reachable but busy
    if (response.status === 429 || (data.message && data.message.toLowerCase().includes('rate limit'))) {
      return { connected: true, message: 'Connected (temporary rate limit - retry in 1 min)', productCount: -1 }
    }

    return { connected: false, message: data.message || 'Token invalid or expired', productCount: 0 }
  } catch (e: any) {
    return { connected: false, message: `Connection error: ${e.message}`, productCount: 0 }
  }
}

// GET: PNI configuration, status, and diagnostics
export async function GET(request: NextRequest) {
  try {
    const config = await loadConfig()
    const token = config.pni?.api_token || ''

    // Check if token needs auto-refresh
    let apiStatus = await testApiConnection(token)

    if (!apiStatus.connected && config.pni?.b2b_username && config.pni?.b2b_password) {
      const refreshResult = await refreshToken(config)
      if (refreshResult.token) {
        apiStatus = await testApiConnection(refreshResult.token)
      }
    }

    // Get cron status
    let cronStatus = { active: false, jobs: [] as any[] }
    try {
      const { stdout } = await execAsync('crontab -l 2>/dev/null || echo ""')
      const pniJobs = stdout.split('\n').filter((line: string) => line.includes('pni') && !line.startsWith('#'))
      cronStatus = {
        active: pniJobs.length > 0,
        jobs: pniJobs.map((job: string) => {
          const schedule = job.split(' ').slice(0, 5).join(' ')
          if (job.includes('stock-quick') || job.includes('stock_quick'))
            return { type: 'stock', schedule, name: 'Quick stock', interval: '15 min' }
          if (job.includes('price-stock') || job.includes('prices_stock'))
            return { type: 'prices', schedule, name: 'Prices + stock', interval: '2 hours' }
          if (job.includes('full-import') || job.includes('full_import') || job.includes('import_pni'))
            return { type: 'full', schedule, name: 'Full import', interval: 'daily 3 AM' }
          return { type: 'unknown', schedule: job, name: 'Unknown job', interval: '' }
        }).filter((j: any) => j.type !== 'unknown')
      }
    } catch (e) {
      console.error('Cron check error:', e)
    }

    // Get sync logs
    let recentLogs: string[] = []
    try {
      const { stdout: quickLog } = await execAsync('tail -30 /var/log/pni_sync_quick.log 2>/dev/null || echo "No quick stock log"')
      const { stdout: fullLog } = await execAsync('tail -20 /var/log/pni_sync.log 2>/dev/null || echo "No prices log"')
      recentLogs = [
        '=== QUICK STOCK ===',
        ...quickLog.split('\n').filter((l: string) => l.trim()).slice(-15),
        '',
        '=== PRICES + STOCK ===',
        ...fullLog.split('\n').filter((l: string) => l.trim()).slice(-10)
      ]
    } catch (e) {
      console.error('Log read error:', e)
    }

    // Get database product stats
    let dbStats = { total: 0, pniProducts: 0, outOfStock: 0, withImages: 0 }
    try {
      const { stdout } = await execAsync(`
        PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U medusa -d medusa_store -t -A -c "
          SELECT
            (SELECT COUNT(*) FROM product) as total,
            (SELECT COUNT(*) FROM product WHERE metadata::text LIKE '%pni_id%') as pni,
            (SELECT COUNT(DISTINCT p.id) FROM product p
             JOIN product_variant pv ON pv.product_id = p.id
             JOIN product_variant_inventory_item pvii ON pvii.variant_id = pv.id
             JOIN inventory_level il ON il.inventory_item_id = pvii.inventory_item_id
             WHERE p.metadata::text LIKE '%pni_id%'
             AND il.stocked_quantity <= 0) as out_of_stock,
            (SELECT COUNT(*) FROM product WHERE thumbnail IS NOT NULL AND thumbnail != '') as with_images
        "
      `)
      const parts = stdout.trim().split('|').map(Number)
      dbStats = {
        total: parts[0] || 0,
        pniProducts: parts[1] || 0,
        outOfStock: parts[2] || 0,
        withImages: parts[3] || 0
      }
    } catch (e) {
      console.error('DB stats error:', e)
    }

    // Token info
    const tokenInfo = {
      hasToken: !!config.pni?.api_token,
      hasCredentials: !!(config.pni?.b2b_username && config.pni?.b2b_password),
      expiresAt: config.pni?.token_expires_at || null,
      isExpired: false
    }
    if (tokenInfo.expiresAt) {
      try {
        tokenInfo.isExpired = new Date() > new Date(tokenInfo.expiresAt)
      } catch {}
    }

    return NextResponse.json({
      config: {
        enabled: config.pni?.enabled ?? true,
        sync_prices: config.pni?.sync_prices ?? true,
        sync_stock: config.pni?.sync_stock ?? true,
        sync_images: config.pni?.sync_images ?? true,
        sync_descriptions: config.pni?.sync_descriptions ?? true,
        sync_specifications: config.pni?.sync_specifications ?? true,
        image_overwrite: config.pni?.image_overwrite ?? true,
        b2b_username: config.pni?.b2b_username || '',
        cron_quick_stock: config.pni?.cron_quick_stock || '*/15 * * * *',
        cron_price_stock: config.pni?.cron_price_stock || '0 */2 * * *',
        cron_full_import: config.pni?.cron_full_import || '0 3 * * *',
        last_sync_stock: config.pni?.last_sync_stock,
        last_sync_prices: config.pni?.last_sync_prices,
        last_sync_images: config.pni?.last_sync_images,
        last_sync_full: config.pni?.last_sync_full,
        last_error: config.pni?.last_error,
      },
      apiStatus,
      tokenInfo,
      cronStatus,
      dbStats,
      recentLogs
    })
  } catch (error: any) {
    console.error('PNI GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Update config, refresh token, update cron
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    const config = await loadConfig()

    // Handle token refresh
    if (action === 'refresh-token') {
      if (data.username) config.pni.b2b_username = data.username
      if (data.password) config.pni.b2b_password = data.password
      await saveConfig(config)

      const result = await refreshToken(config)
      if (result.error) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }
      return NextResponse.json({
        success: true,
        token: result.token?.substring(0, 8) + '...',
        expires_at: result.expires_at
      })
    }

    // Handle cron update
    if (action === 'update-cron') {
      const { cron_quick_stock, cron_price_stock, cron_full_import } = data

      if (cron_quick_stock) config.pni.cron_quick_stock = cron_quick_stock
      if (cron_price_stock) config.pni.cron_price_stock = cron_price_stock
      if (cron_full_import) config.pni.cron_full_import = cron_full_import
      await saveConfig(config)

      const cronQuick = config.pni.cron_quick_stock || '*/15 * * * *'
      const cronPrice = config.pni.cron_price_stock || '0 */2 * * *'
      const cronFull = config.pni.cron_full_import || '0 3 * * *'

      const newCron = `# PNI sync jobs - auto-managed\n${cronQuick} /home/ubuntu/pni_sync_wrapper.sh stock-quick >> /var/log/pni_sync_quick.log 2>&1\n${cronPrice} /home/ubuntu/pni_sync_wrapper.sh price-stock >> /var/log/pni_sync_quick.log 2>&1\n${cronFull} /home/ubuntu/pni_sync_wrapper.sh full-import >> /var/log/pni_sync_full.log 2>&1`

      try {
        const { stdout: existingCron } = await execAsync('crontab -l 2>/dev/null || echo ""')
        const otherJobs = existingCron.split('\n')
          .filter((line: string) => !line.includes('pni') && !line.includes('PNI sync') && line.trim())
          .join('\n')

        const fullCron = otherJobs ? `${otherJobs}\n\n${newCron}` : newCron
        await execAsync(`echo "${fullCron}" | crontab -`)

        return NextResponse.json({ success: true, message: 'Cron updated successfully' })
      } catch (e: any) {
        return NextResponse.json({ success: false, error: `Cron error: ${e.message}` }, { status: 500 })
      }
    }

    // Handle settings update
    const safeData = { ...data }
    // Don't overwrite protected fields with empty values
    if (!safeData.api_token) delete safeData.api_token
    if (!safeData.b2b_password) delete safeData.b2b_password
    if (!safeData.token_expires_at) delete safeData.token_expires_at

    config.pni = { ...config.pni, ...safeData }
    await saveConfig(config)

    return NextResponse.json({ success: true, config: config.pni })
  } catch (error: any) {
    console.error('PNI POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
