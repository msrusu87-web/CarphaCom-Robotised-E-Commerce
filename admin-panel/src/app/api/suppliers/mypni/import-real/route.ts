import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

/**
 * Real B2B Import from mypni.com API
 * Based on official documentation: https://b2b.mypni.com/help/api/
 * 
 * Features:
 * - Full authentication with token caching
 * - Product list with pagination
 * - Full product details including specifications, images, prices
 * - Local image download
 * - Creates products in Medusa database
 */

const MYPNI_API_BASE = 'https://b2b.mypni.com/api/v1'
const IMAGE_UPLOAD_DIR = '/var/www/carphacom/current/admin-panel/public/uploads/products'

// Database connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'medusa',
  password: 'YOUR_DB_PASSWORD',
  database: 'medusa_store'
})

// Token cache
let cachedToken: { token: string; expiresAt: Date } | null = null

// Credentials (should be in env vars)
const B2B_CREDENTIALS = {
  username: process.env.MYPNI_USERNAME || 'YOUR_PNI_USERNAME',
  password: process.env.MYPNI_PASSWORD || 'YOUR_PNI_PASSWORD'
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const TOKEN_CACHE_FILE = '/tmp/mypni_b2b_token.json'

function loadTokenFromFile(): { token: string; expiresAt: string } | null {
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf8'))
      if (data.token && data.expiresAt) {
        const expires = new Date(data.expiresAt)
        if (new Date() < expires) {
          console.log('[B2B] Using cached token from file')
          return data
        }
      }
    }
  } catch (err) {
    console.error('[B2B] Error reading token cache:', err)
  }
  return null
}

function saveTokenToFile(token: string, expiresAt: Date): void {
  try {
    fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify({
      token,
      expiresAt: expiresAt.toISOString()
    }))
    console.log('[B2B] Token saved to file')
  } catch (err) {
    console.error('[B2B] Error saving token:', err)
  }
}

async function getAuthToken(): Promise<string> {
  // 1. Check memory cache
  if (cachedToken && new Date() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  // 2. Check file cache  
  const fileToken = loadTokenFromFile()
  if (fileToken) {
    cachedToken = {
      token: fileToken.token,
      expiresAt: new Date(fileToken.expiresAt)
    }
    return cachedToken.token
  }

  // 3. Request new token
  console.log('[B2B] Getting new auth token...')
  
  const response = await fetch(`${MYPNI_API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(B2B_CREDENTIALS)
  })

  const data = await response.json()
  
  if (data.status !== 1 || !data.data?.token) {
    throw new Error(data.message || 'B2B Authentication failed')
  }

  // Token valid for 24h, cache for 23h
  const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000)
  cachedToken = {
    token: data.data.token,
    expiresAt
  }
  
  // Save to file
  saveTokenToFile(data.data.token, expiresAt)
  
  console.log('[B2B] Token obtained')
  return cachedToken.token
}

async function fetchProductsList(page: number = 1, size: number = 100): Promise<any> {
  const token = await getAuthToken()
  
  const url = `${MYPNI_API_BASE}/products?locale=ro_RO&page=${page}&size=${size}`
  console.log('[B2B] Fetching products list:', url)
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if (!response.ok) {
    throw new Error(`Products list failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function fetchProductDetails(productId: number): Promise<any> {
  const token = await getAuthToken()
  
  const url = `${MYPNI_API_BASE}/products/${productId}?locale=ro_RO`
  console.log('[B2B] Fetching product details:', productId)
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if (!response.ok) {
    throw new Error(`Product ${productId} fetch failed: ${response.status}`)
  }

  return response.json()
}

async function downloadImage(imageUrl: string, sku: string, index: number): Promise<string | null> {
  try {
    // Ensure upload directory exists
    if (!fs.existsSync(IMAGE_UPLOAD_DIR)) {
      fs.mkdirSync(IMAGE_UPLOAD_DIR, { recursive: true })
    }

    // Extract extension from URL
    const urlPath = new URL(imageUrl).pathname
    const ext = path.extname(urlPath) || '.jpg'
    
    // Create filename: SKU_index.ext
    const filename = `${sku.replace(/[^a-zA-Z0-9]/g, '_')}_${index}${ext}`
    const filepath = path.join(IMAGE_UPLOAD_DIR, filename)
    
    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`[IMG] Already exists: ${filename}`)
      return `/uploads/products/${filename}`
    }

    console.log(`[IMG] Downloading: ${imageUrl} -> ${filename}`)

    // Download with proper HTTPS handling
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filepath)
      
      https.get(imageUrl, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            file.close()
            fs.unlinkSync(filepath)
            resolve(downloadImage(redirectUrl, sku, index))
            return
          }
        }

        if (response.statusCode !== 200) {
          file.close()
          fs.unlinkSync(filepath)
          console.error(`[IMG] Failed to download ${imageUrl}: ${response.statusCode}`)
          resolve(null)
          return
        }

        response.pipe(file)
        
        file.on('finish', () => {
          file.close()
          console.log(`[IMG] Downloaded: ${filename}`)
          resolve(`/uploads/products/${filename}`)
        })
        
        file.on('error', (err) => {
          fs.unlinkSync(filepath)
          console.error(`[IMG] Error writing ${filename}:`, err)
          resolve(null)
        })
      }).on('error', (err) => {
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
        console.error(`[IMG] Download error:`, err)
        resolve(null)
      })
    })
  } catch (error) {
    console.error(`[IMG] Exception downloading image:`, error)
    return null
  }
}

