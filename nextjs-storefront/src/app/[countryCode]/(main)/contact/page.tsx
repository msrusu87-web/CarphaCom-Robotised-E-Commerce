import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact | CarphaCom",
  description: "Contact us for any questions about our products.",
}

export default function ContactPage() {
  return (
    <div className="bg-dark-900 min-h-screen py-16">
      <div className="content-container max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Contact Us</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Phone</h3>
                  <a href="tel:+40774077860" className="text-primary-400 text-lg font-bold hover:text-primary-300">+40 774 077 860</a>
                </div>
              </div>
              <p className="text-dark-400 text-sm">Monday - Friday: 09:00 - 18:00</p>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-accent-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Email</h3>
                  <a href="mailto:msrusu@gmail.com" className="text-accent-400 hover:text-accent-300">msrusu@gmail.com</a>
                </div>
              </div>
              <p className="text-dark-400 text-sm">We respond within 24 hours</p>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">WhatsApp</h3>
                  <a href="https://wa.me/40774077860" className="text-green-400 hover:text-green-300">+40 774 077 860</a>
                </div>
              </div>
              <p className="text-dark-400 text-sm">Instant response during business hours</p>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Address</h3>
                  <p className="text-dark-300 font-medium">Qubit Page Limited</p>
                  <p className="text-dark-400 text-sm mt-1">United Kingdom</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Send Us a Message</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-dark-300 text-sm mb-2">Full Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-dark-300 text-sm mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-dark-300 text-sm mb-2">Phone</label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="+44 xxx xxx xxxx"
                />
              </div>
              <div>
                <label className="block text-dark-300 text-sm mb-2">Message</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
                  placeholder="Write your message here..."
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-xl transition-all"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
