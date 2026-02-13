import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'medusa_store',
  user: process.env.DB_USER || 'medusa',
  password: process.env.DB_PASSWORD || 'YOUR_DB_PASSWORD',
})

const UPLOAD_BASE = '/var/www/carphacom/shared/uploads/products'
const THUMB_SIZES = { small: 200, medium: 400 }
const MAIN_SIZE = 800

function generateId(prefix: string): string {
  const chars = 'abcdefghjklmnpqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 20; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}_${id}`
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)
}

async function optimizeAndSaveImage(
  imageUrl: string,
  productHandle: string,
  imageIndex: number,
  isExternal: boolean,
  imageFolder?: string
): Promise<{ mainUrl: string; thumbnailUrl: string } | null> {
  try {
    let buffer: Buffer

    if (isExternal) {
      // Download external image
      const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) })
      if (!res.ok) return null
      buffer = Buffer.from(await res.arrayBuffer())
    } else {
      // Read from uploaded folder
      const imagePath = imageFolder
        ? path.join(UPLOAD_BASE, imageFolder, path.basename(imageUrl))
        : path.join(UPLOAD_BASE, imageUrl)

      const fs = await import('fs/promises')
      try {
        buffer = await fs.readFile(imagePath)
      } catch {
        // Try with original extension variants
        const baseName = path.basename(imageUrl, path.extname(imageUrl))
        for (const ext of ['.webp', '.jpg', '.jpeg', '.png']) {
          try {
            buffer = await fs.readFile(path.join(path.dirname(imagePath), baseName + ext))
            break
          } catch { continue }
        }
        if (!buffer!) return null
      }
    }

    // Create product image directory
    const productDir = path.join(UPLOAD_BASE, 'catalog', productHandle)
    const thumbSmallDir = path.join(productDir, 'thumbnails', 'small')
    const thumbMediumDir = path.join(productDir, 'thumbnails', 'medium')
    await mkdir(productDir, { recursive: true })
    await mkdir(thumbSmallDir, { recursive: true })
    await mkdir(thumbMediumDir, { recursive: true })

    const filename = `${productHandle}_${imageIndex}.webp`

    // Optimize main image
    const mainBuffer = await sharp(buffer)
      .resize(MAIN_SIZE, MAIN_SIZE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()
    await writeFile(path.join(productDir, filename), mainBuffer)

    // Generate small thumbnail
    const smallBuffer = await sharp(buffer)
      .resize(THUMB_SIZES.small, THUMB_SIZES.small, { fit: 'cover', position: 'centre' })
      .webp({ quality: 80 })
      .toBuffer()
    await writeFile(path.join(thumbSmallDir, filename), smallBuffer)

    // Generate medium thumbnail
    const mediumBuffer = await sharp(buffer)
      .resize(THUMB_SIZES.medium, THUMB_SIZES.medium, { fit: 'cover', position: 'centre' })
      .webp({ quality: 82 })
      .toBuffer()
    await writeFile(path.join(thumbMediumDir, filename), mediumBuffer)

    const mainUrl = `/api/uploads/products/catalog/${productHandle}/${filename}`
    const thumbnailUrl = `/api/uploads/products/catalog/${productHandle}/thumbnails/medium/${filename}`

    return { mainUrl, thumbnailUrl }
  } catch (err) {
    console.error(`Image processing error for ${imageUrl}:`, err)
    return null
  }
}

