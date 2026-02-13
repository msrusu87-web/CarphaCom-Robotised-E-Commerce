import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'medusa_store',
  user: process.env.DB_USER || 'medusa',
  password: process.env.DB_PASSWORD || 'YOUR_DB_PASSWORD',
  max: 5,
});

const B2B_COOKIES = 'PHPSESSID=fa2aa48c17ced6adbe7fa48bab4c0d64; b2b_session=a4b8c9d2e1f3g5h7i9j0k2l4m6n8o0p1q3r5s7t9u1v3w5x7y9z1';

// Download image to local server
async function downloadImageToLocal(imageUrl: string, productSku: string, index: number): Promise<string | null> {
  const uploadDir = '/var/www/carphacom/shared/uploads/products';
  
  try {
    // Create directory if not exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Generate filename
    const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
    const filename = `${productSku.replace(/[^a-zA-Z0-9]/g, '-')}_${index}${ext}`;
    const filepath = path.join(uploadDir, filename);
    
    // Check if already exists
    if (fs.existsSync(filepath)) {
      return `/uploads/products/${filename}`;
    }
    
    // Download image
    return new Promise((resolve) => {
      const file = fs.createWriteStream(filepath);
      https.get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(filepath);
          resolve(null);
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(`/uploads/products/${filename}`);
        });
      }).on('error', () => {
        file.close();
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        resolve(null);
      });
    });
  } catch {
    return null;
  }
}

