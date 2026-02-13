import { Metadata } from "next"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Brands | CarphaCom",
  description: "All partner brands in the CarphaCom store - CB radio equipment, antennas, stations, security and accessories from top manufacturers",
}

// All brands — brands with products in store listed first, sorted by product count
const BRANDS = [
  // === Brands WITH products (sorted by product count desc) ===
  { id: "pni", name: "PNI", country: "Romania", description: "Romanian distributor and manufacturer of electronic and communication equipment", category: "CB Radios", products: 1450 },
  { id: "president", name: "President", country: "France", description: "Premium French CB radio brand since 1977", category: "CB Radios", products: 52 },
  { id: "midland", name: "Midland", country: "Italy", description: "International manufacturer of radio and communication equipment since 1959", category: "CB Radios", products: 39 },
  { id: "silvercloud", name: "SilverCloud", country: "Romania", description: "Surveillance solutions, GPS tracking and automotive electronics", category: "Surveillance", products: 29 },
  { id: "crt", name: "CRT", country: "France", description: "CB stations and equipment manufactured in France", category: "CB Radios", products: 25 },
  { id: "dynascan", name: "Dynascan", country: "Europe", description: "CB radios and communication equipment", category: "CB Radios", products: 20 },
  { id: "tti", name: "TTi", country: "United Kingdom", description: "Team Trading International - quality CB and PMR radios", category: "CB Radios", products: 19 },
  { id: "motorola", name: "Motorola", country: "USA", description: "Global leader in communication solutions and professional equipment", category: "PMR Radios", products: 17 },
  { id: "jopix", name: "Jopix", country: "Spain", description: "Spanish radio and communication equipment", category: "CB Radios", products: 15 },
  { id: "alinco", name: "Alinco", country: "Japan", description: "Japanese professional transceivers and radio equipment", category: "Transceivers", products: 15 },
  { id: "sirio", name: "Sirio", country: "Italy", description: "Premium quality Italian professional antennas", category: "Antennas", products: 10 },
  { id: "uniden", name: "Uniden", country: "Japan", description: "Radio scanners and professional communication equipment", category: "Scanners", products: 10 },
  { id: "beko", name: "Beko", country: "Turkey", description: "Electronic equipment and home appliances", category: "Electronics", products: 8 },
  { id: "duracell", name: "Duracell", country: "USA", description: "Premium quality batteries and accumulators", category: "Accessories", products: 8 },
  { id: "rigexpert", name: "RigExpert", country: "Ukraine", description: "Antenna analysers and professional accessories for amateur radio operators", category: "Accessories", products: 6 },
  { id: "albrecht", name: "Albrecht", country: "Germany", description: "German quality electronic and communication equipment", category: "CB Radios", products: 5 },
  { id: "lemm", name: "Lemm", country: "Italy", description: "Italian professional antennas for CB and amateur radio", category: "Antennas", products: 5 },
  { id: "decross", name: "DECROSS", country: "Europe", description: "Antennas and accessories for radio communications", category: "Antennas", products: 4 },
  { id: "adviti", name: "ADVITI", country: "Europe", description: "Security and surveillance equipment", category: "Security", products: 4 },
  { id: "stabo", name: "Stabo", country: "Germany", description: "German manufacturer of radio and communication equipment", category: "CB Radios", products: 3 },
  { id: "minix", name: "Minix", country: "Hong Kong", description: "Mini PCs and compact media players", category: "Electronics", products: 3 },
  { id: "orno", name: "ORNO", country: "Poland", description: "Electrical equipment and home automation", category: "Smart Home", products: 3 },
  { id: "kingston", name: "Kingston", country: "USA", description: "Memory and storage solutions", category: "Electronics", products: 3 },
  { id: "yaesu", name: "Yaesu", country: "Japan", description: "Professional radio equipment and top-tier transceivers", category: "Transceivers", products: 2 },
  { id: "anytone", name: "Anytone", country: "China", description: "Digital and analog radio stations at affordable prices", category: "CB Radios", products: 2 },
  { id: "tp-link", name: "TP-LINK", country: "China", description: "Networking and communication equipment", category: "Networking", products: 2 },
  { id: "nissei", name: "Nissei", country: "Japan", description: "Measuring instruments for radio communications", category: "Accessories", products: 2 },
  { id: "huawei", name: "Huawei", country: "China", description: "Technology and communication equipment", category: "Electronics", products: 2 },
  { id: "moonraker", name: "Moonraker", country: "United Kingdom", description: "Antennas and radio accessories from the UK", category: "Antennas", products: 2 },
  { id: "baofeng", name: "Baofeng", country: "China", description: "Affordable and reliable portable radio stations", category: "PMR Radios", products: 2 },
  { id: "diamond", name: "Diamond", country: "Japan", description: "Premium Japanese professional antennas", category: "Antennas", products: 1 },
  { id: "santiago", name: "Santiago", country: "Europe", description: "CB radios and radio equipment", category: "CB Radios", products: 1 },
  { id: "whistler", name: "Whistler", country: "USA", description: "Radar detectors and American automotive equipment", category: "Radar Detectors", products: 1 },
  { id: "danita", name: "Danita", country: "Europe", description: "Compact CB radio stations", category: "CB Radios", products: 1 },
  { id: "steelbras", name: "Steelbras", country: "Brazil", description: "Professional antennas for vehicles", category: "Antennas", products: 1 },
  // === Partner brands (no products yet) ===
  { id: "cobra", name: "Cobra", country: "USA", description: "World leader in automotive electronics and CB communications since 1948", category: "CB Radios", products: 0 },
  { id: "kenwood", name: "Kenwood", country: "Japan", description: "Japanese manufacturer of professional audio and communication equipment", category: "Transceivers", products: 0 },
  { id: "avanti", name: "Avanti", country: "Romania", description: "Romanian manufacturer of high-quality CB antennas and accessories", category: "Antennas", products: 0 },
  { id: "megawat", name: "Megawat", country: "United Kingdom", description: "Antennas and radio accessories from the United Kingdom", category: "Antennas", products: 0 },
  { id: "storm", name: "Storm", country: "Europe", description: "European brand of CB radios and antennas", category: "CB Radios", products: 0 },
  { id: "rm_italy", name: "RM Italy", country: "Italy", description: "High-quality CB amplifiers and accessories", category: "Amplifiers", products: 0 },
  { id: "zetagi", name: "Zetagi", country: "Italy", description: "Premium Italian radio amplifiers and accessories", category: "Amplifiers", products: 0 },
]

