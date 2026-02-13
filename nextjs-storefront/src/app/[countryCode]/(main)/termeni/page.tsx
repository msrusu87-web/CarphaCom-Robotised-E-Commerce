import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions | CarphaCom",
  description: "Terms and conditions of use for the CarphaCom online store. Complete information about the company, payments, delivery, returns, warranty and data protection.",
}

export default function TermeniPage() {
  return (
    <div className="bg-dark-900 min-h-screen py-16">
      <div className="content-container max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Terms & Conditions</h1>
        <p className="text-dark-400 text-sm mb-10">Last updated: February 2026</p>

        <div className="space-y-6">

          {/* ═══════ 1. COMPANY DETAILS ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">1. Seller Identification</h2>
            <p className="text-dark-300 mb-4">
              The online store <strong className="text-white">CarphaCom</strong> is operated by:
            </p>
            <div className="bg-dark-900 rounded-xl p-5 space-y-2 text-sm text-dark-300">
              <p><strong className="text-white text-base">Qubit Page Limited</strong></p>
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
                <p className="md:col-span-2"><strong className="text-dark-200">Registered Address:</strong> Qubit Page Limited, United Kingdom</p>
                <p><strong className="text-dark-200">Email:</strong> <a href="mailto:msrusu@gmail.com" className="text-primary-400 hover:text-primary-300">msrusu@gmail.com</a></p>
                <p><strong className="text-dark-200">Phone:</strong> <a href="tel:+40774077860" className="text-primary-400 hover:text-primary-300">+40 774 077 860</a></p>
              </div>
            </div>
          </div>

          {/* ═══════ 2. DEFINITIONS ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">2. Definitions</h2>
            <ul className="space-y-3 text-dark-300 text-sm">
              <li><strong className="text-white">"Website"</strong> — the e-commerce platform operated by CarphaCom</li>
              <li><strong className="text-white">"Seller" / "Operator"</strong> — Qubit Page Limited</li>
              <li><strong className="text-white">"Buyer" / "Customer" / "User"</strong> — any natural person aged at least 18 years or legal entity that places an order or uses the website</li>
              <li><strong className="text-white">"Order"</strong> — a purchase request for products from the website, confirmed electronically</li>
              <li><strong className="text-white">"Contract"</strong> — the distance contract concluded between the Seller and the Buyer</li>
              <li><strong className="text-white">"Products"</strong> — goods available on the website for sale (radio communication equipment, accessories, electronic components, etc.)</li>
              <li><strong className="text-white">"Account"</strong> — the section accessible to the customer after registration/authentication, containing order history and personal data</li>
            </ul>
          </div>

          {/* ═══════ 3. SUBJECT OF THE CONTRACT ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">3. Subject of the Contract</h2>
            <div className="space-y-3 text-dark-300 text-sm">
              <p>
                These general terms of sale (hereinafter referred to as "Terms") govern the commercial 
                relationships between Qubit Page Limited and the customers of the CarphaCom online store.
              </p>
              <p>
                By accessing the website and/or placing an order, the Buyer expressly and unconditionally 
                accepts these Terms. If you do not agree with any of the provisions, please do not use 
                the website and do not place orders.
              </p>
              <p>
                The Seller reserves the right to modify these Terms at any time, with the new version 
                being applicable to orders placed after the date of publication.
              </p>
            </div>
          </div>

          {/* ═══════ 4. ORDERS ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">4. Orders & Contract Formation</h2>
            <div className="space-y-3 text-dark-300 text-sm">
              <p>
                Orders are placed online by following these steps: selecting products → adding to cart → 
                entering delivery and billing details → selecting the payment method → confirming the order.
              </p>
              <p>
                <strong className="text-white">The sales contract</strong> is considered concluded when 
                the Buyer receives the order confirmation email from the Seller.
              </p>
              <p>
                The Seller reserves the right to refuse or cancel any order for justified reasons 
                (e.g.: product unavailability, suspicion of fraud, incomplete data, etc.). In case of 
                cancellation, amounts paid will be refunded in full within a maximum of 14 days.
              </p>
              <p>
                By placing an order, the Buyer declares that they have read, understood and fully accepted 
                these Terms, the <a href="/confidentialitate" className="text-primary-400 hover:text-primary-300">Privacy Policy</a>, 
                the <a href="/retur" className="text-primary-400 hover:text-primary-300 ml-1">Return Policy</a> and 
                the <a href="/cookies" className="text-primary-400 hover:text-primary-300 ml-1">Cookie Policy</a>.
              </p>
            </div>
          </div>

          {/* ═══════ 5. PRICES ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">5. Prices & Currency</h2>
            <ul className="space-y-2 text-dark-300 text-sm">
              <li>• All prices displayed on the website include applicable taxes</li>
              <li>• The applicable price is the one displayed on the website at the time of placing the order</li>
              <li>• Prices may be changed at any time by the Seller without prior notice; changes do not affect orders already confirmed</li>
              <li>• Any promotions are valid while stock lasts and for the specified duration</li>
              <li>• Obvious pricing errors (e.g.: a product worth 500 displayed at 5 due to a system error) do not bind the Seller; in such cases, the customer will be notified and the order may be cancelled with a full refund</li>
            </ul>
          </div>

          {/* ═══════ 6. PAYMENT METHODS ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">6. Payment Methods</h2>
            <div className="space-y-4 text-dark-300 text-sm">
              <p>The following payment methods are available:</p>

              <div className="bg-dark-900 border border-primary-500/30 rounded-lg p-5">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#a6c307] rounded-lg flex items-center justify-center text-white text-xs font-bold">PayU</span>
                  Online Card Payment — PayU
                </h3>
                <p className="text-dark-400 text-sm mb-2">
                  Online payments are processed securely through <strong className="text-white">PayU</strong>. 
                  Accepted cards: Visa, Mastercard, Visa Electron, Maestro. 
                  Transactions are protected with <strong className="text-white">3D Secure 2.0</strong> authentication.
                </p>
                <p className="text-dark-400 text-xs">
                  Card details are not stored on CarphaCom servers. Payment information 
                  is encrypted and processed exclusively by PayU in compliance with PCI DSS standards.
                </p>
              </div>

              <div className="bg-dark-900 border border-dark-600 rounded-lg p-5">
                <h3 className="text-white font-semibold mb-2">Cash on Delivery</h3>
                <p className="text-dark-400">
                  Payment is made in cash or by card directly to the courier upon receiving the parcel. 
                  <strong className="text-white"> No additional fees.</strong>
                </p>
              </div>

              <div className="bg-dark-900 border border-dark-600 rounded-lg p-5">
                <h3 className="text-white font-semibold mb-2">Bank Transfer</h3>
                <p className="text-dark-400 mb-3">
                  Available for orders from businesses or international payments.
                </p>
                <div className="bg-dark-800 p-3 rounded text-xs">
                  <p><strong className="text-white">Beneficiary:</strong> Qubit Page Limited</p>
                  <p className="text-dark-500 mt-1">For bank transfer payments, the order is shipped after payment confirmation.</p>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-xs">
                <p className="text-green-400 font-semibold mb-1">Payment Security</p>
                <p className="text-dark-400">
                  The CarphaCom website uses an SSL certificate (HTTPS) for encrypting all 
                  communications. Online payments are processed through PayU, a PCI DSS Level 1 
                  certified service that guarantees the highest security for card data.
                </p>
              </div>
            </div>
          </div>

          {/* ═══════ 7. DELIVERY ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">7. Shipping & Delivery</h2>
            <div className="space-y-3 text-dark-300 text-sm">
              <p>Delivery is carried out through express courier services.</p>
              <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                <p className="text-white font-semibold mb-2">Shipping cost:</p>
                <ul className="space-y-1">
                  <li>• Shipping fees are calculated at checkout based on your location</li>
                  <li>• <strong className="text-white">FREE</strong> shipping may apply for orders above a certain threshold</li>
                </ul>
              </div>
              <p>
                <strong className="text-white">Delivery time:</strong> 1-5 business days from order 
                confirmation and payment processing, depending on your location.
              </p>
              <p>
                The risk of loss or damage to products is transferred to the Buyer upon delivery. 
                Upon receipt, check the integrity of the parcel. In case of visible damage, 
                refuse the parcel and contact us immediately.
              </p>
              <p className="text-dark-400 text-xs mt-2">
                Full details on the <a href="/livrare" className="text-primary-400 hover:text-primary-300">Shipping & Delivery</a> page.
              </p>
            </div>
          </div>

          {/* ═══════ 8. RIGHT OF WITHDRAWAL ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">8. Right of Withdrawal & Returns</h2>
            <div className="space-y-3 text-dark-300 text-sm">
              <p>
                The Buyer (natural person) has the right to withdraw from the contract within 
                <strong className="text-white"> 14 calendar days</strong> of receiving the products, 
                without giving any reason and without penalties.
              </p>
              <p>
                CarphaCom offers an extended period of <strong className="text-white">30 days</strong> from 
                receiving the parcel for exercising the right of return.
              </p>
              <div className="p-4 bg-dark-900 rounded-lg">
                <p className="text-white font-semibold mb-2">Return conditions:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Products must be returned in their original condition and packaging, with all accessories</li>
                  <li>• Seals must be intact (except for normal product inspection)</li>
                  <li>• The product must not show obvious signs of use</li>
                  <li>• The invoice or proof of purchase must be available</li>
                </ul>
              </div>
              <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                <p className="text-primary-300 text-xs">
                  <strong>Refund:</strong> Amounts are returned within a maximum of <strong className="text-white">14 business 
                  days</strong> from receiving the returned products, using the same payment method used 
                  for the purchase or by bank transfer upon request. No restocking fees are charged.
                </p>
              </div>
              <p>
                <strong className="text-white">Products excluded from return:</strong> personalised products, 
                products with broken security/hygiene seals, activated software/licences, products damaged 
                by the customer.
              </p>
              <p className="text-dark-400 text-xs mt-2">
                Full procedure on the <a href="/retur" className="text-primary-400 hover:text-primary-300">Return Policy</a> page.
              </p>
            </div>
          </div>

          {/* ═══════ 9. WARRANTY ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">9. Warranty & Conformity</h2>
            <div className="space-y-3 text-dark-300 text-sm">
              <p>
                All products sold come with a <strong className="text-white">legal warranty of conformity 
                of 24 months</strong> from the date of purchase.
              </p>
              <p>
                The warranty covers manufacturing and material defects. Not covered: mechanical damage 
                caused by the user, improper use, unauthorised modifications, normal wear, damage caused 
                by natural phenomena or accidents.
              </p>
              <p>
                <strong className="text-white">Service & complaints:</strong> To report a non-conformity, 
                contact us at <a href="mailto:msrusu@gmail.com" className="text-primary-400">msrusu@gmail.com</a> or 
                by phone at <a href="tel:+40774077860" className="text-primary-400">+40 774 077 860</a> with your 
                order number and a description of the issue.
              </p>
              <p className="text-dark-400 text-xs mt-2">
                Details on the <a href="/garantie" className="text-primary-400 hover:text-primary-300">Warranty & Service</a> page.
              </p>
            </div>
          </div>

          {/* ═══════ 10. INTELLECTUAL PROPERTY ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">10. Intellectual Property</h2>
            <div className="space-y-3 text-dark-300 text-sm">
              <p>
                The content of the website (text, images, graphics, logos, design elements, databases, 
                software) is the property of Qubit Page Limited or its suppliers and is protected 
                by national and international copyright and intellectual property laws.
              </p>
              <p>
                Reproduction, distribution, modification or use of the content for any commercial purpose 
                without the prior written consent of the Seller is strictly prohibited.
              </p>
            </div>
          </div>

          {/* ═══════ 11. DATA PROTECTION ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">11. Personal Data Protection (GDPR)</h2>
            <div className="space-y-3 text-dark-300 text-sm">
              <p>
                Qubit Page Limited processes customers' personal data in accordance with 
                <strong className="text-white"> Regulation (EU) 2016/679 (GDPR)</strong> and applicable 
                national legislation.
              </p>
              <p><strong className="text-white">Data collected:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>• Identification data: name, delivery/billing address, email, phone</li>
                <li>• Billing data: for legal entities — company name, registration number, registered address</li>
                <li>• Transactional data: order history, selected payment method</li>
                <li>• Technical data: IP address, browser type, browsing data (cookies)</li>
              </ul>
              <p><strong className="text-white">Purpose of processing:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>• Processing and delivering orders</li>
                <li>• Invoicing and tax/accounting obligations</li>
                <li>• Customer communication (order confirmation, shipping notifications)</li>
                <li>• Direct marketing (only with the customer's explicit consent)</li>
                <li>• Compliance with legal obligations</li>
              </ul>
              <p><strong className="text-white">Your rights:</strong> access, rectification, erasure, 
                restriction, portability, objection, withdrawal of consent.
              </p>
              <p>
                Card data is not stored on our servers. Online payments are processed exclusively 
                by <strong className="text-white">PayU</strong> (PCI DSS Level 1 certified).
              </p>
              <p className="text-dark-400 text-xs mt-2">
                Full policy: <a href="/confidentialitate" className="text-primary-400 hover:text-primary-300">Privacy Policy</a> | 
                <a href="/cookies" className="text-primary-400 hover:text-primary-300 ml-1">Cookie Policy</a>
              </p>
            </div>
          </div>

          {/* ═══════ 12. COOKIES ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">12. Cookies</h2>
            <div className="space-y-3 text-dark-300 text-sm">
              <p>
                The website uses cookies (small text files stored in your browser) for optimal 
                site operation, remembering preferences and traffic analysis.
              </p>
              <p>Types of cookies used:</p>
              <ul className="space-y-1 ml-4">
                <li>• <strong className="text-white">Essential cookies</strong> — necessary for site operation (session, shopping cart)</li>
                <li>• <strong className="text-white">Performance cookies</strong> — anonymous traffic analysis (Google Analytics)</li>
                <li>• <strong className="text-white">Functional cookies</strong> — remembering preferences (language, currency)</li>
              </ul>
              <p>
                You can disable cookies from your browser settings. Disabling essential cookies may 
                affect the proper functioning of the website.
              </p>
              <p className="text-dark-400 text-xs mt-2">
                Full details: <a href="/cookies" className="text-primary-400 hover:text-primary-300">Cookie Policy</a>
              </p>
            </div>
          </div>

          {/* ═══════ 13. LIMITATION OF LIABILITY ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">13. Limitation of Liability</h2>
            <div className="space-y-3 text-dark-300 text-sm">
              <p>
                The Seller makes every effort to ensure the accuracy of information on the website 
                (descriptions, specifications, images, prices). However, involuntary errors may occur.
              </p>
              <p>
                The Seller is not liable for indirect, special or consequential damages that may result 
                from the use or inability to use the website or products, to the extent permitted 
                by applicable law.
              </p>
              <p>
                Product images are for informational purposes; the actual appearance of products may 
                differ slightly from photographs (colour, proportions) due to screen settings.
              </p>
              <p>
                The website may contain links to third-party websites. The Seller is not responsible for 
                the content or policies of third-party websites.
              </p>
            </div>
          </div>

          {/* ═══════ 14. FORCE MAJEURE ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">14. Force Majeure</h2>
            <div className="space-y-3 text-dark-300 text-sm">
              <p>
                Neither party shall be liable for failure to perform contractual obligations if 
                this is caused by a force majeure event (natural disasters, war, general strikes, 
                government decisions, pandemics, telecommunications or energy infrastructure failures, etc.).
              </p>
              <p>
                The party invoking force majeure must notify the other party within 5 business days 
                of the occurrence of the event.
              </p>
            </div>
          </div>

          {/* ═══════ 15. COMPLAINTS & DISPUTE RESOLUTION ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">15. Complaints & Alternative Dispute Resolution</h2>
            <div className="space-y-3 text-dark-300 text-sm">
              <p>
                For any complaint or dissatisfaction related to products or services purchased 
                from CarphaCom, please contact us directly:
              </p>
              <div className="bg-dark-900 p-4 rounded-lg text-xs space-y-1">
                <p><strong className="text-white">Email:</strong> <a href="mailto:msrusu@gmail.com" className="text-primary-400">msrusu@gmail.com</a></p>
                <p><strong className="text-white">Phone:</strong> <a href="tel:+40774077860" className="text-primary-400">+40 774 077 860</a></p>
                <p className="text-dark-500">Response time: maximum 48 business hours</p>
              </div>

              <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                <p className="text-primary-300 font-semibold text-xs mb-2">Alternative Dispute Resolution (ADR)</p>
                <p className="text-dark-400 text-xs">
                  In accordance with applicable regulations, consumers may resort to alternative 
                  dispute resolution (ADR) procedures. The European Online Dispute Resolution (ODR) platform:
                </p>
                <p className="mt-2">
                  <a href="https://ec.europa.eu/consumers/odr" className="text-primary-400 hover:text-primary-300 text-xs font-semibold" target="_blank" rel="noopener noreferrer">
                    https://ec.europa.eu/consumers/odr
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* ═══════ 16. APPLICABLE LAW ═══════ */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-primary-400 mb-4">16. Applicable Law & Jurisdiction</h2>
            <div className="space-y-3 text-dark-300 text-sm">
              <p>
                These Terms are governed by and construed in accordance with the laws of the United Kingdom.
              </p>
              <p>
                Any dispute that cannot be resolved amicably shall be submitted to the competent courts 
                of the United Kingdom.
              </p>
              <p><strong className="text-white">Key applicable legislation:</strong></p>
              <ul className="space-y-1 ml-4 text-xs text-dark-400">
                <li>• Consumer Rights Act 2015</li>
                <li>• Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013</li>
                <li>• The Electronic Commerce (EC Directive) Regulations 2002</li>
                <li>• UK General Data Protection Regulation (UK GDPR)</li>
                <li>• Data Protection Act 2018</li>
              </ul>
            </div>
          </div>

          {/* ═══════ 17. CONTACT ═══════ */}
          <div className="bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">17. Contact</h2>
            <p className="text-dark-300 text-sm mb-4">
              For any questions related to these Terms and Conditions, you can contact us:
            </p>
            <div className="bg-dark-900/80 rounded-xl p-5 space-y-2 text-sm">
              <p className="font-bold text-white text-base">Qubit Page Limited</p>
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-1.5 text-dark-300">
                <p className="md:col-span-2"><strong className="text-dark-200">Registered Address:</strong> Qubit Page Limited, United Kingdom</p>
                <p><strong className="text-dark-200">Email:</strong> <a href="mailto:msrusu@gmail.com" className="text-primary-400 hover:text-primary-300">msrusu@gmail.com</a></p>
                <p><strong className="text-dark-200">Phone:</strong> <a href="tel:+40774077860" className="text-primary-400 hover:text-primary-300">+40 774 077 860</a></p>
              </div>
              <p className="text-dark-400 text-xs pt-2">Business Hours: Monday — Friday: 09:00 – 18:00 | Saturday: 10:00 – 14:00</p>
            </div>
          </div>

          {/* ═══════ RELATED PAGES ═══════ */}
          <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-3">Related Pages</h3>
            <div className="flex flex-wrap gap-3 text-xs">
              <a href="/confidentialitate" className="px-3 py-1.5 bg-dark-900 border border-dark-600 rounded-lg text-primary-400 hover:text-primary-300 hover:border-primary-500/30 transition-colors">Privacy Policy</a>
              <a href="/cookies" className="px-3 py-1.5 bg-dark-900 border border-dark-600 rounded-lg text-primary-400 hover:text-primary-300 hover:border-primary-500/30 transition-colors">Cookie Policy</a>
              <a href="/retur" className="px-3 py-1.5 bg-dark-900 border border-dark-600 rounded-lg text-primary-400 hover:text-primary-300 hover:border-primary-500/30 transition-colors">Return Policy</a>
              <a href="/livrare" className="px-3 py-1.5 bg-dark-900 border border-dark-600 rounded-lg text-primary-400 hover:text-primary-300 hover:border-primary-500/30 transition-colors">Shipping & Delivery</a>
              <a href="/plata" className="px-3 py-1.5 bg-dark-900 border border-dark-600 rounded-lg text-primary-400 hover:text-primary-300 hover:border-primary-500/30 transition-colors">Payment Methods</a>
              <a href="/garantie" className="px-3 py-1.5 bg-dark-900 border border-dark-600 rounded-lg text-primary-400 hover:text-primary-300 hover:border-primary-500/30 transition-colors">Warranty & Service</a>
              <a href="/contact" className="px-3 py-1.5 bg-dark-900 border border-dark-600 rounded-lg text-primary-400 hover:text-primary-300 hover:border-primary-500/30 transition-colors">Contact</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
