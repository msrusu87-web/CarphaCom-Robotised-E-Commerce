import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

const API_SECRET = "CBRadio2026GeneratorKey"
const CONFIG_FILE = "/var/www/carphacom/config/supplier_sync.json"
const SCRIPTS_DIR = "/home/ubuntu"
const LOG_DIR = "/var/log"

function authorize(req: NextRequest): boolean {
  const auth = req.headers.get("authorization")
  return auth === `Bearer ${API_SECRET}`
}

function readConfig(): any {
  try {
    const data = fs.readFileSync(CONFIG_FILE, "utf-8")
    return JSON.parse(data)
  } catch {
    return { pni: {} }
  }
}

function writeConfig(config: any): void {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

function readLogTail(logFile: string, lines = 50): string {
  try {
    const fullPath = path.join(LOG_DIR, logFile)
    if (!fs.existsSync(fullPath)) return "Log file not found"
    const content = fs.readFileSync(fullPath, "utf-8")
    const allLines = content.split("\n")
    return allLines.slice(-lines).join("\n")
  } catch (e: any) {
    return `Error reading log: ${e.message}`
  }
}

async function runSyncScript(
  script: string,
  args: string = "",
  logFile: string
): Promise<{ success: boolean; output: string; exitCode: number }> {
  try {
    // Ensure log file exists and is writable
    const logPath = path.join(LOG_DIR, logFile)
    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, "")
    }

    const cmd = `cd ${SCRIPTS_DIR} && python3 ${script} ${args} 2>&1 | tee -a ${logPath}`
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 600000, // 10 min max
      env: { ...process.env, PGPASSWORD: "YOUR_DB_PASSWORD" },
    })

    return {
      success: true,
      output: (stdout + stderr).slice(-2000),
      exitCode: 0,
    }
  } catch (e: any) {
    return {
      success: false,
      output: (e.stdout || "") + (e.stderr || e.message || ""),
      exitCode: e.code || 1,
    }
  }
}

