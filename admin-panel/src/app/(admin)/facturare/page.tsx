"use client"

import { useState, useEffect } from "react"
import { 
  FileText, Settings, Package, Users, CreditCard, TestTube, 
  Loader2, CheckCircle, AlertTriangle, Plus, RefreshCw, Receipt, 
  XCircle, Building2, Save, MapPin, Phone, Mail, Percent,
  Globe, FileCheck, Upload, Shield, UserPlus, Trash2, Eye, Edit2, Download,
  ChevronLeft, ChevronRight, RotateCcw, DollarSign, Printer, X,
  ArrowLeft, ArrowRight, Search, FileDown, Hash, TrendingUp, ShoppingCart
} from "lucide-react"

interface CompanyInfo {
  nume: string
  cui: string
  registruComert: string
  adresa: string
  localitate: string
  judet: string
  codPostal: string
  tara: string
  telefon: string
  email: string
  website: string
  iban: string
  banca: string
  swift?: string
  platitorTVA: boolean
  cotaTVA: number
  serieFactura: string
  numarStartFactura: number
  serieProforma: string
  numarStartProforma: number
  eFacturaActiv: boolean
  eFacturaMode: 'anaf' | 'fgo'
  anafClientId?: string
  anafClientSecret?: string
  fgoCUI?: string
  fgoAPIKey?: string
}

interface UserRole {
  id: string
  email: string
  role: 'admin' | 'operator' | 'viewer'
  permissions: string[]
  createdAt: string
}

const tabs = [
  { id: 'facturi', label: 'Invoices', icon: FileText },
  { id: 'articole', label: 'Products Sold', icon: Package },
  { id: 'clienti', label: 'Customers', icon: Users },
  { id: 'firma', label: 'Company Info', icon: Building2 },
  { id: 'efactura', label: 'E-Invoice', icon: FileCheck },
  { id: 'roles', label: 'Users', icon: Shield },
  { id: 'google', label: 'Google Feed', icon: Globe },
  { id: 'setari', label: 'FGO Settings', icon: Settings },
]

