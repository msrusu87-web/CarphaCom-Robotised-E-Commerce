"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"

type SpecItem = {
  label: string
  value: string
  section?: string
}

type PriceTier = {
  price: number
  currency: string
  min_quantity: number
}

type ProductMetadata = {
  specifications?: SpecItem[]
  video_url?: string
  price_tiers?: PriceTier[]
  rrp_price?: number
  distribution_price?: number
  manufacturer?: string
  warranty?: string
  stock_total?: number
}

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const [activeTab, setActiveTab] = useState(0)
  const [specifications, setSpecifications] = useState<SpecItem[]>([])
  const [metadata, setMetadata] = useState<ProductMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Fetch specifications and metadata from our custom API
  useEffect(() => {
    const fetchSpecs = async () => {
      try {
        const res = await fetch(`/api/products/specs?id=${product.id}`)
        if (res.ok) {
          const data = await res.json()
          // Handle both array format and object format
          if (data.specifications) {
            if (Array.isArray(data.specifications)) {
              setSpecifications(data.specifications)
            } else if (typeof data.specifications === 'object') {
              // Convert object to array format
              const specsArray = Object.entries(data.specifications).map(([key, value]) => ({
                label: key,
                value: String(value),
                section: ''
              }))
              setSpecifications(specsArray)
            }
          }
          if (data.metadata) {
            setMetadata(data.metadata)
          }
        }
      } catch (err) {
        console.error('Error fetching specs:', err)
      } finally {
        setLoading(false)
      }
    }
    
    if (product.id) {
      fetchSpecs()
    }
  }, [product.id])

  const hasSpecs = specifications && specifications.length > 0
  const hasVideo = metadata?.video_url && metadata.video_url.length > 0
  const hasPriceTiers = metadata?.price_tiers && metadata.price_tiers.length > 0
  
  // Build tabs dynamically based on available content
  const tabs = [
    {
      id: 'description',
      label: "📝 Description",
      component: <ProductDescriptionTab product={product} />,
    },
    {
      id: 'specs',
      label: "📋 Specifications",
      component: loading 
        ? <LoadingSpecs />
        : hasSpecs 
          ? <SpecificationsTab specifications={specifications} />
          : <NoSpecsMessage />,
    },
  ]
  
  // Add video tab if video exists
  if (hasVideo) {
    tabs.push({
      id: 'video',
      label: "🎬 Video",
      component: <VideoTab videoUrl={metadata!.video_url!} productTitle={product.title || ''} />,
    })
  }
  
  // Add price tiers tab if tiers exist
  if (hasPriceTiers) {
    tabs.push({
      id: 'pricing',
      label: "💰 Quantity Pricing",
      component: <PriceTiersTab tiers={metadata!.price_tiers!} />,
    })
  }
  
  // Always add shipping tab
  tabs.push({
    id: 'shipping',
    label: "🚚 Shipping",
    component: <ShippingInfoTab />,
  })

  return (
    <div className="w-full bg-dark-800/30 rounded-xl border border-dark-700 overflow-hidden">
      {/* Horizontal Tab Headers */}
      <div className="flex border-b border-dark-700 overflow-x-auto scrollbar-hide">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(i)}
            className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === i
                ? 'bg-primary-500/20 text-primary-400 border-b-2 border-primary-500'
                : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="p-4 md:p-6">
        {tabs[activeTab]?.component}
      </div>
    </div>
  )
}

// Loading state
const LoadingSpecs = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    <span className="ml-3 text-dark-400">Loading specifications...</span>
  </div>
)

// No specs message
const NoSpecsMessage = () => (
  <div className="text-center py-8">
    <p className="text-dark-400 italic">No specifications available for this product.</p>
  </div>
)