async function testPniConnection(): Promise<{
  success: boolean
  message: string
  tokenValid: boolean
  tokenExpires: string | null
  productsCount: number | null
}> {
  const config = readConfig()
  const pni = config.pni || {}
  const token = pni.api_token || ""
  const apiBase = pni.api_base_url || "https://b2b.mypni.com/api/v1"

  if (!token) {
    return {
      success: false,
      message: "No API token configured",
      tokenValid: false,
      tokenExpires: null,
      productsCount: null,
    }
  }

  try {
    const resp = await fetch(`${apiBase}/products?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    })
    const data = await resp.json()

    if (data.status === 1) {
      return {
        success: true,
        message: "Connection successful",
        tokenValid: true,
        tokenExpires: pni.token_expires_at || null,
        productsCount: data.count || data.total || null,
      }
    } else {
      return {
        success: false,
        message: `API returned status ${data.status}: ${data.message || "Unknown error"}`,
        tokenValid: false,
        tokenExpires: pni.token_expires_at || null,
        productsCount: null,
      }
    }
  } catch (e: any) {
    return {
      success: false,
      message: `Connection failed: ${e.message}`,
      tokenValid: false,
      tokenExpires: pni.token_expires_at || null,
      productsCount: null,
    }
  }
}

// GET - Status & logs
export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action") || "status"

  if (action === "status") {
    const config = readConfig()
    const pni = config.pni || {}

    // Get DB stats
    let dbStats = null
    try {
      const { stdout } = await execAsync(
        `PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U medusa -d medusa_store --pset pager=off -t -A -c "
          SELECT json_build_object(
            'total_products', (SELECT COUNT(*) FROM product),
            'published_products', (SELECT COUNT(*) FROM product WHERE status = 'published'),
            'total_images', (SELECT COUNT(DISTINCT url) FROM image WHERE product_id IS NOT NULL),
            'last_product_update', (SELECT MAX(updated_at) FROM product)
          );"`,
        { timeout: 10000 }
      )
      dbStats = JSON.parse(stdout.trim())
    } catch {}

    // Get service status
    let services = null
    try {
      const { stdout } = await execAsync("pm2 jlist 2>/dev/null", { timeout: 5000 })
      const pm2List = JSON.parse(stdout)
      services = pm2List.map((p: any) => ({
        name: p.name,
        status: p.pm2_env?.status,
        uptime: p.pm2_env?.pm_uptime,
        restarts: p.pm2_env?.restart_time,
        memory: p.monit?.memory,
        cpu: p.monit?.cpu,
      }))
    } catch {}

    // Redis status
    let redisOk = false
    try {
      await execAsync("redis-cli -a YOUR_REDIS_PASSWORD ping 2>/dev/null", { timeout: 3000 })
      redisOk = true
    } catch {}

    // PostgreSQL status
    let pgOk = false
    try {
      await execAsync("pg_isready -h localhost -p 5432 2>/dev/null", { timeout: 3000 })
      pgOk = true
    } catch {}

    return NextResponse.json({
      supplier: "PNI B2B",
      config: {
        enabled: pni.enabled,
        api_base_url: pni.api_base_url,
        b2b_username: pni.b2b_username,
        sync_prices: pni.sync_prices,
        sync_stock: pni.sync_stock,
        sync_images: pni.sync_images,
        sync_descriptions: pni.sync_descriptions,
        token_expires_at: pni.token_expires_at,
        last_sync_stock: pni.last_sync_stock,
        last_sync_prices: pni.last_sync_prices,
        last_sync_images: pni.last_sync_images,
        last_sync_full: pni.last_sync_full,
        last_error: pni.last_error,
        cron_quick_stock: pni.cron_quick_stock,
        cron_price_stock: pni.cron_price_stock,
        cron_full_import: pni.cron_full_import,
      },
      db: dbStats,
      services,
      redis: redisOk,
      postgresql: pgOk,
    })
  }

  if (action === "logs") {
    const logType = searchParams.get("type") || "quick"
    const logMap: Record<string, string> = {
      quick: "pni_sync_quick.log",
      full: "pni_sync_full.log",
      import: "pni_sync_import.log",
      images: "pni_sync_images.log",
      autoblog: "autoblog_generate.log",
    }
    const logFile = logMap[logType] || "pni_sync_quick.log"
    // Check both /var/log and /home/ubuntu for autoblog
    let logContent: string
    if (logType === "autoblog") {
      try {
        logContent = fs.readFileSync("/home/ubuntu/autoblog_generate.log", "utf-8")
        const lines = logContent.split("\n")
        logContent = lines.slice(-80).join("\n")
      } catch {
        logContent = "No autoblog log found"
      }
    } else {
      logContent = readLogTail(logFile, 80)
    }
    return NextResponse.json({ logType, content: logContent })
  }

  if (action === "test-connection") {
    const result = await testPniConnection()
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

// POST - Trigger sync operations
export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { action } = body

  switch (action) {
    case "sync-stock": {
      const result = await runSyncScript(
        "sync_pni_stock_quick.py",
        "",
        "pni_sync_quick.log"
      )
      return NextResponse.json({
        action: "sync-stock",
        ...result,
      })
    }

    case "sync-prices": {
      const result = await runSyncScript(
        "sync_pni_prices_stock.py",
        "",
        "pni_sync_full.log"
      )
      return NextResponse.json({
        action: "sync-prices",
        ...result,
      })
    }

    case "sync-full": {
      const result = await runSyncScript(
        "sync_pni_prices_stock.py",
        "",
        "pni_sync_full.log"
      )
      return NextResponse.json({
        action: "sync-full",
        ...result,
      })
    }

    case "sync-images": {
      const result = await runSyncScript(
        "sync_pni_images.py",
        "--overwrite",
        "pni_sync_images.log"
      )
      return NextResponse.json({
        action: "sync-images",
        ...result,
      })
    }

    case "sync-new-products": {
      const result = await runSyncScript(
        "import_pni_products_romanian.py",
        "",
        "pni_sync_import.log"
      )
      return NextResponse.json({
        action: "sync-new-products",
        ...result,
      })
    }

    case "refresh-token": {
      // Force token refresh by clearing the current token expiry
      const config = readConfig()
      config.pni.token_expires_at = "2020-01-01T00:00:00"
      writeConfig(config)
      // Run a quick test which triggers auto-refresh
      const result = await runSyncScript(
        "sync_pni_stock_quick.py",
        "--dry-run",
        "pni_sync_quick.log"
      )
      const newConfig = readConfig()
      return NextResponse.json({
        action: "refresh-token",
        success: result.success,
        new_token_expires: newConfig.pni?.token_expires_at || null,
        output: result.output.slice(-500),
      })
    }

    case "restart-services": {
      try {
        const { stdout } = await execAsync(
          "pm2 restart all 2>&1 && pm2 save 2>&1",
          { timeout: 30000 }
        )
        return NextResponse.json({
          action: "restart-services",
          success: true,
          output: stdout.slice(-1000),
        })
      } catch (e: any) {
        return NextResponse.json({
          action: "restart-services",
          success: false,
          output: e.message,
        })
      }
    }

    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      )
  }
}
