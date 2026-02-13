import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Return Policy | CarphaCom - Free Returns within 30 Days",
  description: "Free returns within 30 days, no restocking fees. Full refund within 14 business days.",
}

export default function ReturPage() {
  return (
    <div className="bg-dark-900 min-h-screen py-16">
      <div className="content-container max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Return & Refund Policy</h1>
        
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-accent-500/20 to-primary-500/20 border border-accent-500/30 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-accent-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">30</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Days Return Right</h2>
                <p className="text-dark-300">No questions asked, no hassle</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-dark-800/50 rounded-lg p-4">
                <div className="text-accent-400 font-bold text-lg mb-1">No Extra Fees</div>
                <div className="text-dark-300 text-sm">We do not charge restocking fees</div>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-4">
                <div className="text-accent-400 font-bold text-lg mb-1">Easy Returns</div>
                <div className="text-dark-300 text-sm">Simple return process</div>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-4">
                <div className="text-accent-400 font-bold text-lg mb-1">Fast Refund</div>
                <div className="text-dark-300 text-sm">Maximum 14 business days</div>
              </div>
            </div>
          </div>

          {/* Return Conditions */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-primary-400 mb-4">Return Conditions</h2>
            <ul className="space-y-3 text-dark-300">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                The product must be in its original condition, unused and untested (except for inspection)
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Original packaging must be intact and complete (box, protective film, labels)
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                All accessories, manuals and components must be present
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                The invoice or proof of purchase must be available
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                The return must be initiated within 30 days of receiving the parcel
              </li>
            </ul>
          </div>

          {/* Return Process */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-primary-400 mb-4">Return Process - Step by Step</h2>
            <ol className="space-y-4 text-dark-300">
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</span>
                <div>
                  <span className="font-semibold text-white">Contact Us</span>
                  <p className="text-sm mt-1">Send an email to <a href="mailto:msrusu@gmail.com" className="text-accent-400 hover:text-accent-300">msrusu@gmail.com</a> or call <a href="tel:+40774077860" className="text-accent-400 hover:text-accent-300">+40 774 077 860</a> to notify us of the return. Specify your order number and the reason for the return.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</span>
                <div>
                  <span className="font-semibold text-white">Receive Return Label</span>
                  <p className="text-sm mt-1">We will send you a prepaid return shipping label by email within 24 business hours.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</span>
                <div>
                  <span className="font-semibold text-white">Pack the Product</span>
                  <p className="text-sm mt-1">Pack the product securely, preferably in the original packaging. Make sure all accessories are included and apply the return label to the parcel.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">4</span>
                <div>
                  <span className="font-semibold text-white">Hand Over to Courier</span>
                  <p className="text-sm mt-1">The parcel will be collected from your address on business days or you can drop it off directly at a courier point. Keep the proof of shipment.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">5</span>
                <div>
                  <span className="font-semibold text-white">Inspection & Approval</span>
                  <p className="text-sm mt-1">After receiving the product, our team will inspect its condition within a maximum of 3 business days and you will receive a return confirmation email.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">6</span>
                <div>
                  <span className="font-semibold text-white">Refund</span>
                  <p className="text-sm mt-1">The money will be returned within a maximum of 14 business days from the return approval, using the same payment method used for the purchase or by bank transfer (your choice).</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Refund Methods */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-primary-400 mb-4">Refund Methods</h2>
            <div className="space-y-4">
              <div className="bg-dark-900 border border-primary-500/30 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-6 h-6 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white font-semibold text-lg">Refund to Original Payment Method</span>
                </div>
                <p className="text-dark-300 text-sm mb-3">The primary and recommended option. Amounts will be automatically returned to:</p>
                <ul className="space-y-2 text-sm text-dark-300 ml-5">
                  <li className="flex items-start gap-2">
                    <span className="text-accent-400">•</span>
                    <span><strong className="text-white">Bank card (PayU):</strong> 5-10 business days — the reversal is done automatically through PayU to the card used for payment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-400">•</span>
                    <span><strong className="text-white">Cash on delivery:</strong> Bank transfer to the account specified by the customer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-400">•</span>
                    <span><strong className="text-white">Online payment (PayU):</strong> Automatic reversal to the payment source, processed securely through PayU</span>
                  </li>
                </ul>
              </div>
              <div className="bg-dark-900 border border-dark-600 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-6 h-6 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white font-semibold text-lg">Direct Bank Transfer</span>
                </div>
                <p className="text-dark-300 text-sm mb-3">Available upon request, if you prefer to receive the money directly in your bank account:</p>
                <ul className="space-y-2 text-sm text-dark-300 ml-5">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400">•</span>
                    <span>Provide us with your bank account details (IBAN, account holder name)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400">•</span>
                    <span>We process the transfer within a maximum of 14 business days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400">•</span>
                    <span>No additional fees for the transfer</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Products That Cannot Be Returned */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-primary-400 mb-4">Products That Cannot Be Returned</h2>
            <p className="text-dark-300 mb-4">In accordance with applicable legislation, the following categories of products are excluded from the right of return:</p>
            <ul className="space-y-3 text-dark-300">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="font-semibold text-white">Custom-made or custom-configured products</span>
                  <p className="text-sm text-dark-400 mt-1">Items made specifically for you, with personalised modifications</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="font-semibold text-white">Products with broken security or hygiene seals</span>
                  <p className="text-sm text-dark-400 mt-1">For hygiene and safety reasons</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="font-semibold text-white">Products damaged or defective due to customer fault</span>
                  <p className="text-sm text-dark-400 mt-1">Impacts, scratches, water immersion (if the product is not waterproof)</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="font-semibold text-white">Products without original packaging or with damaged packaging</span>
                  <p className="text-sm text-dark-400 mt-1">The box or packaging must be intact for resale</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="font-semibold text-white">Downloadable software products or activated licences</span>
                  <p className="text-sm text-dark-400 mt-1">Activated licence codes cannot be returned</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Product Exchange */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-primary-400 mb-4">Exchange for Another Product</h2>
            <p className="text-dark-300 mb-4">If you wish to exchange the product for another instead of a refund:</p>
            <div className="bg-dark-900 border border-primary-500/30 rounded-lg p-5">
              <ol className="space-y-3 text-dark-300">
                <li className="flex items-start gap-2">
                  <span className="text-accent-400 font-bold">1.</span>
                  <span>Let us know by email or phone that you wish to exchange the product</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-400 font-bold">2.</span>
                  <span>Specify the desired product for exchange</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-400 font-bold">3.</span>
                  <span>If there is a price difference, you will pay or receive a refund for the difference</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-400 font-bold">4.</span>
                  <span>The new product will be shipped immediately after receiving the returned one</span>
                </li>
              </ol>
              <div className="mt-4 pt-4 border-t border-dark-700">
                <p className="text-dark-300 text-sm"><span className="text-accent-400 font-semibold">Bonus:</span> For exchanges, return shipping is free regardless of the initial order value!</p>
              </div>
            </div>
          </div>

          {/* Defective or Wrong Products */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-primary-400 mb-4">Defective or Incorrectly Delivered Products</h2>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-5 mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-dark-300">
                  <p className="font-semibold text-white mb-2">Received a defective or wrong product?</p>
                  <p className="text-sm">We apologise for the inconvenience! In this case, the return is completely free and we will immediately send you a replacement product or a full refund.</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 text-dark-300">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong className="text-white">100% free shipping</strong> - you pay nothing for the return</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong className="text-white">Immediate refund or replacement</strong> - your choice</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong className="text-white">Top priority</strong> - we process the return within 24 hours</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong className="text-white">Photos optional</strong> - for faster processing, you can send us photos of the defective product</span>
              </div>
            </div>
          </div>

          {/* Contact & Support */}
          <div className="bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Questions About Returns?</h2>
            <p className="text-dark-300 mb-6">Our support team is available to help you with any questions about the return process.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <a href="mailto:msrusu@gmail.com" className="bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-lg p-5 transition-all duration-200 flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-semibold">Email</div>
                  <div className="text-accent-400 text-sm">msrusu@gmail.com</div>
                </div>
              </a>
              <a href="tel:+40774077860" className="bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-lg p-5 transition-all duration-200 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-semibold">Phone</div>
                  <div className="text-primary-400 text-sm">+40 774 077 860</div>
                </div>
              </a>
            </div>
            <div className="mt-6 pt-6 border-t border-dark-700">
              <p className="text-dark-400 text-sm">
                <strong className="text-white">Business Hours:</strong> Monday - Friday: 09:00 - 18:00 | Saturday: 10:00 - 14:00
              </p>
            </div>
          </div>

          {/* Legal Information */}
          <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">Legal Basis</h3>
            <p className="text-dark-400 text-sm">
              This return policy is compliant with the <strong className="text-white">Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013</strong> and the <strong className="text-white">Consumer Rights Act 2015</strong>. The 30-day period for exercising the right of withdrawal starts from the date of receiving the product. For more information, consult our full <a href="/termeni" className="text-accent-400 hover:text-accent-300 underline">Terms and Conditions</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
