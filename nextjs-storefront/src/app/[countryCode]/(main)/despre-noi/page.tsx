import { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | CarphaCom",
  description: "Learn more about CarphaCom - your trusted supplier for radio communication equipment.",
}

export default function DespreNoiPage() {
  return (
    <div className="bg-dark-900 min-h-screen py-16">
      <div className="content-container max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">About Us</h1>
        
        <div className="prose prose-invert max-w-none">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-400 mb-4">Our Story</h2>
            <p className="text-dark-300 mb-4">
              CarphaCom is the go-to online store for radio communication equipment. 
              With over 10 years of experience in the field, we offer the best products for professionals and enthusiasts alike.
            </p>
            <p className="text-dark-300">
              We are authorised distributors for brands such as President, Avanti, Midland, PNI and CRT, 
              guaranteeing original products with full warranty.
            </p>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-400 mb-4">Our Mission</h2>
            <p className="text-dark-300 mb-4">
              We provide complete communication solutions for truckers, off-road enthusiasts, 
              hunters, fishermen and everyone who needs reliable communication.
            </p>
            <ul className="list-disc list-inside text-dark-300 space-y-2">
              <li>Highest quality products</li>
              <li>Competitive prices</li>
              <li>Specialised technical support</li>
              <li>Fast delivery</li>
            </ul>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-primary-400 mb-4">Why Choose Us</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Original Products</h3>
                  <p className="text-dark-400 text-sm">Authorised distributor for all brands</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Fast Delivery</h3>
                  <p className="text-dark-400 text-sm">Dispatched within 24h for in-stock products</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Technical Support</h3>
                  <p className="text-dark-400 text-sm">Expert team available for you</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Full Warranty</h3>
                  <p className="text-dark-400 text-sm">24-month warranty on all products</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
