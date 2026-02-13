import { NextResponse } from 'next/server'
import fs from 'fs/promises'

const SYNC_STATE_FILE = '/tmp/pni_sync_progress.json'
const PROGRESS_DATA_FILE = '/tmp/pni_sync_progress_data.json'

interface SyncState {
  action: string
  pid: number
  startedAt: string
  logFile: string
  status: 'running' | 'completed' | 'error'
  exitCode?: number
  result?: {
    success: boolean
    message: string
    updates?: number
    errors?: number
    duration?: number
    output?: string
  }
}

interface ProgressData {
  percent: number
  message: string
  phase: 'running' | 'completed' | 'error'
}

async function isProcessRunning(pid: number): Promise<boolean> {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    const content = await fs.readFile(path, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export async function GET() {
  try {
    // Read the sync state file (written by the sync route when starting a sync)
    const state = await readJson<SyncState>(SYNC_STATE_FILE)

    if (!state) {
      return NextResponse.json({
        running: false,
        action: null,
        percent: 0,
        message: 'No active sync',
      })
    }

    // If the sync route already marked it completed/error, return that
    if (state.status === 'completed' || state.status === 'error') {
      return NextResponse.json({
        running: false,
        action: state.action,
        percent: state.status === 'completed' ? 100 : 0,
        message: state.result?.message || (state.status === 'completed' ? 'Sync complete!' : 'Sync error'),
        result: state.result,
        status: state.status,
      })
    }

    // Status is "running" - check if the process is actually alive
    const alive = await isProcessRunning(state.pid)

    if (!alive) {
      // Process died - check if the Python script wrote a final progress
      const progressData = await readJson<ProgressData>(PROGRESS_DATA_FILE)
      
      const elapsed = Math.round((Date.now() - new Date(state.startedAt).getTime()) / 1000)
      const wasSuccess = progressData?.phase === 'completed'
      
      const result = {
        success: wasSuccess,
        message: wasSuccess 
          ? (progressData?.message || `${state.action} sync complete!`)
          : (progressData?.message || `${state.action} sync finished`),
        duration: elapsed,
      }

      // Update state file so next poll doesn't re-check
      state.status = wasSuccess ? 'completed' : 'error'
      state.result = result
      try {
        await fs.writeFile(SYNC_STATE_FILE, JSON.stringify(state, null, 2))
      } catch {}

      return NextResponse.json({
        running: false,
        action: state.action,
        percent: wasSuccess ? 100 : 0,
        message: result.message,
        result,
        status: state.status,
      })
    }

    // Process is alive - read progress from the file the Python script writes
    const progressData = await readJson<ProgressData>(PROGRESS_DATA_FILE)
    const elapsed = Math.round((Date.now() - new Date(state.startedAt).getTime()) / 1000)

    if (progressData) {
      // If Python script reports completed but process still alive, show 99%
      if (progressData.phase === 'completed') {
        return NextResponse.json({
          running: true,
          action: state.action,
          percent: 99,
          message: progressData.message || 'Finalizing...',
          elapsed,
          status: 'running',
        })
      }

      return NextResponse.json({
        running: true,
        action: state.action,
        percent: progressData.percent || 0,
          message: progressData.message || 'Syncing...',
        elapsed,
        status: 'running',
      })
    }

    // No progress data yet - script just started
    return NextResponse.json({
      running: true,
      action: state.action,
      percent: 0,
      message: 'Starting sync...',
      elapsed,
      status: 'running',
    })
  } catch (error: any) {
    console.error('[PNI Progress] Error:', error)
    return NextResponse.json({
      running: false,
      action: null,
      percent: 0,
      message: 'Error checking progress',
    })
  }
}