// Video Tab - Embed YouTube video
const VideoTab = ({ videoUrl, productTitle }: { videoUrl: string; productTitle: string }) => {
  // Convert YouTube watch URL to embed URL if needed
  let embedUrl = videoUrl
  if (videoUrl.includes('youtube.com/watch')) {
    const videoId = new URL(videoUrl).searchParams.get('v')
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`
    }
  } else if (videoUrl.includes('youtu.be/')) {
    const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0]
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-dark-800/50 rounded-xl overflow-hidden border border-dark-700">
        <div className="bg-gradient-to-r from-red-500/20 to-transparent px-4 py-3 border-b border-dark-700">
          <h4 className="flex items-center gap-2 text-white font-semibold">
            <span className="text-lg">🎬</span>
            Video Presentation
          </h4>
        </div>
        <div className="aspect-video w-full">
          <iframe
            src={embedUrl}
            title={productTitle}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}

// Price Tiers Tab - Volume discounts from PNI B2B
const PriceTiersTab = ({ tiers }: { tiers: PriceTier[] }) => {
  // Sort tiers by min_quantity
  const sortedTiers = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity)
  
  // Calculate savings percentage compared to first tier (highest price)
  const basePrice = sortedTiers[0]?.price || 0
  
  return (
    <div className="space-y-4">
      <div className="bg-dark-800/50 rounded-xl overflow-hidden border border-dark-700">
        <div className="bg-gradient-to-r from-green-500/20 to-transparent px-4 py-3 border-b border-dark-700">
          <h4 className="flex items-center gap-2 text-white font-semibold">
            <span className="text-lg">💰</span>
            Quantity Pricing
            <span className="text-dark-400 text-sm font-normal ml-2">(volume discounts)</span>
          </h4>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sortedTiers.map((tier, index) => {
              const savings = basePrice > 0 ? Math.round(((basePrice - tier.price) / basePrice) * 100) : 0
              const formattedPrice = (tier.price / 100).toFixed(2)
              
              return (
                <div
                  key={tier.min_quantity}
                  className={`relative p-4 rounded-xl border transition-all ${
                    index === sortedTiers.length - 1
                      ? 'bg-green-500/10 border-green-500/50 ring-2 ring-green-500/30'
                      : 'bg-dark-700/30 border-dark-600 hover:border-dark-500'
                  }`}
                >
                  {index === sortedTiers.length - 1 && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">
                      BEST DEAL
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="text-dark-400 text-sm mb-1">
                      Min. {tier.min_quantity} pcs
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {formattedPrice}
                      <span className="text-sm text-dark-400 ml-1">{tier.currency}</span>
                    </div>
                    {savings > 0 && (
                      <div className="text-green-400 text-sm font-medium mt-1">
                        -{savings}% savings
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm flex items-center gap-2">
              <span>💡</span>
              Prices are for B2B customers. For bulk orders, contact us for a personalised quote.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Specifications Tab - Now uses array format with sections
const SpecificationsTab = ({ specifications }: { specifications: SpecItem[] }) => {
  if (!specifications || specifications.length === 0) {
    return <NoSpecsMessage />
  }

  // Group specifications by section
  const groupedSpecs: { [section: string]: SpecItem[] } = {}
  specifications.forEach(spec => {
    const section = spec.section || 'General'
    if (!groupedSpecs[section]) {
      groupedSpecs[section] = []
    }
    groupedSpecs[section].push(spec)
  })

  const sections = Object.keys(groupedSpecs)

  return (
    <div className="space-y-4">
      {sections.map((section, sectionIndex) => (
        <div key={section} className="bg-dark-800/50 rounded-xl overflow-hidden border border-dark-700">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-primary-500/20 to-transparent px-4 py-3 border-b border-dark-700">
            <h4 className="flex items-center gap-2 text-white font-semibold">
              <span className="text-lg">📋</span>
              {section}
              <span className="text-dark-400 text-sm font-normal ml-2">
                ({groupedSpecs[section].length} specifications)
              </span>
            </h4>
          </div>
          
          {/* Specs Grid - 2 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-dark-700">
            <div className="divide-y divide-dark-700/50">
              {groupedSpecs[section].slice(0, Math.ceil(groupedSpecs[section].length / 2)).map((spec, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-2.5 hover:bg-dark-700/30 transition-colors">
                  <span className="text-dark-400 text-sm">{spec.label}</span>
                  <span className="text-white text-sm font-medium text-right max-w-[60%]">{spec.value}</span>
                </div>
              ))}
            </div>
            <div className="divide-y divide-dark-700/50">
              {groupedSpecs[section].slice(Math.ceil(groupedSpecs[section].length / 2)).map((spec, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-2.5 hover:bg-dark-700/30 transition-colors">
                  <span className="text-dark-400 text-sm">{spec.label}</span>
                  <span className="text-white text-sm font-medium text-right max-w-[60%]">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      
      {/* Total specs count */}
      <div className="text-center text-dark-400 text-sm">
        Total: {specifications.length} technical specifications
      </div>
    </div>
  )
}

// Description Tab - Renders HTML description
const ProductDescriptionTab = ({ product }: { product: HttpTypes.StoreProduct }) => {
  const description = product.description
  
  if (!description) {
    return (
      <div className="text-center py-8">
        <p className="text-dark-400 italic">No description available.</p>
      </div>
    )
  }
  
  return (
    <div className="prose prose-invert max-w-none">
      <div dangerouslySetInnerHTML={{ __html: description }} />
    </div>
  )
}

// Shipping Info Tab
const ShippingInfoTab = () => {
  return (
    <div className="space-y-4">
      <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
        <h4 className="flex items-center gap-2 text-white font-semibold mb-3">
          <span>🚚</span> Shipping
        </h4>
        <ul className="space-y-2 text-sm text-dark-300">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Free shipping on orders over €150
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            24-48 hour delivery by courier
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Cash on delivery available
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Showroom pickup available
          </li>
        </ul>
      </div>
      
      <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
        <h4 className="flex items-center gap-2 text-white font-semibold mb-3">
          <span>↩️</span> Returns
        </h4>
        <ul className="space-y-2 text-sm text-dark-300">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Free returns within 14 days
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Manufacturer warranty included
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ProductTabs
