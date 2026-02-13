"use client"

import { useState, useCallback } from "react"
import { clx } from "@medusajs/ui"

interface TrackingEvent {
  date: string
  time: string
  status: string
  location: string
}

interface CourierInfo {
  id: string
  name: string
  icon: string
  trackUrl: string
}

interface TrackingResult {
  awb: string
  courier: CourierInfo | null
  detected: boolean
  currentStatus: string
  statusType: 'in_transit' | 'delivered' | 'picked_up' | 'processing' | 'returned' | 'unknown'
  estimatedDelivery: string | null
  events: TrackingEvent[]
  trackingUrl: string
  possibleCouriers?: CourierInfo[]
}

const COURIERS = [
  { id: "fan-courier", name: "FAN Courier", icon: "🚚", color: "from-blue-500 to-blue-600", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
  { id: "sameday", name: "Sameday", icon: "📦", color: "from-orange-500 to-orange-600", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/30" },
  { id: "cargus", name: "Cargus", icon: "🚛", color: "from-red-500 to-red-600", bgColor: "bg-red-500/10", borderColor: "border-red-500/30" },
  { id: "gls", name: "GLS Romania", icon: "🌐", color: "from-yellow-500 to-yellow-600", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/30" },
  { id: "dpd", name: "DPD Romania", icon: "🏢", color: "from-red-600 to-red-700", bgColor: "bg-red-600/10", borderColor: "border-red-600/30" },
  { id: "posta-romana", name: "Romanian Post", icon: "📮", color: "from-indigo-500 to-indigo-600", bgColor: "bg-indigo-500/10", borderColor: "border-indigo-500/30" },
  { id: "urgent-cargus", name: "Urgent Cargus", icon: "⚡", color: "from-purple-500 to-purple-600", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30" },
  { id: "nemo", name: "NEMO Express", icon: "🚀", color: "from-cyan-500 to-cyan-600", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/30" },
]

const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string; bgColor: string }> = {
  delivered: { icon: "✅", label: "Delivered", color: "text-green-400", bgColor: "bg-green-500/10 border-green-500/30" },
  in_transit: { icon: "🚚", label: "In transit", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/30" },
  picked_up: { icon: "📬", label: "Picked up by courier", color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/30" },
  processing: { icon: "⚙️", label: "Processing", color: "text-yellow-400", bgColor: "bg-yellow-500/10 border-yellow-500/30" },
  returned: { icon: "↩️", label: "Returned", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/30" },
  unknown: { icon: "📋", label: "Unknown status", color: "text-dark-300", bgColor: "bg-dark-700 border-dark-600" },
}

const AWBTracker = () => {
  const [awbNumber, setAwbNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [forceCourier, setForceCourier] = useState<string | null>(null)

  const handleTrack = useCallback(async (overrideCourier?: string) => {
    const awb = awbNumber.trim()
    if (!awb) return

    setIsLoading(true)
    setError(null)

    try {
      const courierParam = overrideCourier || forceCourier
      const url = `/api/tracking?awb=${encodeURIComponent(awb)}${courierParam ? `&courier=${courierParam}` : ''}`
      const res = await fetch(url)
      
      if (!res.ok) {
        throw new Error('Error checking tracking')
      }
      
      const data: TrackingResult = await res.json()
      setResult(data)
      setForceCourier(null)

      // Save to localStorage history
      try {
        const history = JSON.parse(localStorage.getItem('awb_history') || '[]')
        const exists = history.findIndex((h: any) => h.awb === awb)
        if (exists >= 0) history.splice(exists, 1)
        history.unshift({ awb, courier: data.courier?.name || 'Unknown', date: new Date().toISOString() })
        localStorage.setItem('awb_history', JSON.stringify(history.slice(0, 10)))
      } catch {}
    } catch (err) {
      setError('Could not retrieve tracking information. Check your AWB number.')
    } finally {
      setIsLoading(false)
    }
  }, [awbNumber, forceCourier])

  const statusConfig = result ? STATUS_CONFIG[result.statusType] || STATUS_CONFIG.unknown : null

  // Get history from localStorage
  const getHistory = () => {
    try {
      return JSON.parse(localStorage.getItem('awb_history') || '[]')
    } catch {
      return []
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5 small:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-1">
            <span className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-sm">
              📍
            </span>
            Check Package Status
          </h2>
          <p className="text-dark-400 text-sm">
            Enter the AWB and we'll auto-detect the courier.
          </p>
        </div>

        {/* AWB Input + Track button */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={awbNumber}
              onChange={(e) => {
                setAwbNumber(e.target.value)
                setResult(null)
                setError(null)
              }}
              placeholder="Enter AWB number..."
              className="w-full px-4 py-3.5 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTrack()
              }}
            />
            {awbNumber && (
              <button
                onClick={() => { setAwbNumber(""); setResult(null); setError(null) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => handleTrack()}
            disabled={!awbNumber.trim() || isLoading}
            className="px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-dark-600 disabled:to-dark-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98] text-sm whitespace-nowrap"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Searching...
              </span>
            ) : '🔍 Track'}
          </button>
        </div>

        {/* Manual courier selection (if needed) */}
        {!result && (
          <div className="mt-4">
            <p className="text-xs text-dark-400 mb-3">Or select courier manually:</p>
            <div className="grid grid-cols-4 2xsmall:grid-cols-4 xsmall:grid-cols-4 small:grid-cols-8 gap-2">
              {COURIERS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setForceCourier(c.id)
                    if (awbNumber.trim()) handleTrack(c.id)
                  }}
                  className={clx(
                    "flex flex-col items-center p-2.5 rounded-xl border transition-all group",
                    forceCourier === c.id
                      ? `${c.bgColor} ${c.borderColor} border-2`
                      : "bg-dark-700/50 border-dark-600 hover:border-primary-500/50"
                  )}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{c.icon}</span>
                  <span className="text-[10px] font-medium text-dark-300 text-center leading-tight mt-1">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-red-400 text-xl">⚠️</span>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Tracking Result */}
      {result && (
        <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
          {/* Status Banner */}
          <div className={clx("p-5 border-b", statusConfig?.bgColor || "bg-dark-700 border-dark-600")}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{statusConfig?.icon}</span>
                <div>
                  <p className={clx("font-bold text-lg", statusConfig?.color || "text-white")}>
                    {statusConfig?.label}
                  </p>
                  <p className="text-dark-300 text-sm">{result.currentStatus}</p>
                </div>
              </div>
              {result.courier && (
                <div className="flex items-center gap-2 bg-dark-700/80 rounded-lg px-3 py-2">
                  <span className="text-lg">{result.courier.icon}</span>
                  <div>
                    <p className="text-white text-sm font-semibold">{result.courier.name}</p>
                    <p className="text-dark-400 text-xs">{result.detected ? 'Auto-detected' : 'Manually selected'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* AWB & Estimated Delivery */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="bg-dark-700/60 rounded-lg px-3 py-1.5">
                <span className="text-dark-400">AWB: </span>
                <span className="text-white font-mono font-bold">{result.awb}</span>
              </div>
              {result.estimatedDelivery && (
                <div className="bg-dark-700/60 rounded-lg px-3 py-1.5">
                  <span className="text-dark-400">Estimated delivery: </span>
                  <span className="text-primary-400 font-semibold">{result.estimatedDelivery}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Events */}
          {result.events.length > 0 ? (
            <div className="p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>📋</span> Tracking History
              </h3>
              <div className="relative pl-6">
                {/* Timeline line */}
                <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-dark-600" />
                
                <div className="space-y-4">
                  {result.events.map((event, i) => {
                    const isLatest = i === 0
                    return (
                      <div key={i} className="relative flex gap-4">
                        {/* Timeline dot */}
                        <div className={clx(
                          "absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center",
                          isLatest
                            ? "bg-primary-500 border-primary-400 shadow-lg shadow-primary-500/30"
                            : "bg-dark-700 border-dark-500"
                        )}>
                          {isLatest && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={clx(
                            "font-medium text-sm",
                            isLatest ? "text-white" : "text-dark-300"
                          )}>
                            {event.status}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-dark-400">
                            {event.date && <span>📅 {event.date}</span>}
                            {event.time && <span>🕐 {event.time}</span>}
                            {event.location && <span>📍 {event.location}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 text-center">
              <p className="text-dark-400 text-sm mb-3">
                No detailed tracking events found.
              </p>
            </div>
          )}

          {/* External link */}
          {result.trackingUrl && (
            <div className="px-5 pb-5">
              <a
                href={result.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-xl text-primary-400 hover:text-primary-300 font-medium text-sm transition-all"
              >
                <span>🔗</span>
                Open tracking on {result.courier?.name || 'courier website'}
                <span className="text-dark-500">→</span>
              </a>
            </div>
          )}

          {/* If not detected, show possible couriers */}
          {!result.detected && result.possibleCouriers && result.possibleCouriers.length > 0 && (
            <div className="px-5 pb-5">
              <p className="text-dark-400 text-sm mb-3">Could not auto-detect the courier. Try one of these:</p>
              <div className="grid grid-cols-2 small:grid-cols-4 gap-2">
                {result.possibleCouriers.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => handleTrack(c.id)}
                    className="flex items-center gap-2 p-3 bg-dark-700/50 border border-dark-600 rounded-xl hover:border-primary-500/50 transition-all text-sm"
                  >
                    <span>{c.icon}</span>
                    <span className="text-white font-medium">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5">
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
          <span>💡</span> Useful Tips
        </h4>
        <ul className="text-xs text-dark-400 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-primary-400">•</span>
            The courier is auto-detected from the AWB structure
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400">•</span>
            The AWB can be found on your order confirmation or shipping email
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400">•</span>
            Tracking updates may take a few hours to appear
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400">•</span>
            If auto-detection doesn't work, manually select the courier
          </li>
        </ul>
      </div>
    </div>
  )
}

export default AWBTracker
