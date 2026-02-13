"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { ShoppingCart, Search, Printer, Package, CreditCard, MapPin, Phone, Mail, User, FileText, X, Truck, Hash, Eye, RefreshCw, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react"

interface OrderItem {
  id: string
  title: string
  product_title?: string
  quantity: number
  unit_price: number
  thumbnail?: string
  variant_title?: string
  subtitle?: string
}

interface Address {
  first_name?: string
  last_name?: string
  company?: string
  address_1?: string
  address_2?: string
  city?: string
  postal_code?: string
  country_code?: string
  province?: string
  phone?: string
  metadata?: Record<string, any>
}

interface Order {
  id: string
  display_id: number
  status: string
  created_at: string
  total: number
  currency_code: string
  email: string
  shipping_address?: Address
  billing_address?: Address
  payment_collections?: Array<{
    payment_sessions?: Array<{ provider_id: string; status: string }>
    payments?: Array<{ provider_id: string; amount: number }>
  }>
  shipping_methods?: Array<{ name: string; amount: number }>
  items?: OrderItem[]
  metadata?: Record<string, any>
}

const SHOP_INFO = {
  name: "YOUR_COMPANY_NAME",
  cui: "CUI: 40434483",
  regCom: "J33/146/2019",
  address: "Sat Pădureni, Nr. 13",
  city: "Com. Aghireșu, Jud. Cluj",
  postalCode: "407005",
  country: "Romania",
  phone: "+40 774 077 860",
  email: "contact@YOUR_PNI_USERNAMEtrafic.ro",
  website: "YOUR_PNI_USERNAMEtrafic.ro",
}

const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  pending:    { label: "Pending",  color: "text-yellow-700", icon: Clock,        bg: "bg-yellow-100" },
  completed:  { label: "Completed",    color: "text-green-700",  icon: CheckCircle2, bg: "bg-green-100" },
  canceled:   { label: "Canceled",       color: "text-red-700",    icon: XCircle,      bg: "bg-red-100" },
  archived:   { label: "Archived",      color: "text-gray-700",   icon: FileText,     bg: "bg-gray-100" },
  requires_action: { label: "Requires action", color: "text-orange-700", icon: AlertCircle, bg: "bg-orange-100" },
}

function getPaymentMethod(order: Order): string {
  const sessions = order.payment_collections?.[0]?.payment_sessions || []
  const provider = sessions[0]?.provider_id || ''
  if (order.metadata?.payu_order_id) return 'PayU (Card Online)'
  const selectedMethod = order.metadata?.payment_method
  if (selectedMethod === 'payu-card') return 'PayU (Card Online)'
  if (selectedMethod === 'ramburs') return 'Cash on delivery'
  if (selectedMethod === 'transfer') return 'Bank Transfer'
  if (provider === 'pp_system_default') return 'Cash on delivery / Bank Transfer'
  if (provider.includes('stripe')) return 'Stripe (Card)'
  if (provider.includes('payu')) return 'PayU (Card)'
  return provider || 'Unknown'
}

