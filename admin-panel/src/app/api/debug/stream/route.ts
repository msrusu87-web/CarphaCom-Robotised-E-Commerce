import { NextRequest } from "next/server"
import fs from "fs/promises"
import path from "path"

const LOG_DIR = process.env.LOG_DIR || "/var/www/carphacom/current/admin-panel/logs"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const source = searchParams.get("source") || "all"
  
  const encoder = new TextEncoder()
  
  let lastCheck = new Date()
  let isActive = true
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`))
      
      // Poll for new logs every 2 seconds
      const interval = setInterval(async () => {
        if (!isActive) {
          clearInterval(interval)
          return
        }
        
        try {
          // Check for new logs since last check
          const files = await fs.readdir(LOG_DIR).catch(() => [])
          const logFiles = files
            .filter(f => f.endsWith(".json"))
            .filter(f => source === "all" || f.startsWith(`${source}-`))
            .sort()
            .reverse()
            .slice(0, 2)
          
          let newLogs: any[] = []
          
          for (const file of logFiles) {
            try {
              const content = await fs.readFile(path.join(LOG_DIR, file), "utf-8")
              const logs = JSON.parse(content)
              const recent = logs.filter((l: any) => new Date(l.timestamp) > lastCheck)
              newLogs = newLogs.concat(recent)
            } catch (e) {}
          }
          
          if (newLogs.length > 0) {
            // Sort and send new logs
            newLogs = newLogs.sort((a, b) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )
            
            for (const log of newLogs) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "log", log })}\n\n`))
            }
          }
          
          lastCheck = new Date()
          
          // Send heartbeat
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`))
          
        } catch (error: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`))
        }
      }, 2000)
      
      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        isActive = false
        clearInterval(interval)
        controller.close()
      })
    },
    
    cancel() {
      isActive = false
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    }
  })
}