// Group brands by category
const CATEGORIES = [...new Set(BRANDS.map(b => b.category))].sort()
const BRANDS_WITH_PRODUCTS = BRANDS.filter(b => b.products > 0).length

export default function BrandsPage({
  params: { countryCode },
}: {
  params: { countryCode: string }
}) {
  return (
    <div className="py-12 content-container">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full mb-4">
          <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
          <span className="text-primary-400 text-sm font-medium">Partner Brands</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          All Our Brands
        </h1>
        <p className="text-dark-400 max-w-2xl mx-auto">
          We partner with the most renowned manufacturers of radio and communication equipment in the world.
          Find your favourite brand and discover available products.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-primary-500">{BRANDS.length}</p>
          <p className="text-sm text-dark-400">Total Brands</p>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-500">{BRANDS_WITH_PRODUCTS}</p>
          <p className="text-sm text-dark-400">With Products in Stock</p>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-500">{CATEGORIES.length}</p>
          <p className="text-sm text-dark-400">Categories</p>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-500">{BRANDS.reduce((sum, b) => sum + b.products, 0).toLocaleString()}+</p>
          <p className="text-sm text-dark-400">Products</p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <span className="px-4 py-2 bg-primary-500 text-white rounded-full text-sm font-medium">
          All ({BRANDS.length})
        </span>
        {CATEGORIES.map(cat => (
          <span 
            key={cat}
            className="px-4 py-2 bg-dark-700 text-dark-300 rounded-full text-sm hover:bg-dark-600 transition-colors cursor-pointer"
          >
            {cat} ({BRANDS.filter(b => b.category === cat).length})
          </span>
        ))}
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {BRANDS.map((brand) => (
          <LocalizedClientLink
            key={brand.id}
            href={`/store?brand=${brand.name}`}
            className="group"
          >
            <div className={`bg-dark-800 border ${brand.products > 0 ? 'border-dark-700' : 'border-dark-700/50'} rounded-xl p-4 hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 h-full flex flex-col`}>
              {/* Logo */}
              <div className="w-full h-20 bg-white/5 rounded-lg flex items-center justify-center mb-4 overflow-hidden group-hover:bg-white/10 transition-colors">
                <Image
                  src={brand.id === 'pni' ? `/brands/pni.png` : `/brands/${brand.id}.svg`}
                  alt={brand.name}
                  width={150}
                  height={60}
                  className={`object-contain max-h-14 ${brand.products > 0 ? 'opacity-80' : 'opacity-50'} group-hover:opacity-100 group-hover:scale-105 transition-all duration-300`}
                />
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                    {brand.name}
                  </h3>
                  {brand.products > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded-full font-medium">
                      {brand.products}
                    </span>
                  )}
                </div>
                <p className="text-xs text-dark-500 mb-2">{brand.country}</p>
                <p className="text-xs text-dark-400 line-clamp-2">
                  {brand.description}
                </p>
              </div>
              
              {/* Category Tag */}
              <div className="mt-3 pt-3 border-t border-dark-700">
                <span className="inline-block px-2 py-1 bg-dark-700 text-dark-300 text-xs rounded-full">
                  {brand.category}
                </span>
              </div>
            </div>
          </LocalizedClientLink>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-16 text-center bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-primary-500/10 rounded-2xl p-8 border border-dark-700">
        <h2 className="text-2xl font-bold text-white mb-4">
          Can&apos;t find the brand you&apos;re looking for?
        </h2>
        <p className="text-dark-400 mb-6 max-w-xl mx-auto">
          Contact us and we&apos;ll help you find the right product. 
          We can order from any manufacturer in Europe.
        </p>
        <LocalizedClientLink
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
        >
          Contact Us
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </LocalizedClientLink>
      </div>
    </div>
  )
}
