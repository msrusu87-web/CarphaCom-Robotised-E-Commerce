"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Users, Mail, MessageSquare, FileText, BarChart3,
  Plus, Search, Trash2, RefreshCw, Send, Eye, Download,
  Upload, Play, Square, Sparkles, Phone, Settings,
  ChevronLeft, ChevronRight, X, Check, AlertCircle, Loader2,
  Globe, Shield, Zap, MapPin, ChevronDown, ChevronUp,
  Key, Wifi, WifiOff, Bot, ScanSearch, Eraser, ExternalLink
} from "lucide-react"

// ==================== TYPES ====================
interface ContactList { id: number; name: string; slug: string; description: string; color: string; contact_count: number; actual_count: string; email_count: string; phone_count: string; created_at: string }
interface Contact { id: number; list_id: number; list_name: string; company_name: string; contact_name: string; email: string; phone: string; website: string; city: string; county: string; category: string; source: string; unsubscribed: boolean; created_at: string }
interface ScrapeJob { id: number; list_name: string; status: string; sources: string[]; categories: string[]; target_count: number; scraped_count: number; new_count: number; duplicate_count: number; created_at: string }
interface Template { id: number; name: string; subject: string; html_body: string; text_body: string; variables: string[]; category: string; is_default: boolean }
interface Campaign { id: number; name: string; type: string; status: string; template_name: string; template_id: number; list_ids: number[]; subject: string; sms_message: string; sent_count: number; failed_count: number; total_recipients: string; delivered_count: string; created_at: string; started_at: string; completed_at: string }
interface SubCat { id: string; name: string; keywords: string[] }
interface BizCat { id: string; name: string; icon: string; description: string; subcategories: SubCat[] }
interface ProxyInfo { id: number; ip: string; port: number; protocol: string; country: string; anonymity: string; speed_ms: number; is_valid: boolean; source: string; fail_count: number; success_count: number }
interface Stats { contacts: any; lists: any; campaigns: any; emailStats: any; smsStats: any; recentCampaigns: any[]; sourceBreakdown: any[] }

const TABS = [
  { id: "contacts", label: "Contacts & Scraping", icon: Users },
  { id: "email", label: "Email Campaigns", icon: Mail },
  { id: "sms", label: "SMS Campaigns", icon: MessageSquare },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "stats", label: "Statistics", icon: BarChart3 },
]

const SOURCES = [
  { id: "websearch", name: "Brave Search", icon: "🔍", desc: "Brave Search → visits websites → extracts contacts" },
  { id: "googlemaps", name: "Google Maps", icon: "📍", desc: "Searches on Brave (maps queries) + visits websites" },
]

function api(path: string, opts?: RequestInit) {
  return fetch(`/app/api/marketing${path}`, { ...opts, headers: { "Content-Type": "application/json", ...opts?.headers } })
    .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Error"); return d })
}

