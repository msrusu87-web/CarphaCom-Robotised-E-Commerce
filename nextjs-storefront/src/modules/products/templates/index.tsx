import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <div className="bg-dark-900 min-h-screen">
      {/* Main Product Section - Compact Professional Layout */}
      <div className="content-container py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          
          {/* Left Column - Image Gallery (responsive) */}
          <div className="lg:col-span-5 xl:col-span-5">
            <div className="lg:sticky lg:top-20">
              <ImageGallery images={images} thumbnail={product.thumbnail} />
            </div>
          </div>
          
          {/* Right Column - Product Info + Actions */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4">
            {/* Product Title, Brand, Description */}
            <ProductInfo product={product} />
            
            {/* Product Actions - Price & Add to Cart */}
            <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
              <ProductOnboardingCta />
              <Suspense
                fallback={
                  <ProductActions
                    disabled={true}
                    product={product}
                    region={region}
                  />
                }
              >
                <ProductActionsWrapper id={product.id} region={region} />
              </Suspense>
            </div>
            
            {/* Quick Specs - Horizontal Pills (GMC fields) */}
            <QuickSpecs product={product} />
          </div>
        </div>
      </div>
      
      {/* Product Tabs Section - Below main content */}
      <div className="content-container pb-8">
        <ProductTabs product={product} />
      </div>
      
      {/* Related Products */}
      <div className="content-container my-8 md:my-12" data-testid="related-products-container">
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </div>
  )
}

// Quick Specs Component - Horizontal pills with GMC data
const QuickSpecs = ({ product }: { product: HttpTypes.StoreProduct }) => {
  const metadata = product.metadata as Record<string, any> | null
  const variant = product.variants?.[0]
  
  // Get stock from metadata (PNI real-time) or fallback to variant inventory
  const stockTotal = metadata?.stock_total
  
  // Extract key specs for quick display
  const specs = [
    { label: 'Brand', value: metadata?.manufacturer || metadata?.brand, icon: '🏷️' },
    { label: 'Condition', value: getConditionLabel(metadata?.condition), icon: '✨' },
    { label: 'Stock', value: getStockLabel(variant, stockTotal), icon: '📦' },
    { label: 'Material', value: metadata?.material, icon: '🧵' },
    { label: 'Weight', value: metadata?.weight ? `${metadata.weight} kg` : null, icon: '⚖️' },
    { label: 'SKU', value: variant?.sku || metadata?.sku || metadata?.pni_sku, icon: '🔢' },
    { label: 'EAN', value: metadata?.ean || metadata?.pni_ean, icon: '📊' },
  ].filter(s => s.value)
  
  if (specs.length === 0) return null
  
  return (
    <div className="flex flex-wrap gap-2">
      {specs.map((spec, i) => (
        <div 
          key={i}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 border border-dark-700 rounded-full text-sm"
        >
          <span>{spec.icon}</span>
          <span className="text-dark-400">{spec.label}:</span>
          <span className="text-white font-medium">{spec.value}</span>
        </div>
      ))}
    </div>
  )
}

// Helper functions
const getConditionLabel = (condition: string | null | undefined) => {
  if (!condition) return null
  const labels: Record<string, string> = {
    'new': 'New',
    'refurbished': 'Refurbished', 
    'used': 'Used'
  }
  return labels[condition] || condition
}

const getStockLabel = (variant: HttpTypes.StoreProductVariant | undefined, metadataStock?: number) => {
  // Priority: PNI real-time stock from metadata > variant inventory
  const qty = metadataStock !== undefined ? metadataStock : (variant?.inventory_quantity || 0)
  
  if (!variant && metadataStock === undefined) return null
  if (!variant?.manage_inventory && metadataStock === undefined) return 'In Stock'
  
  if (qty > 5) return `${qty} pcs.`
  if (qty > 0) return `Last ${qty} pcs.`
  return 'Out of Stock'
}

export default ProductTemplate
