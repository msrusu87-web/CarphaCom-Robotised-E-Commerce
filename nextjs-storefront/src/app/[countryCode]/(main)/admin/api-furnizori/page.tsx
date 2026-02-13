"use client"

import { useState, useEffect, useCallback } from "react"

const API_SECRET = "CBRadio2026GeneratorKey"
const API_BASE = "/api/supplier-sync"

type SyncStatus = {
  supplier: string
  config: {
    enabled: boolean
    api_base_url: string
    b2b_username: string
    sync_prices: boolean
    sync_stock: boolean
    sync_images: boolean
    sync_descriptions: boolean
    token_expires_at: string | null
    last_sync_stock: string | null
    last_sync_prices: string | null
    last_sync_images: string | null
    last_sync_full: string | null
    last_error: string | null
    cron_quick_stock: string
    cron_price_stock: string
    cron_full_import: string
  }
  db: {
    total_products: number
    published_products: number
    total_images: number
    last_product_update: string
  } | null
  services: Array<{
    name: string
    status: string
    uptime: number
    restarts: number
    memory: number
    cpu: number
  }> | null
  redis: boolean
  postgresql: boolean
}

type ConnectionTest = {
  success: boolean
  message: string
  tokenValid: boolean
  tokenExpires: string | null
  productsCount: number | null
}

