"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"

interface Invoice {
  id: string
  order_id: string
  invoice_number: string
  status: 'paid' | 'cancelled' | 'refunded' | 'draft'
  customer_email: string
  billing_first_name: string
  billing_last_name: string
  billing_company: string | null
  is_company: boolean
  subtotal: number
  shipping_total: number
  total: number
  currency_code: string
  created_at: string
  items?: InvoiceItem[]
}

interface InvoiceItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  total: number
  thumbnail: string | null
}

const statusLabels: Record<string, string> = {
  paid: 'Paid',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  draft: 'Draft'
}

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

export default function CustomerInvoices({ customer }: { customer: HttpTypes.StoreCustomer }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/invoices?customer_id=${customer.id}`)
        const data = await res.json()
        setInvoices(data.invoices || [])
      } catch (error) {
        console.error('Error fetching invoices:', error)
      }
      setLoading(false)
    }
    
    if (customer?.id) {
      fetchInvoices()
    }
  }, [customer?.id])

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ro-RO', { 
      style: 'currency', 
      currency: currency?.toUpperCase() || 'RON' 
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const downloadInvoice = (invoice: Invoice) => {
    const html = generateInvoiceHTML(invoice)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Invoice-${invoice.invoice_number}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateInvoiceHTML = (invoice: Invoice): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; background: #f8f9fa; padding: 20px; }
    .invoice { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2d5a4a 0%, #1e3d32 100%); color: white; padding: 40px; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo { font-size: 28px; font-weight: 700; letter-spacing: 1px; }
    .logo-sub { font-size: 12px; opacity: 0.8; margin-top: 5px; }
    .invoice-meta { text-align: right; }
    .invoice-number { font-size: 24px; font-weight: 600; }
    .invoice-date { font-size: 14px; opacity: 0.9; margin-top: 5px; }
    .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; background: rgba(255,255,255,0.2); }
    .content { padding: 40px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 10px; font-weight: 600; }
    .client-name { font-size: 18px; font-weight: 600; color: #333; }
    .client-email { color: #666; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #f8f9fa; padding: 15px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; font-weight: 600; border-bottom: 2px solid #e0e0e0; }
    td { padding: 15px; border-bottom: 1px solid #eee; }
    .product-name { font-weight: 500; color: #333; }
    .text-right { text-align: right; }
    .totals { margin-top: 30px; display: flex; justify-content: flex-end; }
    .totals-box { width: 280px; background: #f8f9fa; border-radius: 8px; padding: 20px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row.final { border-top: 2px solid #2d5a4a; margin-top: 10px; padding-top: 15px; font-size: 18px; font-weight: 600; color: #2d5a4a; }
    .footer { background: #f8f9fa; padding: 30px 40px; text-align: center; color: #666; font-size: 13px; border-top: 1px solid #eee; }
    @media print { body { padding: 0; background: white; } .invoice { box-shadow: none; border-radius: 0; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="logo">CARPATHIAN</div>
        <div class="logo-sub">CarphaCom — Robotised E-Commerce</div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-number">${invoice.invoice_number}</div>
        <div class="invoice-date">${formatDate(invoice.created_at)}</div>
        <div class="status">${statusLabels[invoice.status]}</div>
      </div>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">Billed to</div>
        <div class="client-name">${invoice.is_company ? invoice.billing_company : `${invoice.billing_first_name} ${invoice.billing_last_name}`}</div>
        <div class="client-email">${invoice.customer_email}</div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th class="text-right">Quantity</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(invoice.items || []).map(item => `
            <tr>
              <td class="product-name">${item.title}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatCurrency(item.unit_price, invoice.currency_code)}</td>
              <td class="text-right">${formatCurrency(item.total, invoice.currency_code)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="totals-box">
          <div class="total-row">
            <span>Subtotal</span>
            <span>${formatCurrency(invoice.subtotal, invoice.currency_code)}</span>
          </div>
          <div class="total-row">
            <span>Shipping</span>
            <span>${formatCurrency(invoice.shipping_total, invoice.currency_code)}</span>
          </div>
          <div class="total-row final">
            <span>Total</span>
            <span>${formatCurrency(invoice.total, invoice.currency_code)}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you for your order!</p>
      <p style="margin-top: 5px;">This invoice was generated electronically and is valid without signature.</p>
    </div>
  </div>
</body>
</html>`
  }

  if (loading) {
    return (
      <div className="bg-dark-800 rounded-xl p-6">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-6 bg-dark-700 rounded w-1/3"></div>
          <div className="h-20 bg-dark-700 rounded"></div>
          <div className="h-20 bg-dark-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-800 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold text-white">My Invoices</h2>
        </div>
      </div>
      
      {invoices.length === 0 ? (
        <div className="p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-dark-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-dark-400">No invoices yet</p>
          <p className="text-dark-500 text-sm mt-1">Invoices will appear here after placing orders</p>
        </div>
      ) : (
        <div className="divide-y divide-dark-700">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="p-4 hover:bg-dark-750 transition-colors">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === invoice.id ? null : invoice.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-mono font-medium text-white">{invoice.invoice_number}</div>
                    <div className="text-sm text-dark-400">{formatDate(invoice.created_at)}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status]}`}>
                    {statusLabels[invoice.status]}
                  </span>
                  <span className="font-semibold text-white">
                    {formatCurrency(invoice.total, invoice.currency_code)}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-dark-400 transition-transform ${expandedId === invoice.id ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {expandedId === invoice.id && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                  {invoice.items && invoice.items.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {invoice.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            {item.thumbnail && (
                              <img src={item.thumbnail} alt="" className="w-10 h-10 rounded object-cover bg-dark-700" />
                            )}
                            <span className="text-dark-300">
                              {item.title} <span className="text-dark-500">× {item.quantity}</span>
                            </span>
                          </div>
                          <span className="text-white">{formatCurrency(item.total, invoice.currency_code)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadInvoice(invoice); }}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Invoice
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
