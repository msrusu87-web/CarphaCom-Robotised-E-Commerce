"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const BlogSection = () => {
  return (
    <section className="py-12 bg-dark-800">
      <div className="content-container">
        <div className="flex flex-col small:flex-row items-center justify-between gap-6 p-8 bg-gradient-to-r from-dark-700 to-dark-800 rounded-2xl border border-dark-600 shadow-lg">
          {/* Left side - Icon and text */}
          <div className="flex items-center gap-6 text-center small:text-left">
            <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                CB Radio Guides & News
              </h3>
              <p className="text-dark-300 max-w-xl">
                Discover technical articles, installation guides, detailed reviews and tips from radio communications experts.
              </p>
            </div>
          </div>
          
          {/* Right side - CTA Button */}
          <LocalizedClientLink href="/blog">
            <button className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-lg rounded-xl hover:from-primary-600 hover:to-primary-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-primary-500/30 flex items-center gap-3 whitespace-nowrap">
              <span>View Blog</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

export default BlogSection