const headers = {
  Authorization: `Bearer ${API_SECRET}`,
  "Content-Type": "application/json",
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never"
  try {
    const d = new Date(iso)
    return d.toLocaleString("ro-RO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  } catch {
    return iso
  }
}

function formatUptime(ms: number): string {
  const hours = Math.floor((Date.now() - ms) / 3600000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}z ${hours % 24}h`
  return `${hours}h`
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function tokenTimeLeft(expires: string | null): { text: string; urgent: boolean } {
  if (!expires) return { text: "Unknown", urgent: true }
  try {
    const exp = new Date(expires)
    const now = new Date()
    const diffMs = exp.getTime() - now.getTime()
    if (diffMs <= 0) return { text: "EXPIRAT", urgent: true }
    const hours = Math.floor(diffMs / 3600000)
    const mins = Math.floor((diffMs % 3600000) / 60000)
    return {
      text: `${hours}h ${mins}m`,
      urgent: hours < 4,
    }
  } catch {
    return { text: "Error", urgent: true }
  }
}

export default function ApiFurnizoriPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [connTest, setConnTest] = useState<ConnectionTest | null>(null)
  const [logs, setLogs] = useState<string>("")
  const [logType, setLogType] = useState("quick")
  const [loading, setLoading] = useState(false)
  const [actionLog, setActionLog] = useState<string>("")
  const [runningAction, setRunningAction] = useState<string>("")

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}?action=status`, { headers })
      const data = await res.json()
      setStatus(data)
    } catch (e: any) {
      setActionLog(`Error loading status: ${e.message}`)
    }
  }, [])

  const fetchLogs = useCallback(
    async (type?: string) => {
      const t = type || logType
      try {
        const res = await fetch(`${API_BASE}?action=logs&type=${t}`, { headers })
        const data = await res.json()
        setLogs(data.content || "Empty")
      } catch (e: any) {
        setLogs(`Error: ${e.message}`)
      }
    },
    [logType]
  )

  useEffect(() => {
    fetchStatus()
    fetchLogs()
  }, [fetchStatus, fetchLogs])

  const runAction = async (action: string, label: string) => {
    if (runningAction) return
    setRunningAction(action)
    setActionLog(`⏳ ${label}...`)

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers,
        body: JSON.stringify({ action }),
      })
      const data = await res.json()

      if (data.success) {
        setActionLog(
          `✅ ${label} - Success\n${data.output ? data.output.slice(-500) : ""}`
        )
      } else {
        setActionLog(
          `❌ ${label} - Failed\n${data.output || data.error || "Unknown error"}`
        )
      }
    } catch (e: any) {
      setActionLog(`❌ ${label} - Error: ${e.message}`)
    }

    setRunningAction("")
    fetchStatus()
    fetchLogs()
  }

  const testConnection = async () => {
    setRunningAction("test")
    setConnTest(null)
    try {
      const res = await fetch(`${API_BASE}?action=test-connection`, { headers })
      const data = await res.json()
      setConnTest(data)
    } catch (e: any) {
      setConnTest({
        success: false,
        message: e.message,
        tokenValid: false,
        tokenExpires: null,
        productsCount: null,
      })
    }
    setRunningAction("")
  }

  const tokenInfo = tokenTimeLeft(status?.config?.token_expires_at || null)

  return (
    <div className="py-8 content-container max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            API Furnizori - PNI B2B
          </h1>
          <p className="text-dark-400 mt-1">
            Product, price, stock and image sync from PNI B2B
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Connection Status */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <p className="text-xs text-dark-500 mb-1">B2B Connection</p>
          <p className="text-lg font-bold text-white">
            {status?.config?.enabled ? (
              <span className="text-green-400">● Active</span>
            ) : (
              <span className="text-red-400">● Disabled</span>
            )}
          </p>
          <p className="text-xs text-dark-500 mt-1">
            {status?.config?.b2b_username || "-"}
          </p>
        </div>

        {/* Token Status */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <p className="text-xs text-dark-500 mb-1">API Token</p>
          <p
            className={`text-lg font-bold ${
              tokenInfo.urgent ? "text-red-400" : "text-green-400"
            }`}
          >
            {tokenInfo.text}
          </p>
          <p className="text-xs text-dark-500 mt-1">
            Expires: {formatDate(status?.config?.token_expires_at || null)}
          </p>
        </div>

        {/* Products */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <p className="text-xs text-dark-500 mb-1">Store Products</p>
          <p className="text-lg font-bold text-primary-400">
            {status?.db?.published_products?.toLocaleString() || "-"}
          </p>
          <p className="text-xs text-dark-500 mt-1">
            Total: {status?.db?.total_products?.toLocaleString() || "-"} |
            Images: {status?.db?.total_images?.toLocaleString() || "-"}
          </p>
        </div>

        {/* Infrastructure */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <p className="text-xs text-dark-500 mb-1">Infrastructure</p>
          <div className="flex gap-2 mt-1">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                status?.redis
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              Redis
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                status?.postgresql
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              Postgres
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            {status?.services?.map((s) => (
              <span
                key={s.name}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  s.status === "online"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}
                title={`${s.name}: ${formatUptime(s.uptime)} | ${formatBytes(s.memory)} | ${s.restarts} restarts`}
              >
                {s.name.replace("carphacom-", "").slice(0, 5)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Last Sync Times */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
          Last Sync
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-dark-500">Stock (quick)</p>
            <p className="text-sm text-white font-medium">
              {formatDate(status?.config?.last_sync_stock || null)}
            </p>
            <p className="text-xs text-dark-600">
              Cron: {status?.config?.cron_quick_stock || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-dark-500">Prices + Stock</p>
            <p className="text-sm text-white font-medium">
              {formatDate(status?.config?.last_sync_prices || null)}
            </p>
            <p className="text-xs text-dark-600">
              Cron: {status?.config?.cron_price_stock || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-dark-500">Images</p>
            <p className="text-sm text-white font-medium">
              {formatDate(status?.config?.last_sync_images || null)}
            </p>
          </div>
          <div>
            <p className="text-xs text-dark-500">Full Import</p>
            <p className="text-sm text-white font-medium">
              {formatDate(status?.config?.last_sync_full || null)}
            </p>
            <p className="text-xs text-dark-600">
              Cron: {status?.config?.cron_full_import || "-"}
            </p>
          </div>
        </div>
        {status?.config?.last_error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">
              ⚠️ Last error: {status.config.last_error}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-accent-500 rounded-full"></span>
          Sync Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Test Connection */}
          <button
            onClick={testConnection}
            disabled={!!runningAction}
            className="p-4 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 rounded-xl text-left transition-all group border border-dark-600 hover:border-blue-500/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔌</span>
              <span className="text-sm font-semibold text-white group-hover:text-blue-400">
                Test Connection
              </span>
            </div>
            <p className="text-xs text-dark-400">
              Verify connection with PNI B2B API
            </p>
          </button>

          {/* Refresh Token */}
          <button
            onClick={() => runAction("refresh-token", "Refresh Token")}
            disabled={!!runningAction}
            className="p-4 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 rounded-xl text-left transition-all group border border-dark-600 hover:border-amber-500/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔑</span>
              <span className="text-sm font-semibold text-white group-hover:text-amber-400">
                Refresh Token
              </span>
            </div>
            <p className="text-xs text-dark-400">
              Token valid 24h - manual refresh
            </p>
          </button>

          {/* Sync Stock Only */}
          <button
            onClick={() => runAction("sync-stock", "Sync Stock")}
            disabled={!!runningAction}
            className="p-4 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 rounded-xl text-left transition-all group border border-dark-600 hover:border-green-500/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📦</span>
              <span className="text-sm font-semibold text-white group-hover:text-green-400">
                Sync Stock
              </span>
            </div>
            <p className="text-xs text-dark-400">
              Quick stock only (~4 min)
            </p>
          </button>

          {/* Sync Prices Only */}
          <button
            onClick={() => runAction("sync-prices", "Sync Prices")}
            disabled={!!runningAction}
            className="p-4 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 rounded-xl text-left transition-all group border border-dark-600 hover:border-yellow-500/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💰</span>
              <span className="text-sm font-semibold text-white group-hover:text-yellow-400">
                Sync Prices
              </span>
            </div>
            <p className="text-xs text-dark-400">
              Prices + complete stock (~3 min)
            </p>
          </button>

          {/* Full Sync */}
          <button
            onClick={() => runAction("sync-full", "Full Sync")}
            disabled={!!runningAction}
            className="p-4 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 rounded-xl text-left transition-all group border border-dark-600 hover:border-primary-500/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔄</span>
              <span className="text-sm font-semibold text-white group-hover:text-primary-400">
                Full Sync
              </span>
            </div>
            <p className="text-xs text-dark-400">
              Prices, stock, descriptions (~5 min)
            </p>
          </button>

          {/* Sync Images */}
          <button
            onClick={() => runAction("sync-images", "Sync Images")}
            disabled={!!runningAction}
            className="p-4 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 rounded-xl text-left transition-all group border border-dark-600 hover:border-purple-500/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🖼️</span>
              <span className="text-sm font-semibold text-white group-hover:text-purple-400">
                Sync Images
              </span>
            </div>
            <p className="text-xs text-dark-400">
              No duplicates, overwrite existing
            </p>
          </button>

          {/* Import New Products */}
          <button
            onClick={() =>
              runAction("sync-new-products", "Import New Products")
            }
            disabled={!!runningAction}
            className="p-4 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 rounded-xl text-left transition-all group border border-dark-600 hover:border-cyan-500/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📥</span>
              <span className="text-sm font-semibold text-white group-hover:text-cyan-400">
                Import New Products
              </span>
            </div>
            <p className="text-xs text-dark-400">
              New products with images (~10 min)
            </p>
          </button>

          {/* Restart Services */}
          <button
            onClick={() =>
              runAction("restart-services", "Restart Services")
            }
            disabled={!!runningAction}
            className="p-4 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 rounded-xl text-left transition-all group border border-dark-600 hover:border-red-500/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔧</span>
              <span className="text-sm font-semibold text-white group-hover:text-red-400">
                Restart Services
              </span>
            </div>
            <p className="text-xs text-dark-400">
              Restart PM2 (frontend, backend, admin)
            </p>
          </button>
        </div>

        {/* Running indicator */}
        {runningAction && runningAction !== "test" && (
          <div className="mt-4 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-primary-400">
              Running sync... This may take a few minutes.
            </p>
          </div>
        )}

        {/* Connection Test Result */}
        {connTest && (
          <div
            className={`mt-4 p-4 rounded-lg border ${
              connTest.success
                ? "bg-green-500/10 border-green-500/30"
                : "bg-red-500/10 border-red-500/30"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                connTest.success ? "text-green-400" : "text-red-400"
              }`}
            >
              {connTest.success ? "✅" : "❌"} {connTest.message}
            </p>
            {connTest.tokenValid && (
              <p className="text-xs text-dark-400 mt-1">
                Token valid | Expires: {formatDate(connTest.tokenExpires)} |
                B2B Products: {connTest.productsCount?.toLocaleString() || "?"}
              </p>
            )}
          </div>
        )}

        {/* Action Log */}
        {actionLog && (
          <div className="mt-4 p-4 bg-dark-900 border border-dark-600 rounded-lg">
            <pre className="text-xs text-dark-300 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
              {actionLog}
            </pre>
          </div>
        )}
      </div>

      {/* Services Status */}
      {status?.services && (
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-500 rounded-full"></span>
            Active Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {status.services.map((s) => (
              <div
                key={s.name}
                className={`p-4 rounded-xl border ${
                  s.status === "online"
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-red-500/5 border-red-500/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">
                    {s.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === "online"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-dark-400">
                  <p>Uptime: {formatUptime(s.uptime)}</p>
                  <p>
                    Memory: {formatBytes(s.memory)} | CPU: {s.cpu}%
                  </p>
                  <p>Restarts: {s.restarts}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Viewer */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
            Sync Logs
          </h2>
          <div className="flex gap-2">
            {[
              { id: "quick", label: "Quick Stock" },
              { id: "full", label: "Prices" },
              { id: "import", label: "Import" },
              { id: "images", label: "Images" },
              { id: "autoblog", label: "AutoBlog" },
            ].map((lt) => (
              <button
                key={lt.id}
                onClick={() => {
                  setLogType(lt.id)
                  fetchLogs(lt.id)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  logType === lt.id
                    ? "bg-primary-500 text-white"
                    : "bg-dark-700 text-dark-400 hover:bg-dark-600"
                }`}
              >
                {lt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-dark-900 border border-dark-700 rounded-lg p-4 max-h-96 overflow-y-auto">
          <pre className="text-xs text-dark-300 whitespace-pre-wrap font-mono">
            {logs || "Loading..."}
          </pre>
        </div>
      </div>

      {/* Cron Schedule Info */}
      <div className="mt-8 bg-dark-800 border border-dark-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
          Automation Schedule
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-dark-700/50 rounded-lg">
            <p className="text-xs text-dark-500 mb-1">📦 Quick Stock</p>
            <p className="text-sm text-white font-medium">Every 15 min</p>
            <p className="text-xs text-dark-500 font-mono mt-1">*/15 * * * *</p>
          </div>
          <div className="p-3 bg-dark-700/50 rounded-lg">
            <p className="text-xs text-dark-500 mb-1">💰 Prices + Stock</p>
            <p className="text-sm text-white font-medium">Every 2 hours</p>
            <p className="text-xs text-dark-500 font-mono mt-1">0 */2 * * *</p>
          </div>
          <div className="p-3 bg-dark-700/50 rounded-lg">
            <p className="text-xs text-dark-500 mb-1">📥 Full Import</p>
            <p className="text-sm text-white font-medium">Daily at 03:00</p>
            <p className="text-xs text-dark-500 font-mono mt-1">0 3 * * *</p>
          </div>
          <div className="p-3 bg-dark-700/50 rounded-lg">
            <p className="text-xs text-dark-500 mb-1">📝 AutoBlog</p>
            <p className="text-sm text-white font-medium">Every 5 hours</p>
            <p className="text-xs text-dark-500 font-mono mt-1">0 */5 * * *</p>
          </div>
        </div>
      </div>
    </div>
  )
}
