import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-dark-900 relative small:min-h-screen">
      <div className="h-16 bg-dark-800 border-b border-dark-700">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-dark-300 flex items-center gap-x-2 flex-1 basis-0 hover:text-primary-400 transition-colors"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus">
              Back to cart
            </span>
            <span className="mt-px block small:hidden txt-compact-plus">
              Back
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="text-xl font-bold text-white hover:text-primary-400 transition-colors flex items-center gap-2"
            data-testid="store-link"
          >
            <svg className="w-6 h-6 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.3"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            </svg>
            CarphaCom
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
      <div className="py-6 w-full flex flex-col items-center justify-center border-t border-dark-700">
        <p className="text-dark-400 text-sm">© {new Date().getFullYear()} CarphaCom · Qubit Page Limited — All rights reserved</p>
      </div>
    </div>
  )
}
