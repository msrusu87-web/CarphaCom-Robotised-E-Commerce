import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Warranty | CarphaCom",
  description: "Warranty information - 24 months warranty on all products.",
}

export default function GarantiePage() {
  return (
    <div className="bg-dark-900 min-h-screen py-16">
      <div className="content-container max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Product Warranty</h1>
        
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">24</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Months Warranty</h2>
                <p className="text-dark-300">On all products sold</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-primary-400 mb-4">What the Warranty Covers</h2>
            <ul className="space-y-3 text-dark-300">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Manufacturing and material defects
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Functional issues that arise during normal use
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free replacement or repair of defective products
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-primary-400 mb-4">What the Warranty Does Not Cover</h2>
            <ul className="space-y-3 text-dark-300">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Damage caused by improper use
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Malfunctions caused by connecting to inadequate power sources
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Normal wear and tear, scratches or cosmetic damage
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Modifications or repairs carried out by unauthorised persons
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-primary-400 mb-4">How to Claim Warranty</h2>
            <ol className="space-y-4 text-dark-300">
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</span>
                <span>Contact us at +40 774 077 860 or by email at msrusu@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</span>
                <span>Describe the problem and send us photos of the defective product</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</span>
                <span>Send the product along with the invoice and warranty certificate</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">4</span>
                <span>Within a maximum of 14 days, you will receive the repaired or replaced product</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
