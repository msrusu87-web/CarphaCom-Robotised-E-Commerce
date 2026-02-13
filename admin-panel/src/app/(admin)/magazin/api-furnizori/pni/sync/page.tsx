'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  RefreshCw, Play, Settings, CheckCircle, 
  AlertTriangle, ArrowLeft, Zap, Database, Package,
  FileText, Activity
} from 'lucide-react'

interface SyncSettings {
  stockQuickEnabled: boolean
  stockQuickInterval: number
  priceStockEnabled: boolean
  priceStockInterval: number
  fullImportEnabled: boolean
  fullImportTime: string
  lastUpdated: string
}

interface SyncStatus {
  runningStatus: Record<string, boolean>
  recentJobs: Array<{
    id: string
    type: string
    status: string
    startedAt: string
    completedAt?: string
  }>
}

export default function PNISyncSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SyncSettings>({
    stockQuickEnabled: true,
    stockQuickInterval: 15,
    priceStockEnabled: true,
    priceStockInterval: 2,
    fullImportEnabled: true,
    fullImportTime: '03:00',
    lastUpdated: ''
  })
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [logs, setLogs] = useState<string>('')

  const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'

  const loadData = useCallback(async () => {
    try {
      const settingsRes = await fetch(BACKEND_URL + '/admin/pni/settings', {
        credentials: 'include'
      })
      if (settingsRes.ok) {
        const data = await settingsRes.json()
        if (data.success && data.data?.settings) {
          setSettings(data.data.settings)
        }
      }

      const statusRes = await fetch(BACKEND_URL + '/admin/pni/sync', {
        credentials: 'include'
      })
      if (statusRes.ok) {
        const data = await statusRes.json()
        if (data.success) {
          setSyncStatus(data.data)
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [BACKEND_URL])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleSaveSettings = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(BACKEND_URL + '/admin/pni/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Setari salvate! Cron actualizat.' })
        loadData()
      } else {
        setMessage({ type: 'error', text: data.error || 'Eroare la salvare' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Eroare de conexiune' })
    } finally {
      setSaving(false)
    }
  }

  const handleManualSync = async (type: string) => {
    setSyncing(type)
    setMessage(null)

    try {
      const res = await fetch(BACKEND_URL + '/admin/pni/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: type + ' pornit! Durata estimata: ' + data.data.estimatedDuration
        })
        loadData()
      } else {
        setMessage({ type: 'error', text: data.error || 'Eroare' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Eroare la sync' })
    } finally {
      setSyncing(null)
    }
  }

  const loadLogs = async (type: string) => {
    try {
      const res = await fetch(BACKEND_URL + '/admin/pni/sync?type=' + type, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data?.recentLogs) {
          setLogs(data.data.recentLogs)
        }
      }
    } catch (err) {
      console.error('Failed to load logs:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sincronizare PNI</h1>
          <p className="text-gray-600 mt-1">Gestioneaza sincronizarea automata si manuala cu PNI B2B</p>
        </div>
        <button
          onClick={() => router.push('/magazin/api-furnizori/pni')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Inapoi la PNI
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Manual Sync */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Play className="w-5 h-5" />
          Sincronizare Manuala
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'stock-quick', label: 'Stoc Rapid', desc: 'Doar stoc (~1 min)', icon: Zap, color: 'green' },
            { id: 'price-stock', label: 'Pret + Stoc', desc: 'Preturi si stoc (3-5 min)', icon: Database, color: 'blue' },
            { id: 'full-import', label: 'Import Complet', desc: 'Produse noi (10-20 min)', icon: Package, color: 'purple' }
          ].map((sync) => {
            const Icon = sync.icon
            const isRunning = syncStatus?.runningStatus?.[sync.id]
            
            return (
              <div key={sync.id} className={`border-2 rounded-xl p-5 ${isRunning ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-8 h-8 text-${sync.color}-600`} />
                  {isRunning && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Ruleaza</span>}
                </div>
                <h3 className="font-semibold text-gray-900">{sync.label}</h3>
                <p className="text-sm text-gray-600 mt-1 mb-4">{sync.desc}</p>
                <button
                  onClick={() => handleManualSync(sync.id)}
                  disabled={isRunning || syncing === sync.id}
                  className={`w-full py-2 rounded-lg font-medium ${
                    isRunning ? 'bg-gray-100 text-gray-400' : `bg-${sync.color}-600 text-white hover:bg-${sync.color}-700`
                  }`}
                >
                  {syncing === sync.id ? 'Porneste...' : isRunning ? 'In curs' : 'Porneste'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurare Automatizare (Cron)
        </h2>

        <div className="space-y-4">
          {/* Stock Quick */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-medium">Stoc Rapid</h3>
                  <p className="text-sm text-gray-500">Verifica stocul frecvent</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.stockQuickEnabled}
                onChange={(e) => setSettings({...settings, stockQuickEnabled: e.target.checked})}
                className="w-5 h-5"
              />
            </div>
            {settings.stockQuickEnabled && (
              <div className="mt-3 pt-3 border-t flex items-center gap-3">
                <label className="text-sm">Interval:</label>
                <select
                  value={settings.stockQuickInterval}
                  onChange={(e) => setSettings({...settings, stockQuickInterval: parseInt(e.target.value)})}
                  className="border rounded px-3 py-1"
                >
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={60}>1 ora</option>
                </select>
              </div>
            )}
          </div>

          {/* Price Stock */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium">Pret + Stoc</h3>
                  <p className="text-sm text-gray-500">Actualizare preturi complete</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.priceStockEnabled}
                onChange={(e) => setSettings({...settings, priceStockEnabled: e.target.checked})}
                className="w-5 h-5"
              />
            </div>
            {settings.priceStockEnabled && (
              <div className="mt-3 pt-3 border-t flex items-center gap-3">
                <label className="text-sm">Interval:</label>
                <select
                  value={settings.priceStockInterval}
                  onChange={(e) => setSettings({...settings, priceStockInterval: parseInt(e.target.value)})}
                  className="border rounded px-3 py-1"
                >
                  <option value={1}>1 ora</option>
                  <option value={2}>2 ore</option>
                  <option value={3}>3 ore</option>
                  <option value={6}>6 ore</option>
                  <option value={12}>12 ore</option>
                </select>
              </div>
            )}
          </div>

          {/* Full Import */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-medium">Import Complet</h3>
                  <p className="text-sm text-gray-500">Import produse noi zilnic</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.fullImportEnabled}
                onChange={(e) => setSettings({...settings, fullImportEnabled: e.target.checked})}
                className="w-5 h-5"
              />
            </div>
            {settings.fullImportEnabled && (
              <div className="mt-3 pt-3 border-t flex items-center gap-3">
                <label className="text-sm">Ora zilnica:</label>
                <input
                  type="time"
                  value={settings.fullImportTime}
                  onChange={(e) => setSettings({...settings, fullImportTime: e.target.value})}
                  className="border rounded px-3 py-1"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-6 border-t">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Salveaza Setarile
          </button>
        </div>
      </div>

      {/* Recent Jobs */}
      {syncStatus?.recentJobs && syncStatus.recentJobs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activitate Recenta
          </h2>
          <div className="space-y-2">
            {syncStatus.recentJobs.slice(0, 10).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    job.status === 'completed' ? 'bg-green-500' :
                    job.status === 'running' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium">{job.type}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  job.status === 'completed' ? 'bg-green-100 text-green-700' :
                  job.status === 'running' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Loguri
        </h2>
        <div className="flex gap-2 mb-4">
          <button onClick={() => loadLogs('stock-quick')} className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg">Stoc Rapid</button>
          <button onClick={() => loadLogs('price-stock')} className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg">Pret+Stoc</button>
          <button onClick={() => loadLogs('full-import')} className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg">Import</button>
        </div>
        {logs && (
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-64">{logs}</pre>
        )}
      </div>
    </div>
  )
}
