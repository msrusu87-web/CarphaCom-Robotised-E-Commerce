import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

// Helper function to filter products by search query
function filterProductsBySearch(products: any[], query: string) {
  if (!query || query.trim() === "") return products
  
  const searchTerms = query.toLowerCase().trim().split(/\s+/)
  
  return products.filter((product) => {
    const title = (product.title || "").toLowerCase()
    const description = (product.description || "").toLowerCase()
    const handle = (product.handle || "").toLowerCase()
    
    return searchTerms.every(term => 
      title.includes(term) || 
      description.includes(term) || 
      handle.includes(term)
    )
  })
}

// Helper function to filter products by brand (stored in subtitle)
function filterProductsByBrand(products: any[], brand: string) {
  if (!brand || brand.trim() === "") return products
  
  const brandLower = brand.toLowerCase().trim()
  
  return products.filter((product) => {
    const subtitle = (product.subtitle || "").toLowerCase()
    return subtitle === brandLower || subtitle.includes(brandLower)
  })
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  searchQuery,
  brand,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  searchQuery?: string
  brand?: string
}) {
  const queryParams: PaginatedProductsParams = {
    limit: PRODUCT_LIMIT,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Use the optimized listProductsWithSort which now handles pagination properly
  let {
    response: { products, count },
  } = await listProductsWithSort({
    page: page,
    queryParams,
    sortBy: sortBy || "created_at",
    countryCode,
  })

  // Apply search filter if query is provided (for local filtering)
  if (searchQuery) {
    // For search, we need to get more products to filter from
    const searchResult = await listProductsWithSort({
      page: 1,
      queryParams: {
        ...queryParams,
        limit: 100, // Get enough for search
      },
      sortBy: sortBy || "created_at",
      countryCode,
    })
    
    const filteredProducts = filterProductsBySearch(searchResult.response.products, searchQuery)
    count = filteredProducts.length
    
    // Paginate filtered results
    const startIndex = (page - 1) * PRODUCT_LIMIT
    products = filteredProducts.slice(startIndex, startIndex + PRODUCT_LIMIT)
  }

  // Apply brand filter if brand is provided
  if (brand) {
    const brandResult = await listProductsWithSort({
      page: 1,
      queryParams: {
        ...queryParams,
        limit: 200, // Get enough products to filter by brand
      },
      sortBy: sortBy || "created_at",
      countryCode,
    })
    
    const filteredProducts = filterProductsByBrand(brandResult.response.products, brand)
    count = filteredProducts.length
    
    // Paginate filtered results
    const startIndex = (page - 1) * PRODUCT_LIMIT
    products = filteredProducts.slice(startIndex, startIndex + PRODUCT_LIMIT)
  }

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg className="w-16 h-16 text-dark-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-white mb-2">
          {searchQuery || brand ? "No products found" : "No products"}
        </h3>
        <p className="text-dark-400">
          {searchQuery 
            ? `No products found for "${searchQuery}". Try a different search.`
            : brand
              ? `No products found from the brand "${brand}".`
              : "No products available in this category."
          }
        </p>
      </div>
    )
  }

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-4 gap-y-6"
        data-testid="products-list"
      >
        {products.map((p) => {
          return (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
