"use client"

import React, { useEffect, useState, useRef } from "react"

type RobotInfo = {
  name: string
  status: string
  position: { x: number; y: number }
}

type TrackingItem = {
  productName: string
  quantity: number
  picked: boolean
}

type WarehouseTracking = {
  orderId: string
  orderNumber: string
  status: string
  items: TrackingItem[]
  robot: RobotInfo | null
  createdAt: number
  completedAt?: number
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  QUEUED: { label: "Pending", color: "#94a3b8", icon: "⏳" },
  ASSIGNED: { label: "Robot assigned", color: "#3b82f6", icon: "🤖" },
  PICKING: { label: "Collecting", color: "#f97316", icon: "📦" },
  TRANSPORTING: { label: "Transporting", color: "#8b5cf6", icon: "🚀" },
  PACKING: { label: "Packing", color: "#06b6d4", icon: "📋" },
  COMPLETED: { label: "Completed", color: "#10b981", icon: "✅" },
  FAILED: { label: "Error", color: "#ef4444", icon: "❌" },
}

const STEPS = ["QUEUED", "ASSIGNED", "PICKING", "TRANSPORTING", "PACKING", "COMPLETED"]

type WarehouseTrackingWidgetProps = {
  orderId: string
}

const WarehouseTrackingWidget: React.FC<WarehouseTrackingWidgetProps> = ({ orderId }) => {
  const [tracking, setTracking] = useState<WarehouseTracking | null>(null)
  const [error, setError] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchTracking = async () => {
    try {
      const res = await fetch(`/api/warehouse/${orderId}/tracking`)
      if (res.ok) {
        const data = await res.json()
        setTracking(data)
        setError(false)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    }
  }

  useEffect(() => {
    fetchTracking()
    intervalRef.current = setInterval(fetchTracking, 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [orderId])

  if (error || !tracking) return null

  const statusInfo = STATUS_MAP[tracking.status] || STATUS_MAP.QUEUED
  const currentStepIndex = STEPS.indexOf(tracking.status)
  const progressPct = Math.max(0, ((currentStepIndex + 1) / STEPS.length) * 100)
  const pickedCount = tracking.items.filter(i => i.picked).length
  const totalItems = tracking.items.length

  return (
    <div className="bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] rounded-2xl border border-[#334155] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl">
            🤖
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white">RoboFulfill Tracking</p>
            <p className="text-xs text-slate-400">AI Robot Processing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: `${statusInfo.color}20`,
              color: statusInfo.color,
              border: `1px solid ${statusInfo.color}40`,
            }}
          >
            {statusInfo.icon} {statusInfo.label}
          </span>
          <span className="text-slate-400 text-lg">{isExpanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${statusInfo.color}, #06b6d4)`,
            }}
          />
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[#334155] pt-4">
          {/* Steps */}
          <div className="flex items-center justify-between gap-1">
            {STEPS.map((step, i) => {
              const si = STATUS_MAP[step]
              const isActive = i === currentStepIndex
              const isDone = i < currentStepIndex
              return (
                <div key={step} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isActive
                        ? "ring-2 ring-offset-1 ring-offset-[#0f172a]"
                        : ""
                    }`}
                    style={{
                      backgroundColor: isDone || isActive ? `${si.color}30` : "#1e293b",
                      color: isDone || isActive ? si.color : "#475569",
                      borderColor: si.color,
                      ringColor: isActive ? si.color : undefined,
                    }}
                  >
                    {isDone ? "✓" : si.icon}
                  </div>
                  <span className={`text-[10px] ${isDone || isActive ? "text-slate-300" : "text-slate-600"}`}>
                    {si.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Robot info */}
          {tracking.robot && (
            <div className="bg-[#0f172a] rounded-xl p-3 border border-[#334155]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400 font-bold text-sm">🤖 {tracking.robot.name}</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${STATUS_MAP[tracking.robot.status]?.color || '#666'}20`,
                    color: STATUS_MAP[tracking.robot.status]?.color || '#666',
                  }}
                >
                  {tracking.robot.status}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-slate-400">
                <span>📍 Pos: ({tracking.robot.position.x}, {tracking.robot.position.y})</span>
                <span>📦 Collected: {pickedCount}/{totalItems}</span>
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Products ({pickedCount}/{totalItems} collected)
            </p>
            <div className="space-y-1.5">
              {tracking.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm p-2 rounded-lg bg-[#0f172a]"
                >
                  <span className={item.picked ? "text-slate-300" : "text-slate-500"}>
                    {item.picked ? "✅" : "⏳"} {item.productName}
                  </span>
                  <span className="text-slate-500 text-xs">x{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-2">
            <a
              href="/warehouse/"
              target="_blank"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              View live warehouse →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default WarehouseTrackingWidget
