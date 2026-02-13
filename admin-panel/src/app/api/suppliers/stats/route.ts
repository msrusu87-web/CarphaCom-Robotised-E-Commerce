import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Get stats from database
    const { Pool } = require('pg')
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'medusa_store',
      user: 'medusa',
      password: 'YOUR_DB_PASSWORD'
    })

    // Total B2B products (approximate)
    const totalProducts = 1799

    // Imported products
    const importedResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM product 
      WHERE metadata->>'b2b_id' IS NOT NULL
    `)
    const imported = parseInt(importedResult.rows[0].count)

    // Active products (with stock > 0)
    const activeResult = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM product p
      JOIN product_variant pv ON p.id = pv.product_id
      JOIN product_variant_inventory_item pvii ON pv.id = pvii.variant_id
      JOIN inventory_level il ON pvii.inventory_item_id = il.inventory_item_id
      WHERE il.stocked_quantity > 0
      AND p.metadata->>'b2b_id' IS NOT NULL
    `)
    const active = parseInt(activeResult.rows[0].count)

    // Out of stock
    const outOfStock = imported - active

    // Last sync time
    const lastSyncResult = await pool.query(`
      SELECT metadata->>'last_sync' as last_sync
      FROM product
      WHERE metadata->>'last_sync' IS NOT NULL
      ORDER BY metadata->>'last_sync' DESC
      LIMIT 1
    `)
    const lastSync = lastSyncResult.rows[0]?.last_sync || null

    await pool.end()

    return NextResponse.json({
      total_products: totalProducts,
      imported_products: imported,
      active_products: active,
      out_of_stock: outOfStock,
      last_sync: lastSync,
      sync_enabled: false,
      sync_interval: 60
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({
      total_products: 1799,
      imported_products: 0,
      active_products: 0,
      out_of_stock: 0,
      last_sync: null,
      sync_enabled: false,
      sync_interval: 60
    })
  }
}
