'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RefreshCw, Play, Settings, CheckCircle, AlertTriangle, XCircle,
  Zap, Database, Package, Image, FileText, Activity, Clock, Shield,
  Wifi, WifiOff, BarChart3, Eye, EyeOff, Save, RotateCcw, Trash2,
  ChevronDown, ChevronUp, Terminal, Key, Globe, Server, Upload
} from 'lucide-react'
import ProductUploadTab from './product-upload-tab'

/* ─── Types ─── */
interface PNIData {
  config: {
    enabled: boolean
    sync_prices: boolean
    sync_stock: boolean
    sync_images: boolean
    sync_descriptions: boolean
    sync_specifications: boolean
    image_overwrite: boolean
    b2b_username: string
    cron_quick_stock: string
    cron_price_stock: string
    cron_full_import: string
    last_sync_stock: string | null
    last_sync_prices: string | null
    last_sync_images: string | null
    last_sync_full: string | null
    last_error: string | null
  }
  apiStatus: { connected: boolean; message: string; productCount: number }
  tokenInfo: { hasToken: boolean; hasCredentials: boolean; expiresAt: string | null; isExpired: boolean }
  cronStatus: { active: boolean; jobs: Array<{ type: string; schedule: string; name: string; interval: string }> }
  dbStats: { total: number; pniProducts: number; outOfStock: number; withImages: number }
  recentLogs: string[]
}

interface SyncResult {
  success: boolean
  message: string
  output?: string
  updates?: number
  errors?: number
  duration?: number
}

/* ─── Helper: format date ─── */
function formatDate(iso: string | null): string {
  if (!iso) return 'Never'
  try {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    let ago = ''
    if (mins < 1) ago = 'a few seconds ago'
    else if (mins < 60) ago = `${mins} min ago`
    else if (hours < 24) ago = `${hours} hours ago`
    else ago = `${days} days ago`

    return `${d.toLocaleDateString('en-US')} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} (${ago})`
  } catch {
    return iso
  }
}

/* ─── Helper: cron to text ─── */
function cronToText(cron: string): string {
  if (cron === '*/5 * * * *') return 'Every 5 minutes'
  if (cron === '*/10 * * * *') return 'Every 10 minutes'
  if (cron === '*/15 * * * *') return 'Every 15 minutes'
  if (cron === '*/30 * * * *') return 'Every 30 minutes'
  if (cron === '0 * * * *') return 'Every hour'
  if (cron === '0 */2 * * *') return 'Every 2 hours'
  if (cron === '0 */3 * * *') return 'Every 3 hours'
  if (cron === '0 */6 * * *') return 'Every 6 hours'
  if (cron === '0 */12 * * *') return 'Every 12 hours'
  if (cron.match(/^0 \d+ \* \* \*$/)) {
    const hour = cron.split(' ')[1]
    return `Daily at ${hour}:00`
  }
  if (cron.match(/^\d+ \d+ \* \* \*$/)) {
    const [min, hour] = cron.split(' ')
    return `Daily at ${hour}:${min.padStart(2, '0')}`
  }
  return cron
}

/* ─────────────── Sub-Tab Selector Wrapper ─────────────── */
const API_SUB_TABS = [
  { id: 'pni', label: 'PNI Sync', icon: Globe },
  { id: 'import', label: 'Import CSV/XML', icon: Upload },
]

export default function ApiFurnizoriTab() {
  const [subTab, setSubTab] = useState('pni')

  return (
    <div className="space-y-4">
      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        {API_SUB_TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                subTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Sub-tab content */}
      {subTab === 'pni' && <PNISyncTab />}
      {subTab === 'import' && <ProductUploadTab />}
    </div>
  )
}

