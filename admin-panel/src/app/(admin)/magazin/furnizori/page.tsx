'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SupplierStats {
  total_products: number
  imported_products: number
  last_sync: string | null
  sync_enabled: boolean
  sync_interval: number
  active_products: number
  out_of_stock: number
}

interface SyncConfig {
  enabled: boolean
  interval_minutes: number
  sync_prices: boolean
  sync_stock: boolean
  sync_images: boolean
  sync_descriptions: boolean
  auto_publish: boolean
  min_stock_threshold: number
}

export default function FurnizoriPage() {
  const router = useRouter()
  const [stats, setStats] = useState<SupplierStats | null>(null)
  const [config, setConfig] = useState<SyncConfig>({
    enabled: false,
    interval_minutes: 60,
    sync_prices: true,
    sync_stock: true,
    sync_images: false,
    sync_descriptions: false,
    auto_publish: true,
    min_stock_threshold: 0
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [importMode, setImportMode] = useState<'manual' | 'auto'>('manual')
  const [productIds, setProductIds] = useState('')
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    loadStats()
    loadConfig()
  }, [])

  const loadStats = async () => {
    try {
      const res = await fetch('/app/api/suppliers/stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadConfig = async () => {
    try {
      const res = await fetch('/app/api/suppliers/config')
      const data = await res.json()
      if (data.config) {
        setConfig(data.config)
      }
    } catch (err) {
      console.error('Failed to load config:', err)
    }
  }

  const saveConfig = async () => {
    try {
      const res = await fetch('/app/api/suppliers/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      })
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Configuration saved!' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error saving configuration' })
    }
  }

  const startManualSync = async () => {
    setSyncing(true)
    setMessage(null)
    
    try {
      const ids = productIds.split(',').map(id => id.trim()).filter(id => id)
      
      const res = await fetch('/app/api/suppliers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          product_ids: ids,
          config: config
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ 
          type: 'success', 
          text: `Sync complete! Success: ${data.success}, Errors: ${data.errors}` 
        })
        loadStats()
      } else {
        setMessage({ type: 'error', text: data.error || 'Sync error' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Sync error' })
    } finally {
      setSyncing(false)
    }
  }

  const setupCron = async () => {
    try {
      const res = await fetch('/app/api/suppliers/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          enabled: config.enabled,
          interval: config.interval_minutes
        })
      })
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Cron job configured!' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error configuring cron' })
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">API Suppliers - MyPNI B2B</h1>
        <p className="text-gray-600">Manage product synchronization with the supplier</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total B2B Products</div>
          <div className="text-2xl font-bold">{stats?.total_products || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Imported Products</div>
          <div className="text-2xl font-bold text-green-600">{stats?.imported_products || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Active Products</div>
          <div className="text-2xl font-bold text-blue-600">{stats?.active_products || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Out of Stock</div>
          <div className="text-2xl font-bold text-red-600">{stats?.out_of_stock || 0}</div>
        </div>
      </div>

      {/* Last Sync Info */}
      {stats?.last_sync && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="text-sm">
            <strong>Last sync:</strong> {new Date(stats.last_sync).toLocaleString('en-US')}
          </div>
        </div>
      )}

      {/* Manual Import */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">🔄 Manual Sync</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            B2B Product IDs (comma-separated)
          </label>
          <textarea
            className="w-full p-2 border rounded"
            rows={3}
            placeholder="Ex: 9242, 11073, 10996, 10991, 11089"
            value={productIds}
            onChange={(e) => setProductIds(e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">
            Leave empty to sync all existing products
          </div>
        </div>

        <button
          onClick={startManualSync}
          disabled={syncing}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {syncing ? 'Syncing...' : '▶️ Start Sync'}
        </button>
      </div>

      {/* Configuration */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">⚙️ Sync Configuration</h2>
        
        <div className="space-y-4">
          {/* Enable Auto Sync */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={config.enabled}
              onChange={(e) => setConfig({...config, enabled: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="enabled" className="font-medium">
              Enable automatic sync
            </label>
          </div>

          {/* Sync Interval */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Sync interval (minutes)
            </label>
            <input
              type="number"
              min="15"
              max="1440"
              value={config.interval_minutes}
              onChange={(e) => setConfig({...config, interval_minutes: parseInt(e.target.value) || 60})}
              className="w-full p-2 border rounded"
            />
            <div className="text-xs text-gray-500 mt-1">
              Recommended: 60 minutes (1 hour)
            </div>
          </div>

          {/* What to sync */}
          <div className="border-t pt-4">
            <div className="font-medium mb-2">What to sync:</div>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.sync_prices}
                  onChange={(e) => setConfig({...config, sync_prices: e.target.checked})}
                  className="mr-2"
                />
                <span>Prices (RRP + Distribution)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.sync_stock}
                  onChange={(e) => setConfig({...config, sync_stock: e.target.checked})}
                  className="mr-2"
                />
                <span>Available stock</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.sync_images}
                  onChange={(e) => setConfig({...config, sync_images: e.target.checked})}
                  className="mr-2"
                />
                <span>Product images</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.sync_descriptions}
                  onChange={(e) => setConfig({...config, sync_descriptions: e.target.checked})}
                  className="mr-2"
                />
                <span>Full descriptions (up to 5000 characters)</span>
              </label>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="border-t pt-4">
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={config.auto_publish}
                onChange={(e) => setConfig({...config, auto_publish: e.target.checked})}
                className="mr-2"
              />
              <span>Auto-publish new products</span>
            </label>

            <div>
              <label className="block text-sm font-medium mb-2">
                Minimum stock threshold for publishing
              </label>
              <input
                type="number"
                min="0"
                value={config.min_stock_threshold}
                onChange={(e) => setConfig({...config, min_stock_threshold: parseInt(e.target.value) || 0})}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Save Buttons */}
          <div className="flex gap-4 border-t pt-4">
            <button
              onClick={saveConfig}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              💾 Save Configuration
            </button>
            
            <button
              onClick={setupCron}
              disabled={!config.enabled}
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
            >
              ⏰ Configure Cron Job
            </button>
          </div>
        </div>
      </div>

      {/* Cron Info */}
      {config.enabled && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="font-medium mb-2">ℹ️ Cron Job Info</div>
          <div className="text-sm space-y-1">
            <div>• Automatic sync enabled</div>
            <div>• Interval: every {config.interval_minutes} minutes</div>
            <div>• Next run: {new Date(Date.now() + config.interval_minutes * 60000).toLocaleTimeString('en-US')}</div>
          </div>
        </div>
      )}
    </div>
  )
}
