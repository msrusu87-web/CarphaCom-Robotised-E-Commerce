import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { enabled, interval } = body

    if (!enabled) {
      // Remove cron job
      await execAsync(`crontab -l | grep -v 'b2b_full_importer.py' | crontab -`)
      return NextResponse.json({ 
        success: true, 
        message: 'Cron job disabled' 
      })
    }

    // Calculate cron expression
    let cronExpression = ''
    if (interval < 60) {
      // Every X minutes
      cronExpression = `*/${interval} * * * *`
    } else if (interval === 60) {
      // Every hour
      cronExpression = `0 * * * *`
    } else if (interval === 120) {
      // Every 2 hours
      cronExpression = `0 */2 * * *`
    } else if (interval === 240) {
      // Every 4 hours
      cronExpression = `0 */4 * * *`
    } else if (interval === 1440) {
      // Daily at 3 AM
      cronExpression = `0 3 * * *`
    } else {
      // Every N hours
      const hours = Math.floor(interval / 60)
      cronExpression = `0 */${hours} * * *`
    }

    // Create cron job entry
    const cronJob = `${cronExpression} cd /tmp && python3 /tmp/b2b_full_importer.py >> /var/log/b2b_sync.log 2>&1`

    // Add to crontab (remove existing first)
    await execAsync(`(crontab -l 2>/dev/null | grep -v 'b2b_full_importer.py'; echo "${cronJob}") | crontab -`)

    return NextResponse.json({
      success: true,
      message: 'Cron job configured',
      cron_expression: cronExpression,
      interval_minutes: interval
    })
  } catch (error: any) {
    console.error('Cron setup error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to setup cron job', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Check if cron job exists
    const { stdout } = await execAsync(`crontab -l | grep 'b2b_full_importer.py' || echo ""`)
    
    const enabled = stdout.trim().length > 0
    
    return NextResponse.json({
      enabled,
      cron_entry: stdout.trim()
    })
  } catch (error) {
    return NextResponse.json({
      enabled: false,
      cron_entry: ''
    })
  }
}
