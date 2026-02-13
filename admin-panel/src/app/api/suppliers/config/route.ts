import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const CONFIG_FILE = '/var/www/carphacom/config/supplier_sync.json'

export async function GET() {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8')
    const config = JSON.parse(content)
    return NextResponse.json({ config })
  } catch (error) {
    // Return default config if file doesn't exist
    return NextResponse.json({
      config: {
        enabled: false,
        interval_minutes: 60,
        sync_prices: true,
        sync_stock: true,
        sync_images: false,
        sync_descriptions: false,
        auto_publish: true,
        min_stock_threshold: 0
      }
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config } = body

    // Ensure config directory exists
    const configDir = path.dirname(CONFIG_FILE)
    await fs.mkdir(configDir, { recursive: true })

    // Save config
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('Config save error:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}
