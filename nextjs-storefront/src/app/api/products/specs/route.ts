import { NextResponse, NextRequest } from "next/server"
import { Pool } from "pg"

// Database connection
const pool = new Pool({
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  database: process.env.DATABASE_NAME || "medusa_store",
  user: process.env.DATABASE_USER || "medusa",
  password: process.env.DATABASE_PASSWORD || "YOUR_DB_PASSWORD",
})

type SpecItem = {
  label: string
  value: string
  section?: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const productId = searchParams.get("id")
  const handle = searchParams.get("handle")
  
  if (!productId && !handle) {
    return NextResponse.json({ error: "Product ID or handle required" }, { status: 400 })
  }
  
  try {
    const client = await pool.connect()
    
    const query = productId 
      ? `SELECT id, title, handle, description, metadata FROM product WHERE id = $1`
      : `SELECT id, title, handle, description, metadata FROM product WHERE handle = $1`
    
    const result = await client.query(query, [productId || handle])
    client.release()
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    
    const product = result.rows[0]
    const metadata = product.metadata || {}
    
    // Handle specifications - can be array of {label, value, section} or object
    let specifications: SpecItem[] = []
    if (metadata.specifications) {
      if (Array.isArray(metadata.specifications)) {
        // New format: array of {label, value, section}
        specifications = metadata.specifications
      } else if (typeof metadata.specifications === 'object') {
        // Old format: key-value object
        specifications = Object.entries(metadata.specifications).map(([key, value]) => ({
          label: key,
          value: String(value),
          section: ''
        }))
      }
    }
    
    return NextResponse.json({
      id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.description,
      metadata: metadata,
      specifications: specifications,
      pricing: {
        distribution_price: metadata.distribution_price_ron,
        rrp_price: metadata.rrp_price,
        retail_price: metadata.retail_price_ron,
        cost_price: metadata.cost_price,
      }
    })
  } catch (error) {
    console.error("Error fetching product specs:", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
}
