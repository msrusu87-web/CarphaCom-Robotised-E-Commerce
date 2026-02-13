import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

interface TestResult {
  name: string
  status: "pass" | "fail" | "warning"
  message: string
  details?: any
  duration?: number
}

async function runTests(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // Test 1: Medusa Backend Health
  try {
    const start = Date.now()
    const response = await fetch("http://localhost:9000/health", { 
      method: "GET",
      signal: AbortSignal.timeout(5000)
    })
    results.push({
      name: "Medusa Backend",
      status: response.ok ? "pass" : "fail",
      message: response.ok ? "Backend is healthy" : `Status: ${response.status}`,
      duration: Date.now() - start
    })
  } catch (e: any) {
    results.push({
      name: "Medusa Backend",
      status: "fail",
      message: `Connection failed: ${e.message}`
    })
  }

  // Test 2: Storefront Health
  try {
    const start = Date.now()
    const response = await fetch("http://localhost:8000/api/products", { 
      method: "GET",
      signal: AbortSignal.timeout(5000)
    }).catch(() => fetch("https://www.YOUR_PNI_USERNAMEtrafic.ro/ro", { signal: AbortSignal.timeout(5000) }))
    results.push({
      name: "Storefront",
      status: response.ok ? "pass" : "warning",
      message: response.ok ? "Storefront is running" : `Status: ${response.status}`,
      duration: Date.now() - start
    })
  } catch (e: any) {
    results.push({
      name: "Storefront", 
      status: "fail",
      message: `Connection failed: ${e.message}`
    })
  }

  // Test 3: Database Connection (via Medusa)
  try {
    const start = Date.now()
    const response = await fetch("http://localhost:9000/store/products?limit=1", {
      method: "GET",
      headers: {
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
      },
      signal: AbortSignal.timeout(5000)
    })
    const data = await response.json().catch(() => ({}))
    results.push({
      name: "Database (Products)",
      status: response.ok ? "pass" : "fail",
      message: response.ok ? `Connected, ${data.count || 0} products found` : `Status: ${response.status}`,
      duration: Date.now() - start
    })
  } catch (e: any) {
    results.push({
      name: "Database (Products)",
      status: "fail", 
      message: `Query failed: ${e.message}`
    })
  }

  // Test 4: PM2 Processes
  try {
    const { stdout } = await execAsync("pm2 jlist 2>/dev/null || echo '[]'")
    const processes = JSON.parse(stdout)
    const running = processes.filter((p: any) => p.pm2_env?.status === "online")
    results.push({
      name: "PM2 Processes",
      status: running.length >= 2 ? "pass" : "warning",
      message: `${running.length} processes online`,
      details: processes.map((p: any) => ({
        name: p.name,
        status: p.pm2_env?.status,
        memory: Math.round((p.monit?.memory || 0) / 1024 / 1024) + "MB",
        restarts: p.pm2_env?.restart_time || 0
      }))
    })
  } catch (e: any) {
    results.push({
      name: "PM2 Processes",
      status: "warning",
      message: `Could not check PM2: ${e.message}`
    })
  }

  // Test 5: Disk Space
  try {
    const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $5}'")
    const usage = parseInt(stdout.trim().replace("%", ""))
    results.push({
      name: "Disk Space",
      status: usage < 80 ? "pass" : usage < 90 ? "warning" : "fail",
      message: `${usage}% used`,
      details: { usagePercent: usage }
    })
  } catch (e: any) {
    results.push({
      name: "Disk Space",
      status: "warning",
      message: `Could not check: ${e.message}`
    })
  }

  // Test 6: Memory Usage
  try {
    const { stdout } = await execAsync("free -m | grep Mem | awk '{print $3, $2}'")
    const [used, total] = stdout.trim().split(" ").map(Number)
    const percent = Math.round((used / total) * 100)
    results.push({
      name: "Memory",
      status: percent < 80 ? "pass" : percent < 90 ? "warning" : "fail",
      message: `${percent}% used (${used}MB / ${total}MB)`,
      details: { usedMB: used, totalMB: total, percent }
    })
  } catch (e: any) {
    results.push({
      name: "Memory",
      status: "warning",
      message: `Could not check: ${e.message}`
    })
  }

  // Test 7: Nginx Status
  try {
    const { stdout } = await execAsync("systemctl is-active nginx 2>/dev/null || echo 'unknown'")
    const status = stdout.trim()
    results.push({
      name: "Nginx",
      status: status === "active" ? "pass" : "fail",
      message: status === "active" ? "Running" : `Status: ${status}`
    })
  } catch (e: any) {
    results.push({
      name: "Nginx",
      status: "warning",
      message: `Could not check: ${e.message}`
    })
  }

  // Test 8: Log Directory
  try {
    const { stdout } = await execAsync("ls -la /var/www/carphacom/current/admin-panel/logs 2>/dev/null | wc -l")
    const count = parseInt(stdout.trim()) - 1
    results.push({
      name: "Log Files",
      status: "pass",
      message: `${Math.max(0, count)} log files exist`
    })
  } catch (e: any) {
    results.push({
      name: "Log Files",
      status: "warning",
      message: "Log directory not initialized"
    })
  }

  // Test 9: Revalidation API
  try {
    const start = Date.now()
    const response = await fetch("http://localhost:8000/api/revalidate", {
      method: "GET",
      signal: AbortSignal.timeout(5000)
    })
    results.push({
      name: "Revalidation API",
      status: response.ok ? "pass" : "fail",
      message: response.ok ? "Endpoint available" : `Status: ${response.status}`,
      duration: Date.now() - start
    })
  } catch (e: any) {
    results.push({
      name: "Revalidation API",
      status: "warning",
      message: `Not available: ${e.message}`
    })
  }

  return results
}

export async function GET(request: NextRequest) {
  try {
    const results = await runTests()
    
    const summary = {
      total: results.length,
      pass: results.filter(r => r.status === "pass").length,
      fail: results.filter(r => r.status === "fail").length,
      warning: results.filter(r => r.status === "warning").length,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ results, summary })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { test } = body

    // Run specific test
    if (test === "revalidate") {
      const response = await fetch("http://localhost:8000/api/revalidate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-revalidate-secret": "YOUR_REVALIDATE_SECRET"
        },
        body: JSON.stringify({ type: "all" })
      })
      const data = await response.json()
      return NextResponse.json({ 
        test: "revalidate", 
        success: response.ok, 
        data 
      })
    }

    if (test === "error-simulation") {
      // Log a test error
      await fetch("http://localhost:3001/api/debug/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "system",
          type: "error",
          level: "error",
          message: "Test error simulation",
          data: { simulated: true, timestamp: new Date().toISOString() }
        })
      })
      return NextResponse.json({ test: "error-simulation", success: true })
    }

    return NextResponse.json({ error: "Unknown test type" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