function generateHandle(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100)
}

function extractSpecifications(presentation: string): Record<string, string> {
  const specs: Record<string, string> = {}
  
  if (!presentation) return specs

  // Try to parse HTML table or list format
  // Pattern 1: <tr><td>Key</td><td>Value</td></tr>
  const tableMatches = presentation.matchAll(/<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<\/tr>/gi)
  for (const match of tableMatches) {
    const key = match[1].trim()
    const value = match[2].trim()
    if (key && value) specs[key] = value
  }

  // Pattern 2: <li><strong>Key:</strong> Value</li>
  const listMatches = presentation.matchAll(/<li[^>]*>\s*<strong>([^<:]+):?<\/strong>\s*([^<]+)<\/li>/gi)
  for (const match of listMatches) {
    const key = match[1].trim()
    const value = match[2].trim()
    if (key && value) specs[key] = value
  }

  // Pattern 3: Key: Value in plain text (line by line)
  const lines = presentation.replace(/<[^>]+>/g, '\n').split('\n')
  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0 && colonIndex < 50) {
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      if (key && value && key.length < 50 && !specs[key]) {
        specs[key] = value
      }
    }
  }

  return specs
}

async function createProductInMedusa(productData: any, downloadedImages: string[]): Promise<string> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const variantId = `variant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const moneyAmountId = `ma_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const priceSetId = `pset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    const handle = generateHandle(productData.name)
    const thumbnail = downloadedImages.length > 0 ? downloadedImages[0] : null
    
    // Build specifications from presentation
    const specifications = extractSpecifications(productData.documentation?.presentation || '')
    
    // Build complete metadata
    const metadata = {
      supplier: 'mypni',
      supplier_id: productData.id,
      sku: productData.sku,
      ean: productData.ean,
      manufacturer: productData.manufacturer?.name || null,
      category_b2b: productData.category?.name || null,
      
      // Prices
      rrp_price: productData.price?.retail || 0,
      supplier_price: productData.price?.distribution || 0,
      distribution_price: productData.price?.distribution || 0,
      supplier_price_tiers: productData.price?.discounted ? [
        { min_qty: 3, price: productData.price.discounted['3pcs'] || 0 },
        { min_qty: 5, price: productData.price.discounted['5pcs'] || 0 },
        { min_qty: 10, price: productData.price.discounted['10pcs'] || 0 },
        { min_qty: 20, price: productData.price.discounted['20pcs'] || 0 }
      ].filter(t => t.price > 0) : [],
      
      // Stock
      stock_quantity: productData.stock?.new?.total || 0,
      back_in_stock_date: productData.stock?.new?.backInStockDate || null,
      
      // Documentation
      description_html: productData.documentation?.description || '',
      presentation_html: productData.documentation?.presentation || '',
      specifications: specifications,
      country_of_origin: productData.documentation?.countryOfOrigin || '',
      
      // All images
      images: downloadedImages,
      original_images: productData.documentation?.images || [],
      videos: productData.documentation?.videos || [],
      
      // Warranty
      warranty: productData.warranty ? `${productData.warranty.value} ${productData.warranty.UoM || 'luni'}` : null,
      
      // Measurements
      weight_gross: productData.measurements?.weight?.gross || 0,
      weight_net: productData.measurements?.weight?.net || 0,
      dimensions: productData.measurements?.dimensions || null,
      
      // Import info
      imported_at: new Date().toISOString(),
      import_source: 'b2b.mypni.com'
    }

    // 1. Create product
    await client.query(`
      INSERT INTO product (
        id, title, handle, subtitle, description, is_giftcard, 
        status, thumbnail, weight, discountable, external_id, metadata,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, false, 'published', $6, $7, true, $8, $9, NOW(), NOW())
    `, [
      productId,
      productData.name,
      handle,
      productData.manufacturer?.name || null,
      productData.documentation?.description || productData.name,
      thumbnail,
      Math.round((metadata.weight_gross || 0) * 1000), // kg to grams
      productData.sku,
      JSON.stringify(metadata)
    ])

    // 2. Create product variant
    await client.query(`
      INSERT INTO product_variant (
        id, title, product_id, sku, barcode, ean, inventory_quantity,
        allow_backorder, manage_inventory, variant_rank, metadata,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, true, 0, $8, NOW(), NOW())
    `, [
      variantId,
      'Default',
      productId,
      productData.sku,
      productData.ean,
      productData.ean,
      metadata.stock_quantity,
      JSON.stringify({
        rrp_price: metadata.rrp_price,
        supplier_price: metadata.supplier_price,
        supplier_price_tiers: metadata.supplier_price_tiers
      })
    ])

    // 3. Create price set
    await client.query(`
      INSERT INTO price_set (id, created_at, updated_at)
      VALUES ($1, NOW(), NOW())
    `, [priceSetId])

    // 4. Create price (RRP as customer-facing price)
    const rrpInCents = Math.round((metadata.rrp_price || 0) * 100)
    await client.query(`
      INSERT INTO price (
        id, price_set_id, currency_code, amount, min_quantity, max_quantity,
        created_at, updated_at
      ) VALUES ($1, $2, 'ron', $3, 1, NULL, NOW(), NOW())
    `, [moneyAmountId, priceSetId, rrpInCents])

    // 5. Link variant to price set
    await client.query(`
      INSERT INTO product_variant_price_set (variant_id, price_set_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [variantId, priceSetId])

    // 6. Create product images
    for (let i = 0; i < downloadedImages.length; i++) {
      const imageId = `img_${Date.now()}_${i}`
      await client.query(`
        INSERT INTO image (id, url, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [imageId, downloadedImages[i], JSON.stringify({ rank: i })])
      
      await client.query(`
        INSERT INTO product_image (product_id, image_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [productId, imageId])
    }

    await client.query('COMMIT')
    
    console.log(`[MEDUSA] Created product: ${productId} - ${productData.name}`)
    return productId

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// =============================================================================
// API ENDPOINTS
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'list'
  const page = parseInt(searchParams.get('page') || '1')
  const size = parseInt(searchParams.get('size') || '20')
  const productId = searchParams.get('productId')

  try {
    // List products from B2B
    if (action === 'list') {
      const result = await fetchProductsList(page, size)
      
      if (result.status !== 1) {
        return NextResponse.json({ error: result.message || 'Failed to fetch products' }, { status: 400 })
      }

      const products = result.data?.list || []
      
      return NextResponse.json({
        success: true,
        page,
        size,
        total: result.data?.total || 0,
        products: products.map((p: any) => ({
          id: p.id,
          sku: p.sku,
          ean: p.ean,
          name: p.name,
          manufacturer: p.manufacturer?.name || null,
          category: p.category?.name || null,
          price_distribution: p.price?.distribution || 0,
          price_retail: p.price?.retail || 0,
          stock: p.stock?.new?.total || 0,
          has_images: (p.documentation?.images?.length || 0) > 0
        }))
      })
    }

    // Get single product details
    if (action === 'details' && productId) {
      const result = await fetchProductDetails(parseInt(productId))
      
      if (result.status !== 1) {
        return NextResponse.json({ error: result.message || 'Product not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        product: result.data
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use: list, details' }, { status: 400 })
    
  } catch (error: any) {
    console.error('[B2B Import Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, productIds, page = 1, size = 10 } = body

    // Import specific products by ID
    if (action === 'import' && productIds && Array.isArray(productIds)) {
      const imported: any[] = []
      const errors: any[] = []

      for (const id of productIds.slice(0, 50)) { // Limit to 50 at a time
        try {
          console.log(`\n[IMPORT] Processing product ID: ${id}`)
          
          // 1. Fetch full product details
          const result = await fetchProductDetails(id)
          
          if (result.status !== 1 || !result.data) {
            errors.push({ id, error: 'Product not found in B2B' })
            continue
          }

          const product = result.data
          
          // 2. Download images locally
          const downloadedImages: string[] = []
          const originalImages = product.documentation?.images || []
          
          for (let i = 0; i < originalImages.length && i < 10; i++) {
            const localPath = await downloadImage(originalImages[i], product.sku, i)
            if (localPath) {
              downloadedImages.push(localPath)
            }
          }

          // 3. Create product in Medusa
          const productMedusaId = await createProductInMedusa(product, downloadedImages)

          imported.push({
            b2b_id: id,
            medusa_id: productMedusaId,
            sku: product.sku,
            name: product.name,
            images_downloaded: downloadedImages.length,
            rrp: product.price?.retail || 0,
            supplier: product.price?.distribution || 0,
            stock: product.stock?.new?.total || 0
          })

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200))

        } catch (err: any) {
          console.error(`[IMPORT] Error importing product ${id}:`, err)
          errors.push({ id, error: err.message })
        }
      }

      return NextResponse.json({
        success: true,
        imported_count: imported.length,
        error_count: errors.length,
        imported,
        errors
      })
    }

    // Import from list (fetch page then import)
    if (action === 'import-page') {
      const listResult = await fetchProductsList(page, size)
      
      if (listResult.status !== 1) {
        return NextResponse.json({ error: 'Failed to fetch products list' }, { status: 400 })
      }

      const products = listResult.data?.list || []
      const productIds = products.map((p: any) => p.id)
      
      // Recursively call import
      const importRequest = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ action: 'import', productIds })
      })
      
      return POST(new NextRequest(importRequest.url, {
        method: 'POST',
        body: JSON.stringify({ action: 'import', productIds })
      }))
    }

    // Test authentication
    if (action === 'test-auth') {
      const token = await getAuthToken()
      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        token_preview: token.substring(0, 20) + '...'
      })
    }

    return NextResponse.json({ 
      error: 'Invalid action',
      available_actions: ['import', 'import-page', 'test-auth']
    }, { status: 400 })

  } catch (error: any) {
    console.error('[B2B Import Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