export default function FacturarePage() {
  const [activeTab, setActiveTab] = useState('facturi')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)
  
  const [company, setCompany] = useState<CompanyInfo>({
    nume: '',
    cui: '45068910',
    registruComert: '',
    adresa: '',
    localitate: '',
    judet: '',
    codPostal: '',
    tara: 'Romania',
    telefon: '',
    email: '',
    website: '',
    iban: '',
    banca: '',
    platitorTVA: true,
    cotaTVA: 19,
    serieFactura: 'CARP',
    numarStartFactura: 1,
    serieProforma: 'PRO',
    numarStartProforma: 1,
    eFacturaActiv: false,
    eFacturaMode: 'anaf',
  })

  const [users, setUsers] = useState<UserRole[]>([
    { id: '1', email: 'admin@example.com', role: 'admin', permissions: ['all'], createdAt: new Date().toISOString() }
  ])

  const [googleFeedUrl, setGoogleFeedUrl] = useState('')
  const [googleFeedStatus, setGoogleFeedStatus] = useState<'generating' | 'ready' | 'error' | null>(null)

  const [invoices, setInvoices] = useState<any[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const ITEMS_PER_PAGE = 10

  // Products sold state
  const [articolePage, setArticolePage] = useState(1)
  const [articoleSearch, setArticoleSearch] = useState('')
  const ARTICOLE_PER_PAGE = 15

  // Load company data
  useEffect(() => {
    loadCompanyData()
  }, [])

  const loadCompanyData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/app/api/invoices?action=company')
      const data = await res.json()
      if (data.success) {
        setCompany({ ...company, ...data.data })
      }
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInvoices = async () => {
    setLoadingInvoices(true)
    try {
      const res = await fetch('/app/api/invoices?action=list')
      const data = await res.json()
      if (data.success) {
        setInvoices(data.data || [])
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoadingInvoices(false)
    }
  }

  // Invoice Handlers
  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice)
    setEditForm({
      observatii: invoice.observatii || '',
      metodaPlata: invoice.metodaPlata || 'transfer',
      clientNume: invoice.client?.nume || '',
      clientCui: invoice.client?.cui || '',
      clientAdresa: invoice.client?.adresa || '',
      clientLocalitate: invoice.client?.localitate || '',
      clientJudet: invoice.client?.judet || '',
      clientEmail: invoice.client?.email || '',
      clientTelefon: invoice.client?.telefon || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editingInvoice) return
    setSavingEdit(true)
    try {
      const res = await fetch('/app/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: editingInvoice.id,
          observatii: editForm.observatii,
          metodaPlata: editForm.metodaPlata,
          client: {
            ...editingInvoice.client,
            nume: editForm.clientNume,
            cui: editForm.clientCui,
            adresa: editForm.clientAdresa,
            localitate: editForm.clientLocalitate,
            judet: editForm.clientJudet,
            email: editForm.clientEmail,
            telefon: editForm.clientTelefon,
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `Invoice ${editingInvoice.serie}${editingInvoice.numar} updated successfully` })
        setEditingInvoice(null)
        loadInvoices()
      } else {
        setMessage({ type: 'error', text: data.error || 'Error updating' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating invoice' })
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteInvoice = async (invoice: any) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.serie}-${invoice.numar}?`)) return
    try {
      const res = await fetch(`/app/api/invoices?id=${invoice.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Invoice deleted successfully' })
        loadInvoices()
      } else {
        setMessage({ type: 'error', text: data.error || 'Error deleting' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting invoice' })
    }
  }

  const handleMarkPaid = async (invoice: any) => {
    if (!confirm(`Mark invoice ${invoice.serie}${invoice.numar} as paid?`)) return
    try {
      const res = await fetch('/app/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markPaid', id: invoice.id }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `Invoice ${invoice.serie}${invoice.numar} marked as paid` })
        loadInvoices()
      } else {
        setMessage({ type: 'error', text: data.error || 'Error' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error marking as paid' })
    }
  }

  const handleStornoInvoice = async (invoice: any) => {
    const motiv = prompt(`Reason for reversing invoice ${invoice.serie}${invoice.numar}:`, 'Reversal at customer request')
    if (motiv === null) return
    try {
      const res = await fetch('/app/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'storno', id: invoice.id, motiv }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `Reversal created: ${data.data.serie}${data.data.numar}` })
        loadInvoices()
      } else {
        setMessage({ type: 'error', text: data.error || 'Error creating reversal' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error reversing invoice' })
    }
  }

  const handleCancelInvoice = async (invoice: any) => {
    const motiv = prompt(`Reason for cancelling invoice ${invoice.serie}${invoice.numar}:`, 'Cancellation')
    if (motiv === null) return
    try {
      const res = await fetch('/app/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', id: invoice.id, motiv }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `Invoice ${invoice.serie}${invoice.numar} cancelled` })
        loadInvoices()
      } else {
        setMessage({ type: 'error', text: data.error || 'Error cancelling' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error cancelling invoice' })
    }
  }

  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set())

  const toggleSelectInvoice = (id: string) => {
    const newSelected = new Set(selectedInvoices)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedInvoices(newSelected)
  }

  const downloadSelectedInvoices = async () => {
    if (selectedInvoices.size === 0) {
      setMessage({ type: 'warning', text: 'Select at least one invoice' })
      return
    }
    // Open each selected invoice in a new tab for download
    selectedInvoices.forEach(id => {
      window.open(`/app/api/invoices?action=get&id=${id}&format=xml`, '_blank')
    })
    setMessage({ type: 'success', text: `Downloading ${selectedInvoices.size} XML invoices` })
  }

  useEffect(() => {
    if (activeTab === 'facturi' || activeTab === 'articole') {
      loadInvoices()
    }
  }, [activeTab])

  const saveCompany = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/app/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveCompany', ...company }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Data saved successfully!' })
        setCompany({ ...company, ...data.data })
      } else {
        setMessage({ type: 'error', text: data.error || 'Error saving' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof CompanyInfo, value: any) => {
    setCompany({ ...company, [field]: value })
  }

  const generateGoogleFeed = async () => {
    setGoogleFeedStatus('generating')
    try {
      const res = await fetch('/app/api/google/feed', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setGoogleFeedUrl(data.url)
        setGoogleFeedStatus('ready')
      } else {
        setGoogleFeedStatus('error')
      }
    } catch (error) {
      setGoogleFeedStatus('error')
    }
  }

  const testANAFConnection = async () => {
    setLoading(true)
    try {
      const res = await fetch('/app/api/efactura/test-anaf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: company.anafClientId,
          clientSecret: company.anafClientSecret,
        }),
      })
      const data = await res.json()
      setMessage({ 
        type: data.success ? 'success' : 'error', 
        text: data.message || (data.success ? 'ANAF connection OK!' : 'ANAF connection error') 
      })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoicing & Settings</h1>
              <p className="text-gray-500">Complete management: invoices, customers, E-Invoice ANAF, users</p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="px-6 flex gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* FACTURI TAB */}
        {activeTab === 'facturi' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold text-gray-900">Issued Invoices</h2>
               <div className="flex items-center gap-2">
                 <span className="text-sm text-gray-500">{invoices.length} invoices total</span>
                 <button onClick={() => { setCurrentPage(1); loadInvoices(); }} className="p-2 hover:bg-gray-100 rounded-lg" title="Reload">
                   <RefreshCw className={`w-5 h-5 ${loadingInvoices ? 'animate-spin' : ''}`} />
                 </button>
               </div>
            </div>

            {loadingInvoices ? (
              <div className="text-center py-12">
                 <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                 <p className="mt-2 text-gray-500">Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
               <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                 <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                 <h3 className="text-lg font-medium text-gray-900">No invoices</h3>
                 <p className="text-gray-500">No invoices have been issued yet.</p>
               </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {selectedInvoices.size > 0 && (
                  <div className="px-6 py-3 bg-blue-50 border-b flex items-center justify-between">
                    <span className="text-sm text-blue-700">
                      {selectedInvoices.size} invoice(s) selected
                    </span>
                    <button
                      onClick={downloadSelectedInvoices}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Selected XML
                    </button>
                  </div>
                )}
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-sm text-gray-500">
                      <th className="px-4 py-3 font-medium w-12">
                        <input 
                          type="checkbox" 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoices(new Set(invoices.map(inv => inv.id)))
                            } else {
                              setSelectedInvoices(new Set())
                            }
                          }}
                          checked={selectedInvoices.size === invoices.length && invoices.length > 0}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 font-medium">Number</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Total (RON)</th>
                      <th className="px-4 py-3 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices
                      .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                      .map((invoice) => {
                        const statusColors: Record<string, string> = {
                          draft: 'bg-gray-100 text-gray-700',
                          confirmed: 'bg-blue-100 text-blue-700',
                          synced: 'bg-indigo-100 text-indigo-700',
                          paid: 'bg-green-100 text-green-700',
                          cancelled: 'bg-red-100 text-red-700',
                          storno: 'bg-orange-100 text-orange-700',
                        }
                        const statusLabels: Record<string, string> = {
                          draft: 'Draft',
                          confirmed: 'Confirmed',
                          synced: 'Synced',
                          paid: 'Paid',
                          cancelled: 'Cancelled',
                          storno: 'Reversed',
                        }
                        const isActive = invoice.status !== 'cancelled' && invoice.status !== 'storno'
                        return (
                      <tr key={invoice.id} className={`hover:bg-gray-50 ${!isActive ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            checked={selectedInvoices.has(invoice.id)}
                            onChange={() => toggleSelectInvoice(invoice.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {invoice.serie}{invoice.numar}
                          {invoice.observatii && invoice.observatii.startsWith('Storno') && (
                            <span className="block text-xs text-orange-600">{invoice.observatii}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {invoice.dataEmitere || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{invoice.client?.nume || '-'}</p>
                            {invoice.client?.cui && (
                              <p className="text-gray-500 text-xs">{invoice.client.cui}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[invoice.status] || 'bg-gray-100 text-gray-700'}`}>
                            {statusLabels[invoice.status] || invoice.status}
                          </span>
                          {invoice.platit && invoice.status !== 'paid' && (
                            <span className="ml-1 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                              Paid
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {(invoice.totalGeneral || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {/* View / Print */}
                            <a 
                              href={`/app/api/invoices?action=get&id=${invoice.id}&format=html`}
                              target="_blank"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            {/* Download PDF (print) */}
                            <a 
                              href={`/app/api/invoices?action=get&id=${invoice.id}&format=pdf`}
                              target="_blank"
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
                              title="Download PDF (Print)"
                            >
                              <FileDown className="w-4 h-4" />
                            </a>
                            {/* Download XML */}
                            <a 
                              href={`/app/api/invoices?action=get&id=${invoice.id}&format=xml`}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Download E-Invoice XML"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            {/* Edit */}
                            {isActive && (
                              <button 
                                onClick={() => handleEditInvoice(invoice)}
                                className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {/* Mark Paid */}
                            {isActive && !invoice.platit && (
                              <button 
                                onClick={() => handleMarkPaid(invoice)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                title="Mark as Paid"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                            )}
                            {/* Storno */}
                            {isActive && (
                              <button 
                                onClick={() => handleStornoInvoice(invoice)}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"
                                title="Reversal"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                            {/* Cancel */}
                            {isActive && (
                              <button 
                                onClick={() => handleCancelInvoice(invoice)}
                                className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            {/* Delete */}
                            <button 
                              onClick={() => handleDeleteInvoice(invoice)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                        )
                    })}
                  </tbody>
                </table>
                </div>

                {/* Pagination */}
                {invoices.length > ITEMS_PER_PAGE && (
                  <div className="px-6 py-4 border-t flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, invoices.length)} of {invoices.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.ceil(invoices.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(invoices.length / ITEMS_PER_PAGE), p + 1))}
                        disabled={currentPage >= Math.ceil(invoices.length / ITEMS_PER_PAGE)}
                        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Edit Invoice Modal */}
            {editingInvoice && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-bold">
                      Edit Invoice {editingInvoice.serie}{editingInvoice.numar}
                    </h3>
                    <button onClick={() => setEditingInvoice(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <h4 className="font-medium text-gray-700 border-b pb-2">Customer Details</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Customer Name</label>
                        <input
                          type="text"
                          value={editForm.clientNume}
                          onChange={(e) => setEditForm({ ...editForm, clientNume: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Tax ID</label>
                        <input
                          type="text"
                          value={editForm.clientCui}
                          onChange={(e) => setEditForm({ ...editForm, clientCui: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                        <input
                          type="text"
                          value={editForm.clientAdresa}
                          onChange={(e) => setEditForm({ ...editForm, clientAdresa: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">City</label>
                        <input
                          type="text"
                          value={editForm.clientLocalitate}
                          onChange={(e) => setEditForm({ ...editForm, clientLocalitate: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">County</label>
                        <input
                          type="text"
                          value={editForm.clientJudet}
                          onChange={(e) => setEditForm({ ...editForm, clientJudet: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                        <input
                          type="email"
                          value={editForm.clientEmail}
                          onChange={(e) => setEditForm({ ...editForm, clientEmail: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                        <input
                          type="text"
                          value={editForm.clientTelefon}
                          onChange={(e) => setEditForm({ ...editForm, clientTelefon: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
                        <select
                          value={editForm.metodaPlata}
                          onChange={(e) => setEditForm({ ...editForm, metodaPlata: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="transfer">Bank transfer</option>
                          <option value="card">Card</option>
                          <option value="ramburs">Cash on delivery</option>
                          <option value="numerar">Cash</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
                      <textarea
                        value={editForm.observatii}
                        onChange={(e) => setEditForm({ ...editForm, observatii: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                      />
                    </div>
                    
                    {/* Items preview (read-only) */}
                    <h4 className="font-medium text-gray-700 border-b pb-2 mt-6">Items (view only)</h4>
                    <div className="text-sm">
                      {editingInvoice.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between py-1 border-b border-gray-100">
                          <span>{item.denumire} x {Math.abs(item.cantitate)} {item.um}</span>
                          <span className="font-medium">{(item.pretTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} RON</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-bold">
                        <span>Grand Total</span>
                        <span>{(editingInvoice.totalGeneral || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} RON</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
                    <button
                      onClick={() => setEditingInvoice(null)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ARTICOLE TAB */}
        {activeTab === 'articole' && (() => {
          // Aggregate sold products from all invoices (excluding cancelled/storno)
          const activeInvoices = invoices.filter(inv => inv.status !== 'cancelled' && inv.status !== 'storno')
          const productMap = new Map<string, { cod: string; denumire: string; um: string; cantitate: number; venituri: number; cotaTVA: number; facturi: number; ultimaVanzare: string }>()
          
          activeInvoices.forEach(inv => {
            (inv.items || []).forEach((item: any) => {
              const key = (item.cod || item.denumire || '').toLowerCase().trim()
              if (!key) return
              const existing = productMap.get(key)
              if (existing) {
                existing.cantitate += Math.abs(item.cantitate || 0)
                existing.venituri += Math.abs(item.pretTotal || 0)
                existing.facturi += 1
                if (inv.dataEmitere > existing.ultimaVanzare) {
                  existing.ultimaVanzare = inv.dataEmitere
                }
              } else {
                productMap.set(key, {
                  cod: item.cod || '-',
                  denumire: item.denumire || 'Product',
                  um: item.um || 'buc',
                  cantitate: Math.abs(item.cantitate || 0),
                  venituri: Math.abs(item.pretTotal || 0),
                  cotaTVA: item.cotaTVA || 19,
                  facturi: 1,
                  ultimaVanzare: inv.dataEmitere || '-',
                })
              }
            })
          })

          let articole = Array.from(productMap.values()).sort((a, b) => b.venituri - a.venituri)
          
          // Search filter
          const searchLower = articoleSearch.toLowerCase().trim()
          if (searchLower) {
            articole = articole.filter(a =>
              a.denumire.toLowerCase().includes(searchLower) ||
              a.cod.toLowerCase().includes(searchLower)
            )
          }

          const totalArticole = articole.length
          const totalPages = Math.ceil(totalArticole / ARTICOLE_PER_PAGE) || 1
          const paginatedArticole = articole.slice((articolePage - 1) * ARTICOLE_PER_PAGE, articolePage * ARTICOLE_PER_PAGE)
          const totalVenituri = articole.reduce((s, a) => s + a.venituri, 0)
          const totalCantitate = articole.reduce((s, a) => s + a.cantitate, 0)

          return (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500">Products Sold (unique)</p>
                    <p className="text-2xl font-bold text-gray-900">{Array.from(productMap.values()).length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500">Total Product Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{totalVenituri.toLocaleString('en-US', { minimumFractionDigits: 2 })} RON</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg"><ShoppingCart className="w-5 h-5 text-orange-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500">Total Units Sold</p>
                    <p className="text-2xl font-bold text-gray-900">{totalCantitate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search + Title */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-bold text-gray-900">Products Sold</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search product or code..."
                    value={articoleSearch}
                    onChange={(e) => { setArticoleSearch(e.target.value); setArticolePage(1); }}
                    className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {articoleSearch && (
                    <button onClick={() => { setArticoleSearch(''); setArticolePage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button onClick={() => { setArticolePage(1); loadInvoices(); }} className="p-2 hover:bg-gray-100 rounded-lg" title="Reload">
                  <RefreshCw className={`w-5 h-5 ${loadingInvoices ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loadingInvoices ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <p className="mt-2 text-gray-500">Calculating sold products...</p>
              </div>
            ) : totalArticole === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  {articoleSearch ? 'No products found' : 'No products sold'}
                </h3>
                <p className="text-gray-500">
                  {articoleSearch ? `No products found for "${articoleSearch}"` : 'No invoices with products have been issued yet.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-sm text-gray-500">
                      <th className="px-4 py-3 font-medium w-12">#</th>
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium">Product Name</th>
                      <th className="px-4 py-3 font-medium text-center">UoM</th>
                      <th className="px-4 py-3 font-medium text-right">Total Qty</th>
                      <th className="px-4 py-3 font-medium text-right">Revenue (RON)</th>
                      <th className="px-4 py-3 font-medium text-center">VAT</th>
                      <th className="px-4 py-3 font-medium text-center">No. Invoices</th>
                      <th className="px-4 py-3 font-medium">Last Sale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedArticole.map((art, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-400">{(articolePage - 1) * ARTICOLE_PER_PAGE + idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{art.cod}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{art.denumire}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-center">{art.um}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{art.cantitate}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-700">
                          {art.venituri.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-center">{art.cotaTVA}%</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {art.facturi}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{art.ultimaVanzare}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>

                {/* Pagination */}
                {totalArticole > ARTICOLE_PER_PAGE && (
                  <div className="px-6 py-4 border-t flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Showing {((articolePage - 1) * ARTICOLE_PER_PAGE) + 1}-{Math.min(articolePage * ARTICOLE_PER_PAGE, totalArticole)} of {totalArticole} products
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setArticolePage(p => Math.max(1, p - 1))}
                        disabled={articolePage === 1}
                        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => page === 1 || page === totalPages || Math.abs(page - articolePage) <= 2)
                        .map((page, idx, arr) => (
                          <span key={page}>
                            {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-gray-400 px-1">...</span>}
                            <button
                              onClick={() => setArticolePage(page)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium ${
                                articolePage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              {page}
                            </button>
                          </span>
                        ))}
                      <button
                        onClick={() => setArticolePage(p => Math.min(totalPages, p + 1))}
                        disabled={articolePage >= totalPages}
                        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          )
        })()}

        {/* CLIENTI TAB */}
        {activeTab === 'clienti' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-bold text-lg mb-4">Customers</h2>
              <p className="text-gray-500">Customer database.</p>
            </div>
          </div>
        )}

        {/* FIRMA TAB */}
        {activeTab === 'firma' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                General Information
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={company.nume}
                    onChange={(e) => updateField('nume', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="My Company LLC"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CUI/CIF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={company.cui}
                    onChange={(e) => updateField('cui', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="RO12345678"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trade Registry No.
                  </label>
                  <input
                    type="text"
                    value={company.registruComert}
                    onChange={(e) => updateField('registruComert', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="J12/345/2024"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={company.platitorTVA}
                      onChange={(e) => updateField('platitorTVA', e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                    <span className="font-medium">VAT Payer</span>
                  </label>
                  
                  {company.platitorTVA && (
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={company.cotaTVA}
                        onChange={(e) => updateField('cotaTVA', parseInt(e.target.value) || 19)}
                        className="w-20 px-3 py-2 border rounded-lg"
                      />
                      <span>%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                Headquarters Address
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    type="text"
                    value={company.adresa}
                    onChange={(e) => updateField('adresa', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={company.localitate}
                    onChange={(e) => updateField('localitate', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">County</label>
                  <input
                    type="text"
                    value={company.judet}
                    onChange={(e) => updateField('judet', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                Contact & Banking
              </h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={company.telefon}
                    onChange={(e) => updateField('telefon', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={company.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input
                    type="text"
                    value={company.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">IBAN</label>
                  <input
                    type="text"
                    value={company.iban}
                    onChange={(e) => updateField('iban', e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 border rounded-lg font-mono"
                    placeholder="RO49AAAA1B31007593840000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bank</label>
                  <input
                    type="text"
                    value={company.banca}
                    onChange={(e) => updateField('banca', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Series */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-bold text-lg mb-4">Invoice Series</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">Invoice</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={company.serieFactura}
                      onChange={(e) => updateField('serieFactura', e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="CARP"
                    />
                    <input
                      type="number"
                      value={company.numarStartFactura}
                      onChange={(e) => updateField('numarStartFactura', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="1"
                    />
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-bold text-orange-800 mb-2">Proforma</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={company.serieProforma}
                      onChange={(e) => updateField('serieProforma', e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="PRO"
                    />
                    <input
                      type="number"
                      value={company.numarStartProforma}
                      onChange={(e) => updateField('numarStartProforma', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveCompany}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Company Data
              </button>
            </div>
          </div>
        )}

        {/* E-FACTURA TAB */}
        {activeTab === 'efactura' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-6 text-white">
              <h2 className="font-bold text-xl mb-2 flex items-center gap-2">
                <FileCheck className="w-6 h-6" />
                E-Invoice - Direct ANAF Integration
              </h2>
              <p className="text-white/90">
                Automatically send invoices to ANAF SPV (mandatory for B2B since 2024)
              </p>
            </div>

            {/* Mode Selector */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-lg mb-4">Electronic Invoicing Mode</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => updateField('eFacturaMode', 'anaf')}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    company.eFacturaMode === 'anaf'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileCheck className="w-8 h-8 text-blue-600 mb-2" />
                  <h4 className="font-bold mb-1">ANAF Direct (Recommended)</h4>
                  <p className="text-sm text-gray-600">Direct ANAF API integration - FREE</p>
                  {company.eFacturaMode === 'anaf' && (
                    <CheckCircle className="w-5 h-5 text-green-600 ml-auto mt-2" />
                  )}
                </button>
                
                <button
                  onClick={() => updateField('eFacturaMode', 'fgo')}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    company.eFacturaMode === 'fgo'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Settings className="w-8 h-8 text-purple-600 mb-2" />
                  <h4 className="font-bold mb-1">FGO.ro (Alternative)</h4>
                  <p className="text-sm text-gray-600">Via FGO service - subscription required</p>
                  {company.eFacturaMode === 'fgo' && (
                    <CheckCircle className="w-5 h-5 text-green-600 ml-auto mt-2" />
                  )}
                </button>
              </div>
            </div>

            {/* ANAF Direct Config */}
            {company.eFacturaMode === 'anaf' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-bold text-lg mb-4">ANAF OAuth Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Client ID (ANAF)</label>
                    <input
                      type="text"
                      value={company.anafClientId || ''}
                      onChange={(e) => updateField('anafClientId', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg font-mono"
                      placeholder="client_id_from_anaf"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Client Secret (ANAF)</label>
                    <input
                      type="password"
                      value={company.anafClientSecret || ''}
                      onChange={(e) => updateField('anafClientSecret', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg font-mono"
                      placeholder="secret_from_anaf"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={testANAFConnection}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                      Test Connection
                    </button>
                    
                    <button
                      onClick={saveCompany}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">How to get ANAF credentials:</h4>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Access <a href="https://logincert.anaf.ro" target="_blank" className="underline">ANAF Portal</a> with a digital certificate</li>
                    <li>Go to "Virtual Private Space" → "Application Management"</li>
                    <li>Register a new application for the E-Invoice API</li>
                    <li>Copy the generated Client ID and Secret</li>
                    <li>Enter the data above and test the connection</li>
                  </ol>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <a 
                    href="https://www.anaf.ro/anaf/internet/ANAF/despre_anaf/strategii_anaf/proiecte_digitalizare/e.factura"
                    target="_blank"
                    className="p-4 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                  >
                    <Globe className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">E-Invoice Portal</p>
                      <p className="text-sm text-gray-500">Official documentation</p>
                    </div>
                  </a>
                  
                  <a 
                    href="https://static.anaf.ro/static/10/Anaf/Informatii_R/API/Oauth_procedura_inregistrare_aplicatii_portal_ANAF.pdf"
                    target="_blank"
                    className="p-4 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                  >
                    <Download className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">ANAF OAuth Guide</p>
                      <p className="text-sm text-gray-500">Procedure PDF</p>
                    </div>
                  </a>
                </div>
              </div>
            )}

            {/* FGO Config (alternative) */}
            {company.eFacturaMode === 'fgo' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-bold text-lg mb-4">FGO.ro Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Tax ID</label>
                    <input
                      type="text"
                      value={company.fgoCUI || company.cui}
                      onChange={(e) => updateField('fgoCUI', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">API Key FGO</label>
                    <input
                      type="password"
                      value={company.fgoAPIKey || ''}
                      onChange={(e) => updateField('fgoAPIKey', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Key from FGO.ro"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Option for those who prefer an intermediary service with dedicated support.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ROLES TAB */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Users & Roles</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <UserPlus className="w-4 h-4" />
                  Add User
                </button>
              </div>

              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        Role: <span className="font-medium capitalize">{user.role}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Available Roles:</h3>
                <ul className="text-sm space-y-1">
                  <li><strong>Admin:</strong> Full access (invoices, settings, users)</li>
                  <li><strong>Operator:</strong> Issue invoices, manage orders</li>
                  <li><strong>Viewer:</strong> View reports (read-only)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* GOOGLE FEED TAB */}
        {activeTab === 'google' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Google Merchant Center Feed
              </h2>

              <div className="space-y-4">
                <p className="text-gray-600">
                  XML feed for Google Merchant Center - automatic product sync with Google Shopping.
                </p>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Feed Status:</h3>
                  {googleFeedStatus === 'ready' ? (
                    <div>
                      <p className="text-sm text-green-700 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Feed generated successfully!
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={googleFeedUrl}
                          readOnly
                          className="flex-1 px-3 py-2 border rounded-lg bg-white font-mono text-sm"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(googleFeedUrl)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={generateGoogleFeed}
                      disabled={googleFeedStatus === 'generating'}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {googleFeedStatus === 'generating' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Generate XML Feed
                    </button>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">How to use:</h3>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Generate the XML feed using the button above</li>
                    <li>Copy the generated URL</li>
                    <li>Go to <a href="https://merchants.google.com" target="_blank" className="text-blue-600 underline">Google Merchant Center</a></li>
                    <li>Mergi la "Products" → "Feeds" → "Add Feed"</li>
                    <li>Select "Scheduled fetch" and paste the URL</li>
                    <li>The feed updates automatically every 24 hours</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETARI FGO TAB */}
        {activeTab === 'setari' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-bold text-lg mb-4">Alternative FGO Settings</h2>
              <p className="text-gray-600 mb-4">
                Optional configuration for those who prefer FGO.ro as an intermediary service.
              </p>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Use the "E-Invoice" tab for direct ANAF configuration (recommended and free).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
