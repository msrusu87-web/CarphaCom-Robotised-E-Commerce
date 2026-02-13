import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const LOG_DIR = process.env.LOG_DIR || "/var/www/carphacom/current/admin-panel/logs"
const MAX_LOG_SIZE = 1024 * 1024 * 10 // 10MB per file
const MAX_LOG_FILES = 10

interface LogEntry {
  id: string
  source: "admin" | "storefront" | "api" | "system"
  type: "error" | "warning" | "info" | "debug" | "click" | "operation" | "revalidation"
  level: "critical" | "error" | "warning" | "info" | "debug"
  message: string
  data?: any
  stack?: string
  url?: string
  userAgent?: string
  userId?: string
  sessionId?: string
  timestamp: string
}

async function ensureLogDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true })
  } catch (e) {}
}

async function getLogFilePath(source: string): Promise<string> {
  await ensureLogDir()
  const date = new Date().toISOString().split("T")[0]
  return path.join(LOG_DIR, `${source}-${date}.json`)
}

async function readLogs(filePath: string): Promise<LogEntry[]> {
  try {
    const content = await fs.readFile(filePath, "utf-8")
    return JSON.parse(content)
  } catch (e) {
    return []
  }
}

async function writeLogs(filePath: string, logs: LogEntry[]) {
  await fs.writeFile(filePath, JSON.stringify(logs, null, 2))
}

async function rotateLogs(source: string) {
  await ensureLogDir()
  const files = await fs.readdir(LOG_DIR)
  const sourceFiles = files
    .filter(f => f.startsWith(`${source}-`) && f.endsWith(".json"))
    .sort()
    .reverse()
  
  // Delete old files beyond MAX_LOG_FILES
  for (let i = MAX_LOG_FILES; i < sourceFiles.length; i++) {
    await fs.unlink(path.join(LOG_DIR, sourceFiles[i])).catch(() => {})
  }
}

// POST - Add new log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: body.source || "api",
      type: body.type || "info",
      level: body.level || "info",
      message: body.message || "",
      data: body.data,
      stack: body.stack,
      url: body.url || request.headers.get("referer") || "",
      userAgent: body.userAgent || request.headers.get("user-agent") || "",
      userId: body.userId,
      sessionId: body.sessionId,
      timestamp: body.timestamp || new Date().toISOString()
    }

    const filePath = await getLogFilePath(entry.source)
    const logs = await readLogs(filePath)
    logs.push(entry)
    
    // Keep last 5000 entries per file
    const trimmedLogs = logs.slice(-5000)
    await writeLogs(filePath, trimmedLogs)
    
    // Rotate old logs
    await rotateLogs(entry.source)

    return NextResponse.json({ success: true, id: entry.id })
  } catch (error: any) {
    console.error("Debug log error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Retrieve logs with filters
export async function GET(request: NextRequest) {
  try {
    await ensureLogDir()
    const { searchParams } = new URL(request.url)
    
    const source = searchParams.get("source") // admin, storefront, api, system
    const type = searchParams.get("type") // error, warning, info, click, operation
    const level = searchParams.get("level") // critical, error, warning, info, debug
    const limit = parseInt(searchParams.get("limit") || "100")
    const since = searchParams.get("since") // ISO date string
    const date = searchParams.get("date") // YYYY-MM-DD format
    
    let allLogs: LogEntry[] = []
    
    // Read all log files or specific source
    const files = await fs.readdir(LOG_DIR)
    const logFiles = files
      .filter(f => f.endsWith(".json"))
      .filter(f => !source || f.startsWith(`${source}-`))
      .filter(f => !date || f.includes(date))
      .sort()
      .reverse()
      .slice(0, 7) // Last 7 days max
    
    for (const file of logFiles) {
      const logs = await readLogs(path.join(LOG_DIR, file))
      allLogs = allLogs.concat(logs)
    }
    
    // Apply filters
    let filtered = allLogs
    
    if (type) {
      filtered = filtered.filter(l => l.type === type)
    }
    
    if (level) {
      filtered = filtered.filter(l => l.level === level)
    }
    
    if (since) {
      const sinceDate = new Date(since)
      filtered = filtered.filter(l => new Date(l.timestamp) >= sinceDate)
    }
    
    // Sort by timestamp descending and limit
    filtered = filtered
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
    
    // Calculate stats
    const stats = {
      total: allLogs.length,
      errors: allLogs.filter(l => l.level === "error" || l.level === "critical").length,
      warnings: allLogs.filter(l => l.level === "warning").length,
      clicks: allLogs.filter(l => l.type === "click").length,
      operations: allLogs.filter(l => l.type === "operation").length,
      bySource: {
        admin: allLogs.filter(l => l.source === "admin").length,
        storefront: allLogs.filter(l => l.source === "storefront").length,
        api: allLogs.filter(l => l.source === "api").length,
        system: allLogs.filter(l => l.source === "system").length
      }
    }

    return NextResponse.json({ 
      logs: filtered, 
      stats,
      files: logFiles.length
    })
  } catch (error: any) {
    console.error("Debug log read error:", error)
    return NextResponse.json({ error: error.message, logs: [], stats: {} }, { status: 500 })
  }
}

// DELETE - Clear logs
export async function DELETE(request: NextRequest) {
  try {
    await ensureLogDir()
    const { searchParams } = new URL(request.url)
    const source = searchParams.get("source")
    const date = searchParams.get("date")
    
    const files = await fs.readdir(LOG_DIR)
    let deleted = 0
    
    for (const file of files) {
      if (!file.endsWith(".json")) continue
      if (source && !file.startsWith(`${source}-`)) continue
      if (date && !file.includes(date)) continue
      
      await fs.unlink(path.join(LOG_DIR, file))
      deleted++
    }
    
    return NextResponse.json({ success: true, deleted })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