// POST - Process products from parsed data, create as draft
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      products: productRows,
      fieldMappings,
      imageSource, // 'external' | 'local'
      imageFolder, // folder name for local images
      displayFields, // which fields to show on storefront
      batchId,
    } = body

    if (!productRows || !Array.isArray(productRows) || productRows.length === 0) {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 })
    }

    if (!fieldMappings || !fieldMappings.title) {
      return NextResponse.json({ error: 'Title field mapping is required' }, { status: 400 })
    }

    const uploadBatchId = batchId || `batch_${Date.now()}`
    const results: Array<{ index: number; productId: string; title: string; status: string; imageCount: number }> = []
    const errors: Array<{ index: number; title: string; error: string }> = []

    // Get default sales channel
    const scResult = await pool.query("SELECT id FROM sales_channel WHERE deleted_at IS NULL LIMIT 1")
    const salesChannelId = scResult.rows[0]?.id

    // Get stock location
    const slResult = await pool.query("SELECT id FROM stock_location WHERE deleted_at IS NULL LIMIT 1")
    const stockLocationId = slResult.rows[0]?.id || 'sloc_01JK5E2N3FYE0RDPMG0VCPEHTT'

    for (let i = 0; i < productRows.length; i++) {
      const row = productRows[i]
      try {
        // Map fields
        const getValue = (field: string): string => {
          const sourceCol = fieldMappings[field]
          return sourceCol ? (row[sourceCol] || '').trim() : ''
        }

        const title = getValue('title')
        if (!title) {
          errors.push({ index: i, title: `Row ${i + 1}`, error: 'Title is missing' })
          continue
        }

        const handle = slugify(title)
        const description = getValue('description')
        const sku = getValue('sku') || handle.toUpperCase().substring(0, 15)
        const ean = getValue('ean')
        const brand = getValue('brand')
        const category = getValue('category')
        const price = parseFloat(getValue('price')) || 0
        const supplierPrice = parseFloat(getValue('supplier_price')) || 0
        const stock = parseInt(getValue('stock')) || 0
        const weight = getValue('weight')
        const warrantyMonths = parseInt(getValue('warranty_months')) || 24

        // Collect image references
        const imageRefs: string[] = []
        for (let j = 1; j <= 10; j++) {
          const img = getValue(`image${j}`)
          if (img) imageRefs.push(img)
        }

        // Collect specifications
        const specifications: Record<string, string> = {}
        for (let j = 1; j <= 10; j++) {
          const key = getValue(`spec_key${j}`)
          const val = getValue(`spec_val${j}`)
          if (key && val) specifications[key] = val
        }

        // Process images
        const processedImages: Array<{ url: string; thumbnail: string }> = []
        const isExternal = imageSource === 'external'

        for (let imgIdx = 0; imgIdx < imageRefs.length; imgIdx++) {
          const imgRef = imageRefs[imgIdx]

          if (isExternal && (imgRef.startsWith('http://') || imgRef.startsWith('https://'))) {
            // External: download, optimize, generate thumbnails
            const result = await optimizeAndSaveImage(imgRef, handle, imgIdx + 1, true)
            if (result) {
              processedImages.push({ url: result.mainUrl, thumbnail: result.thumbnailUrl })
            }
          } else if (!isExternal) {
            // Local: process from uploaded folder
            const result = await optimizeAndSaveImage(imgRef, handle, imgIdx + 1, false, imageFolder)
            if (result) {
              processedImages.push({ url: result.mainUrl, thumbnail: result.thumbnailUrl })
            }
          } else if (imgRef.startsWith('http')) {
            // External URL even in local mode
            const result = await optimizeAndSaveImage(imgRef, handle, imgIdx + 1, true)
            if (result) {
              processedImages.push({ url: result.mainUrl, thumbnail: result.thumbnailUrl })
            }
          }
        }

        const thumbnailUrl = processedImages.length > 0 ? processedImages[0].url : null

        // Generate IDs
        const productId = generateId('prod')
        const variantId = generateId('variant')
        const priceSetId = generateId('pset')
        const priceId = generateId('price')
        const inventoryItemId = generateId('iitem')
        const inventoryLevelId = generateId('ilevel')

        // Build metadata
        const metadata: Record<string, any> = {
          rrp_price: price,
          supplier_price: supplierPrice,
          supplier_price_tiers: [{ min_quantity: 1, price: supplierPrice }],
          stock_quantity: stock,
          stock_total: stock,
          ean,
          brand,
          warranty_months: warrantyMonths,
          specifications,
          images: processedImages.map(img => img.url),
          upload_batch: uploadBatchId,
          display_fields: displayFields || [],
          import_source: 'csv_upload',
          import_date: new Date().toISOString(),
        }
        if (weight) metadata.weight = weight

        // Insert product as DRAFT
        await pool.query(`
          INSERT INTO product (id, title, handle, description, status, thumbnail, weight, metadata, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, NOW(), NOW())
        `, [productId, title, handle, description, thumbnailUrl, weight || null, JSON.stringify(metadata)])

        // Insert into product_sales_channel
        if (salesChannelId) {
          await pool.query(`
            INSERT INTO product_sales_channel (id, product_id, sales_channel_id, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
          `, [generateId('psc'), productId, salesChannelId])
        }

        // Insert images into image table
        for (let imgIdx = 0; imgIdx < processedImages.length; imgIdx++) {
          const imgId = generateId('img')
          await pool.query(`
            INSERT INTO image (id, url, product_id, rank, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
          `, [imgId, processedImages[imgIdx].url, productId, imgIdx])
        }

        // Insert variant
        await pool.query(`
          INSERT INTO product_variant (id, title, product_id, sku, ean, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [variantId, 'Standard', productId, sku, ean])

        // Create price set and price
        await pool.query("INSERT INTO price_set (id, created_at, updated_at) VALUES ($1, NOW(), NOW())", [priceSetId])
        const priceInCents = Math.round(price * 100)
        await pool.query(`
          INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, created_at, updated_at)
          VALUES ($1, $2, 'RON', $3, $4, NOW(), NOW())
        `, [priceId, priceSetId, priceInCents, JSON.stringify({ value: String(priceInCents), precision: 20 })])
        await pool.query(`
          INSERT INTO product_variant_price_set (id, variant_id, price_set_id)
          VALUES ($1, $2, $3)
        `, [generateId('pvps'), variantId, priceSetId])

        // Create inventory
        await pool.query(`
          INSERT INTO inventory_item (id, sku, created_at, updated_at)
          VALUES ($1, $2, NOW(), NOW())
        `, [inventoryItemId, sku])
        await pool.query(`
          INSERT INTO inventory_level (id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 0, 0, NOW(), NOW())
        `, [inventoryLevelId, inventoryItemId, stockLocationId, stock])
        await pool.query(`
          INSERT INTO product_variant_inventory_item (id, variant_id, inventory_item_id, required_quantity)
          VALUES ($1, $2, $3, 1)
        `, [generateId('pvii'), variantId, inventoryItemId])

        // Handle category assignment
        if (category) {
          const catParts = category.split('/')
          const catHandle = slugify(catParts[catParts.length - 1])
          const catResult = await pool.query(
            "SELECT id FROM product_category WHERE handle ILIKE $1 OR name ILIKE $2 LIMIT 1",
            [`%${catHandle}%`, `%${catParts[catParts.length - 1]}%`]
          )
          if (catResult.rows.length > 0) {
            await pool.query(`
              INSERT INTO product_category_product (product_id, product_category_id)
              VALUES ($1, $2) ON CONFLICT DO NOTHING
            `, [productId, catResult.rows[0].id])
          }
        }

        results.push({
          index: i,
          productId,
          title,
          status: 'draft',
          imageCount: processedImages.length,
        })
      } catch (err: any) {
        errors.push({
          index: i,
          title: row[fieldMappings.title] || `Row ${i + 1}`,
          error: err.message || 'Processing error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      batchId: uploadBatchId,
      processed: results.length,
      errors: errors.length,
      total: productRows.length,
      results,
      errorDetails: errors,
    })
  } catch (error: any) {
    console.error('Process error:', error)
    return NextResponse.json({ error: error.message || 'Error processing products' }, { status: 500 })
  }
}
