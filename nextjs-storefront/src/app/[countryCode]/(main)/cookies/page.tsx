import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookie Policy | CarphaCom",
  description: "Information about the use of cookies on the CarphaCom website.",
}

export default function CookiesPage() {
  return (
    <div className="bg-dark-900 min-h-screen py-16">
      <div className="content-container max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Cookie Policy</h1>
        
        <div className="prose prose-invert max-w-none">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 mb-6">
            <p className="text-dark-400 text-sm mb-4">Last updated: January 2026</p>
            <p className="text-dark-300">
              This website uses cookies to improve your browsing experience. 
              By continuing to browse, you agree to the use of cookies.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">What Are Cookies?</h2>
              <p className="text-dark-300">
                Cookies are small text files that are stored on your device 
                when you visit a website. They allow the site to recognise you 
                and remember your preferences.
              </p>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">Types of Cookies Used</h2>
              
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-dark-900 rounded-lg">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Essential Cookies
                  </h3>
                  <p className="text-dark-400 text-sm">
                    Required for the website to function. They enable navigation, shopping cart 
                    functionality and order processing. They cannot be disabled.
                  </p>
                </div>

                <div className="p-4 bg-dark-900 rounded-lg">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    Performance Cookies
                  </h3>
                  <p className="text-dark-400 text-sm">
                    Collect anonymous information about how visitors use the website. 
                    They help us improve site performance.
                  </p>
                </div>

                <div className="p-4 bg-dark-900 rounded-lg">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    Functional Cookies
                  </h3>
                  <p className="text-dark-400 text-sm">
                    Allow the website to remember the choices you make (such as 
                    preferred language) and provide enhanced personalised features.
                  </p>
                </div>

                <div className="p-4 bg-dark-900 rounded-lg">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    Marketing Cookies
                  </h3>
                  <p className="text-dark-400 text-sm">
                    Used to display relevant advertisements to you. They may be 
                    used by third-party partners to track you across other websites.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">Third-Party Cookies</h2>
              <p className="text-dark-300 mb-4">We use third-party services that may set cookies:</p>
              <ul className="space-y-2 text-dark-300">
                <li>• <strong className="text-white">Google Analytics</strong> - for traffic analysis</li>
                <li>• <strong className="text-white">Facebook Pixel</strong> - for remarketing</li>
                <li>• <strong className="text-white">Stripe</strong> - for payment processing</li>
              </ul>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">Managing Cookies</h2>
              <p className="text-dark-300 mb-4">
                You can control and delete cookies according to your preferences. Here is how:
              </p>
              <ul className="space-y-2 text-dark-300">
                <li>• <strong className="text-white">Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                <li>• <strong className="text-white">Firefox:</strong> Options → Privacy & Security</li>
                <li>• <strong className="text-white">Safari:</strong> Preferences → Privacy</li>
                <li>• <strong className="text-white">Edge:</strong> Settings → Cookies and Site Permissions</li>
              </ul>
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  <strong>Warning:</strong> Disabling essential cookies may affect 
                  the proper functioning of the website and you will not be able to place orders.
                </p>
              </div>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">Cookie Lifespan</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-dark-300 text-sm">
                  <thead>
                    <tr className="border-b border-dark-600">
                      <th className="text-left py-2 text-white">Cookie</th>
                      <th className="text-left py-2 text-white">Duration</th>
                      <th className="text-left py-2 text-white">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-dark-700">
                      <td className="py-2">_medusa_jwt</td>
                      <td className="py-2">7 days</td>
                      <td className="py-2">User authentication</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="py-2">_medusa_cart_id</td>
                      <td className="py-2">7 days</td>
                      <td className="py-2">Shopping cart</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="py-2">_ga</td>
                      <td className="py-2">2 years</td>
                      <td className="py-2">Google Analytics</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-primary-400 mb-4">Contact</h2>
              <p className="text-dark-300">
                For questions about our cookie policy, contact us at 
                <a href="mailto:msrusu@gmail.com" className="text-primary-400 hover:text-primary-300 ml-1">msrusu@gmail.com</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
