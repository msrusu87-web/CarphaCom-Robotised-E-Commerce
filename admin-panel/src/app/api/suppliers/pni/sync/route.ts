import { NextRequest, NextResponse } from 'next/server'
import { spawn, execSync } from 'child_process'
import fs from 'fs/promises'
import { createWriteStream } from 'fs'

const CONFIG_FILE = '/var/www/carphacom/config/supplier_sync.json'
const PROGRESS_FILE = '/tmp/pni_sync_progress.json'
const PROGRESS_DATA_FILE = '/tmp/pni_sync_progress_data.json'
const GLOBAL_LOCK_FILE = '/tmp/pni_sync_locks/manual.lock'

const LOG_FILES: Record<string, string> = {
  stock: '/var/log/pni_sync_quick.log',
  prices: '/var/log/pni_sync.log',
  images: '/var/log/pni_sync_images.log',
  full: '/var/log/pni_sync_import.log',
}

function getRunningPniProcesses(): string[] {
  try {
    const output = execSync(
      'ps aux | grep -E "python3.*(sync_pni|import_pni)" | grep -v grep',
      { encoding: 'utf-8', timeout: 5000 }
    )
    return output.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, options } = await request.json()

    // Validate action
    const validActions = ['stock', 'prices', 'images', 'full']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 })
    }

    // Check if a manual sync is already running (our own progress file)
    try {
      const existing = JSON.parse(await fs.readFile(PROGRESS_FILE, 'utf-8'))
      if (existing.status === 'running') {
        try {
          process.kill(existing.pid, 0)
          return NextResponse.json({
            error: `${existing.action} sync already in progress (PID ${existing.pid})`,
            alreadyRunning: true,
          }, { status: 409 })
        } catch {
          // PID is dead, continue
        }
      }
    } catch {
      // No progress file, ok to proceed
    }

    // Check if a cron sync is already running (prevents API rate limit competition)
    const runningProcesses = getRunningPniProcesses()
    if (runningProcesses.length > 0) {
      // Extract info about what's running
      const cronInfo = runningProcesses.map(p => {
        if (p.includes('sync_pni_stock_quick')) return 'quick stock sync (cron)'
        if (p.includes('sync_pni_prices_stock')) return 'prices+stock sync (cron)'
        if (p.includes('sync_pni_images')) return 'images sync (cron)'
        if (p.includes('import_pni')) return 'product import (cron)'
        return 'PNI sync'
      })
      return NextResponse.json({
        error: `A ${cronInfo[0]} is already in progress. Please wait for it to finish.`,
        alreadyRunning: true,
        cronRunning: true,
      }, { status: 409 })
    }

    let command = ''
    
    switch (action) {
      case 'stock':
        command = 'cd /home/ubuntu && python3 sync_pni_stock_quick.py --verbose --progress'
        break
      case 'prices':
        command = 'cd /home/ubuntu && python3 sync_pni_prices_stock.py --verbose --progress'
        break
      case 'images': {
        const overwrite = options?.overwrite !== false
        command = `cd /home/ubuntu && python3 sync_pni_images.py --verbose --progress ${overwrite ? '--overwrite' : ''}`
        break
      }
      case 'full':
        command = 'cd /home/ubuntu && python3 import_pni_products_romanian.py --verbose --progress'
        break
    }

    console.log(`[PNI Sync] Starting ${action} sync in background...`)
    console.log(`[PNI Sync] Command: ${command}`)

    // Clean up stale progress data file from previous runs
    try { await fs.unlink(PROGRESS_DATA_FILE) } catch {}

    const logFile = LOG_FILES[action] || '/var/log/pni_sync_manual.log'
    const startedAt = new Date().toISOString()

    // Spawn background process
    const child = spawn('nice', ['-n', '19', 'ionice', '-c', '3', 'bash', '-c', command], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    })

    const pid = child.pid!

    // Write progress file immediately
    const progressData = {
      action,
      pid,
      startedAt,
      logFile,
      status: 'running' as const,
    }
    await fs.writeFile(PROGRESS_FILE, JSON.stringify(progressData, null, 2))

    // Pipe stdout/stderr to log file
    const logStream = createWriteStream(logFile, { flags: 'a' })
    logStream.write(`\n${startedAt} - Starting manual ${action} sync (PID ${pid})\n`)
    child.stdout?.pipe(logStream)
    child.stderr?.pipe(logStream)

    // Handle process exit - update progress file and config
    child.on('close', async (exitCode) => {
      console.log(`[PNI Sync] Process ${pid} exited with code ${exitCode}`)
      const elapsed = Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)

      // Read last lines of log for summary
      let output = ''
      try {
        const { exec: execCb } = require('child_process')
        const { promisify } = require('util')
        const execAsync = promisify(execCb)
        const { stdout } = await execAsync(`tail -20 "${logFile}" 2>/dev/null`, { timeout: 5000 })
        output = stdout
      } catch {}

      const success = exitCode === 0

      // Parse stats from output
      // Python script outputs "Label:  NUMBER" format per line
      let updates = 0
      let errors = 0
      const updatedMatch = output.match(/Updated:\s*(\d+)/i)
      const importedMatch = output.match(/Imported:\s*(\d+)/i)
      const errorsMatch = output.match(/Errors?:\s*(\d+)/i)
      if (updatedMatch) updates += parseInt(updatedMatch[1])
      if (importedMatch) updates += parseInt(importedMatch[1])
      if (errorsMatch) errors = parseInt(errorsMatch[1])
      // Fallback: "NUMBER label" on same line (no newline in between)
      if (!updatedMatch && !importedMatch) {
        const updateMatch = output.match(/(\d+)[ \t]+(?:updates?|updated)/i)
        if (updateMatch) updates = parseInt(updateMatch[1])
      }
      if (!errorsMatch) {
        const errorMatch = output.match(/(\d+)[ \t]+(?:errors?)/i)
        if (errorMatch) errors = parseInt(errorMatch[1])
      }

      const result = {
        success,
        message: success
          ? `${action} sync complete! (${elapsed}s)`
          : `${action} sync failed (code: ${exitCode})`,
        updates,
        errors,
        duration: elapsed,
        output: output.substring(0, 5000),
      }

      // Update progress file
      try {
        const prog = {
          ...progressData,
          status: success ? 'completed' : 'error',
          exitCode,
          result,
        }
        await fs.writeFile(PROGRESS_FILE, JSON.stringify(prog, null, 2))
      } catch (e) {
        console.error('[PNI Sync] Failed to update progress file:', e)
      }

      // Update config timestamps
      if (success) {
        try {
          const content = await fs.readFile(CONFIG_FILE, 'utf-8')
          const config = JSON.parse(content)
          const syncKey = action === 'stock' ? 'last_sync_stock' :
                          action === 'prices' ? 'last_sync_prices' :
                          action === 'images' ? 'last_sync_images' : 'last_sync_full'
          config.pni[syncKey] = new Date().toISOString()
          config.pni.last_error = null
          await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))
        } catch (e) {
          console.error('[PNI Sync] Failed to update config:', e)
        }
      } else {
        try {
          const content = await fs.readFile(CONFIG_FILE, 'utf-8')
          const config = JSON.parse(content)
          config.pni.last_error = `${action}: Process terminated with code ${exitCode}`
          await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))
        } catch (e) {
          console.error('[PNI Sync] Failed to update config:', e)
        }
      }

      logStream.end(`\n${new Date().toISOString()} - Finished manual ${action} sync (exit code: ${exitCode})\n`)
    })

    // Unref so the Node process doesn't wait for the child
    child.unref()

    return NextResponse.json({
      started: true,
      action,
      pid,
      message: `${action} sync started successfully!`,
    })
  } catch (error: any) {
    console.error('[PNI Sync] Error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}