function formatPrice(amount: number, currency?: string): string {
  return `${(amount / 100).toFixed(2)} ${(currency || 'RON').toUpperCase()}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ═══════════════════════════════════════════ */
/*  Printable Shipping Label                   */
/* ═══════════════════════════════════════════ */
function ShippingLabel({ order, onClose }: { order: Order; onClose: () => void }) {
  const sa = order.shipping_address
  const isRamburs = getPaymentMethod(order).includes('Cash on delivery')

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=700,height=500')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>Label #${order.display_id}</title>
<style>
@page{size:A5 landscape;margin:8mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt;color:#1a1a1a}
.label{border:2.5px solid #000}
.hdr{background:#111;color:#fff;text-align:center;padding:8px;font-size:13pt;font-weight:700;letter-spacing:1px}
.body{display:flex}
.sec{flex:1;padding:14px 18px}
.sec.left{border-right:2px dashed #bbb}
.stitle{font-size:8pt;text-transform:uppercase;letter-spacing:3px;color:#888;font-weight:600;margin-bottom:6px}
.name{font-size:14pt;font-weight:700;margin-bottom:3px}
.det{font-size:10pt;line-height:1.55;color:#333}
.ph{margin-top:6px;font-size:11pt;font-weight:600}
.ftr{border-top:2.5px solid #000;padding:7px 18px;display:flex;justify-content:space-between;font-size:9pt;color:#555;background:#f5f5f5}
.badge{font-size:13pt;font-weight:800;background:#000;color:#fff;padding:2px 10px;border-radius:4px}
.ramburs{margin-top:10px;border:2.5px solid #c00;padding:6px 10px;text-align:center;font-weight:800;color:#c00;font-size:13pt;border-radius:4px}
.small{font-size:8pt;color:#999;margin-top:4px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="label">
<div class="hdr">SHIPPING LABEL &mdash; YOUR_PNI_USERNAMEtrafic.ro</div>
<div class="body">
<div class="sec left">
<div class="stitle">Sender</div>
<div class="name">${SHOP_INFO.name}</div>
<div class="det">${SHOP_INFO.address}<br>${SHOP_INFO.city}<br>Postal code: ${SHOP_INFO.postalCode}<br>${SHOP_INFO.country}</div>
<div class="ph">📞 ${SHOP_INFO.phone}</div>
<div class="det">✉ ${SHOP_INFO.email}</div>
<div class="small">${SHOP_INFO.cui} | ${SHOP_INFO.regCom}</div>
</div>
<div class="sec">
<div class="stitle">Recipient</div>
<div class="name">${sa?.first_name || ''} ${sa?.last_name || ''}</div>
${sa?.company ? `<div class="det" style="font-weight:600">${sa.company}</div>` : ''}
<div class="det">${sa?.address_1 || ''} ${sa?.address_2 || ''}<br>${sa?.postal_code ? `Postal code: ${sa.postal_code}<br>` : ''}${sa?.city || ''}${sa?.province ? `, ${sa.province}` : ''}<br>${(sa?.country_code || 'RO').toUpperCase()}</div>
<div class="ph">📞 ${sa?.phone || 'N/A'}</div>
<div class="det">✉ ${order.email}</div>
${isRamburs ? `<div class="ramburs">💰 COD: ${formatPrice(order.total, order.currency_code)}</div>` : ''}
</div>
</div>
<div class="ftr">
<span>Order: <span class="badge">#${order.display_id}</span></span>
<span>Date: ${formatDateShort(order.created_at)}</span>
<span>Payment: ${getPaymentMethod(order)}</span>
<span>Total: ${formatPrice(order.total, order.currency_code)}</span>
</div>
</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`)
    w.document.close()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-900">Shipping Label — Order #{order.display_id}</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"><Printer className="w-4 h-4" />Print</button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
          </div>
        </div>
        <div className="p-6">
          <div className="border-2 border-gray-900 rounded-xl overflow-hidden">
            <div className="bg-gray-900 text-white text-center py-2 font-bold text-sm tracking-wider">SHIPPING LABEL — YOUR_PNI_USERNAMEtrafic.ro</div>
            <div className="grid grid-cols-2 divide-x-2 divide-dashed divide-gray-300">
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-[3px] text-gray-400 font-semibold mb-2">Sender</p>
                <p className="font-bold text-sm">{SHOP_INFO.name}</p>
                <p className="text-xs text-gray-600 mt-1">{SHOP_INFO.address}</p>
                <p className="text-xs text-gray-600">{SHOP_INFO.city}</p>
                <p className="text-xs text-gray-600">Postal code: {SHOP_INFO.postalCode}</p>
                <p className="text-xs text-gray-600 mt-1">📞 {SHOP_INFO.phone}</p>
                <p className="text-xs text-gray-400 mt-1">{SHOP_INFO.cui} | {SHOP_INFO.regCom}</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-[3px] text-gray-400 font-semibold mb-2">Recipient</p>
                <p className="font-bold text-sm">{sa?.first_name} {sa?.last_name}</p>
                {sa?.company && <p className="text-xs font-semibold text-gray-700">{sa.company}</p>}
                <p className="text-xs text-gray-600 mt-1">{sa?.address_1} {sa?.address_2 || ''}</p>
                {sa?.postal_code && <p className="text-xs text-gray-600">Postal code: {sa.postal_code}</p>}
                <p className="text-xs text-gray-600">{sa?.city}{sa?.province ? `, ${sa.province}` : ''}</p>
                <p className="text-xs text-gray-600">{(sa?.country_code || 'RO').toUpperCase()}</p>
                <p className="text-xs text-gray-600 mt-1">📞 {sa?.phone || 'N/A'}</p>
                <p className="text-xs text-gray-600">✉ {order.email}</p>
                {isRamburs && (
                  <div className="mt-2 border-2 border-red-500 rounded px-2 py-1 text-center">
                    <p className="font-bold text-red-600 text-xs">💰 COD: {formatPrice(order.total, order.currency_code)}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 border-t-2 border-gray-900 px-4 py-2 flex justify-between text-xs text-gray-500">
              <span>Order: <span className="font-black text-gray-900 bg-gray-200 px-2 py-0.5 rounded text-xs">#{order.display_id}</span></span>
              <span>Date: {formatDateShort(order.created_at)}</span>
              <span>Payment: {getPaymentMethod(order)}</span>
              <span>Total: {formatPrice(order.total, order.currency_code)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════ */
/*  Order Detail Modal                         */
/* ═══════════════════════════════════════════ */
function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const sa = order.shipping_address
  const ba = order.billing_address
  const items = order.items || []
  const statusCfg = statusConfig[order.status] || statusConfig.pending
  const StatusIcon = statusCfg.icon
  const sameAddress = sa && ba && sa.address_1 === ba.address_1 && sa.city === ba.city && sa.postal_code === ba.postal_code && sa.first_name === ba.first_name

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Order #{order.display_id}</h3>
            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />{statusCfg.label}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
          </div>
        </div>
        <div className="p-5 space-y-5">
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-gray-400" /><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</p></div>
              <p className="font-semibold text-gray-900">{sa?.first_name} {sa?.last_name}</p>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><Mail className="w-3.5 h-3.5" />{order.email}</p>
              {sa?.phone && <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5"><Phone className="w-3.5 h-3.5" />{sa.phone}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><CreditCard className="w-4 h-4 text-gray-400" /><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</p></div>
              <p className="font-semibold text-gray-900">{getPaymentMethod(order)}</p>
              <p className="text-sm text-gray-600 mt-1">Total: {formatPrice(order.total, order.currency_code)}</p>
              {order.metadata?.awb_number && <p className="text-sm text-blue-600 mt-1 font-medium">AWB: {order.metadata.awb_number}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Truck className="w-4 h-4 text-gray-400" /><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Shipping</p></div>
              {order.shipping_methods?.map((sm, i) => (
                <div key={i}><p className="font-semibold text-gray-900">{sm.name}</p><p className="text-sm text-gray-600">{formatPrice(sm.amount, order.currency_code)}</p></div>
              ))}
              {(!order.shipping_methods || order.shipping_methods.length === 0) && <p className="text-sm text-gray-400 italic">N/A</p>}
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3"><MapPin className="w-4 h-4 text-blue-500" /><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Shipping Address</p></div>
              <p className="font-semibold text-gray-900">{sa?.first_name} {sa?.last_name}</p>
              {sa?.company && <p className="text-sm text-gray-700 font-medium">{sa.company}</p>}
              <p className="text-sm text-gray-600">{sa?.address_1} {sa?.address_2 || ''}</p>
              <p className="text-sm text-gray-600">{sa?.postal_code}, {sa?.city}</p>
              {sa?.province && <p className="text-sm text-gray-600">{sa.province}</p>}
              <p className="text-sm text-gray-600">{(sa?.country_code || 'RO').toUpperCase()}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-green-500" /><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Billing Address</p></div>
              {sameAddress ? (
                <p className="text-sm text-gray-500 italic">Same as shipping address</p>
              ) : (
                <>
                  <p className="font-semibold text-gray-900">{ba?.first_name} {ba?.last_name}</p>
                  {ba?.company && <p className="text-sm text-gray-700 font-medium">{ba.company}</p>}
                  <p className="text-sm text-gray-600">{ba?.address_1} {ba?.address_2 || ''}</p>
                  <p className="text-sm text-gray-600">{ba?.postal_code}, {ba?.city}</p>
                  {ba?.province && <p className="text-sm text-gray-600">{ba.province}</p>}
                  <p className="text-sm text-gray-600">{(ba?.country_code || 'RO').toUpperCase()}</p>
                </>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Package className="w-4 h-4" />Products ({items.length})</h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Product</th>
                    <th className="text-center px-4 py-2.5 font-medium text-gray-500 w-20">Qty.</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500 w-28">Price</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500 w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.thumbnail && <img src={item.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover border" />}
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{item.product_title || item.title}</p>
                            {item.variant_title && item.variant_title !== 'Default' && <p className="text-xs text-gray-500">{item.variant_title}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">{item.quantity}x</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatPrice(item.unit_price, order.currency_code)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatPrice(item.unit_price * item.quantity, order.currency_code)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-2.5 text-right font-bold text-gray-900">Order total:</td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-900 text-base">{formatPrice(order.total, order.currency_code)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {order.metadata && Object.keys(order.metadata).length > 0 && (
            <details className="text-xs">
              <summary className="text-gray-400 cursor-pointer hover:text-gray-600">Order metadata</summary>
              <pre className="mt-2 bg-gray-50 rounded-lg p-3 text-gray-600 overflow-x-auto">{JSON.stringify(order.metadata, null, 2)}</pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════ */
/*  Main Orders Page                           */
/* ═══════════════════════════════════════════ */
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [labelOrder, setLabelOrder] = useState<Order | null>(null)
  const [detailLoading, setDetailLoading] = useState<string | null>(null)
  const LIMIT = 20

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) })
      if (statusFilter) params.set('status', statusFilter)
      if (searchQuery) params.set('q', searchQuery)
      const res = await fetch(`/app/api/orders?${params}`)
      const data = await res.json()
      if (data.success) { setOrders(data.orders || []); setTotalCount(data.count || 0) }
    } catch (err) { console.error('Failed to fetch orders:', err) }
    finally { setLoading(false) }
  }, [page, statusFilter, searchQuery])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const openOrderDetail = async (orderId: string) => {
    setDetailLoading(orderId)
    try {
      const res = await fetch(`/app/api/orders?id=${orderId}`)
      const data = await res.json()
      if (data.success && data.order) setSelectedOrder(data.order)
    } catch {} finally { setDetailLoading(null) }
  }

  const openLabel = async (orderId: string) => {
    setDetailLoading(orderId)
    try {
      const res = await fetch(`/app/api/orders?id=${orderId}`)
      const data = await res.json()
      if (data.success && data.order) setLabelOrder(data.order)
    } catch {} finally { setDetailLoading(null) }
  }

  const totalPages = Math.ceil(totalCount / LIMIT)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500">{totalCount} orders in total</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Reload
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 cursor-pointer hover:border-yellow-300" onClick={() => { setStatusFilter(s => s === 'pending' ? '' : 'pending'); setPage(0) }}>
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{statusFilter === 'pending' ? totalCount : '—'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 cursor-pointer hover:border-green-300" onClick={() => { setStatusFilter(s => s === 'completed' ? '' : 'completed'); setPage(0) }}>
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{statusFilter === 'completed' ? totalCount : '—'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 cursor-pointer hover:border-red-300" onClick={() => { setStatusFilter(s => s === 'canceled' ? '' : 'canceled'); setPage(0) }}>
          <p className="text-sm text-gray-500">Canceled</p>
          <p className="text-2xl font-bold text-red-600">{statusFilter === 'canceled' ? totalCount : '—'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Page value</p>
          <p className="text-xl font-bold text-blue-600">{orders.length > 0 ? formatPrice(orders.reduce((s, o) => s + (o.total || 0), 0), 'RON') : '0 RON'}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email, name, ID..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(0) }}
            onKeyDown={e => e.key === 'Enter' && fetchOrders()}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }} className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="canceled">Canceled</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-gray-500">Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3.5 font-semibold">Order</th>
                <th className="px-5 py-3.5 font-semibold">Customer</th>
                <th className="px-5 py-3.5 font-semibold">Payment</th>
                <th className="px-5 py-3.5 font-semibold">Total</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Date</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => {
                const cfg = statusConfig[order.status] || statusConfig.pending
                const Icon = cfg.icon
                return (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Hash className="w-4 h-4 text-blue-600" /></div>
                        <span className="font-bold text-gray-900">#{order.display_id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900 text-sm">{order.shipping_address?.first_name} {order.shipping_address?.last_name}</p>
                      <p className="text-xs text-gray-500">{order.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                        <CreditCard className="w-3 h-3" />{getPaymentMethod(order)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900 text-sm">{formatPrice(order.total, order.currency_code)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{formatDateShort(order.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openOrderDetail(order.id)} disabled={detailLoading === order.id} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 hover:text-blue-700 transition-colors" title="View details">
                          {detailLoading === order.id ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openLabel(order.id)} disabled={detailLoading === order.id} className="p-2 hover:bg-green-50 rounded-lg text-green-600 hover:text-green-700 transition-colors" title="Shipping label">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-500">{page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, totalCount)} of {totalCount}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40">← Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      {labelOrder && <ShippingLabel order={labelOrder} onClose={() => setLabelOrder(null)} />}
    </div>
  )
}
