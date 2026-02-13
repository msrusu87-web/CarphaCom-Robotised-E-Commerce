import { NextRequest, NextResponse } from 'next/server'

/**
 * MyPNI B2B API Integration - Complete Implementation
 * Documentation: https://b2b.mypni.com/help/api/
 * 
 * Endpoints:
 * - POST /api/v1/auth - Get bearer token (valid 24h)
 * - GET /api/v1/products - List products (paginated)
 * - POST /api/v1/products/stock - Get price & stock for multiple products
 * - GET /api/v1/products/{id} - Get FULL product details
 * - GET /api/v1/orders - List orders
 * - POST /api/v1/orders - Place order
 * - GET /api/v1/client/addresses - Get delivery addresses
 */

const MYPNI_API_BASE = 'https://b2b.mypni.com/api/v1'

// Rate limits: 120 requests/minute, 5/minute for auth

interface MyPNICredentials {
  username: string
  password: string
}

interface MyPNIToken {
  token: string
  expires_at: string
}

// Token cache to avoid rate limiting
let cachedToken: MyPNIToken | null = null
let tokenCredentials: string | null = null

async function getAuthToken(credentials: MyPNICredentials): Promise<string> {
  const credHash = `${credentials.username}:${credentials.password}`
  
  // Check if we have a valid cached token
  if (cachedToken && tokenCredentials === credHash) {
    const expiresAt = new Date(cachedToken.expires_at)
    const now = new Date()
    // Refresh if less than 1 hour remaining
    if (expiresAt.getTime() - now.getTime() > 3600000) {
      return cachedToken.token
    }
  }
  
  // Get new token
  const response = await fetch(`${MYPNI_API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  })
  
  const data = await response.json()
  
  if (data.status !== 1) {
    throw new Error(data.message || 'Authentication failed')
  }
  
  cachedToken = data.data
  tokenCredentials = credHash
  
  return data.data.token
}

// Transform product to our complete format
interface FullProduct {
  // Basic info
  id: number
  sku: string
  ean: string
  name: string
  
  // Manufacturer & Category
  manufacturer: { id: number; name: string } | null
  category: { id: number; name: string } | null
  
  // Warranty
  warranty: { value: number; unit: string } | null
  
  // Stock
  stock: {
    new: { total: number; backInStockDate: string | null }
    refurbished: number
    uom: string
  }
  
  // Price
  price: {
    distribution: number
    retail: number
    currency: string
    refurbished?: number
    discounted?: {
      '3pcs'?: number
      '5pcs'?: number
      '10pcs'?: number
      '20pcs'?: number
      '50pcs'?: number
      '100pcs'?: number
      promo?: number
    }
  }
  
  // Documentation
  documentation: {
    description: string
    presentation: string // HTML with technical details
    countryOfOrigin: string
    images: string[]
    videos: { url: string; description: string; language: string[] }[]
    links: { type: string; url: string; lang: string[] }[]
    archive: string | null
  }
  
  // Measurements
  measurements: {
    weight: { gross: number; net: number; uom: string }
    dimensions: {
      product: { length: number; width: number; height: number; uom: string }
      package: { length: number; width: number; height: number; uom: string }
    }
    box?: {
      dimensions: { length: number; width: number; height: number; uom: string }
      units: number
      weight: { value: number; uom: string }
    }
  }
  
  // Related products
  connections: {
    accessories: { id: number; sku: string; ean: string }[]
    similar: { id: number; sku: string; ean: string }[]
  }
}

function transformProduct(apiProduct: any): FullProduct {
  return {
    id: apiProduct.id,
    sku: apiProduct.sku || '',
    ean: apiProduct.ean || '',
    name: apiProduct.name || '',
    
    manufacturer: apiProduct.manufacturer || null,
    category: apiProduct.category || null,
    
    warranty: apiProduct.warranty ? {
      value: apiProduct.warranty.value,
      unit: apiProduct.warranty.UoM || 'month'
    } : null,
    
    stock: {
      new: {
        total: apiProduct.stock?.new?.total || 0,
        backInStockDate: apiProduct.stock?.new?.backInStockDate || null
      },
      refurbished: apiProduct.stock?.refurbished || 0,
      uom: apiProduct.stock?.UoM || 'pcs'
    },
    
    price: {
      distribution: apiProduct.price?.distribution || 0,
      retail: apiProduct.price?.retail || 0,
      currency: apiProduct.price?.currency || 'RON',
      refurbished: apiProduct.price?.refurbished,
      discounted: apiProduct.price?.discounted
    },
    
    documentation: {
      description: apiProduct.documentation?.description || '',
      presentation: apiProduct.documentation?.presentation || '',
      countryOfOrigin: apiProduct.documentation?.countryOfOrigin || '',
      images: apiProduct.documentation?.images || [],
      videos: apiProduct.documentation?.videos || [],
      links: apiProduct.documentation?.links || [],
      archive: apiProduct.documentation?.archive || null
    },
    
    measurements: {
      weight: {
        gross: apiProduct.measurements?.weight?.gross || 0,
        net: apiProduct.measurements?.weight?.net || 0,
        uom: apiProduct.measurements?.weight?.UoM || 'kg'
      },
      dimensions: {
        product: {
          length: apiProduct.measurements?.dimensions?.product?.length || 0,
          width: apiProduct.measurements?.dimensions?.product?.width || 0,
          height: apiProduct.measurements?.dimensions?.product?.height || 0,
          uom: apiProduct.measurements?.dimensions?.product?.UoM || 'cm'
        },
        package: {
          length: apiProduct.measurements?.dimensions?.package?.length || 0,
          width: apiProduct.measurements?.dimensions?.package?.width || 0,
          height: apiProduct.measurements?.dimensions?.package?.height || 0,
          uom: apiProduct.measurements?.dimensions?.package?.UoM || 'cm'
        }
      },
      box: apiProduct.measurements?.box ? {
        dimensions: {
          length: apiProduct.measurements.box.dimensions?.length || 0,
          width: apiProduct.measurements.box.dimensions?.width || 0,
          height: apiProduct.measurements.box.dimensions?.height || 0,
          uom: apiProduct.measurements.box.dimensions?.UoM || 'cm'
        },
        units: apiProduct.measurements.box.units || 0,
        weight: {
          value: apiProduct.measurements.box.weight?.value || 0,
          uom: apiProduct.measurements.box.weight?.UoM || 'kg'
        }
      } : undefined
    },
    
    connections: {
      accessories: apiProduct.connections?.accessories || [],
      similar: apiProduct.connections?.similar || []
    }
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, credentials, ...params } = body
    
    if (!credentials?.username || !credentials?.password) {
      return NextResponse.json({ 
        error: 'Missing credentials',
        hint: 'Provide username and password from b2b.mo.ro or b2b.mypni.com'
      }, { status: 400 })
    }
    
    // Get auth token
    let token: string
    try {
      token = await getAuthToken(credentials)
    } catch (error: any) {
      return NextResponse.json({ 
        error: 'Authentication failed',
        message: error.message,
        hint: 'Check your b2b.mo.ro username and password'
      }, { status: 401 })
    }
    
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
    
    switch (action) {
      case 'test': {
        // Test connection by fetching addresses
        const res = await fetch(`${MYPNI_API_BASE}/client/addresses`, {
          headers: authHeaders
        })
        const data = await res.json()
        return NextResponse.json({ 
          success: data.status === 1,
          message: data.status === 1 ? 'Conectat cu succes la MyPNI B2B!' : data.message,
          addresses: data.data?.addresses || []
        })
      }
      
      case 'products': {
        // List products with pagination
        const { page = 1, size = 25, category_id, manufacturer_id, in_promo, sort = 'newest' } = params
        const queryParams = new URLSearchParams({
          locale: 'ro_RO',
          page: String(page),
          size: String(size),
          sort
        })
        if (category_id) queryParams.append('category_id', String(category_id))
        if (manufacturer_id) queryParams.append('manufacturer_id', String(manufacturer_id))
        if (in_promo !== undefined) queryParams.append('in_promo', String(in_promo))
        
        const res = await fetch(`${MYPNI_API_BASE}/products?${queryParams}`, {
          headers: authHeaders
        })
        const data = await res.json()
        
        if (data.status !== 1) {
          return NextResponse.json({ error: data.message }, { status: 400 })
        }
        
        return NextResponse.json({
          products: data.data.products,
          pagination: data.data.pagination
        })
      }
      
      case 'product-details': {
        // Get FULL detailed product info with ALL fields
        const { productId } = params
        if (!productId) {
          return NextResponse.json({ error: 'productId required' }, { status: 400 })
        }
        
        const res = await fetch(`${MYPNI_API_BASE}/products/${productId}?locale=ro_RO`, {
          headers: authHeaders
        })
        const data = await res.json()
        
        if (data.status !== 1) {
          return NextResponse.json({ error: data.message }, { status: 400 })
        }
        
        // Transform to our complete format
        const fullProduct = transformProduct(data.data.product)
        
        return NextResponse.json({ 
          product: fullProduct,
          raw: data.data.product // Also return raw for debugging
        })
      }
      
      case 'products-batch-details': {
        // Get details for multiple products (for sample extraction)
        const { productIds } = params
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
          return NextResponse.json({ error: 'productIds array required (max 20)' }, { status: 400 })
        }
        
        const products: FullProduct[] = []
        const errors: any[] = []
        
        for (const productId of productIds.slice(0, 20)) {
          try {
            const res = await fetch(`${MYPNI_API_BASE}/products/${productId}?locale=ro_RO`, {
              headers: authHeaders
            })
            const data = await res.json()
            
            if (data.status === 1) {
              products.push(transformProduct(data.data.product))
            } else {
              errors.push({ id: productId, error: data.message })
            }
          } catch (err: any) {
            errors.push({ id: productId, error: err.message })
          }
          
          // Small delay to avoid rate limiting
          await new Promise(r => setTimeout(r, 100))
        }
        
        return NextResponse.json({ products, errors })
      }
      
      case 'stock': {
        // Get stock & price for multiple products
        const { identifierType = 'ean', values } = params
        if (!values || !Array.isArray(values) || values.length === 0) {
          return NextResponse.json({ error: 'values array required (max 50)' }, { status: 400 })
        }
        
        const res = await fetch(`${MYPNI_API_BASE}/products/stock`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ identifierType, values })
        })
        const data = await res.json()
        
        if (data.status !== 1) {
          return NextResponse.json({ error: data.message }, { status: 400 })
        }
        
        return NextResponse.json({ products: data.data })
      }
      
      case 'addresses': {
        // Get delivery addresses
        const res = await fetch(`${MYPNI_API_BASE}/client/addresses`, {
          headers: authHeaders
        })
        const data = await res.json()
        
        if (data.status !== 1) {
          return NextResponse.json({ error: data.message }, { status: 400 })
        }
        
        return NextResponse.json({ addresses: data.data.addresses })
      }
      
      case 'orders': {
        // List orders
        const { status, address_id, date_from, date_to, page = 1, size = 25 } = params
        const queryParams = new URLSearchParams({
          locale: 'ro_RO',
          page: String(page),
          size: String(size)
        })
        if (status) queryParams.append('status', status)
        if (address_id) queryParams.append('address_id', String(address_id))
        if (date_from) queryParams.append('date_created_from', date_from)
        if (date_to) queryParams.append('date_created_to', date_to)
        
        const res = await fetch(`${MYPNI_API_BASE}/orders?${queryParams}`, {
          headers: authHeaders
        })
        const data = await res.json()
        
        if (data.status !== 1) {
          return NextResponse.json({ error: data.message }, { status: 400 })
        }
        
        return NextResponse.json({
          orders: data.data.orders,
          pagination: data.data.pagination
        })
      }
      
      case 'place-order': {
        // Place a new order
        const { clientOrderNumber, addressId, items, comments, deliveryWindow } = params
        
        if (!addressId || !items || !Array.isArray(items) || items.length === 0) {
          return NextResponse.json({ 
            error: 'addressId and items array required',
            hint: 'Use action=addresses to get valid addressId values'
          }, { status: 400 })
        }
        
        const orderData: any = {
          delivery: { addressId },
          items: items.map((item: any) => ({
            identifierType: item.identifierType || 'ean',
            identifier: item.identifier,
            quantity: item.quantity,
            condition: item.condition || 'new'
          }))
        }
        
        if (clientOrderNumber) orderData.clientOrderNumber = clientOrderNumber
        if (comments) orderData.comments = comments
        if (deliveryWindow) {
          orderData.delivery.window = deliveryWindow
        }
        
        const res = await fetch(`${MYPNI_API_BASE}/orders`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(orderData)
        })
        const data = await res.json()
        
        if (data.status !== 1) {
          return NextResponse.json({ error: data.message }, { status: 400 })
        }
        
        return NextResponse.json({ 
          success: true,
          orderId: data.data.orderId,
          message: 'Order placed successfully'
        })
      }
      
      case 'import-products': {
        // Import products to Medusa with ALL fields preserved
        const { productIds, markup = 30 } = params
        
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
          return NextResponse.json({ error: 'productIds array required' }, { status: 400 })
        }
        
        const imported = []
        const errors = []
        
        for (const productId of productIds.slice(0, 20)) {
          try {
            const res = await fetch(`${MYPNI_API_BASE}/products/${productId}?locale=ro_RO`, {
              headers: authHeaders
            })
            const data = await res.json()
            
            if (data.status !== 1) {
              errors.push({ id: productId, error: data.message })
              continue
            }
            
            const product = transformProduct(data.data.product)
            
            // Calculate price with markup
            const basePrice = product.price.distribution || 0
            const finalPrice = Math.round(basePrice * (1 + markup / 100) * 100) // Convert to cents
            
            // Prepare Medusa product data with ALL fields
            const medusaProduct = {
              title: product.name,
              subtitle: product.category?.name || '',
              description: product.documentation.description,
              handle: product.sku.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              status: 'published',
              thumbnail: product.documentation.images[0] || null,
              images: product.documentation.images.map((url: string) => ({ url })),
              
              // All metadata
              metadata: {
                source: 'mypni',
                mypni_id: product.id,
                mypni_sku: product.sku,
                mypni_ean: product.ean,
                
                // Manufacturer info
                manufacturer: product.manufacturer?.name || '',
                manufacturer_id: product.manufacturer?.id || null,
                
                // Category info  
                category: product.category?.name || '',
                category_id: product.category?.id || null,
                
                // Warranty
                warranty_months: product.warranty?.value || 0,
                warranty_unit: product.warranty?.unit || 'month',
                
                // Country of origin
                country_of_origin: product.documentation.countryOfOrigin,
                
                // Technical presentation (HTML)
                presentation_html: product.documentation.presentation,
                
                // Videos
                videos: product.documentation.videos,
                
                // Documentation links
                documentation_links: product.documentation.links,
                archive_url: product.documentation.archive,
                
                // All images URLs
                all_images: product.documentation.images,
                
                // Related products
                accessories: product.connections.accessories,
                similar_products: product.connections.similar,
                
                // Import info
                import_date: new Date().toISOString(),
                original_price_distribution: product.price.distribution,
                original_price_retail: product.price.retail,
                applied_markup: markup
              },
              
              // Variant with complete info
              variants: [{
                title: 'Default',
                sku: product.sku,
                barcode: product.ean,
                inventory_quantity: product.stock.new.total,
                prices: [{
                  amount: finalPrice,
                  currency_code: 'ron'
                }]
              }],
              
              // Physical attributes
              weight: product.measurements.weight.gross ? 
                Math.round(product.measurements.weight.gross * 1000) : undefined,
              length: product.measurements.dimensions.product.length ? 
                Math.round(product.measurements.dimensions.product.length * 10) : undefined,
              width: product.measurements.dimensions.product.width ? 
                Math.round(product.measurements.dimensions.product.width * 10) : undefined,
              height: product.measurements.dimensions.product.height ? 
                Math.round(product.measurements.dimensions.product.height * 10) : undefined
            }
            
            imported.push({
              mypni_id: product.id,
              sku: product.sku,
              name: product.name,
              prepared: medusaProduct,
              fullProduct: product // Include full product for reference
            })
            
            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 100))
          } catch (err: any) {
            errors.push({ id: productId, error: err.message })
          }
        }
        
        return NextResponse.json({
          imported,
          errors,
          message: `Prepared ${imported.length} products for import, ${errors.length} errors`
        })
      }
      
      default:
        return NextResponse.json({ 
          error: 'Invalid action',
          validActions: [
            'test', 
            'products', 
            'product-details', 
            'products-batch-details',
            'stock', 
            'addresses', 
            'orders', 
            'place-order', 
            'import-products'
          ]
        }, { status: 400 })
    }
  } catch (error: any) {
    console.error('MyPNI API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 })
  }
}

// GET endpoint for info
export async function GET() {
  return NextResponse.json({
    name: 'MyPNI B2B API Integration - Complete',
    documentation: 'https://b2b.mypni.com/help/api/',
    login_portal: 'https://b2b.mo.ro/products/home',
    endpoints: {
      test: 'POST with credentials to test connection',
      products: 'List products with pagination',
      'product-details': 'Get FULL product details (all fields)',
      'products-batch-details': 'Get details for multiple products',
      stock: 'Get stock & price for multiple products by EAN/SKU',
      addresses: 'Get your delivery addresses',
      orders: 'List your orders',
      'place-order': 'Place a new order',
      'import-products': 'Prepare products for Medusa import'
    },
    product_fields: [
      'id', 'sku', 'ean', 'name',
      'manufacturer (id, name)',
      'category (id, name)',
      'warranty (value, unit)',
      'stock (new.total, refurbished, backInStockDate)',
      'price (distribution, retail, discounted)',
      'documentation.description',
      'documentation.presentation (HTML technical specs)',
      'documentation.images[]',
      'documentation.videos[]',
      'documentation.links[] (userManual, warranty, software)',
      'documentation.archive (ZIP with all resources)',
      'documentation.countryOfOrigin',
      'measurements.weight (gross, net)',
      'measurements.dimensions.product',
      'measurements.dimensions.package',
      'measurements.box (bulk info)',
      'connections.accessories[]',
      'connections.similar[]'
    ],
    rate_limits: {
      general: '120 requests/minute',
      auth: '5 requests/minute'
    },
    example_request: {
      action: 'product-details',
      credentials: {
        username: 'your_b2b_username',
        password: 'your_b2b_password'
      },
      productId: 8020
    }
  })
}
