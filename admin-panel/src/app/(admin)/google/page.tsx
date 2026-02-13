/**
 * Google Integrations Page - REAL APIs Implementation
 * Integrates Google Merchant Center, Analytics, and Search Console
 * With Product Selection & Sync Management
 */
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { 
  ShoppingBag, Search, BarChart3, Settings, RefreshCw,
  CheckCircle, AlertTriangle, XCircle, Users, Eye, MousePointer,
  Clock, Globe, ArrowUpRight, Package, AlertCircle, LogIn, Loader2, ExternalLink, Megaphone,
  CheckSquare, Square, Filter, ChevronDown, ToggleLeft, ToggleRight, Image as ImageIcon
} from "lucide-react"

interface MerchantProduct {
  id: string
  title: string
  handle: string
  status: string
  thumbnail: string | null
  sku: string | null
  rrp_price: number
  supplier_price: number
  stock: number
  google_merchant_enabled: boolean
  brand: string
}

const tabs = [
  { id: "merchants", label: "Merchants", icon: ShoppingBag },
  { id: "console", label: "Search Console", icon: Search },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
]

export default function GooglePage() {
  const [activeTab, setActiveTab] = useState("merchants")
  const [syncing, setSyncing] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Data states
  const [merchantStats, setMerchantStats] = useState<any>(null)
  const [merchantIssues, setMerchantIssues] = useState<any[]>([])
  const [consoleStats, setConsoleStats] = useState<any>(null)
  const [topQueries, setTopQueries] = useState<any[]>([])
  const [analyticsStats, setAnalyticsStats] = useState<any>(null)
  const [topPages, setTopPages] = useState<any[]>([])
  const [realtimeUsers, setRealtimeUsers] = useState<number>(0)
  const [apiMessages, setApiMessages] = useState<{ [key: string]: { message: string; url?: string } }>({})
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [refreshingAll, setRefreshingAll] = useState(false)
  
  // Merchant Product Management states
  const [merchantProducts, setMerchantProducts] = useState<MerchantProduct[]>([])
  const [merchantProductsCount, setMerchantProductsCount] = useState(0)
  const [merchantEnabledCount, setMerchantEnabledCount] = useState(0)
  const [merchantProductsLoading, setMerchantProductsLoading] = useState(false)
  const [merchantProductsPage, setMerchantProductsPage] = useState(0)
  const [merchantProductsSearch, setMerchantProductsSearch] = useState('')
  const [merchantProductsFilter, setMerchantProductsFilter] = useState('all')
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [bulkActioning, setBulkActioning] = useState(false)
  const [merchantSubTab, setMerchantSubTab] = useState<'products' | 'overview'>('overview')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Expandable sections
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    queries: true,
    topPages: true,
    issues: true
  })

  // Check authentication status + sync status
  useEffect(() => {
    checkAuthStatus()
    fetchSyncStatus()
  }, [])

  // Load tab data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadTabData()
    }
  }, [activeTab, isAuthenticated])

  // Auto-refresh real-time users every 30 seconds when on Analytics tab
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isAuthenticated && activeTab === 'analytics') {
      // Initial load
      loadAnalyticsData()
      
      // Auto-refresh every 30 seconds
      interval = setInterval(async () => {
        try {
          const res = await fetch('/app/api/google/analytics/stats')
          if (res.ok) {
            const data = await res.json()
            setRealtimeUsers(data.realtimeUsers || 0)
            // Optionally update full stats
            // setAnalyticsStats(data.stats)
          }
        } catch (error) {
          console.error('Error refreshing realtime data:', error)
        }
      }, 30000) // 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTab, isAuthenticated])

  async function checkAuthStatus() {
    try {
      const res = await fetch('/app/api/google/auth')
      const data = await res.json()
      setIsAuthenticated(data.authenticated || false)
    } catch (error) {
      console.error('Error checking auth:', error)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSyncStatus() {
    try {
      const res = await fetch('/app/api/google/sync/status')
      const data = await res.json()
      if (data.lastSync) setLastSync(data.lastSync)
    } catch {}
  }

  async function handleRefreshAll() {
    setRefreshingAll(true)
    try {
      await Promise.all([
        loadMerchantsData(),
        loadConsoleData(),
        loadAnalyticsData(),
      ])
      setLastSync(new Date().toISOString())
    } catch (error) {
      console.error('Error refreshing all:', error)
    } finally {
      setRefreshingAll(false)
    }
  }

  async function handleLogin() {
    try {
      const res = await fetch('/app/api/google/auth', { method: 'POST' })
      const data = await res.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error getting auth URL:', error)
      alert('Error connecting to Google. Check the console.')
    }
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect from Google? You will lose access to all data.')) {
      return
    }

    try {
      setSyncing(true)
      const res = await fetch('/app/api/google/disconnect', { method: 'POST' })
      const data = await res.json()
      
      if (data.success) {
        setIsAuthenticated(false)
        setMerchantStats(null)
        setConsoleStats(null)
        setAnalyticsStats(null)
        alert('Disconnected successfully! You can reconnect with another account.')
      } else {
        alert('Disconnect error: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error disconnecting:', error)
      alert('Disconnect error. Check the console.')
    } finally {
      setSyncing(false)
    }
  }

  async function loadTabData() {
    setLoading(true)
    try {
      if (activeTab === "merchants") {
        await loadMerchantsData()
      } else if (activeTab === "console") {
        await loadConsoleData()
      } else if (activeTab === "analytics") {
        await loadAnalyticsData()
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadMerchantsData() {
    try {
      const [statsRes, issuesRes] = await Promise.all([
        fetch('/app/api/google/merchants/stats'),
        fetch('/app/api/google/merchants/issues'),
      ])

      const statsData = await statsRes.json()
      if (statsData.error === 'api_not_enabled') {
        setApiMessages(prev => ({ ...prev, merchants: { message: statsData.message, url: statsData.enableUrl } }))
      }
      setMerchantStats(statsData.totalProducts !== undefined ? statsData : null)

      const issuesData = await issuesRes.json()
      setMerchantIssues(issuesData.issues || [])
    } catch (error) {
      console.error('Error loading merchants data:', error)
    }
  }

  // ─── Merchant Product Management ───
  const loadMerchantProducts = useCallback(async (page = 0, search = '', filter = 'all') => {
    setMerchantProductsLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: String(page * 50),
        search,
        filter,
      })
      const res = await fetch(`/app/api/google/merchants/products?${params}`)
      const data = await res.json()
      setMerchantProducts(data.products || [])
      setMerchantProductsCount(data.count || 0)
      setMerchantEnabledCount(data.enabledCount || 0)
    } catch (error) {
      console.error('Error loading merchant products:', error)
    } finally {
      setMerchantProductsLoading(false)
    }
  }, [])

  // Load merchant products when switching to products sub-tab
  useEffect(() => {
    if (activeTab === 'merchants' && merchantSubTab === 'products') {
      loadMerchantProducts(merchantProductsPage, merchantProductsSearch, merchantProductsFilter)
    }
  }, [activeTab, merchantSubTab, merchantProductsPage, merchantProductsFilter, loadMerchantProducts])

  function handleMerchantSearch(value: string) {
    setMerchantProductsSearch(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setMerchantProductsPage(0)
      loadMerchantProducts(0, value, merchantProductsFilter)
    }, 400)
  }

  function toggleProductSelection(id: string) {
    setSelectedProductIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedProductIds.size === merchantProducts.length) {
      setSelectedProductIds(new Set())
    } else {
      setSelectedProductIds(new Set(merchantProducts.map(p => p.id)))
    }
  }

  async function handleBulkAction(action: 'enable' | 'disable') {
    if (selectedProductIds.size === 0) return
    setBulkActioning(true)
    try {
      const res = await fetch('/app/api/google/merchants/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, productIds: Array.from(selectedProductIds) }),
      })
      const data = await res.json()
      if (data.success) {
        setSelectedProductIds(new Set())
        await loadMerchantProducts(merchantProductsPage, merchantProductsSearch, merchantProductsFilter)
      }
    } catch (error) {
      console.error('Error in bulk action:', error)
    } finally {
      setBulkActioning(false)
    }
  }

  async function handleEnableAllPublished() {
    if (!confirm('Enable ALL published products for Google Merchant Center?')) return
    setBulkActioning(true)
    try {
      const res = await fetch('/app/api/google/merchants/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable_all_published', productIds: [] }),
      })
      const data = await res.json()
      if (data.success) {
        alert(data.message)
        setSelectedProductIds(new Set())
        await loadMerchantProducts(merchantProductsPage, merchantProductsSearch, merchantProductsFilter)
      }
    } catch (error) {
      console.error('Error enabling all:', error)
    } finally {
      setBulkActioning(false)
    }
  }

  async function handleToggleSingleProduct(productId: string, enable: boolean) {
    try {
      await fetch('/app/api/google/merchants/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: enable ? 'enable' : 'disable', productIds: [productId] }),
      })
      setMerchantProducts(prev =>
        prev.map(p => p.id === productId ? { ...p, google_merchant_enabled: enable } : p)
      )
      setMerchantEnabledCount(prev => enable ? prev + 1 : prev - 1)
    } catch (error) {
      console.error('Error toggling product:', error)
    }
  }

  async function loadConsoleData() {
    try {
      const res = await fetch('/app/api/google/console/stats')
      const data = await res.json()
      if (data.error === 'api_not_enabled') {
        setApiMessages(prev => ({ ...prev, console: { message: data.message, url: data.enableUrl } }))
      }
      setConsoleStats(data.stats || null)
      setTopQueries(data.topQueries || [])
    } catch (error) {
      console.error('Error loading console data:', error)
    }
  }

  async function loadAnalyticsData() {
    try {
      const res = await fetch('/app/api/google/analytics/stats')
      const data = await res.json()
      if (data.error === 'api_not_enabled' || data.error === 'GA4 not configured') {
        setApiMessages(prev => ({ ...prev, analytics: { message: data.message, url: data.enableUrl } }))
      }
      setAnalyticsStats(data.stats || null)
      setTopPages(data.topPages || [])
      setRealtimeUsers(data.realtimeUsers || 0)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    }
  }

  async function handleSync() {
    if (!isAuthenticated) {
      alert('You need to authenticate with Google first.')
      return
    }

    if (merchantEnabledCount === 0) {
      alert('You have no products enabled for Google Merchant.\n\nGo to the Merchants → Products tab and enable the products you want to sync.')
      return
    }

    if (!confirm(`Sync ${merchantEnabledCount} enabled products to Google Merchant Center?`)) return

    setSyncing(true)
    try {
      const res = await fetch('/app/api/google/merchants/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabledOnly: true }),
      })

      if (res.ok) {
        const data = await res.json()
        alert(`✓ Sync complete!\nSynced: ${data.synced}\nFailed: ${data.failed}\nTotal enabled: ${data.total}`)
        await loadMerchantsData()
        // Auto-update sitemap after product sync
        await fetch('/app/api/sitemap/update', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trigger: 'product_sync' })
        }).catch(err => console.log('Sitemap update triggered'))
      } else {
        throw new Error('Sync failed')
      }
    } catch (error) {
      console.error('Error syncing:', error)
      alert('Sync error. Check the console.')
    } finally {
      setSyncing(false)
    }
  }

  async function handleSubmitSitemap() {
    if (!isAuthenticated) {
      alert('You need to authenticate with Google first.')
      return
    }

    setSyncing(true)
    try {
      const siteUrl = 'https://www.YOUR_PNI_USERNAMEtrafic.ro'
      const sitemapUrl = `${siteUrl}/sitemap.xml`
      
      const res = await fetch('/app/api/google/console/sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitemapUrl }),
      })

      if (res.ok) {
        alert(`\u2713 Sitemap submitted successfully to Google Search Console!\n\nURL: ${sitemapUrl}`)
      } else {
        const error = await res.json()
        alert(`Sitemap submission error: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error submitting sitemap:', error)
      alert('Sitemap submission error. Check the console.')
    } finally {
      setSyncing(false)
    }
  }

  // Not authenticated view
  if (!isAuthenticated && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Sign in with Google
          </h2>
          <p className="text-gray-500 mb-6">
            To access data from Google Merchant Center, Analytics and Search Console,
            you need to authenticate with your Google account.
          </p>
          <button
            onClick={handleLogin}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-flex items-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
          <p className="text-sm text-gray-400 mt-4">
            You will be redirected to Google for authorization
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Google Integrations</h1>
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">Merchants Center, Search Console & Analytics</p>
            {lastSync && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last sync: {new Date(lastSync).toLocaleString('en-US')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/google/ads"
            className="flex items-center justify-center gap-2 bg-purple-50 text-purple-700 px-3 py-2.5 rounded-lg hover:bg-purple-100 text-sm font-medium border border-purple-200 transition-colors"
          >
            <Megaphone className="w-4 h-4" />
            <span>Google Ads</span>
          </Link>
          <button
            onClick={handleRefreshAll}
            disabled={refreshingAll || syncing}
            className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium border border-gray-200"
          >
            {refreshingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{refreshingAll ? 'Loading...' : 'Reload Data'}</span>
          </button>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {syncing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}  
            <span>{syncing ? 'Syncing...' : 'Sync Products'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 -mx-4 px-4 lg:mx-0 lg:px-0">
        <nav className="flex gap-1 -mb-px overflow-x-auto pb-px scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Merchants Tab */}
      {!loading && activeTab === "merchants" && apiMessages.merchants && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Merchant Center API is not enabled</p>
            <p className="text-sm text-amber-700 mt-1">{apiMessages.merchants.message}</p>
            {apiMessages.merchants.url && (
              <a href={apiMessages.merchants.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline">
                <ExternalLink className="w-4 h-4" /> Enable the API in Google Cloud Console
              </a>
            )}
          </div>
        </div>
      )}
      {!loading && activeTab === "merchants" && (
        <div className="space-y-4">
          {/* Sub-tabs: Overview / Products */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setMerchantSubTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                merchantSubTab === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Statistics
              </span>
            </button>
            <button
              onClick={() => setMerchantSubTab('products')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                merchantSubTab === 'products'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Products
                {merchantEnabledCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    {merchantEnabledCount}
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* ═══ Overview Sub-tab ═══ */}
          {merchantSubTab === 'overview' && merchantStats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <Package className="w-8 h-8 text-blue-500" />
                    <span className="text-xs text-gray-400">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{merchantStats.totalProducts}</p>
                  <p className="text-sm text-gray-500">Products</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-green-200 bg-green-50">
                  <div className="flex items-center justify-between">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <span className="text-xs text-green-600">
                      {merchantStats.totalProducts > 0 ? Math.round((merchantStats.approved / merchantStats.totalProducts) * 100) : 0}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 mt-2">{merchantStats.approved}</p>
                  <p className="text-sm text-green-600">Approved</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-yellow-200 bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    <span className="text-xs text-yellow-600">
                      {merchantStats.totalProducts > 0 ? Math.round((merchantStats.pending / merchantStats.totalProducts) * 100) : 0}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700 mt-2">{merchantStats.pending}</p>
                  <p className="text-sm text-yellow-600">Pending</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-red-200 bg-red-50">
                  <div className="flex items-center justify-between">
                    <XCircle className="w-8 h-8 text-red-500" />
                    <span className="text-xs text-red-600">
                      {merchantStats.totalProducts > 0 ? Math.round((merchantStats.disapproved / merchantStats.totalProducts) * 100) : 0}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-red-700 mt-2">{merchantStats.disapproved}</p>
                  <p className="text-sm text-red-600">Rejected</p>
                </div>
              </div>

              {/* Enabled count info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Products enabled for sync</p>
                    <p className="text-sm text-blue-700">
                      {merchantEnabledCount} products selected · Next sync will only send enabled products
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMerchantSubTab('products')}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium"
                >
                  Manage
                </button>
              </div>

              {/* Issues - Expandable */}
              {merchantIssues.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, issues: !prev.issues }))}
                    className="w-full px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">Product Issues</h3>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        {merchantIssues.length} to resolve
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.issues ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.issues && (
                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                      {merchantIssues.map((issue, idx) => (
                        <div key={idx} className="px-4 py-3 flex items-start gap-3">
                          {issue.severity === "error" ? (
                            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{issue.title || issue.productId}</p>
                            <p className="text-sm text-gray-500">{issue.productId}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Array.isArray(issue.issues) && issue.issues.map((i: string, iidx: number) => (
                                <span key={iidx} className={`px-2 py-0.5 rounded text-xs ${
                                  issue.severity === "error" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                }`}>
                                  {i}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {merchantIssues.length === 0 && (
                <div className="bg-green-50 rounded-xl p-6 border border-green-200 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-900 mb-1">All products are OK!</h3>
                  <p className="text-sm text-green-700">No issues to resolve in Merchant Center.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ Products Sub-tab ═══ */}
          {merchantSubTab === 'products' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={merchantProductsSearch}
                      onChange={(e) => handleMerchantSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={merchantProductsFilter}
                      onChange={(e) => {
                        setMerchantProductsFilter(e.target.value)
                        setMerchantProductsPage(0)
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All products</option>
                      <option value="enabled">Google Enabled</option>
                      <option value="disabled">Disabled</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  {/* Enable All Published */}
                  <button
                    onClick={handleEnableAllPublished}
                    disabled={bulkActioning}
                    className="px-3 py-2 bg-green-50 text-green-700 border border-green-300 rounded-lg text-sm font-medium hover:bg-green-100 disabled:opacity-50 whitespace-nowrap"
                  >
                    {bulkActioning ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                    Enable All Published
                  </button>
                </div>

                {/* Bulk Actions Bar */}
                {selectedProductIds.size > 0 && (
                  <div className="mt-3 flex items-center gap-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedProductIds.size} selected
                    </span>
                    <button
                      onClick={() => handleBulkAction('enable')}
                      disabled={bulkActioning}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {bulkActioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <ToggleRight className="w-4 h-4" />}
                      Enable
                    </button>
                    <button
                      onClick={() => handleBulkAction('disable')}
                      disabled={bulkActioning}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {bulkActioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <ToggleLeft className="w-4 h-4" />}
                      Disable
                    </button>
                    <button
                      onClick={() => setSelectedProductIds(new Set())}
                      className="px-3 py-1.5 text-gray-600 hover:text-gray-900 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Stats summary */}
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <span>{merchantProductsCount} products total</span>
                  <span className="text-green-600 font-medium">{merchantEnabledCount} enabled for Google</span>
                  <span className="text-gray-400">{merchantProductsCount - merchantEnabledCount} disabled</span>
                </div>
              </div>

              {/* Product Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {merchantProductsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : merchantProducts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No products found</p>
                    <p className="text-sm mt-1">Try a different search or filter</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr className="text-left text-sm text-gray-600">
                          <th className="px-4 py-3 w-10">
                            <button onClick={toggleSelectAll} className="text-gray-500 hover:text-gray-700">
                              {selectedProductIds.size === merchantProducts.length && merchantProducts.length > 0 ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          </th>
                          <th className="px-4 py-3 w-14"></th>
                          <th className="px-4 py-3 font-medium">Product</th>
                          <th className="px-4 py-3 font-medium text-right">RRP Price</th>
                          <th className="px-4 py-3 font-medium text-center">Stock</th>
                          <th className="px-4 py-3 font-medium text-center">Status</th>
                          <th className="px-4 py-3 font-medium text-center">Google Merchant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {merchantProducts.map((product) => (
                          <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${product.google_merchant_enabled ? 'bg-green-50/30' : ''}`}>
                            <td className="px-4 py-3">
                              <button onClick={() => toggleProductSelection(product.id)} className="text-gray-500 hover:text-gray-700">
                                {selectedProductIds.has(product.id) ? (
                                  <CheckSquare className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              {product.thumbnail ? (
                                <img
                                  src={product.thumbnail}
                                  alt=""
                                  className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900 text-sm line-clamp-1">{product.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {product.sku && <span className="text-gray-400 mr-2">SKU: {product.sku}</span>}
                                  {product.brand && <span className="text-gray-400">{product.brand}</span>}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-semibold text-gray-900 text-sm">
                                {product.rrp_price > 0 ? `${Number(product.rrp_price).toFixed(2)} RON` : '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                product.status === 'published' ? 'bg-green-100 text-green-700' :
                                product.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {product.status === 'published' ? 'Published' :
                                 product.status === 'draft' ? 'Draft' : product.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleToggleSingleProduct(product.id, !product.google_merchant_enabled)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                  product.google_merchant_enabled
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300'
                                }`}
                              >
                                {product.google_merchant_enabled ? (
                                  <>
                                    <ToggleRight className="w-4 h-4" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="w-4 h-4" />
                                    Inactive
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {merchantProductsCount > 50 && (
                  <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <span className="text-sm text-gray-600">
                      Page {merchantProductsPage + 1} of {Math.ceil(merchantProductsCount / 50)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMerchantProductsPage(p => Math.max(0, p - 1))}
                        disabled={merchantProductsPage === 0}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={() => setMerchantProductsPage(p => p + 1)}
                        disabled={(merchantProductsPage + 1) * 50 >= merchantProductsCount}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Console Tab */}
      {!loading && activeTab === "console" && apiMessages.console && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Search Console API is not enabled</p>
            <p className="text-sm text-amber-700 mt-1">{apiMessages.console.message}</p>
            {apiMessages.console.url && (
              <a href={apiMessages.console.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline">
                <ExternalLink className="w-4 h-4" /> Enable the API in Google Cloud Console
              </a>
            )}
          </div>
        </div>
      )}
      {!loading && activeTab === "console" && consoleStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <MousePointer className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-500">Clicks</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{consoleStats.clicks?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-500">Impressions</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {consoleStats.impressions ? (consoleStats.impressions/1000).toFixed(1) + 'K' : '0'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-500">CTR</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{consoleStats.ctr || '0%'}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-500">Indexate</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{consoleStats.indexedPages || 0}</p>
            </div>
          </div>

          {/* Top Queries - Expandable */}
          {topQueries.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => setExpandedSections(prev => ({ ...prev, queries: !prev.queries }))}
                className="w-full px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Top Searches  ({topQueries.length})</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.queries ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.queries && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-sm text-gray-500">
                        <th className="px-4 py-3 font-medium">Query</th>
                        <th className="px-4 py-3 font-medium text-right">Clicks</th>
                        <th className="px-4 py-3 font-medium text-right">Impressions</th>
                        <th className="px-4 py-3 font-medium text-right">CTR</th>
                        <th className="px-4 py-3 font-medium text-right">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topQueries.map((q: any, i: number) => (
                        <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{q.query}</td>
                          <td className="px-4 py-3 text-right text-gray-900">{q.clicks}</td>
                          <td className="px-4 py-3 text-right text-gray-500">{q.impressions?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-green-600">{q.ctr}</td>
                          <td className="px-4 py-3 text-right text-gray-900">{q.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {!loading && activeTab === "analytics" && apiMessages.analytics && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Google Analytics API is not enabled</p>
            <p className="text-sm text-amber-700 mt-1">{apiMessages.analytics.message}</p>
            {apiMessages.analytics.url && (
              <a href={apiMessages.analytics.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline">
                <ExternalLink className="w-4 h-4" /> Enable the API in Google Cloud Console
              </a>
            )}
          </div>
        </div>
      )}
      {!loading && activeTab === "analytics" && analyticsStats && (
        <div className="space-y-6">
          {/* Real-time + Stats Grid */}
          <div className="grid grid-cols-1 gap-4">
            {/* Real-time Users Card - Prominent */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium opacity-90">Visitors Now (Live)</span>
                  </div>
                  <p className="text-5xl font-bold">{realtimeUsers?.toLocaleString() || 0}</p>
                </div>
                <Users className="w-16 h-16 opacity-20" />
              </div>
              <p className="text-sm opacity-75">Number of active users on the site right now</p>
            </div>

            {/* Other Stats - 3 columns */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-gray-500">Users (30 days)</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{analyticsStats.users?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-gray-500">Sessions</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{analyticsStats.sessions?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-500">Views</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{analyticsStats.pageviews?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-gray-500">Bounce Rate</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{analyticsStats.bounceRate || '0%'}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-gray-500">Avg Duration</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{analyticsStats.avgSessionDuration || '0:00'}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-500">Conversion</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{analyticsStats.conversionRate || '0%'}</p>
              </div>
            </div>
          </div>

          {/* Top Pages - Expandable */}
          {topPages.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => setExpandedSections(prev => ({ ...prev, topPages: !prev.topPages }))}
                className="w-full px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Top Pages ({topPages.length})</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.topPages ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.topPages && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-sm text-gray-500">
                        <th className="px-4 py-3 font-medium">Page</th>
                        <th className="px-4 py-3 font-medium text-right">Views</th>
                        <th className="px-4 py-3 font-medium text-right">Users</th>
                        <th className="px-4 py-3 font-medium text-right">Bounce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPages.map((p: any, i: number) => (
                        <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-blue-600 truncate max-w-[200px]">{p.page}</td>
                          <td className="px-4 py-3 text-right text-gray-900">{p.views?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-gray-500">{p.users?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-gray-500">{p.bounce}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Connection Status</h3>
            <div className="space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Authenticated with Google</p>
                        <p className="text-sm text-green-700">OAuth 2.0 activ</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Active</span>
                  </div>
                  
                  {/* Disconnect Button */}
                  <button
                    onClick={handleDisconnect}
                    disabled={syncing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 border-2 border-red-300 text-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Disconnecting...</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        <span>Disconnect Google Account</span>
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-600 text-center">After disconnecting you can reconnect with another Google account</p>
                </>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Not Connected</p>
                      <p className="text-sm text-gray-600">Connect to access the data</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogin}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Connect
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hidden">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Authenticated with Google</p>
                    <p className="text-sm text-green-700">OAuth 2.0 active</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Active</span>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Medusa Backend Configuration</h4>
                <p className="text-sm text-blue-700 mb-3">
                  For automatic sync, configure the Medusa API token in .env:
                </p>
                <code className="block bg-blue-900 text-blue-100 p-3 rounded text-xs font-mono">
                  MEDUSA_API_TOKEN=your_admin_token_here
                </code>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-600" />
                  Dynamic Sitemap (Auto-Update)
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>URL:</strong> <a href="https://www.YOUR_PNI_USERNAMEtrafic.ro/api/sitemap.xml" target="_blank" className="text-blue-600 hover:underline">www.YOUR_PNI_USERNAMEtrafic.ro/api/sitemap.xml</a>
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  ✓ Auto-regenerates when you add new products<br/>
                  ✓ Automatically submitted daily to Google Search Console<br/>
                  ✓ Includes: Products, Static pages, Blog posts
                </p>
                <button 
                  onClick={handleSubmitSitemap}
                  disabled={syncing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4" />
                      Submit Sitemap Now
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-600" />
                  Robots.txt (AI & Search Engines)
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>URL:</strong> <a href="https://www.YOUR_PNI_USERNAMEtrafic.ro/api/robots.txt" target="_blank" className="text-blue-600 hover:underline">www.YOUR_PNI_USERNAMEtrafic.ro/api/robots.txt</a>
                </p>
                <p className="text-xs text-gray-600">
                  ✓ Allow: Google, Bing, Yandex, DuckDuckGo<br/>
                  ✓ Allow: GPTBot, ClaudeBot, ChatGPT, Perplexity<br/>
                  ✓ Allow: All AI search engines for indexing
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Configuration Assistance
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1 ml-7">
              <li>• <strong>Merchant ID</strong>: Found in Google Merchant Center → Settings</li>
              <li>• <strong>Property ID</strong>: Found in Google Analytics → Admin → Property Settings</li>
              <li>• <strong>Site URL</strong>: Must be verified in Search Console first</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
