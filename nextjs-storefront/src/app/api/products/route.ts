import { NextResponse, NextRequest } from "next/server"
import { listProducts } from "@lib/data/products"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get("limit") || "100")
  const countryCode = searchParams.get("countryCode") || "ro"
  const q = searchParams.get("q") || ""
  
  try {
    const { response } = await listProducts({
      pageParam: 1,
      queryParams: { limit },
      countryCode,
    })
    
    // Map to simple product objects for search
    let products = response.products.map(p => ({
      id: p.id,
      title: p.title || "",
      handle: p.handle || "",
      thumbnail: p.thumbnail,
      subtitle: p.subtitle
    }))
    
    // If query provided, filter
    if (q.trim()) {
      const searchTerms = q.toLowerCase().trim().split(/\s+/)
      products = products.filter(product => {
        const title = product.title.toLowerCase()
        return searchTerms.every(term => title.includes(term))
      })
    }
    
    return NextResponse.json({ products, count: products.length })
  } catch (error) {
    console.error("Error fetching products for search:", error)
    return NextResponse.json({ products: [], count: 0, error: "Failed to fetch products" }, { status: 500 })
  }
}