function Badge({ text, color }: { text: string; color: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-700", red: "bg-red-100 text-red-700", yellow: "bg-yellow-100 text-yellow-700",
    blue: "bg-blue-100 text-blue-700", gray: "bg-gray-100 text-gray-700", purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>{text}</span>
}

function statusBadge(s: string) {
  const map: Record<string, [string, string]> = {
    draft: ["Draft", "gray"], sending: ["Sending...", "yellow"], sent: ["Sent", "green"],
    failed: ["Failed", "red"], cancelled: ["Cancelled", "orange"], running: ["Running", "blue"],
    completed: ["Completed", "green"], pending: ["Pending", "gray"],
  }
  const [t, c] = map[s] || [s, "gray"]
  return <Badge text={t} color={c} />
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${type === "success" ? "bg-green-600" : "bg-red-600"}`}>
      {type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose} className="ml-2"><X className="w-3 h-3" /></button>
    </div>
  )
}

// ==================== MAIN PAGE ====================
export default function MarketingPage() {
  const [tab, setTab] = useState("contacts")
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

  const notify = useCallback((msg: string, type: "success" | "error" = "success") => setToast({ msg, type }), [])

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
        <p className="text-gray-500">Scraping, Email & SMS — Complete marketing system</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "contacts" && <ContactsTab notify={notify} />}
      {tab === "email" && <EmailTab notify={notify} />}
      {tab === "sms" && <SmsTab notify={notify} />}
      {tab === "templates" && <TemplatesTab notify={notify} />}
      {tab === "stats" && <StatsTab />}
    </div>
  )
}

// ==================== TAB 1: CONTACTS & SCRAPING (BLOCK-BASED) ====================
function ContactsTab({ notify }: { notify: (m: string, t?: "success" | "error") => void }) {
  const [lists, setLists] = useState<ContactList[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [jobs, setJobs] = useState<ScrapeJob[]>([])
  const [categories, setCategories] = useState<BizCat[]>([])
  const [selectedList, setSelectedList] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  // ─── Block 1: Proxy State ───
  const [proxyStats, setProxyStats] = useState<any>(null)
  const [proxyList, setProxyList] = useState<ProxyInfo[]>([])
  const [proxyScan, setProxyScan] = useState(false)
  const [proxyExpanded, setProxyExpanded] = useState(false)

  // ─── Block 2: CAPTCHA & Search Engines ───
  const [captchaExpanded, setCaptchaExpanded] = useState(false)
  const [scraperConfig, setScraperConfig] = useState<any>(null)
  const [testingBrave, setTestingBrave] = useState(false)
  const [braveTestResult, setBraveTestResult] = useState<string>("")
  const [testingGmaps, setTestingGmaps] = useState(false)
  const [gmapsTestResult, setGmapsTestResult] = useState<string>("")
  const [gmapsKey, setGmapsKey] = useState("")
  const [gmapsKeyExpanded, setGmapsKeyExpanded] = useState(false)

  // ─── Block 3: Category Selection ───
  const [selectedCatId, setSelectedCatId] = useState("")
  const [selectedSubcats, setSelectedSubcats] = useState<string[]>([])
  const [catExpanded, setCatExpanded] = useState<string | null>(null)

  // ─── Block 4: Scraping ───
  const [scrapeListId, setScrapeListId] = useState(0)
  const [scrapeNewListName, setScrapeNewListName] = useState("")
  const [scrapeSources, setScrapeSources] = useState<string[]>(["websearch"])
  const [scrapeCity, setScrapeCity] = useState("")
  const [scrapeCount, setScrapeCount] = useState(300)
  const [scrapeUseProxy, setScrapeUseProxy] = useState(false)

  // ─── New list creation ───
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [newListDesc, setNewListDesc] = useState("")

  const loadLists = useCallback(async () => {
    const d = await api("/lists"); setLists(d.lists || [])
  }, [])

  const loadContacts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: page.toString(), limit: "50" })
    if (selectedList) params.set("list_id", selectedList.toString())
    if (search) params.set("search", search)
    const d = await api(`/contacts?${params}`)
    setContacts(d.contacts || [])
    setTotalPages(d.totalPages || 1)
    setTotal(d.total || 0)
    setLoading(false)
  }, [selectedList, search, page])

  const loadJobs = useCallback(async () => {
    const d = await api("/scrape"); setJobs(d.jobs || []); setCategories(d.categories || [])
  }, [])

  const loadProxies = useCallback(async () => {
    try {
      const d = await api("/proxies")
      setProxyStats(d.stats)
      setProxyList(d.proxies?.slice(0, 50) || [])
    } catch {}
  }, [])

  const loadScraperConfig = useCallback(async () => {
    try {
      const d = await api("/scrape/config")
      setScraperConfig(d)
    } catch {}
  }, [])

  useEffect(() => { loadLists(); loadJobs(); loadProxies(); loadScraperConfig() }, [loadLists, loadJobs, loadProxies, loadScraperConfig])
  useEffect(() => { loadContacts() }, [loadContacts])

  // Auto-refresh jobs every 8 seconds if any are running
  useEffect(() => {
    const running = jobs.some(j => j.status === 'running' || j.status === 'pending')
    if (!running) return
    const timer = setInterval(() => { loadJobs(); loadContacts(); loadLists() }, 8000)
    return () => clearInterval(timer)
  }, [jobs, loadJobs, loadContacts, loadLists])

  // ─── Actions ───
  const scanProxies = async () => {
    setProxyScan(true)
    try {
      const r = await api("/proxies", { method: "POST" })
      notify(`Proxy scan complete: ${r.scanned} scanned, ${r.valid} valid`)
      loadProxies()
    } catch (e: any) { notify(e.message, "error") }
    setProxyScan(false)
  }

  const clearProxies = async () => {
    if (!confirm("Delete all proxies?")) return
    await api("/proxies?action=clear", { method: "DELETE" })
    notify("Proxies deleted"); loadProxies()
  }

  const cleanupProxies = async () => {
    const r = await api("/proxies", { method: "DELETE" })
    notify(`${r.removed} invalid proxies removed`); loadProxies()
  }

  const testBraveSearch = async () => {
    setTestingBrave(true); setBraveTestResult("")
    try {
      const d = await api("/scrape/config", { method: "POST", body: JSON.stringify({ action: "test_brave" }) })
      setBraveTestResult(d.test?.message || "Test completed")
    } catch (e: any) { setBraveTestResult(`❌ Error: ${e.message}`) }
    setTestingBrave(false)
  }

  const testGmapsApi = async () => {
    setTestingGmaps(true); setGmapsTestResult("")
    try {
      const d = await api("/scrape/config", { method: "POST", body: JSON.stringify({ action: "test_gmaps" }) })
      setGmapsTestResult(d.test?.message || "Test completed")
    } catch (e: any) { setGmapsTestResult(`❌ Error: ${e.message}`) }
    setTestingGmaps(false)
  }

  const saveGmapsKey = async () => {
    if (!gmapsKey.trim()) { notify("Enter the API Key", "error"); return }
    try {
      await api("/scrape/config", { method: "POST", body: JSON.stringify({ action: "save_gmaps_key", api_key: gmapsKey.trim() }) })
      notify("Google Maps API Key saved!"); setGmapsKey(""); loadScraperConfig()
    } catch (e: any) { notify(e.message, "error") }
  }

  const createList = async () => {
    if (!newListName) return
    await api("/lists", { method: "POST", body: JSON.stringify({ name: newListName, description: newListDesc }) })
    setNewListName(""); setNewListDesc(""); setShowNewList(false)
    notify("List created"); loadLists()
  }

  const deleteList = async (id: number) => {
    if (!confirm("Delete the list and all contacts?")) return
    await api(`/lists/${id}`, { method: "DELETE" })
    if (selectedList === id) setSelectedList(null)
    notify("List deleted"); loadLists(); loadContacts()
  }

  const clearListContacts = async (id: number) => {
    const listName = lists.find(l => l.id === id)?.name || "List"
    if (!confirm(`Delete ALL contacts from "${listName}"? The list will remain but without contacts.`)) return
    try {
      const r = await api(`/lists/${id}`, { method: "PUT", body: JSON.stringify({ action: "clear_contacts" }) })
      notify(`${r.deleted || 0} contacts deleted from "${listName}"`)
      loadLists(); loadContacts()
    } catch (e: any) { notify(e.message, "error") }
  }

  const startScrape = async () => {
    let targetListId = scrapeListId
    if (targetListId === -1) {
      if (!scrapeNewListName.trim()) { notify("Enter the new list name", "error"); return }
      const r = await api("/lists", { method: "POST", body: JSON.stringify({ name: scrapeNewListName.trim() }) })
      targetListId = r.list?.id
      if (!targetListId) { notify("Error creating list", "error"); return }
      setScrapeNewListName(""); loadLists()
    }
    if (!targetListId || targetListId < 1) { notify("Select or create a list", "error"); return }
    if (!selectedCatId) { notify("Select a category", "error"); return }
    if (scrapeSources.length === 0) { notify("Select at least one source", "error"); return }
    const subcats: Record<string, string[]> = {}
    if (selectedSubcats.length > 0) subcats[selectedCatId] = selectedSubcats
    await api("/scrape", {
      method: "POST",
      body: JSON.stringify({
        list_id: targetListId, sources: scrapeSources, categories: [selectedCatId],
        subcategories: subcats, target_count: scrapeCount, city: scrapeCity, use_proxy: scrapeUseProxy,
      })
    })
    notify("Scraping started!"); loadJobs()
  }

  const cancelScrape = async (jobId: number) => {
    await api(`/scrape?job_id=${jobId}`, { method: "DELETE" })
    notify("Scraping stopped"); loadJobs()
  }

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedList) return
    const text = await file.text()
    const lines = text.split("\n").filter(l => l.trim())
    if (lines.length < 2) { notify("Empty CSV", "error"); return }
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""))
    const cts = lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/"/g, ""))
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = vals[i] || "" })
      return obj
    })
    const res = await api("/contacts/import", { method: "POST", body: JSON.stringify({ list_id: selectedList, contacts: cts }) })
    notify(`Import: ${res.imported} new, ${res.duplicates} dup, ${res.errors} errors`)
    loadContacts(); loadLists()
    if (fileRef.current) fileRef.current.value = ""
  }

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Delete ${selectedIds.length} contacts?`)) return
    await api("/contacts", { method: "DELETE", body: JSON.stringify({ ids: selectedIds }) })
    setSelectedIds([]); notify(`${selectedIds.length} contacts deleted`); loadContacts(); loadLists()
  }

  const selectedCat = categories.find(c => c.id === selectedCatId)

  return (
    <div className="space-y-6">

      {/* ═══════════ BLOCK 1: PROXY MANAGEMENT ═══════════ */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button onClick={() => setProxyExpanded(!proxyExpanded)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-100/50 transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center text-sm font-bold">1</div>
            <div className="text-left">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-600" />Proxy Pool & Surse
              </h3>
              <p className="text-xs text-gray-500">
                {proxyStats ? `${proxyStats.valid || 0} valid out of ${proxyStats.total || 0} • avg ${proxyStats.avg_speed || 0}ms` : "Scan free proxies for anonymous scraping"}
              </p>
            </div>
          </div>
          {proxyExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {proxyExpanded && (
          <div className="px-5 pb-5 space-y-4 border-t">
            {/* Proxy stats bar */}
            {proxyStats && proxyStats.total > 0 && (
              <div className="grid grid-cols-4 gap-3 pt-4">
                <div className="bg-white rounded-lg border p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{proxyStats.total}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="bg-white rounded-lg border p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{proxyStats.valid}</div>
                  <div className="text-xs text-gray-500">Valid</div>
                </div>
                <div className="bg-white rounded-lg border p-3 text-center">
                  <div className="text-xl font-bold text-red-500">{proxyStats.invalid}</div>
                  <div className="text-xs text-gray-500">Invalid</div>
                </div>
                <div className="bg-white rounded-lg border p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">{proxyStats.avg_speed || 0}ms</div>
                  <div className="text-xs text-gray-500">Average Speed</div>
                </div>
              </div>
            )}

            {/* Proxy Sources */}
            {scraperConfig?.proxySources && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Proxy Sources (6 free sources)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {scraperConfig.proxySources.map((src: any) => (
                    <div key={src.id} className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-start gap-2">
                      <Globe className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-800">{src.name}</div>
                        <div className="text-[10px] text-gray-400 truncate">{src.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button onClick={scanProxies} disabled={proxyScan}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-60">
                {proxyScan ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanSearch className="w-4 h-4" />}
                {proxyScan ? "Scanning..." : "Scan New Sources"}
              </button>
              {proxyStats?.total > 0 && (
                <>
                  <button onClick={cleanupProxies} className="px-3 py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm hover:bg-yellow-100">
                    Clean Invalid
                  </button>
                  <button onClick={clearProxies} className="px-3 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100">
                    Delete All
                  </button>
                  <button onClick={loadProxies} className="px-3 py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Proxy table (compact, first 20) */}
            {proxyList.length > 0 && (
              <div className="bg-white rounded-lg border overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500">IP:Port</th>
                      <th className="px-3 py-2 text-left text-gray-500">Protocol</th>
                      <th className="px-3 py-2 text-left text-gray-500">Country</th>
                      <th className="px-3 py-2 text-left text-gray-500">Speed</th>
                      <th className="px-3 py-2 text-left text-gray-500">Status</th>
                      <th className="px-3 py-2 text-left text-gray-500">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {proxyList.slice(0, 20).map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-1.5 font-mono">{p.ip}:{p.port}</td>
                        <td className="px-3 py-1.5">{p.protocol}</td>
                        <td className="px-3 py-1.5">{p.country || "—"}</td>
                        <td className="px-3 py-1.5">{p.speed_ms > 0 ? `${p.speed_ms}ms` : "—"}</td>
                        <td className="px-3 py-1.5">{p.is_valid ? <span className="text-green-600 font-medium">Valid</span> : <span className="text-red-500">Invalid</span>}</td>
                        <td className="px-3 py-1.5 text-gray-400">{p.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════ BLOCK 2: CAPTCHA SYSTEMS & SEARCH ENGINES ═══════════ */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 shadow-sm overflow-hidden">
        <button onClick={() => setCaptchaExpanded(!captchaExpanded)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-amber-50/80 transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center text-sm font-bold">2</div>
            <div className="text-left">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Bot className="w-4 h-4 text-amber-600" />CAPTCHA Solvers & Search Engines
              </h3>
              <p className="text-xs text-gray-500">
                {scraperConfig ? `${scraperConfig.captchaSystems?.filter((s: any) => s.status === 'active').length || 0} active systems • Brave Search ${scraperConfig.searchEngines?.find((e: any) => e.id === 'brave')?.status === 'primary' ? '✅' : '❌'}` : "Anti-CAPTCHA and search engine configuration"}
              </p>
            </div>
          </div>
          {captchaExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {captchaExpanded && (
          <div className="px-5 pb-5 space-y-5 border-t pt-4">

            {/* CAPTCHA Solver Systems */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">CAPTCHA Solver Systems</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(scraperConfig?.captchaSystems || []).map((sys: any) => (
                  <div key={sys.id} className={`flex items-start gap-3 p-3 rounded-lg border ${sys.status === 'active' ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0 ${sys.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'}`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-800">{sys.name}</div>
                      <div className="text-xs text-gray-500">{sys.desc}</div>
                    </div>
                    <Badge text={sys.status === 'active' ? 'Active' : 'Inactive'} color={sys.status === 'active' ? 'green' : 'gray'} />
                  </div>
                ))}
              </div>
              {scraperConfig?.captchaStats && (
                <div className="mt-3 flex gap-4 text-xs text-gray-500 bg-white rounded-lg border p-3">
                  <span>Attempts: <strong>{scraperConfig.captchaStats.attempts}</strong></span>
                  <span>Resolved: <strong className="text-green-600">{scraperConfig.captchaStats.successes}</strong></span>
                  <span>Failed: <strong className="text-red-500">{scraperConfig.captchaStats.fails}</strong></span>
                  <span>Success rate: <strong>{scraperConfig.captchaStats.successRate}</strong></span>
                </div>
              )}
            </div>

            {/* Search Engines */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Search Engines (Scraping Sources)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(scraperConfig?.searchEngines || []).map((eng: any) => (
                  <div key={eng.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                    eng.status === 'primary' ? 'border-green-300 bg-green-50' :
                    eng.status === 'configured' ? 'border-blue-200 bg-blue-50' :
                    eng.status === 'blocked' ? 'border-red-200 bg-red-50/50' :
                    'border-gray-200 bg-gray-50'
                  }`}>
                    {eng.status === 'primary' ? <Wifi className="w-5 h-5 text-green-600 flex-shrink-0" /> :
                     eng.status === 'configured' ? <Key className="w-5 h-5 text-blue-600 flex-shrink-0" /> :
                     eng.status === 'blocked' ? <WifiOff className="w-5 h-5 text-red-400 flex-shrink-0" /> :
                     <Settings className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800">{eng.name}</div>
                      <div className="text-xs text-gray-500">{eng.desc}</div>
                    </div>
                    <Badge text={
                      eng.status === 'primary' ? 'Primary' :
                      eng.status === 'configured' ? 'Configured' :
                      eng.status === 'blocked' ? 'Blocked' : 'Needs Config'
                    } color={
                      eng.status === 'primary' ? 'green' :
                      eng.status === 'configured' ? 'blue' :
                      eng.status === 'blocked' ? 'red' : 'yellow'
                    } />
                  </div>
                ))}
              </div>
            </div>

            {/* Test Connection + Google Maps API */}
            <div className="flex flex-wrap gap-3 pt-1">
              <button onClick={testBraveSearch} disabled={testingBrave}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-60">
                {testingBrave ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                Test Brave Search
              </button>
              <button onClick={() => setGmapsKeyExpanded(!gmapsKeyExpanded)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Key className="w-4 h-4" />
                {scraperConfig?.gmapsConfigured ? 'Reconfigure Google Maps API' : 'Configure Google Maps API'}
              </button>
              {scraperConfig?.gmapsConfigured && (
                <button onClick={testGmapsApi} disabled={testingGmaps}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                  {testingGmaps ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  Test Google Maps API
                </button>
              )}
            </div>

            {/* Test Results */}
            {braveTestResult && (
              <div className={`p-3 rounded-lg text-sm ${braveTestResult.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {braveTestResult}
              </div>
            )}
            {gmapsTestResult && (
              <div className={`p-3 rounded-lg text-sm ${gmapsTestResult.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {gmapsTestResult}
              </div>
            )}

            {/* Google Maps API Key Input */}
            {gmapsKeyExpanded && (
              <div className="bg-white rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Google Places API (New)</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      With Places API (New) you harvest directly through API — structured results: company name, address, phone, website.
                      Then the scraper visits each company's website to extract the email. Much more precise than web scraping.
                    </p>
                    <a href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2">
                      <ExternalLink className="w-3 h-3" />Enable Places API (New) on Google Cloud
                    </a>
                    <div className="text-[10px] text-gray-400 mt-1">
                      1. Click the link above → Enable / Activate<br/>
                      2. Then go to <strong>Credentials → Create Credentials → API Key</strong><br/>
                      3. Copy the API Key and paste it here<br/>
                      <span className="text-red-400">⚠ IMPORTANT: Enable "Places API (New)" — NOT "Places API" legacy!</span><br/>
                      Direct link: <a href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com" target="_blank" className="text-blue-500 underline">Places API (New)</a>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input value={gmapsKey} onChange={e => setGmapsKey(e.target.value)}
                    placeholder="AIzaSy... (API Key from Google Cloud)"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono" />
                  <button onClick={saveGmapsKey} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    Save
                  </button>
                </div>
                {scraperConfig?.gmapsConfigured && (
                  <div className="text-xs text-green-600">Current key: {scraperConfig.gmapsKey}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════ BLOCK 3: CATEGORY SELECTION ═══════════ */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center text-sm font-bold">3</div>
          <div>
            <h3 className="font-bold text-gray-900">Choose Business Category</h3>
            <p className="text-xs text-gray-500">Select the domain and subcategories for scraping</p>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
            {categories.map(cat => (
              <button key={cat.id}
                onClick={() => {
                  setSelectedCatId(cat.id === selectedCatId ? "" : cat.id)
                  setSelectedSubcats([])
                  setCatExpanded(cat.id === selectedCatId ? null : cat.id)
                }}
                className={`text-left p-3 rounded-lg border-2 transition-all ${
                  selectedCatId === cat.id
                    ? "border-purple-500 bg-purple-50 ring-1 ring-purple-300"
                    : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50"
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-semibold text-sm text-gray-900 truncate">{cat.name}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{cat.subcategories?.length || 0} subcategories</p>
              </button>
            ))}
          </div>

          {selectedCat && selectedCat.subcategories && (
            <div className="bg-white rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-purple-700">{selectedCat.icon} {selectedCat.name} — Subcategories</h4>
                <button onClick={() => {
                  if (selectedSubcats.length === selectedCat.subcategories.length) setSelectedSubcats([])
                  else setSelectedSubcats(selectedCat.subcategories.map(s => s.id))
                }} className="text-xs text-purple-600 hover:underline">
                  {selectedSubcats.length === selectedCat.subcategories.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedCat.subcategories.map(sub => (
                  <label key={sub.id}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      selectedSubcats.includes(sub.id)
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-200 hover:border-purple-200"
                    }`}>
                    <input type="checkbox" checked={selectedSubcats.includes(sub.id)}
                      onChange={e => setSelectedSubcats(p => e.target.checked ? [...p, sub.id] : p.filter(x => x !== sub.id))}
                      className="rounded mt-0.5 text-purple-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sub.name}</div>
                      <div className="text-xs text-gray-400 truncate">{sub.keywords.slice(0, 2).join(", ")}</div>
                    </div>
                  </label>
                ))}
              </div>
              {selectedSubcats.length === 0 && (
                <p className="text-xs text-gray-400 italic">If you don't select subcategories, all will be used.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ BLOCK 4: SCRAPING CONFIG & LAUNCH ═══════════ */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-600 text-white flex items-center justify-center text-sm font-bold">4</div>
          <div>
            <h3 className="font-bold text-gray-900">Configuration & Launch Scraping</h3>
            <p className="text-xs text-gray-500">
              {selectedCatId ? `Category: ${categories.find(c => c.id === selectedCatId)?.name}` : "Select a category above"}
              {selectedSubcats.length > 0 ? ` • ${selectedSubcats.length} subcategories` : ""}
            </p>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Destination List</label>
              <select value={scrapeListId} onChange={e => setScrapeListId(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500">
                <option value={0}>Select list...</option>
                <option value={-1}>+ Create New List</option>
                {lists.map(l => <option key={l.id} value={l.id}>{l.name} ({l.actual_count} contacts)</option>)}
              </select>
              {scrapeListId === -1 && (
                <input value={scrapeNewListName} onChange={e => setScrapeNewListName(e.target.value)}
                  placeholder="New list name..."
                  className="mt-2 w-full px-3 py-2 border rounded-lg text-sm" />
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">City (optional)</label>
              <input value={scrapeCity} onChange={e => setScrapeCity(e.target.value)} placeholder="e.g.: Bucharest, Cluj..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Target Contact Count</label>
              <input type="number" value={scrapeCount} onChange={e => setScrapeCount(parseInt(e.target.value) || 300)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Use Proxy</label>
              <label className="flex items-center gap-3 px-3 py-2.5 border rounded-lg bg-white cursor-pointer">
                <input type="checkbox" checked={scrapeUseProxy}
                  onChange={e => setScrapeUseProxy(e.target.checked)}
                  className="rounded text-green-600 w-5 h-5" />
                <span className="text-sm text-gray-700">{scrapeUseProxy ? "Yes — via proxy pool" : "No — direct"}</span>
              </label>
              {scrapeUseProxy && (!proxyStats || proxyStats.valid === 0) && (
                <p className="text-xs text-amber-600 mt-1">⚠ No valid proxy. Scan first!</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Scraping Sources</label>
            <div className="flex gap-3">
              {SOURCES.map(s => (
                <label key={s.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all flex-1 ${
                    scrapeSources.includes(s.id) ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:border-green-300"
                  }`}>
                  <input type="checkbox" checked={scrapeSources.includes(s.id)}
                    onChange={e => setScrapeSources(p => e.target.checked ? [...p, s.id] : p.filter(x => x !== s.id))}
                    className="rounded text-green-600 w-5 h-5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{s.icon} {s.name}</div>
                    <div className="text-xs text-gray-500">{s.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-green-200/50">
            <div className="text-sm text-gray-500">
              {selectedCatId && scrapeListId ? (
                <>
                  <strong>{categories.find(c => c.id === selectedCatId)?.name}</strong>
                  {" → "}
                  {scrapeListId === -1 ? <strong>{scrapeNewListName || "New list"}</strong> : <strong>{lists.find(l => l.id === scrapeListId)?.name}</strong>}
                  {" • "}{scrapeCount} contacts
                  {scrapeUseProxy && " • with proxy"}
                </>
              ) : (
                <span className="text-amber-600">Fill in all fields to start.</span>
              )}
            </div>
            <button onClick={startScrape}
              disabled={!selectedCatId || (!scrapeListId && scrapeListId !== -1) || scrapeSources.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 shadow-sm">
              <Play className="w-5 h-5" />Start Scraping
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════ ACTIVE JOBS ═══════════ */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Scraping Jobs</h3>
            <button onClick={loadJobs} className="text-gray-400 hover:text-gray-600"><RefreshCw className="w-4 h-4" /></button>
          </div>
          <div className="divide-y">
            {jobs.map(j => (
              <div key={j.id} className="px-4 py-3 flex items-center gap-4 text-sm">
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{j.list_name || "—"}</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-500">{j.sources?.join(", ")}</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-500">{j.categories?.join(", ")}</span>
                </div>
                {(j.status === "running") && (
                  <div className="w-32 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all animate-pulse"
                      style={{ width: `${j.target_count > 0 ? Math.min((j.scraped_count / j.target_count) * 100, 100) : 50}%` }} />
                  </div>
                )}
                <div className="text-gray-600">{j.scraped_count}/{j.target_count}</div>
                <div className="text-green-600">{j.new_count} new</div>
                <div className="text-yellow-600">{j.duplicate_count} dup</div>
                {statusBadge(j.status)}
                {(j.status === "running" || j.status === "pending") && (
                  <button onClick={() => cancelScrape(j.id)} className="text-red-500 hover:text-red-700"><Square className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ CONTACTS TABLE WITH LIST MANAGEMENT ═══════════ */}
      <div className="space-y-3">
        {/* Lists bar */}
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={() => { setSelectedList(null); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${!selectedList ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
            Toate ({lists.reduce((s, l) => s + parseInt(l.actual_count || "0"), 0)})
          </button>
          {lists.map(l => (
            <div key={l.id} className="relative group">
              <button onClick={() => { setSelectedList(l.id); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${selectedList === l.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: l.color }} />
                {l.name} ({l.actual_count})
              </button>
              {/* Delete & Clear buttons on hover */}
              <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5">
                <button onClick={() => clearListContacts(l.id)} title="Empty list (delete contacts)"
                  className="w-5 h-5 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs hover:bg-yellow-600">
                  <Eraser className="w-3 h-3" />
                </button>
                <button onClick={() => deleteList(l.id)} title="Delete list completely"
                  className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => setShowNewList(true)} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50">
            <Plus className="w-4 h-4 inline mr-1" />New List
          </button>
          <div className="ml-auto flex gap-2">
            {selectedList && (
              <>
                <button onClick={() => clearListContacts(selectedList)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600">
                  <Eraser className="w-4 h-4" />Empty List
                </button>
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                  <Upload className="w-4 h-4" />Import CSV
                </button>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
              </>
            )}
          </div>
        </div>

        {showNewList && (
          <div className="bg-white rounded-xl border p-4 space-y-3 shadow-sm">
            <h3 className="font-semibold text-gray-900">New List</h3>
            <input value={newListName} onChange={e => setNewListName(e.target.value)} placeholder="List name" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input value={newListDesc} onChange={e => setNewListDesc(e.target.value)} placeholder="Description (optional)" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="flex gap-2">
              <button onClick={createList} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">Create</button>
              <button onClick={() => setShowNewList(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg">Cancel</button>
            </div>
          </div>
        )}

        {/* Contacts Table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search contacts..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
            </div>
            <span className="text-sm text-gray-500">{total} contacts</span>
            {selectedIds.length > 0 && (
              <button onClick={deleteSelected} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg"><Trash2 className="w-3 h-3" />{selectedIds.length} selected</button>
            )}
            <button onClick={loadContacts} className="text-gray-400 hover:text-gray-600"><RefreshCw className="w-4 h-4" /></button>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3 w-8">
                      <input type="checkbox" checked={selectedIds.length === contacts.length && contacts.length > 0}
                        onChange={e => setSelectedIds(e.target.checked ? contacts.map(c => c.id) : [])} className="rounded" />
                    </th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">List</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contacts.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <input type="checkbox" checked={selectedIds.includes(c.id)}
                          onChange={e => setSelectedIds(e.target.checked ? [...selectedIds, c.id] : selectedIds.filter(x => x !== c.id))} className="rounded" />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-gray-900">{c.company_name || "—"}</div>
                        {c.contact_name && <div className="text-xs text-gray-400">{c.contact_name}</div>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{c.email && !c.email.includes("no-email") && !c.email.includes("@unknown") ? c.email : "—"}</td>
                      <td className="px-4 py-2.5 text-gray-600">{c.phone || "—"}</td>
                      <td className="px-4 py-2.5 text-gray-500">{c.city || "—"}</td>
                      <td className="px-4 py-2.5"><Badge text={c.source || "?"} color="gray" /></td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{c.list_name || "—"}</td>
                    </tr>
                  ))}
                  {contacts.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No contacts found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-2 py-1 rounded border text-sm disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-2 py-1 rounded border text-sm disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== TAB 2: EMAIL CAMPAIGNS ====================
function EmailTab({ notify }: { notify: (m: string, t?: "success" | "error") => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [lists, setLists] = useState<ContactList[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: "", template_id: 0, list_ids: [] as number[], subject: "" })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSubjects, setAiSubjects] = useState<string[]>([])
  const [previewHtml, setPreviewHtml] = useState("")
  // Test email state
  const [testEmail, setTestEmail] = useState("")
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null)
  // Quick-send workflow
  const [quickMode, setQuickMode] = useState(false)
  const [quickTpl, setQuickTpl] = useState(0)
  const [quickList, setQuickList] = useState(0)
  const [quickSubject, setQuickSubject] = useState("")
  const [quickTestEmail, setQuickTestEmail] = useState("")
  const [quickPreviewHtml, setQuickPreviewHtml] = useState("")
  const [quickSending, setQuickSending] = useState(false)
  const [quickAiLoading, setQuickAiLoading] = useState(false)
  const [quickAiSubjects, setQuickAiSubjects] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const [c, t, l] = await Promise.all([api("/campaigns"), api("/templates"), api("/lists")])
    setCampaigns((c.campaigns || []).filter((x: Campaign) => x.type === "email"))
    setTemplates(t.templates || [])
    setLists(l.lists || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const createCampaign = async () => {
    if (!form.name || form.list_ids.length === 0) { notify("Complete the name and select lists", "error"); return }
    await api("/campaigns", { method: "POST", body: JSON.stringify({ ...form, type: "email" }) })
    setShowNew(false); setForm({ name: "", template_id: 0, list_ids: [], subject: "" }); notify("Campaign created"); load()
  }

  const sendCampaign = async (id: number) => {
    if (!confirm("Send the campaign now? This action cannot be undone.")) return
    await api(`/campaigns/${id}/send`, { method: "POST" })
    notify("Campaign has started sending!"); load()
  }

  const deleteCampaign = async (id: number) => {
    if (!confirm("Delete campaign?")) return
    await api(`/campaigns/${id}`, { method: "DELETE" })
    notify("Campaign deleted"); load()
  }

  const genAI = async (quick = false) => {
    const tplId = quick ? quickTpl : form.template_id
    const tpl = templates.find(t => t.id === tplId)
    if (!tpl) { notify("Select a template first", "error"); return }
    if (quick) setQuickAiLoading(true); else setAiLoading(true)
    try {
      const d = await api("/campaigns/ai-subject", { method: "POST", body: JSON.stringify({ body_preview: tpl.text_body?.slice(0, 300) || tpl.name }) })
      if (quick) setQuickAiSubjects(d.subjects || []); else setAiSubjects(d.subjects || [])
    } catch { notify("AI Error", "error") }
    if (quick) setQuickAiLoading(false); else setAiLoading(false)
  }

  const preview = (tplId: number, where: "form" | "quick" = "form") => {
    const tpl = templates.find(t => t.id === tplId)
    if (tpl) {
      if (where === "quick") setQuickPreviewHtml(tpl.html_body)
      else setPreviewHtml(tpl.html_body)
    }
  }

  // Send test email
  const sendTestEmail = async (quick = false) => {
    const email = quick ? quickTestEmail : testEmail
    const tplId = quick ? quickTpl : form.template_id
    const subject = quick ? quickSubject : form.subject
    if (!email) { notify("Enter a test email", "error"); return }
    if (!tplId) { notify("Select a template", "error"); return }
    if (quick) setQuickSending(true); else setTestSending(true)
    setTestResult(null)
    try {
      const r = await api("/campaigns/test-send", {
        method: "POST",
        body: JSON.stringify({ template_id: tplId, subject, test_email: email })
      })
      if (r.success) {
        setTestResult({ success: true, msg: `Email sent successfully to ${email}` })
        notify(`Test email sent to ${email}`)
      } else {
        setTestResult({ success: false, msg: r.error || "Error" })
        notify(r.error || "Error", "error")
      }
    } catch (err: any) {
      setTestResult({ success: false, msg: err.message })
      notify(err.message, "error")
    }
    if (quick) setQuickSending(false); else setTestSending(false)
  }

  // Quick Send — create campaign + send immediately
  const quickSendBulk = async () => {
    if (!quickTpl || !quickList || !quickSubject) { notify("Complete the template, list, and subject", "error"); return }
    if (!confirm(`Send email to the entire list? This action cannot be undone.`)) return
    setQuickSending(true)
    try {
      const listObj = lists.find(l => l.id === quickList)
      const tplObj = templates.find(t => t.id === quickTpl)
      const campaignName = `${tplObj?.name || "Campaign"} → ${listObj?.name || "List"} (${new Date().toLocaleDateString("en-US")})`
      // Create campaign
      const c = await api("/campaigns", {
        method: "POST",
        body: JSON.stringify({ name: campaignName, type: "email", template_id: quickTpl, list_ids: [quickList], subject: quickSubject })
      })
      // Send immediately
      await api(`/campaigns/${c.campaign.id}/send`, { method: "POST" })
      notify("Campaign has started sending!")
      setQuickMode(false); setQuickTpl(0); setQuickList(0); setQuickSubject(""); setQuickTestEmail(""); setQuickPreviewHtml("")
      load()
    } catch (err: any) {
      notify(err.message, "error")
    }
    setQuickSending(false)
  }

  return (
    <div className="space-y-6">
      {/* Header with two buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Email Campaigns</h2>
        <div className="flex gap-2">
          <button onClick={() => { setQuickMode(true); setShowNew(false) }} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
            <Send className="w-4 h-4" />Send Quick Email
          </button>
          <button onClick={() => { setShowNew(true); setQuickMode(false) }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />New Campaign
          </button>
        </div>
      </div>

      {/* ====== QUICK SEND WORKFLOW ====== */}
      {quickMode && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-green-800 flex items-center gap-2"><Send className="w-5 h-5" />Send Quick Email</h3>
            <button onClick={() => setQuickMode(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-sm text-green-700">Choose the template, list, send a test first, then bulk send.</p>

          {/* Step 1: Template + Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">1. Choose Template</label>
              <div className="flex gap-2">
                <select value={quickTpl} onChange={e => { setQuickTpl(parseInt(e.target.value)); setQuickPreviewHtml("") }}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500">
                  <option value={0}>Select template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
                </select>
                {quickTpl > 0 && (
                  <button onClick={() => preview(quickTpl, "quick")} className="px-3 py-2 border rounded-lg text-gray-600 hover:bg-gray-50" title="Preview">
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">2. Choose List</label>
              <select value={quickList} onChange={e => setQuickList(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500">
                <option value={0}>Select list...</option>
                {lists.map(l => <option key={l.id} value={l.id}>{l.name} — {l.email_count} emails</option>)}
              </select>
            </div>
          </div>

          {/* Subject line */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">3. Email Subject</label>
            <div className="flex gap-2">
              <input value={quickSubject} onChange={e => setQuickSubject(e.target.value)} placeholder="e.g.: Special spring offer..."
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500" />
              <button onClick={() => genAI(true)} disabled={quickAiLoading || !quickTpl}
                className="flex items-center gap-1 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-sm hover:bg-purple-100 disabled:opacity-50">
                {quickAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate AI
              </button>
            </div>
            {quickAiSubjects.length > 0 && (
              <div className="mt-2 space-y-1">
                {quickAiSubjects.map((s, i) => (
                  <button key={i} onClick={() => { setQuickSubject(s); setQuickAiSubjects([]) }}
                    className="block w-full text-left px-3 py-1.5 text-sm text-purple-700 bg-purple-50 rounded hover:bg-purple-100">{s}</button>
                ))}
              </div>
            )}
          </div>

          {/* Preview inline */}
          {quickPreviewHtml && (
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Preview Template</span>
                <button onClick={() => setQuickPreviewHtml("")} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <iframe srcDoc={quickPreviewHtml} className="w-full h-[350px] border-0" sandbox="" />
            </div>
          )}

          {/* Step 4: Test email */}
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              4. Send Test Email
              <span className="text-xs font-normal text-gray-400">(check how it looks before bulk send)</span>
            </label>
            <div className="flex gap-2">
              <input value={quickTestEmail} onChange={e => setQuickTestEmail(e.target.value)} placeholder="Test email (e.g.: admin@example.com)"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white" />
              <button onClick={() => sendTestEmail(true)} disabled={quickSending || !quickTpl || !quickTestEmail}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
                {quickSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Test
              </button>
            </div>
            {testResult && (
              <div className={`text-sm px-3 py-2 rounded-lg ${testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {testResult.success ? <Check className="w-4 h-4 inline mr-1" /> : <AlertCircle className="w-4 h-4 inline mr-1" />}
                {testResult.msg}
              </div>
            )}
          </div>

          {/* Step 5: Bulk Send */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-gray-500">
              {quickTpl > 0 && quickList > 0 && (
                <>Template: <strong>{templates.find(t => t.id === quickTpl)?.name}</strong> → Lista: <strong>{lists.find(l => l.id === quickList)?.name}</strong> ({lists.find(l => l.id === quickList)?.email_count} emails)</>
              )}
            </div>
            <button onClick={quickSendBulk} disabled={quickSending || !quickTpl || !quickList || !quickSubject}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 shadow-sm">
              {quickSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Send Bulk to Entire List
            </button>
          </div>
        </div>
      )}

      {/* ====== NEW CAMPAIGN FORM (advanced) ====== */}
      {showNew && !quickMode && (
        <div className="bg-white rounded-xl border p-5 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">New Email Campaign</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Campaign Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g.: Newsletter February" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Template</label>
              <div className="flex gap-2">
                <select value={form.template_id} onChange={e => setForm(p => ({ ...p, template_id: parseInt(e.target.value) }))} className="flex-1 px-3 py-2 border rounded-lg text-sm">
                  <option value={0}>Select template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
                </select>
                {form.template_id > 0 && <button onClick={() => preview(form.template_id)} className="px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"><Eye className="w-4 h-4" /></button>}
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email Subject</label>
            <div className="flex gap-2">
              <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Subject..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              <button onClick={() => genAI(false)} disabled={aiLoading} className="flex items-center gap-1 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-sm hover:bg-purple-100 disabled:opacity-50">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI
              </button>
            </div>
            {aiSubjects.length > 0 && (
              <div className="mt-2 space-y-1">
                {aiSubjects.map((s, i) => (
                  <button key={i} onClick={() => { setForm(p => ({ ...p, subject: s })); setAiSubjects([]) }}
                    className="block w-full text-left px-3 py-1.5 text-sm text-purple-700 bg-purple-50 rounded hover:bg-purple-100">{s}</button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Destination Lists</label>
            <div className="flex flex-wrap gap-2">
              {lists.map(l => (
                <label key={l.id} className="flex items-center gap-1.5 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
                  <input type="checkbox" checked={form.list_ids.includes(l.id)}
                    onChange={e => setForm(p => ({
                      ...p,
                      list_ids: e.target.checked ? [...p.list_ids, l.id] : p.list_ids.filter(x => x !== l.id)
                    }))} className="rounded" />
                  {l.name} <span className="text-gray-400">({l.email_count} emails)</span>
                </label>
              ))}
            </div>
          </div>
          {/* Test email before creating */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Test Email <span className="text-xs text-gray-400">(optional — check first)</span>
            </label>
            <div className="flex gap-2">
              <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="Test email..." className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white" />
              <button onClick={() => sendTestEmail(false)} disabled={testSending || !form.template_id || !testEmail}
                className="flex items-center gap-1 px-3 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 disabled:opacity-50">
                {testSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Test
              </button>
            </div>
            {testResult && (
              <div className={`text-sm px-3 py-2 rounded ${testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {testResult.msg}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={createCampaign} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">Create Draft</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewHtml("")}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b flex justify-between items-center">
              <span className="font-semibold text-sm">Preview Template</span>
              <button onClick={() => setPreviewHtml("")}><X className="w-4 h-4" /></button>
            </div>
            <iframe srcDoc={previewHtml} className="w-full h-[600px] border-0" sandbox="" />
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Existing Campaigns</h3>
          <button onClick={load} className="text-gray-400 hover:text-gray-600"><RefreshCw className="w-4 h-4" /></button>
        </div>
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Template</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium">Failed</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    {c.subject && <div className="text-xs text-gray-400 truncate max-w-xs">{c.subject}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.template_name || "—"}</td>
                  <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{c.sent_count || 0}</td>
                  <td className="px-4 py-3 text-red-600">{c.failed_count || 0}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.created_at ? new Date(c.created_at).toLocaleDateString("en-US") : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {c.status === "draft" && (
                        <button onClick={() => sendCampaign(c.id)} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100"><Send className="w-3 h-3 inline mr-1" />Send</button>
                      )}
                      <button onClick={() => deleteCampaign(c.id)} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No email campaigns</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ==================== TAB 3: SMS CAMPAIGNS ====================
function SmsTab({ notify }: { notify: (m: string, t?: "success" | "error") => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [lists, setLists] = useState<ContactList[]>([])
  const [smsConfig, setSmsConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: "", list_ids: [] as number[], sms_message: "" })
  const [testMsg, setTestMsg] = useState("")
  const [testLoading, setTestLoading] = useState(false)
  const [editConfig, setEditConfig] = useState(false)
  const [cfgForm, setCfgForm] = useState({ system_id: "", password: "", smpp_host: "", smpp_port: 2776, sender: "", test_phone: "", max_throughput: 10, is_active: true })

  const load = useCallback(async () => {
    setLoading(true)
    const [c, l, sc] = await Promise.all([api("/campaigns"), api("/lists"), api("/sms/config")])
    setCampaigns((c.campaigns || []).filter((x: Campaign) => x.type === "sms"))
    setLists(l.lists || [])
    if (sc.config) {
      setSmsConfig(sc.config)
      setCfgForm({ system_id: sc.config.system_id || "", password: sc.config.password || "", smpp_host: sc.config.smpp_host || "", smpp_port: sc.config.smpp_port || 2776, sender: sc.config.sender || "", test_phone: sc.config.test_phone || "", max_throughput: sc.config.max_throughput || 10, is_active: sc.config.is_active !== false })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const saveConfig = async () => {
    try {
      await api("/sms/config", { method: "PUT", body: JSON.stringify(cfgForm) })
      notify("SMS configuration saved!"); setEditConfig(false); load()
    } catch (e: any) { notify(e.message, "error") }
  }

  const createCampaign = async () => {
    if (!form.name || !form.sms_message || form.list_ids.length === 0) { notify("Complete all fields", "error"); return }
    await api("/campaigns", { method: "POST", body: JSON.stringify({ ...form, type: "sms" }) })
    setShowNew(false); setForm({ name: "", list_ids: [], sms_message: "" }); notify("SMS Campaign created"); load()
  }

  const sendCampaign = async (id: number) => {
    if (!confirm("Send the SMS campaign now?")) return
    await api(`/campaigns/${id}/send`, { method: "POST" })
    notify("SMS campaign has started!"); load()
  }

  const deleteCampaign = async (id: number) => {
    if (!confirm("Delete campaign?")) return
    await api(`/campaigns/${id}`, { method: "DELETE" })
    notify("Campaign deleted"); load()
  }

  const sendTest = async () => {
    setTestLoading(true)
    try {
      const res = await api("/sms/test", { method: "POST", body: JSON.stringify({ message: testMsg || undefined }) })
      if (res.success) notify(`Test SMS sent! ID: ${res.messageId || "OK"}`)
      else notify(res.error || "Error", "error")
    } catch (e: any) { notify(e.message, "error") }
    setTestLoading(false)
  }

  const charCount = form.sms_message.length
  const smsCount = Math.ceil(charCount / 160) || 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">SMS Campaigns</h2>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
          <Plus className="w-4 h-4" />SMS Campaign
        </button>
      </div>

      {/* OVH Config + Test */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2"><Settings className="w-4 h-4" />OVH SMPP Configuration</h3>
            <button onClick={() => setEditConfig(!editConfig)} className="text-xs text-blue-600 hover:underline">{editConfig ? "Cancel" : "Edit"}</button>
          </div>
          {editConfig ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">System ID</label>
                  <input value={cfgForm.system_id} onChange={e => setCfgForm(p => ({...p, system_id: e.target.value}))} className="w-full px-2 py-1.5 border rounded text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Password</label>
                  <input value={cfgForm.password} onChange={e => setCfgForm(p => ({...p, password: e.target.value}))} type="password" className="w-full px-2 py-1.5 border rounded text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">SMPP Host</label>
                  <input value={cfgForm.smpp_host} onChange={e => setCfgForm(p => ({...p, smpp_host: e.target.value}))} className="w-full px-2 py-1.5 border rounded text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">SMPP Port</label>
                  <input type="number" value={cfgForm.smpp_port} onChange={e => setCfgForm(p => ({...p, smpp_port: parseInt(e.target.value) || 2776}))} className="w-full px-2 py-1.5 border rounded text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Sender Name</label>
                  <input value={cfgForm.sender} onChange={e => setCfgForm(p => ({...p, sender: e.target.value}))} className="w-full px-2 py-1.5 border rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Test Phone</label>
                  <input value={cfgForm.test_phone} onChange={e => setCfgForm(p => ({...p, test_phone: e.target.value}))} className="w-full px-2 py-1.5 border rounded text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Max Throughput (msg/s)</label>
                  <input type="number" value={cfgForm.max_throughput} onChange={e => setCfgForm(p => ({...p, max_throughput: parseInt(e.target.value) || 10}))} className="w-full px-2 py-1.5 border rounded text-sm" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm pb-1.5">
                    <input type="checkbox" checked={cfgForm.is_active} onChange={e => setCfgForm(p => ({...p, is_active: e.target.checked}))} className="rounded" />
                    Activ
                  </label>
                </div>
              </div>
              <button onClick={saveConfig} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Save</button>
            </div>
          ) : smsConfig ? (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">System ID:</span><span className="font-mono text-gray-700">{smsConfig.system_id}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Host:</span><span className="font-mono text-gray-700">{smsConfig.smpp_host}:{smsConfig.smpp_port}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Sender:</span><span className="text-gray-700">{smsConfig.sender}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Test phone:</span><span className="font-mono text-gray-700">{smsConfig.test_phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Max throughput:</span><span className="text-gray-700">{smsConfig.max_throughput} msg/s</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status:</span>{smsConfig.is_active ? <Badge text="Active" color="green" /> : <Badge text="Inactive" color="red" />}</div>
            </div>
          ) : <p className="text-sm text-gray-400">Not configured</p>}
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2"><Phone className="w-4 h-4" />Test SMS</h3>
          <p className="text-xs text-gray-400 mb-2">Send test SMS to {smsConfig?.test_phone || "—"}</p>
          <input value={testMsg} onChange={e => setTestMsg(e.target.value)} placeholder="Test message (optional)" className="w-full px-3 py-2 border rounded-lg text-sm mb-3" />
          <button onClick={sendTest} disabled={testLoading} className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-50">
            {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Send Test
          </button>
        </div>
      </div>

      {/* New SMS Campaign */}
      {showNew && (
        <div className="bg-white rounded-xl border p-5 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">New SMS Campaign</h3>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Campaign Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g.: SMS Promo February" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">SMS Message <span className="text-gray-400 font-normal">({charCount}/160 • {smsCount} SMS{smsCount > 1 ? "es" : ""})</span></label>
            <textarea value={form.sms_message} onChange={e => setForm(p => ({ ...p, sms_message: e.target.value }))} placeholder="Write the SMS message... You can use {{company_name}}" rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Destination Lists</label>
            <div className="flex flex-wrap gap-2">
              {lists.map(l => (
                <label key={l.id} className="flex items-center gap-1.5 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
                  <input type="checkbox" checked={form.list_ids.includes(l.id)}
                    onChange={e => setForm(p => ({
                      ...p,
                      list_ids: e.target.checked ? [...p.list_ids, l.id] : p.list_ids.filter(x => x !== l.id)
                    }))} className="rounded" />
                  {l.name} <span className="text-gray-400">({l.phone_count} phones)</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createCampaign} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg">Create Draft</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* SMS Campaigns Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium">Failed</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-xs">{c.sms_message || "—"}</td>
                  <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{c.sent_count || 0}</td>
                  <td className="px-4 py-3 text-red-600">{c.failed_count || 0}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.created_at ? new Date(c.created_at).toLocaleDateString("en-US") : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {c.status === "draft" && (
                        <button onClick={() => sendCampaign(c.id)} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100"><Send className="w-3 h-3 inline mr-1" />Send</button>
                      )}
                      <button onClick={() => deleteCampaign(c.id)} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No SMS campaigns</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ==================== TAB 4: TEMPLATES ====================
function TemplatesTab({ notify }: { notify: (m: string, t?: "success" | "error") => void }) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Template | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: "", subject: "", html_body: "", text_body: "", category: "general" })
  const [previewHtml, setPreviewHtml] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const d = await api("/templates")
    setTemplates(d.templates || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.name || !form.subject || !form.html_body) { notify("Complete all fields", "error"); return }
    if (editing) {
      await api(`/templates/${editing.id}`, { method: "PUT", body: JSON.stringify(form) })
      notify("Template updated")
    } else {
      await api("/templates", { method: "POST", body: JSON.stringify(form) })
      notify("Template created")
    }
    setEditing(null); setShowNew(false); setForm({ name: "", subject: "", html_body: "", text_body: "", category: "general" }); load()
  }

  const del = async (id: number) => {
    if (!confirm("Delete template?")) return
    try { await api(`/templates/${id}`, { method: "DELETE" }); notify("Template deleted"); load() }
    catch (e: any) { notify(e.message, "error") }
  }

  const edit = (t: Template) => {
    setEditing(t)
    setForm({ name: t.name, subject: t.subject, html_body: t.html_body, text_body: t.text_body, category: t.category })
    setShowNew(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
        <button onClick={() => { setEditing(null); setForm({ name: "", subject: "", html_body: "", text_body: "", category: "general" }); setShowNew(true) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />New Template
        </button>
      </div>

      {/* Editor */}
      {showNew && (
        <div className="bg-white rounded-xl border p-5 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">{editing ? `Edit: ${editing.name}` : "New Template"}</h3>
          <div className="grid grid-cols-3 gap-4">
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Template name" className="px-3 py-2 border rounded-lg text-sm" />
            <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Email subject" className="px-3 py-2 border rounded-lg text-sm" />
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm">
              <option value="general">General</option>
              <option value="newsletter">Newsletter</option>
              <option value="promotional">Promotional</option>
              <option value="b2b">B2B</option>
              <option value="servicii">Services</option>
              <option value="follow-up">Follow-up</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">HTML Body</label>
              <button onClick={() => setPreviewHtml(form.html_body)} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Eye className="w-3 h-3" />Preview</button>
            </div>
            <textarea value={form.html_body} onChange={e => setForm(p => ({ ...p, html_body: e.target.value }))} rows={12} className="w-full px-3 py-2 border rounded-lg text-xs font-mono" placeholder="<!DOCTYPE html>..." />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Text Body (fallback)</label>
            <textarea value={form.text_body} onChange={e => setForm(p => ({ ...p, text_body: e.target.value }))} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Text version..." />
          </div>
          <p className="text-xs text-gray-400">Available variables: {"{{contact_name}}"}, {"{{company_name}}"}, {"{{email}}"}, {"{{unsubscribe_url}}"}, {"{{year}}"}, {"{{category}}"}</p>
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">{editing ? "Update" : "Create"}</button>
            <button onClick={() => { setShowNew(false); setEditing(null) }} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewHtml("")}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b flex justify-between items-center">
              <span className="font-semibold text-sm">Preview Template</span>
              <button onClick={() => setPreviewHtml("")}><X className="w-4 h-4" /></button>
            </div>
            <iframe srcDoc={previewHtml} className="w-full h-[600px] border-0" sandbox="" />
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {loading ? (
        <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition">
              <div className="h-40 overflow-hidden bg-gray-50 border-b">
                <iframe srcDoc={t.html_body} className="w-full h-full border-0 pointer-events-none scale-50 origin-top-left" style={{ width: "200%", height: "200%" }} sandbox="" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{t.name}</h4>
                  <Badge text={t.category} color="blue" />
                </div>
                <p className="text-xs text-gray-500 truncate mb-3">{t.subject}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewHtml(t.html_body)} className="flex-1 px-2 py-1.5 border rounded text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"><Eye className="w-3 h-3" />Preview</button>
                  <button onClick={() => edit(t)} className="flex-1 px-2 py-1.5 border rounded text-xs text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1"><FileText className="w-3 h-3" />Edit</button>
                  {!t.is_default && <button onClick={() => del(t.id)} className="px-2 py-1.5 border rounded text-xs text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== TAB 5: STATS ====================
function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api("/stats").then(d => { setStats(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
  if (!stats) return <div className="p-8 text-center text-gray-400">Error loading statistics</div>

  const c = stats.contacts
  const cs = stats.campaigns
  const es = stats.emailStats
  const ss = stats.smsStats

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Marketing Statistics</h2>

      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Contacts" value={c?.total || 0} color="blue" />
        <StatCard label="Unique Emails" value={c?.unique_emails || 0} color="green" />
        <StatCard label="Unique Phones" value={c?.unique_phones || 0} color="purple" />
        <StatCard label="Unsubscribed" value={c?.unsubscribed || 0} color="red" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Campaigns" value={cs?.total || 0} color="gray" />
        <StatCard label="Emails Sent" value={es?.total_sent || 0} color="green" />
        <StatCard label="SMS Sent" value={ss?.total_sent || 0} color="orange" />
        <StatCard label="Draft Campaigns" value={cs?.drafts || 0} color="yellow" />
      </div>

      {/* Source Breakdown */}
      {stats.sourceBreakdown && stats.sourceBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Contacts per Source</h3>
          <div className="space-y-2">
            {stats.sourceBreakdown.map((s: any, i: number) => {
              const maxCount = Math.max(...stats.sourceBreakdown.map((x: any) => parseInt(x.count)))
              const pct = maxCount > 0 ? (parseInt(s.count) / maxCount) * 100 : 0
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28 truncate">{s.source || "unknown"}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-16 text-right">{parseInt(s.count).toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Campaigns */}
      {stats.recentCampaigns && stats.recentCampaigns.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b"><h3 className="font-semibold text-sm text-gray-700">Recent Campaigns</h3></div>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Sent</th>
                <th className="px-4 py-2 font-medium">Failed</th>
                <th className="px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.recentCampaigns.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-2"><Badge text={c.type === "email" ? "Email" : "SMS"} color={c.type === "email" ? "blue" : "green"} /></td>
                  <td className="px-4 py-2">{statusBadge(c.status)}</td>
                  <td className="px-4 py-2 text-green-600">{c.sent_count || 0}</td>
                  <td className="px-4 py-2 text-red-600">{c.failed_count || 0}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{c.created_at ? new Date(c.created_at).toLocaleDateString("en-US") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700", green: "bg-green-50 text-green-700", purple: "bg-purple-50 text-purple-700",
    red: "bg-red-50 text-red-700", orange: "bg-orange-50 text-orange-700", yellow: "bg-yellow-50 text-yellow-700",
    gray: "bg-gray-50 text-gray-700",
  }
  return (
    <div className={`rounded-xl p-4 ${colors[color] || colors.gray}`}>
      <p className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-sm opacity-75">{label}</p>
    </div>
  )
}
