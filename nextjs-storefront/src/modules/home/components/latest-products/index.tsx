import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

type LatestProductsProps = {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
}

function extractBrand(title: string): string | null {
  const brands = ['Avanti', 'PNI', 'President', 'Midland', 'Albrecht', 'CRT', 'Sirio', 'Megawat', 'Storm', 'Lemm', 'Cobra', 'JOPIX', 'Tacho']
  for (const brand of brands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) return brand
  }
  return null
}

const brandColors: Record<string, string> = {
  'Avanti': 'bg-red-600', 'PNI': 'bg-purple-600', 'President': 'bg-blue-700',
  'Midland': 'bg-green-700', 'Albrecht': 'bg-orange-600', 'CRT': 'bg-lime-700',
  'Sirio': 'bg-cyan-700', 'Megawat': 'bg-red-700', 'Storm': 'bg-sky-700',
  'Lemm': 'bg-amber-700', 'Cobra': 'bg-slate-700', 'JOPIX': 'bg-indigo-600', 'Tacho': 'bg-teal-700',
}

function getStockBadge(product: HttpTypes.StoreProduct): { label: string; color: string } | null {
  const metadata = product.metadata as Record<string, any> | null
  const metadataStock = metadata?.stock_total as number | undefined
  const variant = product.variants?.[0]
  const qty = metadataStock !== undefined ? metadataStock : (variant?.inventory_quantity || 0)
  if (qty === 0) return { label: 'Stoc Epuizat', color: 'bg-red-600' }
  if (qty <= 5) return { label: `Ultimele ${qty} buc`, color: 'bg-orange-500' }
  return { label: `${qty} buc`, color: 'bg-green-600' }
}

/* Featured indices create a diagonal staircase pattern on 6-col desktop */
const FEATURED = new Set([0, 5, 10])

const LatestProducts = ({ products, region }: LatestProductsProps) => {
  if (!products?.length) return null

  const items = products.slice(0, 15)

  return (
    <div className="bg-dark-900 py-6 small:py-8">
      <div className="content-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 small:mb-4">
          <div className="flex items-center gap-2 small:gap-3">
            <span className="w-2 h-2 bg-new rounded-full animate-pulse" />
            <h2 className="text-lg small:text-xl font-bold text-white">Produse Noi</h2>
          </div>
          <LocalizedClientLink
            href="/store?sort=created_at"
            className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1"
          >
            Vezi toate
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </LocalizedClientLink>
        </div>

        {/* Asymmetric Bento Grid — dense flow fills gaps for staircase pattern */}
        <div
          className="grid grid-cols-2 xsmall:grid-cols-3 small:grid-cols-5 large:grid-cols-6 gap-1.5 xsmall:gap-2 small:gap-2.5"
          style={{ gridAutoFlow: 'dense' }}
        >
          {items.map((product, idx) => {
            const featured = FEATURED.has(idx)
            const { cheapestPrice } = getProductPrice({ product })
            const brand = product.subtitle || extractBrand(product.title || '')
            const brandClass = brand ? brandColors[brand] || 'bg-dark-600' : 'bg-dark-600'
            const stockBadge = getStockBadge(product)

            if (featured) {
              /* ═══ FEATURED CARD: col-span-2 × row-span-2 ═══ */
              return (
                <LocalizedClientLink
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="group col-span-2 row-span-2"
                >
                  <div className="h-full flex flex-col bg-dark-800 border border-dark-700 rounded-lg overflow-hidden hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300">
                    <div className="relative">
                      <Thumbnail
                        thumbnail={product.thumbnail}
                        images={product.images}
                        size="full"
                        isFeatured
                        priority={idx === 0}
                      />
                      {brand && (
                        <span className={`absolute top-2 left-2 px-2 py-0.5 ${brandClass} text-white text-[10px] small:text-xs font-bold rounded`}>
                          {brand}
                        </span>
                      )}
                      {stockBadge && (
                        <span className={`absolute top-2 right-2 px-2 py-0.5 ${stockBadge.color} text-white text-[10px] small:text-xs font-bold rounded`}>
                          {stockBadge.label}
                        </span>
                      )}
                      {idx === 0 && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-new text-white text-[10px] small:text-xs font-bold rounded animate-pulse">
                          NOU
                        </span>
                      )}
                    </div>
                    <div className="p-2.5 small:p-3 flex flex-col flex-1">
                      <h3
                        className="text-xs small:text-sm font-medium text-white leading-snug line-clamp-2 group-hover:text-primary-400 transition-colors"
                        title={product.title}
                      >
                        {product.title}
                      </h3>
                      {cheapestPrice && (
                        <div className="mt-auto pt-1.5 flex flex-wrap items-baseline gap-x-1.5">
                          {cheapestPrice.price_type === "sale" && (
                            <span className="line-through text-dark-500 text-[10px] small:text-xs">
                              {cheapestPrice.original_price}
                            </span>
                          )}
                          <span
                            className={`text-sm small:text-base font-bold ${
                              cheapestPrice.price_type === "sale" ? "text-sale" : "text-primary-400"
                            }`}
                          >
                            {cheapestPrice.calculated_price}
                            <span className="text-[10px] small:text-xs font-normal text-dark-400 ml-0.5">
                              +TVA
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </LocalizedClientLink>
              )
            }

            /* ═══ COMPACT CARD: 1×1 dense product tile ═══ */
            return (
              <LocalizedClientLink
                key={product.id}
                href={`/products/${product.handle}`}
                className="group"
              >
                <div className="h-full flex flex-col bg-dark-800 border border-dark-700 rounded-lg overflow-hidden hover:border-primary-500/50 hover:shadow-md hover:shadow-primary-500/10 transition-all duration-200">
                  <div className="relative">
                    <Thumbnail
                      thumbnail={product.thumbnail}
                      images={product.images}
                      size="small"
                    />
                    {brand && (
                      <span className={`absolute top-1 left-1 px-1 py-px ${brandClass} text-white text-[8px] small:text-[10px] font-bold rounded`}>
                        {brand}
                      </span>
                    )}
                    {stockBadge && (
                      <span className={`absolute top-1 right-1 px-1 py-px ${stockBadge.color} text-white text-[8px] small:text-[10px] font-bold rounded`}>
                        {stockBadge.label}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 p-1.5 small:p-2">
                    <h3
                      className="text-[10px] xsmall:text-[11px] small:text-xs font-medium text-white leading-tight line-clamp-2 group-hover:text-primary-400 transition-colors"
                      title={product.title}
                    >
                      {product.title}
                    </h3>
                    {cheapestPrice && (
                      <div className="mt-auto pt-1 flex flex-wrap items-baseline gap-x-1">
                        {cheapestPrice.price_type === "sale" && (
                          <span className="line-through text-dark-500 text-[8px] small:text-[10px]">
                            {cheapestPrice.original_price}
                          </span>
                        )}
                        <span
                          className={`text-[11px] xsmall:text-xs small:text-sm font-bold ${
                            cheapestPrice.price_type === "sale" ? "text-sale" : "text-primary-400"
                          }`}
                        >
                          {cheapestPrice.calculated_price}
                          <span className="text-[8px] small:text-[9px] font-normal text-dark-400 ml-0.5">
                            +TVA
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </LocalizedClientLink>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default LatestProducts
