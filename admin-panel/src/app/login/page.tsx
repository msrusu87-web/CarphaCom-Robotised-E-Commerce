"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Package } from "lucide-react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const err = searchParams.get('error')
    const deniedEmail = searchParams.get('email')
    if (err === 'access_denied' && deniedEmail) {
      setError(`Account ${deniedEmail} does not have access. Use the authorized account.`)
    } else if (err === 'auth_failed') {
      setError('Google authentication failed. Try again.')
    } else if (err) {
      setError(`Error: ${err}`)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/app/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        router.push("/dashboard")
      } else {
        const data = await response.json()
        setError(data.message || "Authentication failed")
      }
    } catch {
      setError("Connection error")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")
    setGoogleLoading(true)
    try {
      const res = await fetch("/app/api/admin/auth/google", { method: "POST" })
      const data = await res.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        setError("Could not generate Google authentication URL")
      }
    } catch {
      setError("Error connecting with Google")
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">CarphaCom</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Connecting..." : "Sign In"}
            </button>
          </form>

          {/* Demo accounts info */}
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs font-medium text-blue-700 mb-1">Demo Accounts:</p>
            <p className="text-xs text-blue-600">admin@example.com / YOUR_ADMIN_PASSWORD</p>
            <p className="text-xs text-blue-600">demo@example.com / YOUR_DEMO_PASSWORD</p>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          CarphaCom Admin Panel
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
