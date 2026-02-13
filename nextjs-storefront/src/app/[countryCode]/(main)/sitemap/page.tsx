import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Sitemap | CarphaCom",
  description: "Easily navigate through all sections and pages of our radio communications and equipment store.",
}

// All brands A-Z
const ALL_BRANDS = [
  "Albrecht", "Alinco", "Anytone", "Avanti", "Cobra", "CRT", "Dynascan",
  "Escort", "Hoffman", "Jopix", "Kenwood", "Lemm", "Megawat", "Midland",
  "Motorola", "PNI", "President", "Radian", "RigExpert", "RM Italy",
  "Sirio", "Stabo", "Storm", "TTi", "Whistler", "Yosan", "Zetagi"
]

// Main site categories (parent only)
const CATEGORIES = [
  {
    name: "CB Radio Stations",
    href: "/categories/statii-radio-cb",
    children: [
      { name: "Mobile Stations", href: "/categories/statii-mobile" },
      { name: "Portable Stations", href: "/categories/statii-portabile" },
      { name: "Base Stations", href: "/categories/statii-de-baza" },
    ]
  },
  {
    name: "Antennas",
    href: "/categories/antene",
    children: [
      { name: "Mobile Antennas", href: "/categories/antene-mobile" },
      { name: "Fixed Antennas", href: "/categories/antene-fixe" },
      { name: "Portable Antennas", href: "/categories/antene-portabile" },
    ]
  },
  {
    name: "Accessories",
    href: "/categories/accesorii",
    children: [
      { name: "Microphones", href: "/categories/microfoane" },
      { name: "Amplifiers", href: "/categories/amplificatoare" },
      { name: "Power Supplies", href: "/categories/surse-alimentare" },
      { name: "Cables and Connectors", href: "/categories/cabluri-conectori" },
    ]
  },
  {
    name: "Measuring Equipment",
    href: "/categories/echipamente-masura",
    children: [
      { name: "SWR Meters", href: "/categories/swr-metre" },
      { name: "Analysers", href: "/categories/analizoare" },
    ]
  },
]

const MAIN_PAGES = [
  { name: "Home", href: "/", icon: "🏠" },
  { name: "Store", href: "/store", icon: "🛒" },
  { name: "All Categories", href: "/categories", icon: "📂" },
  { name: "All Brands", href: "/brands", icon: "🏷️" },
  { name: "Shopping Cart", href: "/cart", icon: "🛍️" },
  { name: "My Account", href: "/account", icon: "👤" },
  { name: "Contact", href: "/contact", icon: "📧" },
]

const USEFUL_LINKS = [
  { name: "Terms and Conditions", href: "/terms" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Return Policy", href: "/return-policy" },
  { name: "Shipping and Payment", href: "/shipping" },
  { name: "FAQ", href: "/faq" },
]

export default async function SitemapPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 py-12">
      <div className="content-container">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
            <span className="text-xl">🗺️</span>
            <span className="text-sm font-medium text-primary-400">Navigation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Sitemap
          </h1>
          <p className="text-lg text-dark-300 max-w-2xl mx-auto">
            Quickly find any page or section of our store
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-dark-800/50 rounded-xl p-4 text-center border border-dark-700">
            <div className="text-3xl font-bold text-primary-400">{MAIN_PAGES.length}</div>
            <div className="text-sm text-dark-400">Main Pages</div>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 text-center border border-dark-700">
            <div className="text-3xl font-bold text-green-400">{CATEGORIES.length}</div>
            <div className="text-sm text-dark-400">Main Categories</div>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 text-center border border-dark-700">
            <div className="text-3xl font-bold text-blue-400">{ALL_BRANDS.length}</div>
            <div className="text-sm text-dark-400">Brands</div>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-4 text-center border border-dark-700">
            <div className="text-3xl font-bold text-purple-400">500+</div>
            <div className="text-sm text-dark-400">Products</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Main Pages */}
          <div className="bg-dark-800/30 rounded-2xl p-6 border border-dark-700">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-primary-500 rounded-full"></span>
              Main Pages
            </h2>
            <ul className="space-y-3">
              {MAIN_PAGES.map((page) => (
                <li key={page.href}>
                  <Link 
                    href={`/${countryCode}${page.href}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-700/50 transition-colors group"
                  >
                    <span className="text-xl">{page.icon}</span>
                    <span className="text-dark-200 group-hover:text-white transition-colors">
                      {page.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            
            <div className="mt-8 pt-6 border-t border-dark-700">
              <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-4">
                Useful Information
              </h3>
              <ul className="space-y-2">
                {USEFUL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={`/${countryCode}${link.href}`}
                      className="text-sm text-dark-400 hover:text-primary-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 2: Categories */}
          <div className="bg-dark-800/30 rounded-2xl p-6 border border-dark-700">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-green-500 rounded-full"></span>
              Categories
            </h2>
            <div className="space-y-6">
              {CATEGORIES.map((category) => (
                <div key={category.href}>
                  <Link 
                    href={`/${countryCode}${category.href}`}
                    className="flex items-center gap-2 text-white font-medium hover:text-primary-400 transition-colors mb-2"
                  >
                    <span className="text-lg">📁</span>
                    {category.name}
                  </Link>
                  {category.children && (
                    <ul className="pl-7 space-y-1.5">
                      {category.children.map((child) => (
                        <li key={child.href}>
                          <Link 
                            href={`/${countryCode}${child.href}`}
                            className="text-sm text-dark-400 hover:text-primary-400 transition-colors flex items-center gap-1.5"
                          >
                            <span className="w-1 h-1 rounded-full bg-dark-500"></span>
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Brands A-Z */}
          <div className="bg-dark-800/30 rounded-2xl p-6 border border-dark-700">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              Brands A-Z
            </h2>
            <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-dark-800">
              {ALL_BRANDS.map((brand) => (
                <Link 
                  key={brand}
                  href={`/${countryCode}/store?brand=${brand}`}
                  className="text-sm text-dark-300 hover:text-primary-400 transition-colors p-2 rounded hover:bg-dark-700/30"
                >
                  {brand}
                </Link>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-dark-700">
              <Link 
                href={`/${countryCode}/brands`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-lg text-primary-400 font-medium transition-colors"
              >
                <span>🏷️</span>
                View All Brands
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dark-800/50 border border-dark-700">
            <span className="text-sm text-dark-400">
              For search engines: 
            </span>
            <a 
              href="/sitemap.xml" 
              className="text-sm text-primary-400 hover:text-primary-300 underline"
              target="_blank"
            >
              sitemap.xml
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