/* ─────────────── PNI Sync Tab Component ─────────────── */
function PNISyncTab() {
  const [data, setData] = useState<PNIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [syncProgress, setSyncProgress] = useState<{ percent: number; message: string; elapsed?: number } | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [showLogs, setShowLogs] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [showCronSettings, setShowCronSettings] = useState(false)
  const [showSyncOutput, setShowSyncOutput] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refreshingToken, setRefreshingToken] = useState(false)

  // Credentials form
  const [credUsername, setCredUsername] = useState('')
  const [credPassword, setCredPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Settings form
  const [settings, setSettings] = useState({
    sync_prices: true,
    sync_stock: true,
    sync_images: true,
    sync_descriptions: true,
    sync_specifications: true,
    image_overwrite: true,
  })

  // Cron form
  const [cronSettings, setCronSettings] = useState({
    cron_quick_stock: '*/15 * * * *',
    cron_price_stock: '0 */2 * * *',
    cron_full_import: '0 3 * * *',
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ─── Data loading ─── */
  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/app/api/suppliers/pni')
      if (!res.ok) throw new Error('Failed to load PNI data')
      const json = await res.json()
      setData(json)

      // Sync form states from loaded data
      if (json.config) {
        setSettings({
          sync_prices: json.config.sync_prices ?? true,
          sync_stock: json.config.sync_stock ?? true,
          sync_images: json.config.sync_images ?? true,
          sync_descriptions: json.config.sync_descriptions ?? true,
          sync_specifications: json.config.sync_specifications ?? true,
          image_overwrite: json.config.image_overwrite ?? true,
        })
        setCronSettings({
          cron_quick_stock: json.config.cron_quick_stock || '*/15 * * * *',
          cron_price_stock: json.config.cron_price_stock || '0 */2 * * *',
          cron_full_import: json.config.cron_full_import || '0 3 * * *',
        })
        setCredUsername(json.config.b2b_username || '')
      }
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /* ─── Token refresh ─── */
  const handleRefreshToken = async () => {
    setRefreshingToken(true)
    setMessage(null)
    try {
      const body: any = { action: 'refresh-token' }
      if (credUsername) body.username = credUsername
      if (credPassword) body.password = credPassword

      const res = await fetch('/app/api/suppliers/pni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = await res.json()

      if (json.success) {
        setMessage({ type: 'success', text: `Token renewed successfully! Expires: ${json.expires_at}` })
        setCredPassword('')
        await loadData()
      } else {
        setMessage({ type: 'error', text: json.error || 'Error renewing token' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection error' })
    } finally {
      setRefreshingToken(false)
    }
  }

  /* ─── Poll sync progress ─── */
  const pollProgress = useCallback((action: string) => {
    // Clear any existing progress poll
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    progressIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch('/app/api/suppliers/pni/sync/progress')
        if (!res.ok) return
        const data = await res.json()

        if (data.running) {
          setSyncProgress({
            percent: data.percent || 0,
            message: data.message || 'Syncing...',
            elapsed: data.elapsed,
          })
        } else {
          // Sync finished
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
          }

          setSyncProgress({ percent: 100, message: data.message || 'Complete!' })

          // Short delay to show 100%, then show result
          setTimeout(() => {
            setSyncing(null)
            setSyncProgress(null)

            if (data.result) {
              setSyncResult(data.result)
              setShowSyncOutput(true)
            }

            if (data.status === 'completed') {
              setMessage({ type: 'success', text: data.result?.message || `✅ ${action} sync complete!` })
            } else {
              setMessage({ type: 'error', text: data.result?.message || `❌ ${action} sync failed` })
            }

            loadData()
          }, 1500)
        }
      } catch (err) {
        console.error('Progress poll error:', err)
      }
    }, 2000) // Poll every 2 seconds
  }, [loadData])

  useEffect(() => {
    loadData()
    intervalRef.current = setInterval(loadData, 30000) // Refresh every 30s

    // Check if a sync is already running (e.g., page was refreshed)
    fetch('/app/api/suppliers/pni/sync/progress')
      .then(res => res.json())
      .then(data => {
        if (data.running && data.action) {
          setSyncing(data.action)
          setSyncProgress({ percent: data.percent || 0, message: data.message || 'Syncing...', elapsed: data.elapsed })
          pollProgress(data.action)
        }
      })
      .catch(() => {})

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [loadData, pollProgress])

  /* ─── Manual sync ─── */
  const handleSync = async (action: string) => {
    setSyncing(action)
    setSyncResult(null)
    setSyncProgress({ percent: 0, message: 'Starting...' })
    setMessage(null)
    setShowSyncOutput(false)

    try {
      const res = await fetch('/app/api/suppliers/pni/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          options: { overwrite: settings.image_overwrite }
        })
      })
      const json = await res.json()

      if (json.alreadyRunning) {
        setMessage({ type: 'info', text: json.error || 'Sync already in progress!' })
        setSyncing(null)
        setSyncProgress(null)
        return
      }

      if (json.started) {
        // Sync started in background - start polling
        setMessage({ type: 'info', text: `${action} sync started...` })
        pollProgress(action)
      } else if (json.error) {
        setMessage({ type: 'error', text: json.error })
        setSyncing(null)
        setSyncProgress(null)
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error starting sync' })
      setSyncing(null)
      setSyncProgress(null)
    }
  }

  /* ─── Save settings ─── */
  const handleSaveSettings = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/app/api/suppliers/pni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-settings', ...settings })
      })
      const json = await res.json()
      if (json.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        setMessage({ type: 'error', text: json.error || 'Error saving' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error' })
    } finally {
      setSaving(false)
    }
  }

  /* ─── Save cron ─── */
  const handleSaveCron = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/app/api/suppliers/pni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-cron', ...cronSettings })
      })
      const json = await res.json()
      if (json.success) {
        setMessage({ type: 'success', text: json.message || 'Cron updated!' })
        await loadData()
      } else {
        setMessage({ type: 'error', text: json.error || 'Error updating cron' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error' })
    } finally {
      setSaving(false)
    }
  }

  /* ─── Render ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-600">Loading PNI data...</span>
      </div>
    )
  }

  const connected = data?.apiStatus?.connected ?? false
  const tokenExpired = data?.tokenInfo?.isExpired ?? false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Globe className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Supplier API - PNI</h2>
            <p className="text-sm text-gray-500">Connection management, sync and MyPNI B2B configuration</p>
          </div>
        </div>
        <button
          onClick={() => { setLoading(true); loadData() }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Reload
        </button>
      </div>

      {/* Global Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
          'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" /> :
           message.type === 'error' ? <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" /> :
           <Activity className="w-5 h-5 mt-0.5 flex-shrink-0" />}
          <div className="flex-1">
            <p>{message.text}</p>
          </div>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ──── STATUS CARDS ──── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connection Status */}
        <div className={`rounded-xl border-2 p-5 ${
          connected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            {connected ? <Wifi className="w-8 h-8 text-green-600" /> : <WifiOff className="w-8 h-8 text-red-600" />}
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">API Connection</h3>
          <p className="text-sm text-gray-500 mt-1">{data?.apiStatus?.message || 'N/A'}</p>
          {connected && data?.apiStatus?.productCount !== undefined && data.apiStatus.productCount >= 0 && (
            <p className="text-xs text-gray-400 mt-2">
              {data.apiStatus.productCount.toLocaleString()} products in PNI catalog
            </p>
          )}
        </div>

        {/* Token Status */}
        <div className={`rounded-xl border-2 p-5 ${
          data?.tokenInfo?.hasToken && !tokenExpired ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <Key className="w-8 h-8 text-blue-600" />
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              tokenExpired ? 'bg-red-100 text-red-700' :
              data?.tokenInfo?.hasToken ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {tokenExpired ? 'EXPIRED' : data?.tokenInfo?.hasToken ? 'VALID' : 'MISSING'}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">API Token</h3>
          <p className="text-sm text-gray-500 mt-1">
            {data?.tokenInfo?.expiresAt
              ? `Expires: ${formatDate(data.tokenInfo.expiresAt)}`
              : 'No expiration info'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Credentials: {data?.tokenInfo?.hasCredentials ? 'Configured' : 'Missing'}
          </p>
        </div>

        {/* DB Stats */}
        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-5">
          <div className="flex items-center justify-between mb-3">
            <Database className="w-8 h-8 text-indigo-600" />
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
              DB
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Products in Database</h3>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">Total: <strong>{data?.dbStats?.total?.toLocaleString()}</strong></p>
            <p className="text-sm text-gray-600">PNI: <strong>{data?.dbStats?.pniProducts?.toLocaleString()}</strong></p>
            <p className="text-sm text-gray-600">Out of stock: <strong className="text-orange-600">{data?.dbStats?.outOfStock?.toLocaleString()}</strong></p>
          </div>
        </div>

        {/* Cron Status */}
        <div className={`rounded-xl border-2 p-5 ${
          data?.cronStatus?.active ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-8 h-8 text-purple-600" />
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              data?.cronStatus?.active ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {data?.cronStatus?.active ? `${data.cronStatus.jobs.length} JOBS` : 'INACTIVE'}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Cron Automation</h3>
          {data?.cronStatus?.jobs?.map((job, i) => (
            <p key={i} className="text-xs text-gray-500 mt-1">
              {job.name}: <code className="bg-white px-1 rounded">{job.schedule}</code>
            </p>
          ))}
        </div>
      </div>

      {/* Last Error Banner */}
      {data?.config?.last_error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Last sync error</p>
            <p className="text-sm text-red-600">{data.config.last_error}</p>
          </div>
        </div>
      )}

      {/* Last Sync Times */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          Last Syncs
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Stock', value: data?.config?.last_sync_stock, color: 'green' },
            { label: 'Prices', value: data?.config?.last_sync_prices, color: 'blue' },
            { label: 'Images', value: data?.config?.last_sync_images, color: 'purple' },
            { label: 'Full import', value: data?.config?.last_sync_full, color: 'orange' },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase font-medium">{item.label}</p>
              <p className={`text-sm font-medium mt-1 ${item.value ? 'text-gray-800' : 'text-gray-400'}`}>
                {formatDate(item.value ?? null)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ──── CREDENTIALS & TOKEN SECTION ──── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowCredentials(!showCredentials)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Credentials & API Token</span>
            {!data?.tokenInfo?.hasCredentials && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Configuration required</span>
            )}
          </div>
          {showCredentials ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showCredentials && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
            <p className="text-sm text-gray-500">
              Credentials for <strong>b2b.mypni.com</strong> / <strong>b2b.mo.ro</strong>.
              Token renews automatically (valid 24h).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={credUsername}
                  onChange={(e) => setCredUsername(e.target.value)}
                  placeholder="username b2b.mo.ro"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credPassword}
                    onChange={(e) => setCredPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefreshToken}
                disabled={refreshingToken}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {refreshingToken ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                {refreshingToken ? 'Renewing...' : 'Renew Token'}
              </button>
              {data?.tokenInfo?.expiresAt && (
                <span className="text-sm text-gray-500">
                  Expires: {new Date(data.tokenInfo.expiresAt).toLocaleString('en-US')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ──── MANUAL SYNC SECTION ──── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-indigo-600" />
          Manual Sync
        </h3>
        <p className="text-sm text-gray-500 mb-4">Start sync selectively: stock only, prices+stock, images only, or full import</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              id: 'stock', label: 'Quick Stock', desc: 'Stock update only (~1 min)',
              icon: Zap, color: 'green', bgColor: 'bg-green-600', hoverColor: 'hover:bg-green-700'
            },
            {
              id: 'prices', label: 'Prices + Stock', desc: 'Price and stock update (3-5 min)',
              icon: Database, color: 'blue', bgColor: 'bg-blue-600', hoverColor: 'hover:bg-blue-700'
            },
            {
              id: 'images', label: 'Images', desc: `Image sync${settings.image_overwrite ? ' (overwrite)' : ''}`,
              icon: Image, color: 'purple', bgColor: 'bg-purple-600', hoverColor: 'hover:bg-purple-700'
            },
            {
              id: 'full', label: 'Full Import', desc: 'New products + all data (10-20 min)',
              icon: Package, color: 'orange', bgColor: 'bg-orange-600', hoverColor: 'hover:bg-orange-700'
            },
          ].map((sync) => {
            const Icon = sync.icon
            const isRunning = syncing === sync.id
            const isDisabled = !connected || !!syncing

            return (
              <div
                key={sync.id}
                className={`border-2 rounded-xl p-4 transition ${
                  isRunning ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-7 h-7 text-${sync.color}-600`} />
                  {isRunning && (
                    <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Running
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">{sync.label}</h4>
                <p className="text-xs text-gray-500 mt-1 mb-3">{sync.desc}</p>

                {/* Progress bar */}
                {isRunning && syncProgress && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 truncate max-w-[70%]">{syncProgress.message}</span>
                      <span className="text-xs font-bold text-indigo-700">{syncProgress.percent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-indigo-500 to-indigo-600"
                        style={{ width: `${syncProgress.percent}%` }}
                      />
                    </div>
                    {syncProgress.elapsed !== undefined && (
                      <p className="text-xs text-gray-400 mt-1 text-right">
                        {syncProgress.elapsed < 60
                          ? `${syncProgress.elapsed}s`
                          : `${Math.floor(syncProgress.elapsed / 60)}m ${syncProgress.elapsed % 60}s`}
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => handleSync(sync.id)}
                  disabled={isDisabled}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition ${
                    isDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : `${sync.bgColor} text-white ${sync.hoverColor}`
                  }`}
                >
                  {isRunning ? 'Syncing...' : 'Start'}
                </button>
              </div>
            )
          })}
        </div>

        {!connected && (
          <p className="text-sm text-red-500 mt-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            API connection is not active. Check the token and credentials.
          </p>
        )}
      </div>

      {/* Sync Output */}
      {showSyncOutput && syncResult && (
        <div className={`border-2 rounded-xl p-5 ${
          syncResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              {syncResult.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
              Sync Result
            </h3>
            <button onClick={() => setShowSyncOutput(false)} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm mb-2">{syncResult.message}</p>
          {(syncResult.updates !== undefined || syncResult.duration !== undefined) && (
            <div className="flex gap-4 text-sm">
              {syncResult.updates !== undefined && <span>Updates: <strong>{syncResult.updates}</strong></span>}
              {syncResult.errors !== undefined && syncResult.errors > 0 && <span className="text-red-600">Errors: <strong>{syncResult.errors}</strong></span>}
              {syncResult.duration !== undefined && <span>Duration: <strong>{syncResult.duration}s</strong></span>}
            </div>
          )}
          {syncResult.output && (
            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Output details</summary>
              <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs mt-2 overflow-auto max-h-48 whitespace-pre-wrap">
                {syncResult.output}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* ──── SYNC SETTINGS ──── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-900">Sync Settings</span>
          </div>
          {showSettings ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showSettings && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
            {[
              { key: 'sync_prices', label: 'Sync Prices', desc: 'Update prices from PNI API' },
              { key: 'sync_stock', label: 'Sync Stock', desc: 'Update stock quantities' },
              { key: 'sync_images', label: 'Sync Images', desc: 'Download and update product images' },
              { key: 'sync_descriptions', label: 'Sync Descriptions', desc: 'Update product descriptions' },
              { key: 'sync_specifications', label: 'Sync Specifications', desc: 'Update technical specifications' },
              { key: 'image_overwrite', label: 'Overwrite Images', desc: 'Overwrite existing images (does not keep old copies)' },
            ].map((setting) => (
              <label key={setting.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-sm text-gray-900">{setting.label}</p>
                  <p className="text-xs text-gray-500">{setting.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={(settings as any)[setting.key] ?? true}
                  onChange={(e) => setSettings({ ...settings, [setting.key]: e.target.checked })}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            ))}

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ──── CRON SETTINGS ──── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowCronSettings(!showCronSettings)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-900">Cron Configuration (Automation)</span>
            {data?.cronStatus?.active && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
            )}
          </div>
          {showCronSettings ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showCronSettings && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
            {/* Stock Quick */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="font-medium text-sm">Quick Stock</span>
                <span className="text-xs text-gray-400">({cronToText(cronSettings.cron_quick_stock)})</span>
              </div>
              <select
                value={cronSettings.cron_quick_stock}
                onChange={(e) => setCronSettings({ ...cronSettings, cron_quick_stock: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
              >
                <option value="*/5 * * * *">Every 5 minutes</option>
                <option value="*/10 * * * *">Every 10 minutes</option>
                <option value="*/15 * * * *">Every 15 minutes</option>
                <option value="*/30 * * * *">Every 30 minutes</option>
                <option value="0 * * * *">Every hour</option>
              </select>
            </div>

            {/* Price Stock */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">Prices + Stock</span>
                <span className="text-xs text-gray-400">({cronToText(cronSettings.cron_price_stock)})</span>
              </div>
              <select
                value={cronSettings.cron_price_stock}
                onChange={(e) => setCronSettings({ ...cronSettings, cron_price_stock: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
              >
                <option value="0 * * * *">Every hour</option>
                <option value="0 */2 * * *">Every 2 hours</option>
                <option value="0 */3 * * *">Every 3 hours</option>
                <option value="0 */6 * * *">Every 6 hours</option>
                <option value="0 */12 * * *">Every 12 hours</option>
              </select>
            </div>

            {/* Full Import */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-sm">Full Import</span>
                <span className="text-xs text-gray-400">({cronToText(cronSettings.cron_full_import)})</span>
              </div>
              <select
                value={cronSettings.cron_full_import}
                onChange={(e) => setCronSettings({ ...cronSettings, cron_full_import: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
              >
                <option value="0 2 * * *">Daily at 2:00</option>
                <option value="0 3 * * *">Daily at 3:00</option>
                <option value="0 4 * * *">Daily at 4:00</option>
                <option value="0 5 * * *">Daily at 5:00</option>
                <option value="0 3 * * 1">Weekly (Monday 3:00)</option>
              </select>
            </div>

            {/* Active Cron Jobs */}
            {data?.cronStatus?.jobs && data.cronStatus.jobs.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <p className="text-xs font-medium text-purple-700 mb-2">CRON ACTIVE:</p>
                {data.cronStatus.jobs.map((job, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-purple-600">
                    <CheckCircle className="w-3 h-3" />
                    <code className="bg-white px-1 rounded">{job.schedule}</code> - {job.name}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={handleSaveCron}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save and Update Cron
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ──── LOGS ──── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-900">Sync Logs</span>
          </div>
          {showLogs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showLogs && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            {data?.recentLogs && data.recentLogs.length > 0 ? (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-80 whitespace-pre-wrap font-mono">
                {data.recentLogs.join('\n')}
              </pre>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No logs available</p>
            )}
          </div>
        )}
      </div>

      {/* ──── API INFO ──── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <Globe className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-gray-600 text-sm">PNI API Information</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-500">
          <div>
            <p className="font-medium text-gray-700">Endpoint</p>
            <p>https://b2b.mypni.com/api/v1</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Rate Limit</p>
            <p>120 req/min (5/min auth)</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Documentation</p>
            <a href="https://b2b.mypni.com/help/api/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
              b2b.mypni.com/help/api/
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
