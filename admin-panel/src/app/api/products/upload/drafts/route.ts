import { NextRequest, NextResponse } from 'next/server'

const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'medusa_store',
  user: process.env.DB_USER || 'medusa',
  password: process.env.DB_PASSWORD || 'YOUR_DB_PASSWORD',
})

// GET - List draft products (optionally by batch)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')

    let whereClause = "p.status = 'draft' AND p.deleted_at IS NULL"
    const params: any[] = []

    if (batchId) {
      params.push(batchId)
      whereClause += ` AND p.metadata->>'upload_batch' = $${params.length}`
    }

    const result = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.handle,
        p.status,
        p.description,
        p.thumbnail,
        p.metadata,
        p.created_at,
        pv.sku,
        pv.ean as variant_ean,
        (SELECT COUNT(*) FROM image i WHERE i.product_id = p.id AND i.deleted_at IS NULL) as image_count,
        (
          SELECT json_agg(json_build_object('id', i.id, 'url', i.url) ORDER BY i.rank)
          FROM image i WHERE i.product_id = p.id AND i.deleted_at IS NULL
        ) as images
      FROM product p
      LEFT JOIN product_variant pv ON p.id = pv.product_id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
    `, params)

    const drafts = result.rows.map((row: any) => {
      const meta = row.metadata || {}
      return {
        id: row.id,
        title: row.title,
        handle: row.handle,
        description: row.description,
        thumbnail: row.thumbnail,
        sku: row.sku,
        ean: meta.ean || row.variant_ean || '',
        brand: meta.brand || '',
        price: meta.rrp_price || 0,
        supplierPrice: meta.supplier_price || 0,
        stock: meta.stock_quantity || 0,
        imageCount: parseInt(row.image_count) || 0,
        images: row.images || [],
        specifications: meta.specifications || {},
        uploadBatch: meta.upload_batch || '',
        importDate: meta.import_date || row.created_at,
        displayFields: meta.display_fields || [],
      }
    })

    return NextResponse.json({
      success: true,
      count: drafts.length,
      drafts,
    })
  } catch (error: any) {
    console.error('Draft list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove draft products (by ID or batch)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { productIds, batchId } = body

    let deleted = 0

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      // Delete specific products
      const placeholders = productIds.map((_: any, i: number) => `$${i + 1}`).join(',')
      const result = await pool.query(
        `UPDATE product SET deleted_at = NOW(), status = 'rejected' WHERE id IN (${placeholders}) AND status = 'draft'`,
        productIds
      )
      deleted = result.rowCount
    } else if (batchId) {
      // Delete all in batch
      const result = await pool.query(
        "UPDATE product SET deleted_at = NOW(), status = 'rejected' WHERE metadata->>'upload_batch' = $1 AND status = 'draft'",
        [batchId]
      )
      deleted = result.rowCount
    }

    return NextResponse.json({ success: true, deleted })
  } catch (error: any) {
    console.error('Delete drafts error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
