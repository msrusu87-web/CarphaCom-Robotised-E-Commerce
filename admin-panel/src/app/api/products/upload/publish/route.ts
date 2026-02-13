import { NextRequest, NextResponse } from 'next/server'

const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'medusa_store',
  user: process.env.DB_USER || 'medusa',
  password: process.env.DB_PASSWORD || 'YOUR_DB_PASSWORD',
})

// POST - Publish draft products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productIds, batchId } = body

    let published = 0

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      const placeholders = productIds.map((_: any, i: number) => `$${i + 1}`).join(',')
      const result = await pool.query(
        `UPDATE product SET status = 'published', updated_at = NOW() WHERE id IN (${placeholders}) AND status = 'draft' AND deleted_at IS NULL`,
        productIds
      )
      published = result.rowCount
    } else if (batchId) {
      const result = await pool.query(
        "UPDATE product SET status = 'published', updated_at = NOW() WHERE metadata->>'upload_batch' = $1 AND status = 'draft' AND deleted_at IS NULL",
        [batchId]
      )
      published = result.rowCount
    }

    return NextResponse.json({ success: true, published })
  } catch (error: any) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
