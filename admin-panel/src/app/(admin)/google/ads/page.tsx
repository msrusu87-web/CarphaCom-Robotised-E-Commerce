"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  TrendingUp,
  MousePointer,
  Eye,
  DollarSign,
  Target,
  Search,
  Monitor,
  ShoppingBag,
  Zap,
  ChevronDown,
  ChevronUp,
  Settings,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
} from "lucide-react"

// ─── TYPES ──────────────────────────────────────────────────────

interface CampaignSummary {
  id: string
  name: string
  status: string
  type: string
  budget: number
  budgetName: string
  biddingStrategy: string
  startDate?: string
  endDate?: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  ctr: number
}

interface AccountStats {
  impressions: number
  clicks: number
  cost: number
  conversions: number
  ctr: number
  avgCpc: number
  activeCampaigns: number
}

interface AccountInfo {
  id: string
  descriptiveName: string
  currencyCode: string
  timeZone: string
}

interface SetupStep {
  step: string
  done: boolean
}

// ─── COMPONENT ──────────────────────────────────────────────────

export default function GoogleAdsPage() {
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(false)
  const [missing, setMissing] = useState<string[]>([])
  const [setupSteps, setSetupSteps] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState("")

  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [stats, setStats] = useState<AccountStats | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Create campaign form state
  const [formData, setFormData] = useState({
    name: "",
    type: "SEARCH" as "SEARCH" | "DISPLAY" | "SHOPPING" | "PERFORMANCE_MAX",
    dailyBudget: 50,
    biddingStrategy: "MAXIMIZE_CLICKS" as "MAXIMIZE_CLICKS" | "MAXIMIZE_CONVERSIONS" | "MANUAL_CPC" | "TARGET_SPEND",
    targetCpa: "",
    startDate: "",
    endDate: "",
    keywords: "",
    adHeadlines: ["", "", ""],
    adDescriptions: ["", ""],
    finalUrl: "https://warehouse-orchestrator.ai",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setErrorMessage("")
    try {
      const res = await fetch("/app/api/google/ads/campaigns")
      const data = await res.json()

      if (data.configured === false) {
        setConfigured(false)
        setMissing(data.missing || [])
        setSetupSteps(data.setupSteps || [])
      } else if (data.error === "developer_token_pending") {
        setConfigured(true)
        setErrorMessage(data.message)
      } else if (data.error) {
        setErrorMessage(data.error)
      } else {
        setConfigured(true)
        setAccount(data.account)
        setStats(data.stats)
        setCampaigns(data.campaigns || [])
      }
    } catch (e) {
      setErrorMessage("Server connection error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── CAMPAIGN ACTIONS ──────────────────────────────────────────

  const toggleCampaignStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ENABLED" ? "PAUSED" : "ENABLED"
    setActionLoading(id)
    try {
      const res = await fetch(`/app/api/google/ads/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
      } else {
        const data = await res.json()
        alert(data.error || "Update error")
      }
    } catch {
      alert("Connection error")
    } finally {
      setActionLoading(null)
    }
  }

  const removeCampaign = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete campaign "${name}"? It will be permanently deactivated.`)) return
    setActionLoading(id)
    try {
      const res = await fetch(`/app/api/google/ads/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REMOVED" }),
      })
      if (res.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== id))
      }
    } catch {
      alert("Connection error")
    } finally {
      setActionLoading(null)
    }
  }

  const createCampaign = async () => {
    if (!formData.name.trim()) {
      alert("Campaign name is required")
      return
    }
    setCreating(true)
    try {
      const keywords = formData.keywords
        .split("\n")
        .map(k => k.trim())
        .filter(k => k.length > 0)

      const adHeadlines = formData.adHeadlines.filter(h => h.trim().length > 0)
      const adDescriptions = formData.adDescriptions.filter(d => d.trim().length > 0)

      const res = await fetch("/app/api/google/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          keywords,
          adHeadlines,
          adDescriptions,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setShowCreateForm(false)
        setFormData({
          name: "",
          type: "SEARCH",
          dailyBudget: 50,
          biddingStrategy: "MAXIMIZE_CLICKS",
          targetCpa: "",
          startDate: "",
          endDate: "",
          keywords: "",
          adHeadlines: ["", "", ""],
          adDescriptions: ["", ""],
          finalUrl: "https://warehouse-orchestrator.ai",
        })
        fetchData()
      } else {
        alert(data.error || "Error creating campaign")
      }
    } catch {
      alert("Connection error")
    } finally {
      setCreating(false)
    }
  }

  // ─── HELPERS ───────────────────────────────────────────────────

  const statusColor = (s: string) => {
    switch (s) {
      case "ENABLED": return "text-green-400 bg-green-400/10"
      case "PAUSED": return "text-yellow-400 bg-yellow-400/10"
      default: return "text-gray-400 bg-gray-400/10"
    }
  }

  const statusLabel = (s: string) => {
    switch (s) {
      case "ENABLED": return "Active"
      case "PAUSED": return "Paused"
      default: return s
    }
  }

  const typeIcon = (t: string) => {
    switch (t) {
      case "SEARCH": return <Search className="w-4 h-4" />
      case "DISPLAY": return <Monitor className="w-4 h-4" />
      case "SHOPPING": return <ShoppingBag className="w-4 h-4" />
      case "PERFORMANCE_MAX": return <Zap className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  const typeLabel = (t: string) => {
    switch (t) {
      case "SEARCH": return "Search"
      case "DISPLAY": return "Display"
      case "SHOPPING": return "Shopping"
      case "PERFORMANCE_MAX": return "Performance Max"
      default: return t
    }
  }

  const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(n)
  const fmtMoney = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "RON", minimumFractionDigits: 2 }).format(n)
  const fmtPct = (n: number) => (n * 100).toFixed(2) + "%"

  // ─── RENDER: NOT CONFIGURED ────────────────────────────────────

  if (!loading && !configured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/google" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Google Ads</h1>
            <p className="text-gray-400 text-sm">Advertising Campaign Manager</p>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <Settings className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-2">Configuration required</h2>
              <p className="text-gray-400 mb-4">
                Google Ads is not yet configured. Follow the steps below:
              </p>

              {missing.length > 0 && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm font-medium mb-1">Missing ENV variables:</p>
                  <ul className="list-disc list-inside text-red-300 text-sm">
                    {missing.map(m => <li key={m}><code className="bg-red-500/20 px-1 rounded">{m}</code></li>)}
                  </ul>
                </div>
              )}

              <ol className="space-y-3">
                {(setupSteps.length > 0 ? setupSteps : [
                  "Create a Google Ads account at ads.google.com",
                  "Create a Manager account (MCC) at ads.google.com/home/tools/manager-accounts",
                  "Apply for Developer Token from API Center (Tools → API Center)",
                  "Set GOOGLE_ADS_DEVELOPER_TOKEN in .env.local",
                  "Set GOOGLE_ADS_CUSTOMER_ID (10 digits, no dashes) in .env.local",
                  "Re-connect Google OAuth to approve the new scope (adwords)",
                ]).map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-4 flex gap-3">
                <a
                  href="https://ads.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Google Ads
                </a>
                <a
                  href="https://console.cloud.google.com/apis/library/googleads.googleapis.com?project=YOUR_GOOGLE_PROJECT_ID"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Enable API
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── RENDER: LOADING ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-gray-400">Loading Google Ads...</p>
        </div>
      </div>
    )
  }

  // ─── RENDER: MAIN PAGE ─────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/google" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Google Ads</h1>
            <p className="text-gray-400 text-sm">
              {account?.descriptiveName || "Campaign Manager"} 
              {account?.currencyCode ? ` • ${account.currencyCode}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Reload"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-300 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard icon={<Eye />} label="Impressions" value={fmtNum(stats.impressions)} />
          <StatCard icon={<MousePointer />} label="Clicks" value={fmtNum(stats.clicks)} />
          <StatCard icon={<DollarSign />} label="Cost" value={fmtMoney(stats.cost)} />
          <StatCard icon={<TrendingUp />} label="CTR" value={fmtPct(stats.ctr)} />
          <StatCard icon={<DollarSign />} label="Avg CPC" value={fmtMoney(stats.avgCpc)} />
          <StatCard icon={<Target />} label="Conversions" value={fmtNum(stats.conversions)} />
          <StatCard icon={<Zap />} label="Active Campaigns" value={String(stats.activeCampaigns)} />
        </div>
      )}

      {/* Campaigns List */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700/50">
          <h2 className="text-lg font-semibold text-white">Campaigns ({campaigns.length})</h2>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-10 text-center">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No campaigns</p>
            <p className="text-gray-500 text-sm mb-4">Create your first Google Ads campaign</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="group">
                <div className="px-5 py-4 flex items-center gap-4">
                  {/* Type icon */}
                  <div className="p-2 bg-gray-700/50 rounded-lg text-gray-400">
                    {typeIcon(campaign.type)}
                  </div>

                  {/* Name & info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">{campaign.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(campaign.status)}`}>
                        {statusLabel(campaign.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{typeLabel(campaign.type)}</span>
                      <span>Budget: {fmtMoney(campaign.budget)}/day</span>
                      <span>{campaign.biddingStrategy?.replace(/_/g, " ")}</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Impressions</p>
                      <p className="text-white font-medium">{fmtNum(campaign.impressions)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Clicks</p>
                      <p className="text-white font-medium">{fmtNum(campaign.clicks)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Cost</p>
                      <p className="text-white font-medium">{fmtMoney(campaign.cost)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">CTR</p>
                      <p className="text-white font-medium">{fmtPct(campaign.ctr)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCampaignStatus(campaign.id, campaign.status)}
                      disabled={actionLoading === campaign.id}
                      className={`p-2 rounded-lg transition-colors ${
                        campaign.status === "ENABLED"
                          ? "text-yellow-400 hover:bg-yellow-400/10"
                          : "text-green-400 hover:bg-green-400/10"
                      } disabled:opacity-50`}
                      title={campaign.status === "ENABLED" ? "Pause" : "Activate"}
                    >
                      {campaign.status === "ENABLED" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removeCampaign(campaign.id, campaign.name)}
                      disabled={actionLoading === campaign.id}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedCampaign(expandedCampaign === campaign.id ? null : campaign.id)}
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 transition-colors"
                    >
                      {expandedCampaign === campaign.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedCampaign === campaign.id && (
                  <div className="px-5 pb-4 pl-16 space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">ID:</span>
                        <span className="text-gray-300 ml-2">{campaign.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Conversions:</span>
                        <span className="text-gray-300 ml-2">{fmtNum(campaign.conversions)}</span>
                      </div>
                      {campaign.startDate && (
                        <div>
                          <span className="text-gray-500">Start:</span>
                          <span className="text-gray-300 ml-2">{campaign.startDate}</span>
                        </div>
                      )}
                      {campaign.endDate && (
                        <div>
                          <span className="text-gray-500">End:</span>
                          <span className="text-gray-300 ml-2">{campaign.endDate}</span>
                        </div>
                      )}
                    </div>
                    {/* Mobile metrics */}
                    <div className="md:hidden grid grid-cols-2 gap-3 text-sm mt-2">
                      <div><span className="text-gray-500">Impressions:</span> <span className="text-white">{fmtNum(campaign.impressions)}</span></div>
                      <div><span className="text-gray-500">Clicks:</span> <span className="text-white">{fmtNum(campaign.clicks)}</span></div>
                      <div><span className="text-gray-500">Cost:</span> <span className="text-white">{fmtMoney(campaign.cost)}</span></div>
                      <div><span className="text-gray-500">CTR:</span> <span className="text-white">{fmtPct(campaign.ctr)}</span></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateForm && (
        <CreateCampaignModal
          formData={formData}
          setFormData={setFormData}
          creating={creating}
          onClose={() => setShowCreateForm(false)}
          onSubmit={createCampaign}
        />
      )}
    </div>
  )
}

// ─── STAT CARD ───────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center">
      <div className="flex justify-center mb-2 text-gray-400">{icon}</div>
      <p className="text-white font-semibold text-sm">{value}</p>
      <p className="text-gray-500 text-xs mt-0.5">{label}</p>
    </div>
  )
}

// ─── CREATE CAMPAIGN MODAL ───────────────────────────────────────

function CreateCampaignModal({
  formData,
  setFormData,
  creating,
  onClose,
  onSubmit,
}: {
  formData: any
  setFormData: (fn: any) => void
  creating: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const updateHeadline = (index: number, value: string) => {
    setFormData((prev: any) => {
      const headlines = [...prev.adHeadlines]
      headlines[index] = value
      return { ...prev, adHeadlines: headlines }
    })
  }

  const addHeadline = () => {
    if (formData.adHeadlines.length < 15) {
      setFormData((prev: any) => ({ ...prev, adHeadlines: [...prev.adHeadlines, ""] }))
    }
  }

  const updateDescription = (index: number, value: string) => {
    setFormData((prev: any) => {
      const descriptions = [...prev.adDescriptions]
      descriptions[index] = value
      return { ...prev, adDescriptions: descriptions }
    })
  }

  const addDescription = () => {
    if (formData.adDescriptions.length < 4) {
      setFormData((prev: any) => ({ ...prev, adDescriptions: [...prev.adDescriptions, ""] }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold text-white">New Campaign</h2>
            <p className="text-gray-400 text-sm">Will be created in PAUSED mode for review</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Campaign name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g.: InfoTraffic Stations - Romania"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Campaign Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Campaign type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {([
                { value: "SEARCH", label: "Search", icon: <Search className="w-5 h-5" />, desc: "Text ads on Google" },
                { value: "DISPLAY", label: "Display", icon: <Monitor className="w-5 h-5" />, desc: "Banners on websites" },
                { value: "SHOPPING", label: "Shopping", icon: <ShoppingBag className="w-5 h-5" />, desc: "Products in Shopping" },
                { value: "PERFORMANCE_MAX", label: "PMax", icon: <Zap className="w-5 h-5" />, desc: "AI across all networks" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateField("type", opt.value)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    formData.type === opt.value
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <div className="flex justify-center mb-1">{opt.icon}</div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Budget & Bidding */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Daily budget (RON) *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.dailyBudget}
                onChange={(e) => updateField("dailyBudget", Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">~{(formData.dailyBudget * 30.4).toFixed(0)} RON/month</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bidding strategy</label>
              <select
                value={formData.biddingStrategy}
                onChange={(e) => updateField("biddingStrategy", e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="MAXIMIZE_CLICKS">Maximize clicks</option>
                <option value="MAXIMIZE_CONVERSIONS">Maximize conversions</option>
                <option value="MANUAL_CPC">Manual CPC</option>
                <option value="TARGET_SPEND">Target Spend</option>
              </select>
            </div>
          </div>

          {/* Target CPA */}
          {formData.biddingStrategy === "MAXIMIZE_CONVERSIONS" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target CPA (RON, optional)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.targetCpa}
                onChange={(e) => updateField("targetCpa", e.target.value)}
                placeholder="Leave empty for auto"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start date (optional)</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End date (optional)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Search-specific: Keywords, Ads */}
          {formData.type === "SEARCH" && (
            <>
              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Keywords (one per line)
                </label>
                <textarea
                  value={formData.keywords}
                  onChange={(e) => updateField("keywords", e.target.value)}
                  rows={4}
                  placeholder={"infotraffic stations\nthermal comfort stations\ntraffic equipment Romania\nroad signage"}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Broad match by default. Add [] for exact, "" for phrase.</p>
              </div>

              {/* Landing page */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Landing page URL</label>
                <input
                  type="url"
                  value={formData.finalUrl}
                  onChange={(e) => updateField("finalUrl", e.target.value)}
                  placeholder="https://warehouse-orchestrator.ai"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ad Headlines */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ad headlines (min 3, max 15, each max 30 chars)
                </label>
                <div className="space-y-2">
                  {formData.adHeadlines.map((h: string, i: number) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={30}
                      value={h}
                      onChange={(e) => updateHeadline(i, e.target.value)}
                      placeholder={`Headline ${i + 1}`}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>
                {formData.adHeadlines.length < 15 && (
                  <button onClick={addHeadline} className="mt-2 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add headline
                  </button>
                )}
              </div>

              {/* Ad Descriptions */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ad descriptions (min 2, max 4, each max 90 chars)
                </label>
                <div className="space-y-2">
                  {formData.adDescriptions.map((d: string, i: number) => (
                    <textarea
                      key={i}
                      maxLength={90}
                      value={d}
                      onChange={(e) => updateDescription(i, e.target.value)}
                      placeholder={`Description ${i + 1}`}
                      rows={2}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>
                {formData.adDescriptions.length < 4 && (
                  <button onClick={addDescription} className="mt-2 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add description
                  </button>
                )}
              </div>
            </>
          )}

          {/* Info box */}
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">The campaign will be created in PAUSED mode</p>
              <p className="text-blue-400/70">
                You can review settings and activate manually when ready. 
                Targeting is set to Romania by default.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={creating || !formData.name.trim()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Campaign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
