import { Metadata } from "next"
// ISR - Revalidate every 300 seconds
export const revalidate = 300

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import BrandsBar from "@modules/home/components/brands-bar"
import LatestProducts from "@modules/home/components/latest-products"
import PromotionProducts from "@modules/home/components/promotion-products"
import BlogSection from "@modules/home/components/blog-section"
import CategoriesSection from "@modules/home/components/categories-section"
import SuperOfertaSection from "@modules/home/components/super-oferta-section"
import BlogGallery from "@modules/home/components/blog-gallery"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"

// Helper: get stock quantity for a product
function getProductStock(product: any): number {
  const metadata = product.metadata as Record<string, any> | null
  const metadataStock = metadata?.stock_total as number | undefined
  const variant = product.variants?.[0]
  return metadataStock !== undefined ? metadataStock : (variant?.inventory_quantity || 0)
}

// Helper: filter to only products that are in stock
function filterInStock(products: any[]): any[] {
  return products.filter(p => getProductStock(p) > 0)
}

export const metadata: Metadata = {
  title: "CarphaCom | CB Radio & Premium Accessories",
  description:
    "Online store specialising in CB radios, antennas, amplifiers and accessories. Top brands: Avanti, PNI, Midland, President. Fast delivery.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  // Fetch latest products (sorted by created_at) - fetch more to filter in-stock
  const { response: latestResponse } = await listProducts({
    pageParam: 1,
    queryParams: {
      limit: 30,
      order: "-created_at",
    },
    countryCode,
  })

  // Only show in-stock products on home page, max 15 for bento grid
  const latestInStock = filterInStock(latestResponse.products).slice(0, 15)

  // Fetch all products for promotions (we'll filter client-side for compare_at_price)
  const { response: allProductsResponse } = await listProducts({
    pageParam: 1,
    queryParams: {
      limit: 50,
    },
    countryCode,
  })

  // Filter for products with sale prices AND in stock
  const promotionProducts = filterInStock(allProductsResponse.products.filter((product) => {
    const variant = product.variants?.[0]
    if (!variant?.calculated_price) return false
    const calcPrice = variant.calculated_price as any
    return calcPrice.original_amount && calcPrice.calculated_amount && 
           calcPrice.original_amount > calcPrice.calculated_amount
  })).slice(0, 4)

  // Fetch super oferta products (products with big discounts or marked special) - only in stock
  const superOfertaProducts = filterInStock(allProductsResponse.products.filter((product) => {
    const variant = product.variants?.[0]
    if (!variant?.calculated_price) return false
    const calcPrice = variant.calculated_price as any
    if (calcPrice.original_amount && calcPrice.calculated_amount) {
      const discount = ((calcPrice.original_amount - calcPrice.calculated_amount) / calcPrice.original_amount) * 100
      return discount >= 10 // Show products with 10%+ discount
    }
    return false
  })).slice(0, 4)

  if (!collections || !region) {
    return null
  }

  return (
    <div className="bg-dark-900">
      <Hero />
      <CategoriesSection />
      <BrandsBar />
      {latestInStock.length > 0 && (
        <LatestProducts products={latestInStock} region={region} />
      )}
      {promotionProducts.length > 0 && (
        <PromotionProducts products={promotionProducts} region={region} />
      )}
      {superOfertaProducts.length > 0 && (
        <SuperOfertaSection products={superOfertaProducts} region={region} />
      )}
      <BlogGallery />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </div>
  )
}
