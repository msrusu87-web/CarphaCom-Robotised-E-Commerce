/**
 * API Route: Google Merchant Center Product Management
 * GET  - List products with their Google Merchant status
 * POST - Toggle google_merchant_enabled on products
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/api-auth'

const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'medusa_store',
  user: process.env.DB_USER || 'medusa',
  password: process.env.DB_PASSWORD || 'YOUR_DB_PASSWORD',
})

export async function GET(request: NextRequest) {
  try {
    const session = requireAdminSession(request)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const filter = searchParams.get('filter') || 'all' // all, enabled, disabled, published

    let whereClause = "p.deleted_at IS NULL"
    let countWhereClause = "p.deleted_at IS NULL"
    
    if (filter === 'enabled') {
      const f = " AND (p.metadata->>'google_merchant_enabled')::boolean = true"
      whereClause += f
      countWhereClause += f
    } else if (filter === 'disabled') {
      const f = " AND (p.metadata->>'google_merchant_enabled' IS NULL OR (p.metadata->>'google_merchant_enabled')::boolean = false)"
      whereClause += f
      countWhereClause += f
    } else if (filter === 'published') {
      const f = " AND p.status = 'published'"
      whereClause += f
      countWhereClause += f
    }

    if (search) {
      whereClause += ` AND (p.title ILIKE $3 OR p.handle ILIKE $3)`
      countWhereClause += ` AND (p.title ILIKE $1 OR p.handle ILIKE $1)`
    }

    const queryParams: any[] = [limit, offset]
    if (search) {
      queryParams.push(`%${search}%`)
    }

    const result = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.handle,
        p.status,
        p.thumbnail,
        p.metadata,
        (SELECT pv.sku FROM product_variant pv WHERE pv.product_id = p.id LIMIT 1) as sku
      FROM product p
      WHERE ${whereClause}
      ORDER BY 
        CASE WHEN (p.metadata->>'google_merchant_enabled')::boolean = true THEN 0 ELSE 1 END,
        p.title ASC
      LIMIT $1 OFFSET $2
    `, queryParams)

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM product p WHERE ${countWhereClause}`,
      search ? [`%${search}%`] : []
    )

    // Count enabled products
    const enabledCount = await pool.query(
      `SELECT COUNT(*) FROM product p WHERE p.deleted_at IS NULL AND (p.metadata->>'google_merchant_enabled')::boolean = true`
    )

    const products = result.rows.map((row: any) => {
      const meta = row.metadata || {}
      return {
        id: row.id,
        title: row.title,
        handle: row.handle,
        status: row.status,
        thumbnail: row.thumbnail,
        sku: row.sku,
        rrp_price: meta.retail_price_ron || meta.rrp_price || 0,
        supplier_price: meta.distribution_price_ron || meta.supplier_price || 0,
        stock: meta.stock_total || 0,
        google_merchant_enabled: meta.google_merchant_enabled === true,
        brand: meta.manufacturer || meta.brand || '',
      }
    })

    return NextResponse.json({
      products,
      count: parseInt(countResult.rows[0].count),
      enabledCount: parseInt(enabledCount.rows[0].count),
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching merchant products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireAdminSession(request)
    if (session instanceof NextResponse) return session

    const body = await request.json()
    const { action, productIds } = body

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }

    if (action === 'enable_all_published') {
      // Enable all published products — no productIds needed
      const result = await pool.query(
        `UPDATE product SET metadata = metadata || '{"google_merchant_enabled": true}'::jsonb WHERE status = 'published' AND deleted_at IS NULL`
      )
      return NextResponse.json({ success: true, message: `${result.rowCount} produse publicate activate pentru Google Merchant` })
    }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'Missing productIds' }, { status: 400 })
    }

    if (action === 'enable') {
      // Enable products for Google Merchant
      for (const id of productIds) {
        await pool.query(
          `UPDATE product SET metadata = metadata || '{"google_merchant_enabled": true}'::jsonb WHERE id = $1`,
          [id]
        )
      }
      return NextResponse.json({ success: true, message: `${productIds.length} produse activate pentru Google Merchant` })
    } else if (action === 'disable') {
      // Disable products from Google Merchant
      for (const id of productIds) {
        await pool.query(
          `UPDATE product SET metadata = metadata || '{"google_merchant_enabled": false}'::jsonb WHERE id = $1`,
          [id]
        )
      }
      return NextResponse.json({ success: true, message: `${productIds.length} produse dezactivate din Google Merchant` })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating merchant products:', error)
    return NextResponse.json({ error: 'Failed to update products' }, { status: 500 })
  }
}