// Fetch product details from B2B
async function fetchB2BProductDetails(productId: string): Promise<{
  price: number;
  stock: number;
  rrp: number;
  tieredPrices?: Array<{ min: number; max: number | null; price: number }>;
} | null> {
  try {
    const res = await fetch(`https://b2b.mo.ro/api/product/${productId}`, {
      headers: { 'Cookie': B2B_COOKIES }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    return {
      price: parseFloat(data.distribution_price || data.price || 0),
      stock: parseInt(data.stock || data.stock_total || 0),
      rrp: parseFloat(data.rrp_price || data.rrp || 0),
      tieredPrices: data.tiered_prices || data.quantity_prices
    };
  } catch {
    // Try scraping if API fails
    try {
      const pageRes = await fetch(`https://b2b.mo.ro/produs/${productId}`, {
        headers: { 'Cookie': B2B_COOKIES }
      });
      const html = await pageRes.text();
      
      // Parse price from HTML
      const priceMatch = html.match(/pret[^>]*>[\s]*([0-9.,]+)/i);
      const stockMatch = html.match(/stoc[^>]*>[\s]*([0-9]+)/i);
      
      return {
        price: priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0,
        stock: stockMatch ? parseInt(stockMatch[1]) : 0,
        rrp: 0
      };
    } catch {
      return null;
    }
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const body = await request.json();
    const { action, productIds } = body;
    
    if (action === 'sync-all' || action === 'sync-prices-stock') {
      // Get all products with B2B source
      const productsRes = await client.query(`
        SELECT 
          p.id, 
          p.title, 
          v.sku,
          v.id as variant_id,
          p.metadata->>'b2b_id' as b2b_id,
          p.metadata->>'distribution_price' as current_dist_price,
          p.metadata->>'rrp_price' as current_rrp,
          il.stocked_quantity as current_stock
        FROM product p
        LEFT JOIN product_variant v ON v.product_id = p.id
        LEFT JOIN inventory_item ii ON ii.sku = v.sku
        LEFT JOIN inventory_level il ON il.inventory_item_id = ii.id
        WHERE p.metadata->>'b2b_id' IS NOT NULL
        ${productIds ? 'AND p.id = ANY($1)' : ''}
      `, productIds ? [productIds] : []);
      
      const results = {
        synced: 0,
        failed: 0,
        updated_prices: 0,
        updated_stock: 0,
        details: [] as Array<{ sku: string; status: string; changes?: string[] }>
      };
      
      for (const product of productsRes.rows) {
        const b2bData = await fetchB2BProductDetails(product.b2b_id);
        
        if (!b2bData) {
          results.failed++;
          results.details.push({ sku: product.sku, status: 'failed', changes: ['B2B fetch failed'] });
          continue;
        }
        
        const changes: string[] = [];
        
        // Update prices if changed
        const currentDist = parseFloat(product.current_dist_price || '0');
        const currentRrp = parseFloat(product.current_rrp || '0');
        
        if (Math.abs(currentDist - b2bData.price) > 0.01 || Math.abs(currentRrp - b2bData.rrp) > 0.01) {
          await client.query(`
            UPDATE product 
            SET metadata = metadata || $1::jsonb
            WHERE id = $2
          `, [JSON.stringify({
            distribution_price: b2bData.price,
            rrp_price: b2bData.rrp,
            last_price_sync: new Date().toISOString()
          }), product.id]);
          
          changes.push(`Price: ${currentDist} → ${b2bData.price}`);
          changes.push(`RRP: ${currentRrp} → ${b2bData.rrp}`);
          results.updated_prices++;
        }
        
        // Update stock if changed
        const currentStock = parseInt(product.current_stock || '0');
        if (currentStock !== b2bData.stock) {
          // Update inventory level
          await client.query(`
            UPDATE inventory_level il
            SET stocked_quantity = $1
            FROM inventory_item ii
            WHERE il.inventory_item_id = ii.id
            AND ii.sku = $2
          `, [b2bData.stock, product.sku]);
          
          // Also update metadata
          await client.query(`
            UPDATE product 
            SET metadata = metadata || $1::jsonb
            WHERE id = $2
          `, [JSON.stringify({
            stock_total: b2bData.stock,
            last_stock_sync: new Date().toISOString()
          }), product.id]);
          
          changes.push(`Stock: ${currentStock} → ${b2bData.stock}`);
          results.updated_stock++;
        }
        
        results.synced++;
        results.details.push({ 
          sku: product.sku, 
          status: changes.length > 0 ? 'updated' : 'unchanged',
          changes 
        });
      }
      
      return NextResponse.json({
        success: true,
        action: 'sync-prices-stock',
        timestamp: new Date().toISOString(),
        ...results
      });
    }
    
    if (action === 'download-images') {
      // Download images locally for products with CDN URLs
      const imagesRes = await client.query(`
        SELECT 
          i.id,
          i.url,
          p.id as product_id,
          v.sku
        FROM image i
        JOIN product p ON p.id = (
          SELECT product_id FROM product_variant WHERE id = ANY(
            SELECT variant_id FROM product_variant_image WHERE image_id = i.id
          ) LIMIT 1
        )
        LEFT JOIN product_variant v ON v.product_id = p.id
        WHERE i.url LIKE 'https://cdn.%'
        OR i.url LIKE 'http://cdn.%'
        LIMIT 100
      `);
      
      const results = { downloaded: 0, failed: 0, skipped: 0 };
      
      for (let idx = 0; idx < imagesRes.rows.length; idx++) {
        const img = imagesRes.rows[idx];
        const localPath = await downloadImageToLocal(img.url, img.sku || 'product', idx);
        
        if (localPath) {
          // Update image URL in database
          await client.query(`UPDATE image SET url = $1 WHERE id = $2`, [localPath, img.id]);
          results.downloaded++;
        } else {
          results.failed++;
        }
      }
      
      return NextResponse.json({
        success: true,
        action: 'download-images',
        ...results
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error: unknown) {
    console.error('Sync error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET() {
  // Return sync status and last sync times
  const client = await pool.connect();
  
  try {
    const res = await client.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE metadata->>'b2b_id' IS NOT NULL) as b2b_products,
        COUNT(*) FILTER (WHERE metadata->>'last_price_sync' IS NOT NULL) as price_synced,
        COUNT(*) FILTER (WHERE metadata->>'last_stock_sync' IS NOT NULL) as stock_synced,
        MAX(metadata->>'last_price_sync') as last_price_sync,
        MAX(metadata->>'last_stock_sync') as last_stock_sync
      FROM product
    `);
    
    const stats = res.rows[0];
    
    return NextResponse.json({
      success: true,
      stats: {
        total_products: parseInt(stats.total_products),
        b2b_linked_products: parseInt(stats.b2b_products),
        price_synced: parseInt(stats.price_synced),
        stock_synced: parseInt(stats.stock_synced),
        last_price_sync: stats.last_price_sync,
        last_stock_sync: stats.last_stock_sync
      }
    });
  } finally {
    client.release();
  }
}
