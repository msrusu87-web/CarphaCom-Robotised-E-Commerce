import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_ids, config } = body

    if (!product_ids || product_ids.length === 0) {
      return NextResponse.json({ error: 'No product IDs provided' }, { status: 400 })
    }

    // Validate B2B credentials
    if (!config.b2b_username || !config.b2b_password) {
      return NextResponse.json({ error: 'B2B credentials not configured' }, { status: 400 })
    }

    // Build Python command with environment variables for credentials
    const env = {
      ...process.env,
      B2B_USERNAME: config.b2b_username,
      B2B_PASSWORD: config.b2b_password
    }

    const idsString = product_ids.join(',')
    const command = `python3 /var/www/carphacom/scripts/b2b_full_importer_puppeteer.py --ids "${idsString}"`

    console.log('[Sync] Starting import for products:', idsString)

    // Execute import script with authentication
    const { stdout, stderr } = await execAsync(command, {
      timeout: 600000, // 10 minute timeout (Puppeteer needs time)
      maxBuffer: 20 * 1024 * 1024, // 20MB buffer
      env
    })

    console.log('[Sync] Import completed')

    // Parse results from stdout
    const successMatch = stdout.match(/Success: (\d+)/)
    const skippedMatch = stdout.match(/Skipped: (\d+)/)
    const errorMatch = stdout.match(/Errors: (\d+)/)
    
    const success = successMatch ? parseInt(successMatch[1]) : 0
    const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0
    const errors = errorMatch ? parseInt(errorMatch[1]) : 0

    return NextResponse.json({
      success,
      skipped,
      errors,
      output: stdout,
      error_output: stderr
    })
  } catch (error: any) {
    console.error('[Sync] Error:', error)
    return NextResponse.json(
      { 
        error: 'Sync failed', 
        details: error.message,
        output: error.stdout || '',
        error_output: error.stderr || ''
      },
      { status: 500 }
    )
  }
}
