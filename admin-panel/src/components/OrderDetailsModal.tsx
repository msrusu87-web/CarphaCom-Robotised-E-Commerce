"use client"

import { X, Package, User, MapPin, CreditCard, Truck, FileText, Download } from 'lucide-react'

interface OrderDetailsModalProps {
  order: any
  onClose: () => void
}

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  if (!order) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order #{order.display_id || order.id?.slice(-6)}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(order.created_at).toLocaleString('en-US', { 
                dateStyle: 'full', 
                timeStyle: 'short' 
              })}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Order Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                order.status === 'completed' ? 'bg-green-100 text-green-700' :
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {order.status === 'pending' ? 'Pending' : 
                 order.status === 'completed' ? 'Completed' : 
                 order.status === 'canceled' ? 'Canceled' : order.status}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Payment Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                order.payment_status === 'captured' ? 'bg-green-100 text-green-700' :
                order.payment_status === 'authorized' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {order.payment_status === 'captured' ? 'Paid' :
                 order.payment_status === 'authorized' ? 'Authorized' : 'Unpaid'}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Delivery Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                order.fulfillment_status === 'fulfilled' ? 'bg-green-100 text-green-700' :
                order.fulfillment_status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {order.fulfillment_status === 'fulfilled' ? 'Delivered' :
                 order.fulfillment_status === 'shipped' ? 'Shipped' : 
                 order.fulfillment_status === 'canceled' ? 'Canceled' : 'Not shipped'}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold">Customer Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">
                  {order.shipping_address?.first_name || order.customer?.first_name || 'N/A'} {order.shipping_address?.last_name || order.customer?.last_name || ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{order.email || order.customer?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{order.shipping_address?.phone || order.customer?.phone || '-'}</p>
              </div>
              {order.billing_address?.company && (
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{order.billing_address.company}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold">Shipping Address</h3>
              </div>
              <div className="space-y-1 text-gray-700">
                <p>{order.shipping_address.address_1}</p>
                {order.shipping_address.address_2 && <p>{order.shipping_address.address_2}</p>}
                <p>{order.shipping_address.city}, {order.shipping_address.postal_code}</p>
                <p>{order.shipping_address.province}, {order.shipping_address.country_code?.toUpperCase()}</p>
              </div>
            </div>
          )}

          {/* Products */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold">Products ({order.items?.length || 0})</h3>
            </div>
            <div className="space-y-3">
              {order.items?.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-4 flex-1">
                    {item.thumbnail && (
                      <img 
                        src={item.thumbnail} 
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.title || item.variant?.product?.title || 'Product'}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      {item.variant?.sku && <p className="text-xs text-gray-400">SKU: {item.variant.sku}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{((item.unit_price * item.quantity) / 100).toFixed(2)} RON</p>
                    <p className="text-sm text-gray-500">{(item.unit_price / 100).toFixed(2)} RON/pc</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>{((order.subtotal || 0) / 100).toFixed(2)} RON</span>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{((order.discount_total || 0) / 100).toFixed(2)} RON</span>
                </div>
              )}
              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span>{((order.shipping_total || 0) / 100).toFixed(2)} RON</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>VAT</span>
                <span>{((order.tax_total || 0) / 100).toFixed(2)} RON</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>{((order.total || 0) / 100).toFixed(2)} RON</span>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          {order.metadata?.invoice_generated && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-900">
                <FileText className="w-5 h-5" />
                <span className="font-medium">Invoice generated: {order.metadata.invoice_number}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {order.metadata?.invoice_number && (
            <button
              onClick={() => window.open(`/app/facturare?tab=facturi`, '_blank')}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View Invoice
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
