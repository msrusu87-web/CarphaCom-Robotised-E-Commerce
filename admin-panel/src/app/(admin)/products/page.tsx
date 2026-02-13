"use client"

import { useState, useEffect } from "react"
import { 
  Package, Search, Plus, 
  Eye, Loader2, X, Upload, Check, AlertCircle, Video,
  TrendingUp, DollarSign, Image as ImageIcon, FileText, ChevronLeft, ChevronRight,
  ZoomIn, Trash2, CheckSquare, Square, RefreshCw
} from "lucide-react"

interface Product {
  id: string
  title: string
  handle: string
  description?: string
  status: string
  thumbnail?: string
  sku?: string
  rrp_price?: number
  distribution_price?: number
  manufacturer?: string
  category?: string
  warranty?: string
  box_size?: number
  stock_total?: number
  ean?: string
  weight?: number
  video_url?: string
  specifications?: Record<string, Record<string, string>>
  tiered_prices?: Array<{
    min_quantity: number
    max_quantity: number | null
    amount: number
    currency_code: string
  }>
  images?: Array<{
    id: string
    url: string
    rank: number
  }>
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // New product form state
  const [newProduct, setNewProduct] = useState({
    title: '',
    sku: '',
    description: '',
    rrp_price: 0,
    distribution_price: 0,
    manufacturer: '',
    category: '',
    warranty: '24 luni',
    stock_total: 0,
    ean: '',
    weight: 0,
    thumbnail: '',
    status: 'draft'
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/app/api/products?limit=100&all=true')
      const data = await res.json()
      
      if (data.products) {
        setProducts(data.products)
      } else if (data.error) {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      console.error('Failed to load products:', error)
      setMessage({ type: 'error', text: 'Failed to load products' })
    } finally {
      setLoading(false)
    }
  }

  const handleImportFromB2B = async () => {
    setIsImporting(true)
    setMessage(null)
    try {
      const res = await fetch('/app/api/suppliers/mypni/scrape-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import-category', categoryId: 348, limit: 10 })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `${data.imported_count} products imported from B2B!` })
        await loadProducts()
      } else {
        setMessage({ type: 'error', text: data.error || 'Import error' })
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsImporting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} product(s)?`)) return
    
    setIsDeleting(true)
    try {
      const res = await fetch('/app/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: `${data.deleted_count} product(s) deleted successfully!` })
        setSelectedIds([])
        await loadProducts()
      } else {
        setMessage({ type: 'error', text: data.error || 'Delete error' })
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateProduct = async () => {
    if (!newProduct.title) {
      setMessage({ type: 'error', text: 'Title is required' })
      return
    }
    
    setIsSaving(true)
    try {
      const res = await fetch('/app/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      })
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: `Product "${data.product.title}" was created successfully!` })
        setShowAddModal(false)
        setNewProduct({
          title: '',
          sku: '',
          description: '',
          rrp_price: 0,
          distribution_price: 0,
          manufacturer: '',
          category: '',
          warranty: '24 months',
          stock_total: 0,
          ean: '',
          weight: 0,
          thumbnail: '',
          status: 'draft'
        })
        await loadProducts()
      } else {
        setMessage({ type: 'error', text: data.error || 'Create error' })
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredProducts.map(p => p.id))
    }
  }

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product)
    setSelectedImageIndex(0)
    setShowModal(true)
  }

  const calculateProfit = (rrp?: number, dist?: number) => {
    if (!rrp || !dist) return { profit: 0, percent: 0 }
    const profit = rrp - dist
    const percent = Math.round((profit / dist) * 100)
    return { profit, percent }
  }

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.handle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const uniqueImages = (images?: Array<{id: string, url: string, rank: number}>) => {
    if (!images) return []
    const seen = new Set<string>()
    return images.filter(img => {
      if (seen.has(img.url)) return false
      seen.add(img.url)
      return true
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">
            {products.length} products • {selectedIds.length} selected
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadProducts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleImportFromB2B}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Import B2B
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-blue-700 font-medium">
            {selectedIds.length} product(s) selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Deselect
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products by name, SKU or handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No products found</p>
            <button onClick={handleImportFromB2B} className="mt-4 text-blue-600 hover:underline">
              Import products from B2B →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-4 py-4 font-medium">
                    <button onClick={toggleSelectAll} className="p-1 hover:bg-gray-200 rounded">
                      {selectedIds.length === filteredProducts.length ? 
                        <CheckSquare className="w-5 h-5 text-blue-600" /> : 
                        <Square className="w-5 h-5" />
                      }
                    </button>
                  </th>
                  <th className="px-4 py-4 font-medium">Product</th>
                  <th className="px-4 py-4 font-medium">SKU</th>
                  <th className="px-4 py-4 font-medium text-right">Supplier Price</th>
                  <th className="px-4 py-4 font-medium text-right">RRP Price</th>
                  <th className="px-4 py-4 font-medium text-right">Profit</th>
                  <th className="px-4 py-4 font-medium text-center">Stock</th>
                  <th className="px-4 py-4 font-medium text-center">Photos</th>
                  <th className="px-4 py-4 font-medium text-center">Status</th>
                  <th className="px-4 py-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const { profit, percent } = calculateProfit(product.rrp_price, product.distribution_price)
                  const imgCount = uniqueImages(product.images).length
                  const isSelected = selectedIds.includes(product.id)
                  return (
                    <tr key={product.id} className={`border-t border-gray-200 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-4">
                        <button onClick={() => toggleSelect(product.id)} className="p-1 hover:bg-gray-200 rounded">
                          {isSelected ? 
                            <CheckSquare className="w-5 h-5 text-blue-600" /> : 
                            <Square className="w-5 h-5 text-gray-400" />
                          }
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.thumbnail ? (
                              <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate max-w-xs">{product.title}</div>
                            <div className="text-xs text-gray-500">{product.manufacturer} • {product.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-mono text-sm text-gray-900">{product.sku || '-'}</div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-medium text-gray-600">
                          {product.distribution_price ? `${product.distribution_price.toFixed(2)} RON` : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-bold text-blue-600">
                          {product.rrp_price ? `${product.rrp_price.toFixed(2)} RON` : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {profit > 0 ? (
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="font-bold text-green-600">{profit.toFixed(0)} RON</span>
                            <span className="text-xs text-green-500">({percent}%)</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`font-bold ${
                          (product.stock_total || 0) === 0 ? 'text-red-600' : 
                          (product.stock_total || 0) < 10 ? 'text-orange-500' : 'text-green-600'
                        }`}>
                          {product.stock_total || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                          <span className={`font-medium ${imgCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                            {imgCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {product.status === 'published' ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openProductDetails(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">Add New Product</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g.: CB Radio Station PNI Escort HP 60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: PNI-HP60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">EAN (Barcode)</label>
                  <input
                    type="text"
                    value={newProduct.ean}
                    onChange={(e) => setNewProduct({...newProduct, ean: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: 5949066543418"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Price (RON)</label>
                  <input
                    type="number"
                    value={newProduct.distribution_price}
                    onChange={(e) => setNewProduct({...newProduct, distribution_price: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RRP Price (RON)</label>
                  <input
                    type="number"
                    value={newProduct.rrp_price}
                    onChange={(e) => setNewProduct({...newProduct, rrp_price: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={newProduct.stock_total}
                    onChange={(e) => setNewProduct({...newProduct, stock_total: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={newProduct.manufacturer}
                    onChange={(e) => setNewProduct({...newProduct, manufacturer: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: PNI"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g.: CB Radio Stations"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty</label>
                  <input
                    type="text"
                    value={newProduct.warranty}
                    onChange={(e) => setNewProduct({...newProduct, warranty: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="24 luni"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newProduct.weight}
                    onChange={(e) => setNewProduct({...newProduct, weight: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.000"
                  />
                </div>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Image URL</label>
                <input
                  type="url"
                  value={newProduct.thumbnail}
                  onChange={(e) => setNewProduct({...newProduct, thumbnail: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Product description..."
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newProduct.status}
                  onChange={(e) => setNewProduct({...newProduct, status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProduct}
                  disabled={isSaving || !newProduct.title}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Save Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">Product Details</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Title & Basic Info */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.title}</h3>
                <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                  <span>SKU: <strong className="font-mono">{selectedProduct.sku}</strong></span>
                  <span>EAN: <strong className="font-mono">{selectedProduct.ean}</strong></span>
                  <span>Manufacturer: <strong>{selectedProduct.manufacturer}</strong></span>
                </div>
              </div>

              {/* IMAGE GALLERY */}
              {selectedProduct.images && uniqueImages(selectedProduct.images).length > 0 && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" /> Image Gallery ({uniqueImages(selectedProduct.images).length})
                  </h4>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-80 h-80 bg-white rounded-lg overflow-hidden border relative group">
                      <img 
                        src={uniqueImages(selectedProduct.images)[selectedImageIndex]?.url} 
                        alt={selectedProduct.title}
                        className="w-full h-full object-contain"
                      />
                      <a 
                        href={uniqueImages(selectedProduct.images)[selectedImageIndex]?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 p-2 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </a>
                      {uniqueImages(selectedProduct.images).length > 1 && (
                        <>
                          <button 
                            onClick={() => setSelectedImageIndex(i => i > 0 ? i - 1 : uniqueImages(selectedProduct.images).length - 1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setSelectedImageIndex(i => i < uniqueImages(selectedProduct.images).length - 1 ? i + 1 : 0)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-2 content-start max-h-80 overflow-y-auto">
                      {uniqueImages(selectedProduct.images).map((img, i) => (
                        <div 
                          key={img.id}
                          onClick={() => setSelectedImageIndex(i)}
                          className={`w-full aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                            i === selectedImageIndex ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Section */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" /> Prices and Profit
                </h4>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Supplier Price</div>
                    <div className="text-2xl font-bold text-gray-700">
                      {selectedProduct.distribution_price?.toFixed(2)} RON
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">RRP Price</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedProduct.rrp_price?.toFixed(2)} RON
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-green-200">
                    <div className="text-sm text-gray-500 mb-1">Profit</div>
                    {(() => {
                      const { profit, percent } = calculateProfit(selectedProduct.rrp_price, selectedProduct.distribution_price)
                      return (
                        <div className="text-2xl font-bold text-green-600 flex items-baseline gap-2">
                          {profit.toFixed(2)} RON
                          <span className="text-sm font-normal text-green-500">({percent}%)</span>
                        </div>
                      )
                    })()}
                  </div>
                </div>
                
                {selectedProduct.tiered_prices && selectedProduct.tiered_prices.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-600 mb-2">Tiered prices:</div>
                    <div className="flex gap-2 flex-wrap">
                      {selectedProduct.tiered_prices.map((tier, i) => (
                        <div key={i} className="bg-white px-3 py-2 rounded-lg text-sm shadow-sm">
                          <span className="text-gray-500">
                            {tier.min_quantity}{tier.max_quantity ? `-${tier.max_quantity}` : '+'} pcs:
                          </span>
                          <span className="font-bold ml-1">{(tier.amount / 100).toFixed(2)} RON</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Inventory & Category */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-bold mb-3">Stock & Shipping</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Available stock:</span><span className="font-bold">{selectedProduct.stock_total || 0} pcs</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Weight:</span><span>{selectedProduct.weight ? `${selectedProduct.weight} kg` : '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Pcs/box:</span><span>{selectedProduct.box_size || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Warranty:</span><span>{selectedProduct.warranty || '-'}</span></div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-bold mb-3">Category</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Category:</span><span>{selectedProduct.category || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Handle URL:</span><span className="font-mono text-xs">{selectedProduct.handle}</span></div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedProduct.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {selectedProduct.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Description
                  </h4>
                  <div className="prose prose-sm max-w-none text-gray-700 bg-white p-4 rounded-lg" dangerouslySetInnerHTML={{ __html: selectedProduct.description }} />
                </div>
              )}

              {/* Videos */}
              {selectedProduct.video_url && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <Video className="w-5 h-5" /> Video Presentation
                  </h4>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe src={selectedProduct.video_url} className="w-full h-full" allowFullScreen />
                  </div>
                </div>
              )}

              {/* SPECIFICATIONS - Grouped */}
              {selectedProduct.specifications && typeof selectedProduct.specifications === 'object' && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-bold mb-3">Technical Specifications</h4>
                  <div className="space-y-4">
                    {Object.entries(selectedProduct.specifications).map(([groupName, specs]) => {
                      if (typeof specs === 'object' && specs !== null) {
                        return (
                          <div key={groupName} className="bg-white rounded-lg overflow-hidden">
                            <div className="bg-blue-50 px-4 py-2 font-medium text-blue-800">{groupName}</div>
                            <div className="divide-y">
                              {Object.entries(specs).map(([key, value]) => (
                                <div key={key} className="flex px-4 py-2">
                                  <span className="text-gray-500 text-sm w-1/2">{key}</span>
                                  <span className="font-medium text-sm w-1/2">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      } else {
                        return (
                          <div key={groupName} className="flex px-4 py-2 bg-white rounded-lg">
                            <span className="text-gray-500 text-sm w-1/2">{groupName}</span>
                            <span className="font-medium text-sm w-1/2">{String(specs)}</span>
                          </div>
                        )
                      }
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
