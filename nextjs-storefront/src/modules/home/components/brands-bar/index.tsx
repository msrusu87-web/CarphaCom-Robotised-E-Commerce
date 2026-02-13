"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { useState } from "react"

// Brands ordered by number of products in store (brands with products first)
const BRANDS = [
  // === Brands WITH products in store (sorted by product count desc) ===
  { name: "PNI", slug: "pni", color: "text-orange-500", hasProducts: true },
  { name: "President", slug: "president", color: "text-blue-400", hasProducts: true },
  { name: "Midland", slug: "midland", color: "text-green-500", hasProducts: true },
  { name: "SilverCloud", slug: "silvercloud", color: "text-gray-400", hasProducts: true },
  { name: "CRT", slug: "crt", color: "text-purple-500", hasProducts: true },
  { name: "Dynascan", slug: "dynascan", color: "text-sky-500", hasProducts: true },
  { name: "TTi", slug: "tti", color: "text-cyan-400", hasProducts: true },
  { name: "Motorola", slug: "motorola", color: "text-blue-500", hasProducts: true },
  { name: "Jopix", slug: "jopix", color: "text-rose-400", hasProducts: true },
  { name: "Alinco", slug: "alinco", color: "text-teal-500", hasProducts: true },
  { name: "Sirio", slug: "sirio", color: "text-teal-400", hasProducts: true },
  { name: "Uniden", slug: "uniden", color: "text-red-400", hasProducts: true },
  { name: "Beko", slug: "beko", color: "text-emerald-500", hasProducts: true },
  { name: "Duracell", slug: "duracell", color: "text-amber-500", hasProducts: true },
  { name: "RigExpert", slug: "rigexpert", color: "text-indigo-400", hasProducts: true },
  { name: "Albrecht", slug: "albrecht", color: "text-yellow-500", hasProducts: true },
  { name: "Lemm", slug: "lemm", color: "text-lime-500", hasProducts: true },
  { name: "DECROSS", slug: "decross", color: "text-violet-400", hasProducts: true },
  { name: "ADVITI", slug: "adviti", color: "text-pink-400", hasProducts: true },
  { name: "Stabo", slug: "stabo", color: "text-slate-400", hasProducts: true },
  { name: "ORNO", slug: "orno", color: "text-fuchsia-400", hasProducts: true },
  { name: "Yaesu", slug: "yaesu", color: "text-blue-300", hasProducts: true },
  { name: "Anytone", slug: "anytone", color: "text-red-500", hasProducts: true },
  { name: "Baofeng", slug: "baofeng", color: "text-orange-400", hasProducts: true },
  // === Brands without products (partner brands) ===
  { name: "Cobra", slug: "cobra", color: "text-yellow-500", hasProducts: false },
  { name: "Kenwood", slug: "kenwood", color: "text-emerald-500", hasProducts: false },
  { name: "Avanti", slug: "avanti", color: "text-red-500", hasProducts: false },
  { name: "Megawat", slug: "megawat", color: "text-pink-500", hasProducts: false },
  { name: "Storm", slug: "storm", color: "text-indigo-400", hasProducts: false },
]

const TOTAL_BRANDS = BRANDS.length

const BrandCard = ({ brand }: { brand: typeof BRANDS[0] }) => {
  const [imageError, setImageError] = useState(false)
  // PNI has a real PNG logo, others use generated SVG
  const logoSrc = brand.slug === 'pni' ? `/brands/pni.png` : `/brands/${brand.slug}.svg`
  
  return (
    <LocalizedClientLink
      href={`/store?brand=${brand.name}`}
      className="flex-shrink-0 group"
    >
      <div className={`w-28 h-16 small:w-full small:h-20 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm border ${brand.hasProducts ? 'border-dark-600' : 'border-dark-700/50'} group-hover:border-primary-500 group-hover:shadow-lg group-hover:shadow-primary-500/10 transition-all duration-300 flex items-center justify-center p-3`}>
        {!imageError ? (
          <Image
            src={logoSrc}
            alt={brand.name}
            width={100}
            height={50}
            className={`object-contain max-h-12 ${brand.hasProducts ? 'opacity-80' : 'opacity-50'} group-hover:opacity-100 group-hover:scale-105 transition-all duration-300`}
            onError={() => setImageError(true)}
          />
        ) : (
          <span className={`text-base font-bold ${brand.color} ${brand.hasProducts ? '' : 'opacity-50'} group-hover:opacity-100 group-hover:scale-110 transition-all`}>
            {brand.name}
          </span>
        )}
      </div>
    </LocalizedClientLink>
  )
}

const BrandsBar = () => {
  return (
    <div className="bg-gradient-to-b from-dark-800/80 to-dark-900/50 border-y border-dark-700/50 py-8">
      <div className="content-container">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
              <span className="w-1 h-3 bg-primary-500/50 rounded-full"></span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Partner Brands</h3>
              <p className="text-xs text-dark-400">Professional equipment from top manufacturers</p>
            </div>
          </div>
          <LocalizedClientLink 
            href="/brands"
            className="text-sm text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1 group"
          >
            View all ({TOTAL_BRANDS})
            <svg 
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </LocalizedClientLink>
        </div>
        
        {/* Show first 12 brands (all have products) on desktop, scrollable on mobile */}
        <div className="flex overflow-x-auto gap-3 small:grid small:grid-cols-6 medium:grid-cols-12 small:gap-4 small:overflow-visible no-scrollbar pb-2">
          {BRANDS.slice(0, 12).map((brand) => (
            <BrandCard key={brand.slug} brand={brand} />
          ))}
        </div>
        
        <div className="flex justify-center mt-4 small:hidden">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span 
                key={i} 
                className={`w-8 h-1 rounded-full ${i === 0 ? 'bg-primary-500' : 'bg-dark-600'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrandsBar
