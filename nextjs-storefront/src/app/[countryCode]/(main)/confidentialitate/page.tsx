import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | CarphaCom",
  description: "Privacy policy and personal data protection.",
}

export default function ConfidentialitatePage() {
  return (
    <div className="bg-dark-900 min-h-screen py-16">
      <div className="content-container max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 mb-6">
            <p className="text-dark-400 text-sm mb-4">Last updated: January 2026</p>
            <p className="text-dark-300">
              Qubit Page Limited is committed to protecting the privacy of your personal data 
              in accordance with the General Data Protection Regulation (GDPR).
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">1. Data We Collect</h2>
              <ul className="space-y-2 text-dark-300">
                <li>• <strong className="text-white">Identification data:</strong> name, surname, email address, phone number</li>
                <li>• <strong className="text-white">Delivery data:</strong> full delivery address</li>
                <li>• <strong className="text-white">Billing data:</strong> for businesses - company name, registration number, registered address</li>
                <li>• <strong className="text-white">Technical data:</strong> IP address, browser type, device used</li>
              </ul>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">2. Purpose of Processing</h2>
              <ul className="space-y-2 text-dark-300">
                <li>• Processing and delivering orders</li>
                <li>• Issuing invoices and legal documents</li>
                <li>• Communication regarding orders and technical support</li>
                <li>• Improving services and user experience</li>
                <li>• Direct marketing (only with your explicit consent)</li>
              </ul>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">3. Legal Basis</h2>
              <p className="text-dark-300 mb-4">We process your data based on:</p>
              <ul className="space-y-2 text-dark-300">
                <li>• Performance of the sales contract</li>
                <li>• Legal obligations (tax, accounting)</li>
                <li>• Our legitimate interests</li>
                <li>• Your consent (for marketing)</li>
              </ul>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">4. Sharing Data with Third Parties</h2>
              <p className="text-dark-300 mb-4">Your data may be shared with the following categories of third parties:</p>
              <ul className="space-y-3 text-dark-300">
                <li>• <strong className="text-white">Courier services</strong> - for order delivery (we share name, address, phone)</li>
                <li>• <strong className="text-white">Payment processors</strong> - Stripe, PayU for secure online transaction processing (we do not store card data)</li>
                <li>• <strong className="text-white">Google Services</strong> - we use Google Analytics for traffic analysis, Google Ads for advertising, Google Merchant Center for product listings, and Google OAuth for optional authentication (if you choose to sign in with Google)</li>
                <li>• <strong className="text-white">Email Marketing</strong> - Brevo (Sendinblue) for sending newsletters and commercial communications (only with your consent)</li>
                <li>• <strong className="text-white">Hosting and cloud services</strong> - for storing and protecting your data</li>
                <li>• <strong className="text-white">Public authorities</strong> - when required by law</li>
              </ul>
              <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                <p className="text-primary-300 text-sm">
                  <strong>Important:</strong> We do not sell or rent your personal data to third parties for commercial purposes. 
                  All third-party services process data based on data processing agreements that guarantee data protection in accordance with GDPR.
                </p>
              </div>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">4.1. Google OAuth Authentication</h2>
              <p className="text-dark-300 mb-4">
                We offer the option to sign in using your Google account (Google OAuth 2.0). 
                If you choose this option:
              </p>
              <ul className="space-y-2 text-dark-300">
                <li>• Google will provide us with your email address and full name</li>
                <li>• You can disconnect from your Google account at any time from your account settings</li>
                <li>• Google collects data about your interactions according to its own privacy policy</li>
                <li>• We do not have access to your Google account password</li>
                <li>• We use this method solely to simplify the authentication process</li>
              </ul>
              <p className="text-dark-300 mt-4">
                For details on how Google processes your data, see the 
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 ml-1">
                  Google Privacy Policy
                </a>.
              </p>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">5. Your Rights</h2>
              <p className="text-dark-300 mb-4">Under GDPR, you have the following rights:</p>
              <ul className="space-y-2 text-dark-300">
                <li>• <strong className="text-white">Right of access</strong> - to receive a copy of your data</li>
                <li>• <strong className="text-white">Right to rectification</strong> - to correct inaccurate data</li>
                <li>• <strong className="text-white">Right to erasure</strong> - to request deletion of your data</li>
                <li>• <strong className="text-white">Right to restriction</strong> - to limit processing</li>
                <li>• <strong className="text-white">Right to portability</strong> - to receive your data in a structured format</li>
                <li>• <strong className="text-white">Right to object</strong> - to object to processing</li>
              </ul>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">6. Data Retention</h2>
              <p className="text-dark-300">
                We retain your data for the period necessary to fulfil the purposes for which it was 
                collected, or for the period required by legal obligations (for example, tax documents 
                are kept for 10 years).
              </p>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">7. Data Security</h2>
              <p className="text-dark-300">
                We implement appropriate technical and organisational measures to protect your data 
                against unauthorised access, loss or destruction. Our website uses SSL encryption 
                for all data transmissions.
              </p>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">8. Contact DPO</h2>
              <p className="text-dark-300 mb-4">
                For any questions related to personal data processing or to exercise 
                your rights, you can contact us:
              </p>
              <div className="bg-dark-900 p-4 rounded-lg">
                <p className="text-dark-300"><strong className="text-white">Email:</strong> msrusu@gmail.com</p>
                <p className="text-dark-300"><strong className="text-white">Phone:</strong> +40 774 077 860</p>
              </div>
              <p className="text-dark-300 mt-4">
                You also have the right to lodge a complaint with the relevant data protection 
                supervisory authority (ICO in the UK).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
