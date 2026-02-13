"use client"

import { 
  useState, useEffect, useCallback } from "react"
import { 
  useRouter } from "next/navigation"
import { 
  
  ShoppingCart, Package, Warehouse, Users, Percent, DollarSign, Tags,
  Search, Plus, Filter, Eye, Edit, Edit2, Trash2, Sparkles, RotateCcw, Archive,
  Image, Globe, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight,
  Loader2, RefreshCw, X, Tag, Layers, Download, Upload, FileSpreadsheet, ArrowRight,
  Truck, CreditCard, MapPin, Bookmark, Clock, Settings, Save, TestTube, EyeOff, Check,
  Weight, Calculator, ChevronDown, ChevronUp, Wallet, Building2, Banknote, Shield, ExternalLink, FileText
} from "lucide-react"
import { 
  DataCard } from "@/components/responsive-table"
import { OrderDetailsModal } from "@/components/OrderDetailsModal"
import ProductUploadTab from "@/components/product-upload-tab"
import { 
  
  getProducts, searchProducts, getAdminCategories, getAdminProductById, getAdminProducts,
  createProduct, updateProduct, deleteProduct, updateVariantPrice, updateProductImages,
  createCategory, updateCategory, deleteCategory,
  getAdminCustomers, createCustomer, updateCustomer, deleteCustomer,
  getDiscounts, createDiscount, updateDiscount, deleteDiscount, getAdminOrders, getAdminOrderById,
  uploadFile,
  type MedusaProduct, type MedusaCategory, type MedusaCustomer
} from '@/lib/api'

const MAGAZIN_TABS = [
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "brands", label: "Brands", icon: Bookmark },
  { id: "inventory", label: "Inventory", icon: Warehouse },
  { id: "customers", label: "Customers", icon: Users },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "promotions", label: "Promotions", icon: Percent },
  { id: "curieri", label: "Couriers", icon: Truck },
  { id: "plati", label: "Payments", icon: CreditCard },
  { id: "apis", label: "API Suppliers", icon: Globe },
  { id: "trash", label: "Trash", icon: Archive },
]

const PRODUCTS_PER_PAGE_OPTIONS = [20, 50, 100, 500]

export default function MagazinPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("products")
  const [inventorySubTab, setInventorySubTab] = useState<'all' | 'no_stock' | 'published' | 'unpublished' | 'api'>('all')
  const [_apisSubTab, _setApisSubTab] = useState<'overview' | 'sources' | 'settings'>('overview')
  
  // Load tab from URL on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab) setActiveTab(tab)
    }
  }, [])
  const [productsPerPage, setProductsPerPage] = useState(20)
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [categories, setCategories] = useState<MedusaCategory[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [bulkCategory, setBulkCategory] = useState("")
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [csvData, setCsvData] = useState<string[][]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvMapping, setCsvMapping] = useState<Record<string, string>>({})
  const [csvStep, setCsvStep] = useState(1)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MedusaCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', handle: '', description: '', parentId: '', imageUrl: '' })
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false)

  // Message state
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)

  // Orders state
  const [orders, setOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersPage, setOrdersPage] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [ordersSearch, setOrdersSearch] = useState('')
  const [ordersPerPage] = useState(20)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [viewingOrder, setViewingOrder] = useState<any | null>(null)
  const [generatingAWB, setGeneratingAWB] = useState<string | null>(null)
  const [editingAWB, setEditingAWB] = useState<{[key: string]: string}>({}) // Store AWB inputs by order ID
  const [savingAWB, setSavingAWB] = useState<string | null>(null)
  const [processingOrder, setProcessingOrder] = useState<string | null>(null)

  // Brands state
  const [brands, setBrands] = useState<any[]>([])
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<any>(null)
  const [brandForm, setBrandForm] = useState({ name: '', slug: '', description: '', logo: '', country: '', website: '', is_active: true, is_featured: false, sort_order: 0 })


  // Brands API functions
  const loadBrands = async () => {
    setLoadingBrands(true)
    try {
      const res = await fetch("/app/api/brands")
      const data = await res.json()
      setBrands(Array.isArray(data) ? data : (data.brands || []))
    } catch (error) {
      console.error("Error loading brands:", error)
    } finally {
      setLoadingBrands(false)
    }
  }

  // Orders API functions
  const loadOrders = async () => {
    setLoadingOrders(true)
    try {
      const res = await getAdminOrders((ordersPage - 1) * ordersPerPage, ordersPerPage)
      let filteredOrders = res.orders || []
      
      // Client-side search filtering
      if (ordersSearch) {
        const search = ordersSearch.toLowerCase()
        filteredOrders = filteredOrders.filter((order: any) => {
          const displayId = order.display_id?.toString() || ''
          const email = (order.email || order.customer?.email || '').toLowerCase()
          const firstName = (order.shipping_address?.first_name || order.customer?.first_name || '').toLowerCase()
          const lastName = (order.shipping_address?.last_name || order.customer?.last_name || '').toLowerCase()
          const phone = (order.shipping_address?.phone || '').toLowerCase()
          const company = (order.billing_address?.company || '').toLowerCase()
          
          return displayId.includes(search) || email.includes(search) || 
                 firstName.includes(search) || lastName.includes(search) || 
                 phone.includes(search) || company.includes(search)
        })
      }
      
      setOrders(filteredOrders)
      setTotalOrders(res.count || 0)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  // Order Handlers
  const handleViewOrder = async (order: any) => {
    try {
      const { order: fullOrder } = await getAdminOrderById(order.id)
      const items = fullOrder.items?.map((item: any) => 
        `${item.title} x ${item.quantity} = ${((item.unit_price * item.quantity) / 100).toFixed(2)} RON`
      ).join('\n') || 'No items'
      alert(`🛒 Order #${fullOrder.display_id}\n\n📦 Products:\n${items}\n\n💰 Total: ${(fullOrder.total / 100).toFixed(2)} RON\n📊 Status: ${fullOrder.status}\n💳 Payment: ${fullOrder.payment_status}`)
    } catch (error) {
      console.error('Error loading order:', error)
      setMessage({ type: 'error', text: 'Error loading order' })
    }
  }

  const handleEditOrder = (order: any) => {
    setMessage({ type: 'warning', text: `Edit order #${order.display_id} - in development` })
  }

  const handleDeleteOrder = async (order: any) => {
    if (!confirm(`Are you sure you want to DELETE order #${order.display_id}?\n\nThis action is permanent and cannot be undone!`)) return
    setProcessingOrder(order.id)
    try {
      const response = await fetch('/app/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', orderId: order.id })
      })
      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: `Order #${order.display_id} has been deleted` })
        loadOrders()
      } else {
        setMessage({ type: 'error', text: data.error || 'Error deleting' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setProcessingOrder(null)
    }
  }

  const handleAcceptOrder = async (order: any) => {
    console.log('🔵 handleAcceptOrder called for order:', order.id)
    if (!confirm(`Accept order #${order.display_id} for processing?`)) {
      console.log('⚠️ User cancelled confirmation')
      return
    }
    
    console.log('✅ Confirmation accepted, processing order...')
    setProcessingOrder(order.id)
    try {
      console.log('📡 Sending request to /app/api/orders...')
      const response = await fetch('/app/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'accept',
          orderId: order.id,
          adminToken: localStorage.getItem('admin_token'),
          metadata: order.metadata || {}
        })
      })

      console.log('📨 Response status:', response.status)
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || 'Failed to accept order')
      }
      
      const result = await response.json()
      console.log('✅ API Success:', result)
      setMessage({ type: 'success', text: `✅ Order #${order.display_id} accepted successfully!` })
      await loadOrders()
      console.log('🔄 Orders reloaded')
    } catch (error) {
      console.error('Error accepting order:', error)
      setMessage({ type: 'error', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` })
    } finally {
      setProcessingOrder(null)
    }
  }

  const handleGenerateInvoice = async (order: any) => {
    if (!confirm(`Generate invoice for order #${order.display_id}?`)) return
    
    setProcessingOrder(order.id)
    try {
      const response = await fetch('/app/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate-invoice',
          orderId: order.id,
          adminToken: localStorage.getItem('admin_token')
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate invoice')
      }
      
      const result = await response.json()
      
      setMessage({ 
        type: 'success', 
        text: `✅ Invoice ${result.invoice.invoiceNumber} generated successfully! Check in Billing → Invoices.` 
      })
      
      await loadOrders()
    } catch (error) {
      console.error('Error generating invoice:', error)
      setMessage({ type: 'error', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` })
    } finally {
      setProcessingOrder(null)
    }
  }

  const handleAcceptMultipleOrders = async () => {
    console.log('🔵 handleAcceptMultipleOrders called, selected:', selectedOrders.size)
    if (selectedOrders.size === 0) {
      console.log('⚠️ No orders selected')
      return
    }
    if (!confirm(`Accept ${selectedOrders.size} orders for processing?`)) {
      console.log('⚠️ User cancelled confirmation')
      return
    }

    console.log('✅ Processing multiple orders...')
    try {
      const response = await fetch('/app/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept-multiple',
          orderIds: Array.from(selectedOrders),
          adminToken: localStorage.getItem('admin_token')
        })
      })

      if (!response.ok) throw new Error('Failed to accept orders')

      const result = await response.json()
      setMessage({ 
        type: 'success', 
        text: `✅ ${result.accepted} orders accepted successfully!${result.failed > 0 ? ` (${result.failed} failed)` : ''}` 
      })
      setSelectedOrders(new Set())
      await loadOrders()
    } catch (error) {
      console.error('Error accepting multiple orders:', error)
      setMessage({ type: 'error', text: 'Error accepting orders' })
    }
  }

  const toggleOrderSelection = (orderId: string) => {
    const newSelection = new Set(selectedOrders)
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId)
    } else {
      newSelection.add(orderId)
    }
    setSelectedOrders(newSelection)
  }

  const toggleSelectAllOrders = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)))
    }
  }

  const handleViewOrderDetails = async (order: any) => {
    try {
      const { order: fullOrder } = await getAdminOrderById(order.id)
      setViewingOrder(fullOrder)
    } catch (error) {
      console.error('Error loading order:', error)
      setMessage({ type: 'error', text: 'Error loading order' })
    }
  }

  const handleGenerateAWB = async (order: any) => {
    setGeneratingAWB(order.id)
    try {
      // Simulate AWB generation (replace with real courier API later)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const awbNumber = `AWB-${Date.now()}`
      setMessage({ 
        type: 'success', 
        text: `✅ AWB ${awbNumber} generated for order #${order.display_id}` 
      })
      
      // In production, update order metadata with AWB info
      await loadOrders()
    } catch (error) {
      console.error('Error generating AWB:', error)
      setMessage({ type: 'error', text: 'Error generating AWB' })
    } finally {
      setGeneratingAWB(null)
    }
  }

  const handleSaveAWB = async (order: any) => {
    const awbNumber = editingAWB[order.id]?.trim()
    if (!awbNumber) {
      setMessage({ type: 'error', text: 'Enter AWB number' })
      return
    }

    setSavingAWB(order.id)
    try {
      console.log('🚚 Saving AWB:', awbNumber, 'for order:', order.id)
      
      const response = await fetch('/app/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'save-awb',
          orderId: order.id,
          awb: awbNumber
        })
      })

      if (!response.ok) throw new Error('Failed to save AWB')
      
      setMessage({ 
        type: 'success', 
        text: `✅ AWB ${awbNumber} saved for order #${order.display_id}`
      })
      
      // Clear input and reload
      setEditingAWB(prev => ({ ...prev, [order.id]: '' }))
      await loadOrders()
    } catch (error) {
      console.error('Error saving AWB:', error)
      setMessage({ type: 'error', text: 'Error saving AWB' })
    } finally {
      setSavingAWB(null)
    }
  }
  
  const saveBrand = async () => {
    try {
      const method = editingBrand ? 'PUT' : 'POST'
      const body = editingBrand ? { id: editingBrand.id, ...brandForm } : brandForm
      const res = await fetch('/app/api/brands', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        await loadBrands()
        setShowBrandModal(false)
        setEditingBrand(null)
        setBrandForm({ name: '', slug: '', description: '', logo: '', country: '', website: '', is_active: true, is_featured: false, sort_order: 0 })
      }
    } catch (error) {
      console.error('Error saving brand:', error)
    }
  }
  
  const deleteBrand = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return
    try {
      const res = await fetch(`/app/api/brands?id=${id}`, { method: 'DELETE' })
      if (res.ok) await loadBrands()
    } catch (error) {
      console.error('Error deleting brand:', error)
    }
  }

  const openEditBrand = (brand: any) => {
    setEditingBrand(brand)
    setBrandForm({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      logo: brand.logo || '',
      country: brand.country || '',
      website: brand.website || '',
      is_active: brand.is_active,
      is_featured: brand.is_featured,
      sort_order: brand.sort_order || 0
    })
    setShowBrandModal(true)
  }
  
  const openAddBrand = () => {
    setEditingBrand(null)
    setBrandForm({ name: '', slug: '', description: '', logo: '', country: '', website: '', is_active: true, is_featured: false, sort_order: brands.length + 1 })
    setShowBrandModal(true)
  }

  // Load brands when tab changes or when product modal opens
  useEffect(() => {
    if ((activeTab === 'brands' || activeTab === 'products' || activeTab === 'inventory') && brands.length === 0) {
      loadBrands()
    }
  }, [activeTab])

  
  // Promotii state
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<any>(null)
  const [couponForm, setCouponForm] = useState({ 
    code: '', 
    type: 'percentage' as 'percentage' | 'fixed', 
    value: '', 
    minOrder: '', 
    expiryDate: '',
    usageLimit: '',
    isActive: true
  })
  const [coupons, setCoupons] = useState<any[]>([])
  
  // Customers state
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [customerForm, setCustomerForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', notes: '' })
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [inlineEdit, setInlineEdit] = useState<{field: string, value: string}>({field: '', value: ''})
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [searchResults, setSearchResults] = useState<MedusaProduct[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<MedusaProduct | null>(null)
  const [productForm, setProductForm] = useState({ 
    title: '', description: '', handle: '', price: '', stock: '', sku: '',
    gtin: '', brand: '', productType: 'simple' as 'simple' | 'digital',
    mpn: '', condition: 'new' as 'new' | 'refurbished' | 'used',
    availability: 'in_stock' as 'in_stock' | 'out_of_stock' | 'preorder' | 'backorder',
    googleCategory: '', color: '', size: '', material: '',
    weight: '', shippingWeight: '', ageGroup: '', gender: '',
    images: [] as string[],
    categoryIds: [] as string[],
    // PNI Metadata fields - Extended
    pniId: '',
    pniSku: '',
    pniEan: '',
    pniBrand: '',
    rrpPrice: '',
    costPrice: '',
    retailPriceRon: '',
    distributionPriceRon: '',
    stockTotal: '',
    warrantyMonths: '',
    countryOfOrigin: '',
    specifications: [] as Array<{label: string, value: string, section: string}>,
    priceTiers: [] as Array<{qty: number, price: number}>
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [trashedProducts, setTrashedProducts] = useState<MedusaProduct[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<MedusaProduct | null>(null)
  const [deletingProduct, setDeletingProduct] = useState(false)

  // Curieri / Shipping state (loaded from API)
  const [expandedCourier, setExpandedCourier] = useState<string | null>(null)
  const [couriers, setCouriers] = useState<any[]>([])
  const [shippingSettings, setShippingSettings] = useState<any>({
    globalTVA: 19,
    fixedShippingRate: 30,
    freeShippingThreshold: 600,
    fixedRateEnabled: true,
    pickupEnabled: true,
    pickupAddress: 'Calea Unirii nr 35, Suceava',
    pickupSchedule: 'Luni-Vineri: 09:00-18:00',
    shippingMode: 'fixed',
  })
  const [shippingSaving, setShippingSaving] = useState(false)
  const [shippingLoaded, setShippingLoaded] = useState(false)

  // Plati state
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [paymentsSaving, setPaymentsSaving] = useState(false)
  const [paymentsLoaded, setPaymentsLoaded] = useState(false)

  // Load payment settings from API
  const loadPaymentSettings = useCallback(async () => {
    try {
      const res = await fetch('/app/api/settings/payments')
      const data = await res.json()
      if (data.success && Array.isArray(data.payments)) {
        setPayments(data.payments)
      }
      setPaymentsLoaded(true)
    } catch (err) {
      console.error('Failed to load payment settings:', err)
      setPaymentsLoaded(true)
    }
  }, [])

  // Save payment settings to API
  const savePaymentSettings = async () => {
    setPaymentsSaving(true)
    try {
      const res = await fetch('/app/api/settings/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payments }),
      })
      const data = await res.json()
      if (data.success) {
        alert('✅ Payment settings saved successfully!\n\nChanges will be visible in the online store.')
      } else {
        alert('❌ Error saving: ' + (data.error || 'Unknown'))
      }
    } catch (err) {
      console.error('Failed to save payment settings:', err)
      alert('❌ Error saving payment settings')
    } finally {
      setPaymentsSaving(false)
    }
  }

  const toggleCourier = (id: string) => {
    setCouriers(couriers.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c))
  }

  // Load shipping settings from API
  const loadShippingSettings = useCallback(async () => {
    try {
      const res = await fetch('/app/api/settings/shipping')
      const data = await res.json()
      if (data.success && data.settings) {
        const s = data.settings
        setShippingSettings({
          globalTVA: s.globalTVA ?? 19,
          fixedShippingRate: s.fixedShippingRate ?? 30,
          freeShippingThreshold: s.freeShippingThreshold ?? 600,
          fixedRateEnabled: s.fixedRateEnabled ?? true,
          pickupEnabled: s.pickupEnabled ?? true,
          pickupAddress: s.pickupAddress ?? '',
          pickupSchedule: s.pickupSchedule ?? '',
          shippingMode: s.shippingMode ?? 'fixed',
        })
        if (Array.isArray(s.couriers)) {
          setCouriers(s.couriers)
        }
      }
      setShippingLoaded(true)
    } catch (err) {
      console.error('Failed to load shipping settings:', err)
      setShippingLoaded(true)
    }
  }, [])

  // Save shipping settings to API
  const saveShippingSettings = async () => {
    setShippingSaving(true)
    try {
      const res = await fetch('/app/api/settings/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...shippingSettings,
          couriers,
        }),
      })
      const data = await res.json()
      if (data.success) {
        alert('✅ Shipping settings saved successfully!\n\nChanges are active immediately in the online store.')
      } else {
        alert('❌ Error saving: ' + (data.error || 'Unknown'))
      }
    } catch (err) {
      console.error('Failed to save shipping settings:', err)
      alert('❌ Error saving shipping settings')
    } finally {
      setShippingSaving(false)
    }
  }

  const togglePayment = (id: string) => {
    setPayments(payments.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p))
  }

  const targetFields = [
    { key: 'title', label: 'Product Title', required: true },
    { key: 'sku', label: 'SKU', required: false },
    { key: 'price', label: 'Price', required: true },
    { key: 'stock', label: 'Stock', required: false },
    { key: 'description', label: 'Description', required: false },
    { key: 'category', label: 'Category', required: false },
    { key: 'gtin', label: 'GTIN/EAN', required: false },
    { key: 'brand', label: 'Brand', required: false },
    { key: 'image', label: 'Image URL', required: false },
  ]

  const totalPages = Math.ceil(totalProducts / productsPerPage)

  // AJAX Search with debounce - searches ALL products via API
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    if (searchTimeout) clearTimeout(searchTimeout)
    
    if (query.length >= 2) {
      const timeout = setTimeout(async () => {
        try {
          // Search ALL products via API, not just current page
          const data = await searchProducts(query)
          setSearchResults((data.products || []).slice(0, 10))
          setShowSearchDropdown(true)
        } catch (error) {
          console.error("Search failed:", error)
          // Fallback to local search if API fails
          const results = products.filter(p => 
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.handle?.toLowerCase().includes(query.toLowerCase())
          )
          setSearchResults(results.slice(0, 10))
          setShowSearchDropdown(true)
        }
      }, 300)
      setSearchTimeout(timeout)
    } else {
      setSearchResults([])
      setShowSearchDropdown(false)
    }
  }

  const loadProducts = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const offset = (page - 1) * productsPerPage
      // Use local PostgreSQL API for reliable data
      const res = await fetch(`/app/api/products?limit=${productsPerPage}&offset=${offset}&all=true`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setProducts(data.products || [])
      setTotalProducts(data.count || 0)
    } catch (error) {
      console.error("Failed to load products:", error)
    } finally {
      setLoading(false)
    }
  }, [productsPerPage])

  const loadCategories = useCallback(async () => {
    try {
      const data = await getAdminCategories()
      setCategories(data.product_categories || [])
    } catch (error) {
      console.error("Failed to load categories:", error)
    }
  }, [])

  const loadDiscounts = useCallback(async () => {
    try {
      const data = await getDiscounts(0, 100)
      // Transform Medusa v2 promotions to match UI structure
      const discounts = (data.promotions || []).map((d: any) => ({
        id: d.id,
        code: d.code,
        type: d.application_method?.type === 'percentage' ? 'percentage' : 'fixed',
        value: d.application_method?.value || 0,
        minOrder: 0, // Medusa doesn't have direct minOrder, could use conditions
        expiryDate: d.ends_at ? new Date(d.ends_at).toISOString().split('T')[0] : '',
        usageLimit: d.limit || 0,
        usageCount: d.used || 0,
        isActive: d.status === 'active'
      }))
      setCoupons(discounts)
    } catch (error) {
      console.error("Failed to load promotions:", error)
    }
  }, [])

  useEffect(() => {
    loadProducts(currentPage)
    loadCategories()
    loadDiscounts()
    loadPaymentSettings()
    loadShippingSettings()
  }, [currentPage, productsPerPage, loadProducts, loadCategories, loadDiscounts, loadPaymentSettings, loadShippingSettings])

  // Inline edit handlers
  const startInlineEdit = (productId: string, field: string, value: string) => {
    setEditingProductId(productId)
    setInlineEdit({field, value})
  }

  const saveInlineEdit = async (productId: string) => {
    try {
      const updateData: Record<string, unknown> = {}
      if (inlineEdit.field === 'title') updateData.title = inlineEdit.value
      else if (inlineEdit.field === 'price') updateData.metadata = { price: inlineEdit.value }
      else if (inlineEdit.field === 'stock') updateData.metadata = { stock: inlineEdit.value }
      
      await updateProduct(productId, updateData)
      alert(`Saved: ${inlineEdit.field} = ${inlineEdit.value}`)
      loadProducts(currentPage)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setEditingProductId(null)
      setInlineEdit({field: '', value: ''})
    }
  }

  const cancelInlineEdit = () => {
    setEditingProductId(null)
    setInlineEdit({field: '', value: ''})
  }

  // Product CRUD
  const openAddProduct = () => {
    setEditingProduct(null)
    setProductForm({ 
      title: '', description: '', handle: '', price: '', stock: '', sku: '',
      gtin: '', brand: '', productType: 'simple',
      mpn: '', condition: 'new', availability: 'in_stock', googleCategory: '',
      color: '', size: '', material: '', weight: '', shippingWeight: '',
      ageGroup: '', gender: '',
      images: [], categoryIds: [],
      // PNI fields reset - Extended
      pniId: '', pniSku: '', pniEan: '', pniBrand: '',
      rrpPrice: '', costPrice: '', retailPriceRon: '', distributionPriceRon: '',
      stockTotal: '', warrantyMonths: '', countryOfOrigin: '', 
      specifications: [], priceTiers: []
    })
    // Ensure brands are loaded before showing modal
    if (brands.length === 0) {
      loadBrands()
    }
    if (brands.length === 0) { loadBrands() }
    setShowProductModal(true)
  }

  const openEditProduct = (product: MedusaProduct) => {
    setEditingProduct(product)
    const metadata = product.metadata as Record<string, any> || {}
    
    // Parse specifications - can be string or array
    let specs: Array<{label: string, value: string, section: string}> = []
    if (metadata.specifications) {
      if (Array.isArray(metadata.specifications)) {
        specs = metadata.specifications
      } else if (typeof metadata.specifications === 'string') {
        try {
          specs = JSON.parse(metadata.specifications)
        } catch { specs = [] }
      }
    }
    
    // Parse price tiers
    let tiers: Array<{qty: number, price: number}> = []
    if (metadata.price_tiers && Array.isArray(metadata.price_tiers)) {
      tiers = metadata.price_tiers
    }
    
    setProductForm({
      title: product.title,
      description: product.description || '',
      handle: product.handle || '',
      price: getProductPrice(product),
      stock: String(getProductStock(product)),
      sku: getProductSku(product),
      gtin: metadata.gtin || metadata.pni_ean || '',
      brand: metadata.brand || metadata.pni_brand || '',
      productType: (metadata.product_type as 'simple' | 'digital') || 'simple',
      mpn: metadata.mpn || '',
      condition: (metadata.condition as 'new' | 'refurbished' | 'used') || 'new',
      availability: (metadata.availability as 'in_stock' | 'out_of_stock' | 'preorder' | 'backorder') || 'in_stock',
      googleCategory: metadata.google_category || '',
      color: metadata.color || '',
      size: metadata.size || '',
      material: metadata.material || '',
      weight: metadata.weight || '',
      shippingWeight: metadata.shipping_weight || '',
      ageGroup: metadata.age_group || '',
      gender: metadata.gender || '',
      images: product.images?.map(img => img.url) || [],
      categoryIds: product.categories?.map(c => c.id) || [],
      // PNI Metadata from product - Extended
      pniId: String(metadata.pni_id || ''),
      pniSku: metadata.pni_sku || '',
      pniEan: metadata.pni_ean || '',
      pniBrand: metadata.pni_brand || '',
      rrpPrice: metadata.rrp_price ? String(metadata.rrp_price) : (metadata.retail_price_ron ? String(metadata.retail_price_ron) : ''),
      costPrice: metadata.cost_price ? String(metadata.cost_price) : (metadata.distribution_price_ron ? String(metadata.distribution_price_ron) : ''),
      retailPriceRon: metadata.retail_price_ron ? String(metadata.retail_price_ron) : '',
      distributionPriceRon: metadata.distribution_price_ron ? String(metadata.distribution_price_ron) : '',
      stockTotal: metadata.stock_total ? String(metadata.stock_total) : '',
      warrantyMonths: metadata.warranty_months ? String(metadata.warranty_months) : '',
      countryOfOrigin: metadata.country_of_origin || '',
      specifications: specs,
      priceTiers: tiers
    })
    if (brands.length === 0) { loadBrands() }
    setShowProductModal(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (productForm.images.length >= 10) {
      alert('Maximum 10 images per product!')
      return
    }
    
    setUploadingImage(true)
    try {
      const file = files[0]
      const result = await uploadFile(file)
      if (result.url) {
        setProductForm({...productForm, images: [...productForm.images, result.url]})
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Error uploading image!')
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = (index: number) => {
    setProductForm({...productForm, images: productForm.images.filter((_, i) => i !== index)})
  }

  const handleSaveProduct = async () => {
    if (!productForm.title || !productForm.price) return
    setSavingProduct(true)
    
    try {
      // Parse price to cents (Medusa stores prices in smallest currency unit)
      const priceInCents = Math.round(parseFloat(productForm.price) * 100)
      const handle = productForm.handle || productForm.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      
      if (editingProduct) {
        // Update existing product - preserve existing metadata and merge with form data
        const existingMetadata = editingProduct.metadata as Record<string, any> || {}
        await updateProduct(editingProduct.id, {
          title: productForm.title,
          handle,
          description: productForm.description,
          categories: productForm.categoryIds.map(id => ({ id })),
          metadata: {
            ...existingMetadata,
            gtin: productForm.gtin || productForm.pniEan,
            brand: productForm.brand || productForm.pniBrand,
            product_type: productForm.productType,
            stock: productForm.stock,
            sku: productForm.sku || productForm.pniSku,
            mpn: productForm.mpn,
            condition: productForm.condition,
            availability: productForm.availability,
            google_category: productForm.googleCategory,
            color: productForm.color,
            size: productForm.size,
            material: productForm.material,
            weight: productForm.weight,
            shipping_weight: productForm.shippingWeight,
            age_group: productForm.ageGroup,
            gender: productForm.gender,
            // PNI fields - editable
            pni_id: productForm.pniId ? parseInt(productForm.pniId) : existingMetadata.pni_id,
            pni_sku: productForm.pniSku,
            pni_ean: productForm.pniEan,
            pni_brand: productForm.pniBrand,
            rrp_price: productForm.rrpPrice ? parseFloat(productForm.rrpPrice) : existingMetadata.rrp_price,
            cost_price: productForm.costPrice ? parseFloat(productForm.costPrice) : existingMetadata.cost_price,
            retail_price_ron: productForm.retailPriceRon ? parseFloat(productForm.retailPriceRon) : (productForm.rrpPrice ? parseFloat(productForm.rrpPrice) : existingMetadata.retail_price_ron),
            distribution_price_ron: productForm.distributionPriceRon ? parseFloat(productForm.distributionPriceRon) : (productForm.costPrice ? parseFloat(productForm.costPrice) : existingMetadata.distribution_price_ron),
            stock_total: productForm.stockTotal ? parseInt(productForm.stockTotal) : existingMetadata.stock_total,
            warranty_months: productForm.warrantyMonths ? parseInt(productForm.warrantyMonths) : existingMetadata.warranty_months,
            country_of_origin: productForm.countryOfOrigin,
            specifications: productForm.specifications,
            price_tiers: productForm.priceTiers
          }
        })
        
        // Update variant price if product has variants
        const variant = editingProduct.variants?.[0]
        if (variant) {
          await updateVariantPrice(editingProduct.id, variant.id, priceInCents, 'ron')
        }
        
        // Update images if any
        if (productForm.images.length > 0) {
          await updateProductImages(
            editingProduct.id, 
            productForm.images.map(url => ({ url })),
            productForm.images[0] // First image as thumbnail
          )
        }
        
        alert(`Product "${productForm.title}" updated successfully!`)
      } else {
        // Create new product WITH variant and price in single API call
        const result = await createProduct({
          title: productForm.title,
          handle,
          description: productForm.description,
          status: 'published',
          options: [{ title: 'Size', values: ['Standard'] }],
          variants: [{
            title: 'Standard',
            sku: productForm.sku || productForm.pniSku || undefined,
            options: { 'Size': 'Standard' },
            prices: [{ amount: priceInCents, currency_code: 'ron' }]
          }],
          categories: productForm.categoryIds.map(id => ({ id })),
          thumbnail: productForm.images[0] || undefined,
          images: productForm.images.map(url => ({ url })),
          metadata: {
            gtin: productForm.gtin || productForm.pniEan,
            brand: productForm.brand || productForm.pniBrand,
            product_type: productForm.productType,
            stock: productForm.stock || productForm.stockTotal,
            sku: productForm.sku || productForm.pniSku,
            mpn: productForm.mpn,
            condition: productForm.condition,
            availability: productForm.availability,
            google_category: productForm.googleCategory,
            color: productForm.color,
            size: productForm.size,
            material: productForm.material,
            weight: productForm.weight,
            shipping_weight: productForm.shippingWeight,
            age_group: productForm.ageGroup,
            gender: productForm.gender,
            // PNI fields for new products
            pni_id: productForm.pniId ? parseInt(productForm.pniId) : undefined,
            pni_sku: productForm.pniSku || undefined,
            pni_ean: productForm.pniEan || undefined,
            pni_brand: productForm.pniBrand || undefined,
            rrp_price: productForm.rrpPrice ? parseFloat(productForm.rrpPrice) : undefined,
            cost_price: productForm.costPrice ? parseFloat(productForm.costPrice) : undefined,
            retail_price_ron: productForm.retailPriceRon ? parseFloat(productForm.retailPriceRon) : undefined,
            distribution_price_ron: productForm.distributionPriceRon ? parseFloat(productForm.distributionPriceRon) : undefined,
            stock_total: productForm.stockTotal ? parseInt(productForm.stockTotal) : undefined,
            warranty_months: productForm.warrantyMonths ? parseInt(productForm.warrantyMonths) : undefined,
            country_of_origin: productForm.countryOfOrigin || undefined,
            specifications: productForm.specifications.length > 0 ? productForm.specifications : undefined,
            price_tiers: productForm.priceTiers.length > 0 ? productForm.priceTiers : undefined
          }
        })
        
        alert(`Product "${productForm.title}" added successfully!`)
      }
      
      setShowProductModal(false)
      setProductForm({ 
        title: '', description: '', handle: '', price: '', stock: '', sku: '',
        gtin: '', brand: '', productType: 'simple',
        mpn: '', condition: 'new', availability: 'in_stock', googleCategory: '',
        color: '', size: '', material: '', weight: '', shippingWeight: '',
        ageGroup: '', gender: '',
        images: [], categoryIds: [],
        pniId: '', pniSku: '', pniEan: '', pniBrand: '',
        rrpPrice: '', costPrice: '', retailPriceRon: '', distributionPriceRon: '',
        stockTotal: '', warrantyMonths: '', countryOfOrigin: '', 
        specifications: [], priceTiers: []
      })
      setEditingProduct(null)
      loadProducts(currentPage)
    } catch (error: any) {
      console.error('Save product error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setSavingProduct(false)
    }
  }
  const handleDeleteProduct = async (product: MedusaProduct) => {
    setShowDeleteConfirm(product)
  }

  const confirmDeleteProduct = async () => {
    if (!showDeleteConfirm) return
    const product = showDeleteConfirm
    setDeletingProduct(true)
    
    try {
      // Move to trash by setting status to draft and adding trashed metadata
      await updateProduct(product.id, {
        status: 'draft',
        metadata: { ...product.metadata, trashed: true, trashedAt: new Date().toISOString() }
      })
      setTrashedProducts([...trashedProducts, product])
      setMessage({ type: 'success', text: `Product "${product.title}" moved to Trash!` })
      setShowDeleteConfirm(null)
      loadProducts(currentPage) // Refresh list
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setDeletingProduct(false)
    }
  }
  
  const handlePermanentDeleteFromList = async (product: MedusaProduct) => {
    setShowDeleteConfirm(product)
  }

  const handleRestoreProduct = async (product: MedusaProduct) => {
    try {
      await updateProduct(product.id, {
        status: 'published',
        metadata: { ...product.metadata, trashed: false, trashedAt: null }
      })
      setTrashedProducts(trashedProducts.filter(p => p.id !== product.id))
      alert(`Product "${product.title}" restored!`)
      loadProducts(currentPage)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handlePermanentDelete = async (product: MedusaProduct) => {
    if (!confirm(`PERMANENTLY delete product "${product.title}"? This action cannot be undone!`)) return
    
    try {
      await deleteProduct(product.id)
      setTrashedProducts(trashedProducts.filter(p => p.id !== product.id))
      alert(`Product "${product.title}" permanently deleted!`)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const getProductPrice = (product: MedusaProduct) => {
    const variant = product.variants?.[0]
    const price = variant?.prices?.find(p => p.currency_code === "ron") || variant?.prices?.[0]
    if (price && price.amount > 0) {
      return (price.amount / 100).toFixed(2)
    }
    // Fallback: metadata.retail_price_ron (already in RON)
    const metadata = product.metadata as Record<string, any> | null
    if (metadata?.retail_price_ron !== undefined && metadata.retail_price_ron !== null) {
      return parseFloat(metadata.retail_price_ron).toFixed(2)
    }
    return "0.00"
  }

  // Get RRP Price from metadata or variant price
  const getProductRRPPrice = (product: MedusaProduct) => {
    const metadata = product.metadata as Record<string, any> | null
    
    // Priority 1: metadata.retail_price_ron (stored in RON by PNI importer)
    if (metadata?.retail_price_ron !== undefined && metadata.retail_price_ron !== null) {
      const val = parseFloat(metadata.retail_price_ron)
      if (val > 0) return val
    }
    
    // Priority 2: metadata.rrp_price (could be in RON or bani — detect by size)
    if (metadata?.rrp_price !== undefined && metadata.rrp_price !== null) {
      const val = parseFloat(metadata.rrp_price)
      if (val > 0) return val > 10000 ? val / 100 : val  // >10000 likely bani
    }
    
    // Priority 3: metadata.price_rrp (alternate key)
    if (metadata?.price_rrp !== undefined && metadata.price_rrp !== null) {
      const val = parseFloat(metadata.price_rrp)
      if (val > 0) return val > 10000 ? val / 100 : val
    }
    
    // Priority 4: Direct rrp_price from product root
    if ((product as any).rrp_price !== undefined && (product as any).rrp_price !== null) {
      const val = parseFloat((product as any).rrp_price)
      if (val > 0) return val > 10000 ? val / 100 : val
    }
    
    // Fallback: variant price (in bani/cents)
    const variant = product.variants?.[0]
    const price = variant?.prices?.find(p => p.currency_code === "ron") || variant?.prices?.[0]
    if (price && price.amount > 0) {
      return price.amount / 100
    }
    return 0
  }
  
  // Get Supplier/Distribution Price (purchase cost)
  const getProductSupplierPrice = (product: MedusaProduct) => {
    const metadata = product.metadata as Record<string, any> | null
    
    // Priority 1: metadata.distribution_price_ron (stored in RON by PNI importer)
    if (metadata?.distribution_price_ron !== undefined && metadata.distribution_price_ron !== null) {
      const val = parseFloat(metadata.distribution_price_ron)
      if (val > 0) return val
    }
    
    // Priority 2: metadata.supplier_price
    if (metadata?.supplier_price !== undefined && metadata.supplier_price !== null) {
      const val = parseFloat(metadata.supplier_price)
      if (val > 0) return val
    }
    
    // Priority 3: Direct supplier_price from product root
    if ((product as any).supplier_price !== undefined && (product as any).supplier_price !== null) {
      const val = parseFloat((product as any).supplier_price)
      if (val > 0) return val
    }
    
    // Priority 4: metadata.cost_price
    if (metadata?.cost_price !== undefined && metadata.cost_price !== null) {
      const val = parseFloat(metadata.cost_price)
      if (val > 0) return val
    }
    
    // Priority 5: metadata.distribution_price (alternate key)
    if (metadata?.distribution_price !== undefined && metadata.distribution_price !== null) {
      const val = parseFloat(metadata.distribution_price)
      if (val > 0) return val
    }
    
    // Priority 6: First tier from price_tiers (amounts in bani)
    if (metadata?.price_tiers && Array.isArray(metadata.price_tiers) && metadata.price_tiers.length > 0) {
      const firstTier = metadata.price_tiers[0]
      if (firstTier?.price !== undefined) {
        const val = parseFloat(firstTier.price)
        if (val > 0) return val > 10000 ? val / 100 : val  // bani detection
      }
    }
    
    // Priority 7: First tier from supplier_price_tiers
    if (metadata?.supplier_price_tiers && Array.isArray(metadata.supplier_price_tiers) && metadata.supplier_price_tiers.length > 0) {
      const firstTier = metadata.supplier_price_tiers[0]
      if (firstTier?.price !== undefined) {
        const val = parseFloat(firstTier.price)
        if (val > 0) return val > 10000 ? val / 100 : val
      }
    }
    
    return 0
  }

  const getProductStock = (product: MedusaProduct) => {
    const metadata = product.metadata as Record<string, any> | null
    
    // Priority 1: metadata.stock_total (from B2B sync)
    if (metadata?.stock_total !== undefined && metadata.stock_total !== null) {
      return parseInt(String(metadata.stock_total)) || 0
    }
    
    // Priority 2: metadata.stock (from admin form input)
    if (metadata?.stock) {
      return parseInt(metadata.stock) || 0
    }
    
    // Fallback: variant.inventory_quantity (usually null in Medusa v2)
    return product.variants?.[0]?.inventory_quantity ?? 0
  }

  const getProductImage = (product: MedusaProduct): string | null => {
    // Priority: thumbnail > first image URL
    if (product.thumbnail) return product.thumbnail
    if (product.images && product.images.length > 0) return product.images[0].url
    return null
  }

  const getProductSku = (product: MedusaProduct) => {
    return product.variants?.[0]?.sku || product.handle?.substring(0, 15) || "-"
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const renderPagination = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }

    return (
      <div className="flex items-center justify-center gap-1 mt-4">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((page, idx) => (
          typeof page === "number" ? (
            <button
              key={idx}
              onClick={() => goToPage(page)}
              className={`w-10 h-10 rounded-lg text-sm font-medium ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={idx} className="px-2 text-gray-400">...</span>
          )
        ))}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  const filteredProducts = searchQuery 
    ? products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : products

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const selectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.size} selected products?`)) {
      alert(`Deleting ${selectedIds.size} products... (demo)`)  
      clearSelection()
    }
  }

  const handleBulkCategory = () => {
    if (bulkCategory) {
      alert(`Applying category "${bulkCategory}" to ${selectedIds.size} products... (demo)`)
      setShowBulkEdit(false)
      setBulkCategory("")
      clearSelection()
    }
  }

  const handleBulkSEO = () => {
    alert(`Generating SEO for ${selectedIds.size} products... (demo)`)
    clearSelection()
  }

  const handleExportSelected = () => {
    const selectedProducts = products.filter(p => selectedIds.has(p.id))
    const csv = [
      ['ID', 'Title', 'SKU', 'Price', 'Stock'].join(','),
      ...selectedProducts.map(p => [
        p.id,
        `"${p.title.replace(/"/g, '""')}"`,
        getProductSku(p),
        getProductPrice(p),
        getProductStock(p)
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-export-${Date.now()}.csv`
    a.click()
  }

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      const parsed = lines.map(line => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        result.push(current.trim())
        return result
      })
      
      if (parsed.length > 0) {
        setCsvHeaders(parsed[0])
        setCsvData(parsed.slice(1))
        setCsvStep(2)
        
        // Auto-detect field mappings
        const autoMapping: Record<string, string> = {}
        const headerLower = parsed[0].map(h => h.toLowerCase())
        
        targetFields.forEach(field => {
          const idx = headerLower.findIndex(h => 
            h.includes(field.key) || 
            h.includes(field.label.toLowerCase()) ||
            (field.key === 'title' && (h.includes('nume') || h.includes('produs') || h.includes('name'))) ||
            (field.key === 'price' && (h.includes('pret') || h.includes('preț'))) ||
            (field.key === 'stock' && (h.includes('stoc') || h.includes('cantitate') || h.includes('qty')))
          )
          if (idx !== -1) {
            autoMapping[field.key] = parsed[0][idx]
          }
        })
        setCsvMapping(autoMapping)
      }
    }
    reader.readAsText(file)
  }

  const handleCsvImport = () => {
    alert(`Importing ${csvData.length} products... (demo)`)
    setShowCsvImport(false)
    setCsvStep(1)
    setCsvData([])
    setCsvHeaders([])
    setCsvMapping({})
  }

  const resetCsvImport = () => {
    setShowCsvImport(false)
    setCsvStep(1)
    setCsvData([])
    setCsvHeaders([])
    setCsvMapping({})
  }

  const openAddCategory = () => {
    setEditingCategory(null)
    setCategoryForm({ name: '', handle: '', description: '', parentId: '', imageUrl: '' })
    setShowCategoryModal(true)
  }

  const openEditCategory = (cat: MedusaCategory) => {
    setEditingCategory(cat)
    const existingImageUrl = cat.metadata?.image_url || ''
    setCategoryForm({ 
      name: cat.name, 
      handle: cat.handle, 
      description: cat.metadata?.description || '', 
      parentId: cat.parent_category_id || '',
      imageUrl: existingImageUrl
    })
    setShowCategoryModal(true)
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.name) return
    setSavingCategory(true)
    
    try {
      // Generate default image if none provided
      let imageUrl = categoryForm.imageUrl
      if (!imageUrl) {
        const handle = categoryForm.handle || categoryForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        // Use UI Avatars as fallback for category icons
        imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(categoryForm.name)}&size=400&background=1e40af&color=fff&bold=true&font-size=0.4`
      }
      
      const categoryData = {
        name: categoryForm.name,
        handle: categoryForm.handle || categoryForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: categoryForm.description,
        parent_category_id: categoryForm.parentId || undefined,
        metadata: {
          image_url: imageUrl
        }
      }
      
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData)
        alert(`Category "${categoryForm.name}" updated successfully!`)
      } else {
        await createCategory(categoryData)
        alert(`Category "${categoryForm.name}" added successfully!`)
      }
      setShowCategoryModal(false)
      setCategoryForm({ name: '', handle: '', description: '', parentId: '', imageUrl: '' })
      loadCategories() // Refresh list
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSavingCategory(false)
    }
  }

  const handleDeleteCategory = async (cat: MedusaCategory) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return
    
    try {
      await deleteCategory(cat.id)
      alert(`Category "${cat.name}" deleted successfully!`)
      loadCategories() // Refresh list
    } catch (error: any) {
      alert(`Error deleting: ${error.message}`)
    }
  }

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    setCouponForm({...couponForm, code})
  }

  const openAddCoupon = () => {
    setEditingCoupon(null)
    setCouponForm({ code: '', type: 'percentage', value: '', minOrder: '', expiryDate: '', usageLimit: '', isActive: true })
    setShowCouponModal(true)
  }

  const openEditCoupon = (coupon: any) => {
    setEditingCoupon(coupon)
    setCouponForm({ 
      code: coupon.code, 
      type: coupon.type, 
      value: String(coupon.value), 
      minOrder: String(coupon.minOrder || ''), 
      expiryDate: coupon.expiryDate || '',
      usageLimit: String(coupon.usageLimit || ''),
      isActive: coupon.isActive 
    })
    setShowCouponModal(true)
  }

  const handleSaveCoupon = async () => {
    if (!couponForm.code || !couponForm.value) return
    
    try {
      const discountData = {
        code: couponForm.code.toUpperCase(),
        rule: {
          type: couponForm.type,
          value: couponForm.type === 'percentage' ? parseFloat(couponForm.value) : parseFloat(couponForm.value) * 100, // Medusa uses cents for fixed
          allocation: 'total' as const
        },
        is_disabled: !couponForm.isActive,
        ends_at: couponForm.expiryDate ? new Date(couponForm.expiryDate).toISOString() : undefined,
        usage_limit: couponForm.usageLimit ? parseInt(couponForm.usageLimit) : undefined,
      }
      
      if (editingCoupon) {
        await updateDiscount(editingCoupon.id, {
          code: discountData.code,
          is_disabled: discountData.is_disabled,
          ends_at: discountData.ends_at,
          usage_limit: discountData.usage_limit
        })
        alert(`Coupon "${couponForm.code}" updated successfully!`)
      } else {
        await createDiscount(discountData)
        alert(`Coupon "${couponForm.code}" added successfully!`)
      }
      setShowCouponModal(false)
      setCouponForm({ code: '', type: 'percentage', value: '', minOrder: '', expiryDate: '', usageLimit: '', isActive: true })
      loadDiscounts() // Refresh list
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleDeleteCoupon = async (coupon: any) => {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return
    try {
      await deleteDiscount(coupon.id)
      alert(`Coupon "${coupon.code}" deleted successfully!`)
      loadDiscounts()
    } catch (error: any) {
      alert(`Error deleting: ${error.message}`)
    }
  }

  const toggleCouponActive = async (coupon: any) => {
    try {
      await updateDiscount(coupon.id, { is_disabled: coupon.isActive }) // Toggle: if active, disable it
      loadDiscounts()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  // Customer handlers
  const openAddCustomer = () => {
    setEditingCustomer(null)
    setCustomerForm({ firstName: '', lastName: '', email: '', phone: '', password: '', notes: '' })
    setShowPasswordReset(false)
    setShowCustomerModal(true)
  }

  const openEditCustomer = (customer: any) => {
    setEditingCustomer(customer)
    setCustomerForm({ firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone || '', password: '', notes: customer.notes || '' })
    setShowPasswordReset(false)
    setShowCustomerModal(true)
  }

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true)
    try {
      const data = await getAdminCustomers(0, 100)
      const mappedCustomers = (data.customers || []).map((c: MedusaCustomer) => ({
        id: c.id,
        firstName: c.first_name || '',
        lastName: c.last_name || '',
        email: c.email,
        phone: c.phone || '',
        orders: (c.metadata as any)?.orders_count || 0,
        totalSpent: (c.metadata as any)?.total_spent || 0,
        createdAt: c.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        notes: (c.metadata as any)?.notes || ''
      }))
      setCustomers(mappedCustomers)
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoadingCustomers(false)
    }
  }, [])

  // Load customers when tab changes
  useEffect(() => {
    if (activeTab === 'customers' && customers.length === 0) {
      loadCustomers()
    }
  }, [activeTab, customers.length, loadCustomers])


  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders()
    }
  }, [activeTab, ordersPage, ordersSearch])

  const handleSaveCustomer = async () => {
    if (!customerForm.firstName || !customerForm.email) return
    setSavingCustomer(true)
    
    try {
      const customerData = {
        email: customerForm.email,
        first_name: customerForm.firstName,
        last_name: customerForm.lastName,
        phone: customerForm.phone,
        metadata: {
          notes: customerForm.notes
        }
      }
      
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, customerData)
        alert(`Customer "${customerForm.firstName} ${customerForm.lastName}" updated successfully!`)
      } else {
        await createCustomer(customerData)
        alert(`Customer "${customerForm.firstName} ${customerForm.lastName}" added successfully!`)
      }
      setShowCustomerModal(false)
      loadCustomers() // Refresh list
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSavingCustomer(false)
    }
  }

  const handleDeleteCustomer = async (customer: any) => {
    if (!confirm(`Delete customer "${customer.firstName} ${customer.lastName}"?`)) { return }
    
    try {
      await deleteCustomer(customer.id)
      alert(`Customer "${customer.firstName} ${customer.lastName}" deleted successfully!`)
      loadCustomers() // Refresh list
    } catch (error: any) {
      alert(`Error deleting: ${error.message}`)
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Toast Messages */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-medium">{message.text}</p>
            </div>
            <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Store</h1>
          <p className="text-sm text-gray-500">Manage orders, products and customers</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCsvImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <button 
            onClick={() => loadProducts(currentPage)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openAddProduct} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus className="w-5 h-5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 -mx-4 px-4 lg:mx-0 lg:px-0">
        <nav className="flex gap-1 -mb-px overflow-x-auto pb-px scrollbar-hide">
          {MAGAZIN_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                router.push(`/magazin?tab=${tab.id}`, { scroll: false })
              }}
              className={`flex items-center gap-2 px-3 lg:px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search with AJAX dropdown */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products... (min 2 characters)"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {/* Search Results Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {searchResults.map(product => (
                <div 
                  key={product.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                  onMouseDown={() => {
                    openEditProduct(product)
                    setShowSearchDropdown(false)
                    setSearchQuery('')
                  }}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${getProductImage(product) ? 'bg-gray-100' : 'bg-red-100'}`}>
                    {getProductImage(product) ? (
                      <img src={getProductImage(product)!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.title}</p>
                    <p className="text-sm text-gray-500">{getProductPrice(product)} RON • Stock: {getProductStock(product)}</p>
                  </div>
                  <Edit className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
              <p className="text-sm text-gray-500">Total Products</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-2xl font-bold text-green-600">{categories.length}</p>
              <p className="text-sm text-gray-500">Categories</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-2xl font-bold text-blue-600">{currentPage}</p>
              <p className="text-sm text-gray-500">Page / {totalPages}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <select 
                value={productsPerPage}
                onChange={(e) => {
                  setProductsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="text-2xl font-bold text-purple-600 bg-transparent border-none cursor-pointer focus:outline-none w-full"
              >
                {PRODUCTS_PER_PAGE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
                <option value={10000}>All</option>
              </select>
              <p className="text-sm text-gray-500">Per Page</p>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="bg-blue-600 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-medium">{selectedIds.size} selected</span>
                <button onClick={clearSelection} className="p-1 hover:bg-blue-500 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setShowBulkEdit(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 rounded-lg text-sm"
                >
                  <Tag className="w-4 h-4" />Category
                </button>
                <button 
                  onClick={handleBulkSEO}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 hover:bg-purple-400 rounded-lg text-sm"
                >
                  <Sparkles className="w-4 h-4" />Generate SEO
                </button>
                <button 
                  onClick={handleExportSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-400 rounded-lg text-sm"
                >
                  <Download className="w-4 h-4" />Export CSV
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-400 rounded-lg text-sm"
                >
                  <Trash2 className="w-4 h-4" />Delete
                </button>
              </div>
            </div>
          )}

          {/* Bulk Category Modal */}
          {showBulkEdit && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Change Category</h3>
                <p className="text-sm text-gray-500 mb-4">Apply to {selectedIds.size} selected products</p>
                <select 
                  value={bulkCategory} 
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowBulkEdit(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleBulkCategory}
                    disabled={!bulkCategory}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CSV Import Modal */}
          {showCsvImport && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Import CSV
                  </h3>
                  <button onClick={resetCsvImport} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Step indicators */}
                <div className="flex items-center gap-2 mb-6">
                  {[1, 2, 3].map(step => (
                    <div key={step} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        csvStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step}
                      </div>
                      <span className={`text-sm ${csvStep >= step ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step === 1 ? 'Upload' : step === 2 ? 'Mapping' : 'Import'}
                      </span>
                      {step < 3 && <ArrowRight className="w-4 h-4 text-gray-300" />}
                    </div>
                  ))}
                </div>

                {/* Step 1: Upload */}
                {csvStep === 1 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Drag the CSV file here or click to upload</p>
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleCsvFile}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label 
                      htmlFor="csv-upload"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      Select CSV
                    </label>
                  </div>
                )}

                {/* Step 2: Field Mapping */}
                {csvStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">Detected {csvData.length} rows. Map the columns:</p>
                    <div className="grid gap-3">
                      {targetFields.map(field => (
                        <div key={field.key} className="flex items-center gap-3">
                          <label className="w-32 text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <select
                            value={csvMapping[field.key] || ''}
                            onChange={(e) => setCsvMapping({...csvMapping, [field.key]: e.target.value})}
                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="">-- Do not map --</option>
                            {csvHeaders.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          {csvMapping[field.key] && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button 
                        onClick={() => setCsvStep(1)}
                        className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Back
                      </button>
                      <button 
                        onClick={() => setCsvStep(3)}
                        disabled={!csvMapping.title || !csvMapping.price}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Preview & Import */}
                {csvStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">Preview first 5 products from {csvData.length} total:</p>
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Title</th>
                            <th className="px-3 py-2 text-left">Price</th>
                            <th className="px-3 py-2 text-left">SKU</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 5).map((row, i) => {
                            const titleIdx = csvHeaders.indexOf(csvMapping.title || '')
                            const priceIdx = csvHeaders.indexOf(csvMapping.price || '')
                            const skuIdx = csvHeaders.indexOf(csvMapping.sku || '')
                            return (
                              <tr key={i} className="border-t">
                                <td className="px-3 py-2 truncate max-w-[200px]">{row[titleIdx] || '-'}</td>
                                <td className="px-3 py-2">{row[priceIdx] || '-'}</td>
                                <td className="px-3 py-2">{row[skuIdx] || '-'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                      <strong>Warning:</strong> {csvData.length} new products will be imported into the catalog.
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setCsvStep(2)}
                        className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Back
                      </button>
                      <button 
                        onClick={handleCsvImport}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Import {csvData.length} Products
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Edit Modal */}
          {showProductModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Title *</label>
                      <input
                        type="text"
                        value={productForm.title}
                        onChange={(e) => setProductForm({...productForm, title: e.target.value, handle: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')})}
                        className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                        placeholder="CB Radio Station..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                      <input
                        type="text"
                        value={productForm.handle}
                        onChange={(e) => setProductForm({...productForm, handle: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
                        placeholder="statie-radio-cb"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                      <input
                        type="text"
                        value={productForm.sku}
                        onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg font-mono"
                        placeholder="CB-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (RON) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="299.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                      <input
                        type="number"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  {/* Rich Text Editor for Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      {/* Toolbar */}
                      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
                        <button type="button" className="p-2 hover:bg-gray-200 rounded" title="Bold" onClick={() => document.execCommand('bold')}>
                          <span className="font-bold text-sm">B</span>
                        </button>
                        <button type="button" className="p-2 hover:bg-gray-200 rounded" title="Italic" onClick={() => document.execCommand('italic')}>
                          <span className="italic text-sm">I</span>
                        </button>
                        <button type="button" className="p-2 hover:bg-gray-200 rounded" title="Underline" onClick={() => document.execCommand('underline')}>
                          <span className="underline text-sm">U</span>
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1" />
                        <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm" title="Heading" onClick={() => document.execCommand('formatBlock', false, 'h2')}>
                          H2
                        </button>
                        <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm" title="Heading 3" onClick={() => document.execCommand('formatBlock', false, 'h3')}>
                          H3
                        </button>
                        <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm" title="Paragraph" onClick={() => document.execCommand('formatBlock', false, 'p')}>
                          P
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1" />
                        <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm" title="List" onClick={() => document.execCommand('insertUnorderedList')}>
                          • List
                        </button>
                        <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm" title="Numbered list" onClick={() => document.execCommand('insertOrderedList')}>
                          1. Num
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1" />
                        <select 
                          className="p-1.5 text-sm border border-gray-300 rounded bg-white"
                          onChange={(e) => document.execCommand('fontSize', false, e.target.value)}
                          defaultValue="3"
                        >
                          <option value="1">Small</option>
                          <option value="2">Small Normal</option>
                          <option value="3">Normal</option>
                          <option value="4">Medium</option>
                          <option value="5">Large</option>
                          <option value="6">Very Large</option>
                        </select>
                        <div className="w-px h-6 bg-gray-300 mx-1" />
                        <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm" title="Link" onClick={() => {
                          const url = prompt('URL Link:')
                          if (url) document.execCommand('createLink', false, url)
                        }}>
                          🔗
                        </button>
                        <button type="button" className="p-2 hover:bg-gray-200 rounded text-sm text-red-600" title="Clear formatting" onClick={() => document.execCommand('removeFormat')}>
                          ✕
                        </button>
                      </div>
                      {/* Editor Area */}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none"
                        onBlur={(e) => setProductForm({...productForm, description: e.currentTarget.innerHTML})}
                        dangerouslySetInnerHTML={{ __html: productForm.description }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Select text to apply style. Supports Bold, Italic, Lists, Headings.</p>
                  </div>

                  {/* Product Type & Google Merchant Fields */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Google Merchant Center</h4>
                    </div>
                    <p className="text-sm text-blue-700">Fill in these fields for Google Shopping approval.</p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                        <select
                          value={productForm.productType}
                          onChange={(e) => setProductForm({...productForm, productType: e.target.value as 'simple' | 'digital'})}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        >
                          <option value="simple">Physical Product</option>
                          <option value="digital">Digital Product</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GTIN / EAN</label>
                        <input
                          type="text"
                          value={productForm.gtin}
                          onChange={(e) => setProductForm({...productForm, gtin: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg font-mono"
                          placeholder="5901234123457"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                        <select
                          value={productForm.brand}
                          onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        >
                          <option value="">Select brand...</option>
                          {brands.map(b => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Additional GMC Fields */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">MPN (Manufacturer Code)</label>
                        <input
                          type="text"
                          value={productForm.mpn}
                          onChange={(e) => setProductForm({...productForm, mpn: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg font-mono"
                          placeholder="ABC123XYZ"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Condition</label>
                        <select
                          value={productForm.condition}
                          onChange={(e) => setProductForm({...productForm, condition: e.target.value as 'new' | 'refurbished' | 'used'})}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        >
                          <option value="new">New</option>
                          <option value="refurbished">Refurbished</option>
                          <option value="used">Used</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                        <select
                          value={productForm.availability}
                          onChange={(e) => setProductForm({...productForm, availability: e.target.value as 'in_stock' | 'out_of_stock' | 'preorder' | 'backorder'})}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        >
                          <option value="in_stock">In Stock</option>
                          <option value="out_of_stock">Out of Stock</option>
                          <option value="preorder">Preorder</option>
                          <option value="backorder">Special Order</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Google Category (optional)</label>
                        <input
                          type="text"
                          list="google-categories"
                          value={productForm.googleCategory}
                          onChange={(e) => setProductForm({...productForm, googleCategory: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                          placeholder="Search or select category..."
                        />
                        <datalist id="google-categories">
                          <option value="Electronics > Communications > Two-Way Radios" />
                          <option value="Electronics > Communications > CB Radios" />
                          <option value="Electronics > Communications > Radio Accessories" />
                          <option value="Electronics > Communications > Radio Antennas" />
                          <option value="Electronics > GPS & Navigation" />
                          <option value="Electronics > Audio > Speakers" />
                          <option value="Electronics > Car Electronics > Car Audio" />
                          <option value="Vehicles & Parts > Vehicle Parts & Accessories" />
                          <option value="Vehicles & Parts > Vehicle Electronics" />
                          <option value="Hardware > Tools" />
                          <option value="Hardware > Electrical" />
                          <option value="Apparel & Accessories > Clothing" />
                          <option value="Apparel & Accessories > Shoes" />
                          <option value="Apparel & Accessories > Jewelry" />
                          <option value="Home & Garden > Home Decor" />
                          <option value="Home & Garden > Furniture" />
                          <option value="Sports & Fitness > Outdoor Recreation" />
                          <option value="Sports & Fitness > Exercise & Fitness" />
                          <option value="Health & Beauty > Personal Care" />
                          <option value="Health & Beauty > Medical Devices" />
                          <option value="Baby & Toddler > Baby Care" />
                          <option value="Toys & Games > Games" />
                          <option value="Food & Beverages > Food Items" />
                          <option value="Office Supplies > Office Equipment" />
                          <option value="Software > Computer Software" />
                          <option value="Cameras & Optics > Cameras" />
                          <option value="Media > Books" />
                          <option value="Media > Music & Sound Recordings" />
                          <option value="Pet Supplies > Pet Food" />
                          <option value="Arts & Entertainment > Hobbies & Creative Arts" />
                        </datalist>
                        <p className="text-xs text-gray-500 mt-1">Enter text for autocomplete or leave empty</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <input
                          type="text"
                          value={productForm.color}
                          onChange={(e) => setProductForm({...productForm, color: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                          placeholder="Negru"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                        <input
                          type="text"
                          value={productForm.size}
                          onChange={(e) => setProductForm({...productForm, size: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                          placeholder="M / 42 / XL"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                        <input
                          type="text"
                          value={productForm.material}
                          onChange={(e) => setProductForm({...productForm, material: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                          placeholder="Bumbac 100%"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                        <input
                          type="text"
                          value={productForm.weight}
                          onChange={(e) => setProductForm({...productForm, weight: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                          placeholder="0.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Weight</label>
                        <input
                          type="text"
                          value={productForm.shippingWeight}
                          onChange={(e) => setProductForm({...productForm, shippingWeight: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                          placeholder="0.6"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                        <select
                          value={productForm.ageGroup}
                          onChange={(e) => setProductForm({...productForm, ageGroup: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        >
                          <option value="">Select...</option>
                          <option value="newborn">Newborns (0-3 months)</option>
                          <option value="infant">Infants (3-12 months)</option>
                          <option value="toddler">Toddlers (1-5 years)</option>
                          <option value="kids">Children (5-13 years)</option>
                          <option value="adult">Adults</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                          value={productForm.gender}
                          onChange={(e) => setProductForm({...productForm, gender: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        >
                          <option value="">Select...</option>
                          <option value="male">Men</option>
                          <option value="female">Women</option>
                          <option value="unisex">Unisex</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* PNI Metadata Section - Editable */}
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-orange-600" />
                      <h4 className="font-medium text-orange-900">Supplier Data / PNI</h4>
                      {productForm.pniId && <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Synced product</span>}
                    </div>
                    <p className="text-sm text-orange-700">Optional data for products imported from suppliers (PNI, FOMCO, etc.)</p>
                    
                    {/* Row 1: Identificare */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PNI ID</label>
                        <input
                          type="text"
                          value={productForm.pniId}
                          onChange={(e) => setProductForm({...productForm, pniId: e.target.value})}
                          placeholder="ex: 4124"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PNI SKU</label>
                        <input
                          type="text"
                          value={productForm.pniSku}
                          onChange={(e) => setProductForm({...productForm, pniSku: e.target.value})}
                          placeholder="ex: PNI-1212C"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">EAN/GTIN</label>
                        <input
                          type="text"
                          value={productForm.pniEan || productForm.gtin}
                          onChange={(e) => setProductForm({...productForm, pniEan: e.target.value, gtin: e.target.value})}
                          placeholder="ex: 5949066504457"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Brand</label>
                        <input
                          type="text"
                          value={productForm.pniBrand}
                          onChange={(e) => setProductForm({...productForm, pniBrand: e.target.value})}
                          placeholder="ex: PNI"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                    
                    {/* Row 2: Prices and Costs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">RRP Price (RON)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={productForm.rrpPrice}
                          onChange={(e) => setProductForm({...productForm, rrpPrice: e.target.value})}
                          placeholder="ex: 826"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (RON)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={productForm.costPrice}
                          onChange={(e) => setProductForm({...productForm, costPrice: e.target.value})}
                          placeholder="ex: 500"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-orange-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price (RON)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={productForm.retailPriceRon}
                          onChange={(e) => setProductForm({...productForm, retailPriceRon: e.target.value})}
                          placeholder="ex: 8.26"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Distribution Price (RON)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={productForm.distributionPriceRon}
                          onChange={(e) => setProductForm({...productForm, distributionPriceRon: e.target.value})}
                          placeholder="ex: 5"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>
                    
                    {/* Row 3: Alte date */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Supplier Stock</label>
                        <input
                          type="number"
                          value={productForm.stockTotal}
                          onChange={(e) => setProductForm({...productForm, stockTotal: e.target.value})}
                          placeholder="ex: 20"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Warranty (months)</label>
                        <input
                          type="number"
                          value={productForm.warrantyMonths}
                          onChange={(e) => setProductForm({...productForm, warrantyMonths: e.target.value})}
                          placeholder="ex: 24"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
                        <input
                          type="text"
                          value={productForm.countryOfOrigin}
                          onChange={(e) => setProductForm({...productForm, countryOfOrigin: e.target.value})}
                          placeholder="ex: CN, RO, DE"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div className="flex items-end">
                        {productForm.rrpPrice && productForm.costPrice && (
                          <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                            <span className="text-xs text-blue-600">Margin:</span>
                            <span className="block font-bold text-blue-800">
                              {((parseFloat(productForm.rrpPrice) - parseFloat(productForm.costPrice)) / parseFloat(productForm.rrpPrice) * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Specifications Table */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Technical Specifications</label>
                        <button
                          type="button"
                          onClick={() => setProductForm({
                            ...productForm, 
                            specifications: [...productForm.specifications, {label: '', value: '', section: 'General'}]
                          })}
                          className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add specification
                        </button>
                      </div>
                      
                      {productForm.specifications.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">Section</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">Property</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">Value</th>
                                <th className="px-3 py-2 w-10"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {productForm.specifications.map((spec, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      value={spec.section}
                                      onChange={(e) => {
                                        const newSpecs = [...productForm.specifications]
                                        newSpecs[idx] = {...spec, section: e.target.value}
                                        setProductForm({...productForm, specifications: newSpecs})
                                      }}
                                      placeholder="General"
                                      className="w-full p-1.5 border border-gray-200 rounded text-xs"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      value={spec.label}
                                      onChange={(e) => {
                                        const newSpecs = [...productForm.specifications]
                                        newSpecs[idx] = {...spec, label: e.target.value}
                                        setProductForm({...productForm, specifications: newSpecs})
                                      }}
                                      placeholder="ex: Material"
                                      className="w-full p-1.5 border border-gray-200 rounded text-xs"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      value={spec.value}
                                      onChange={(e) => {
                                        const newSpecs = [...productForm.specifications]
                                        newSpecs[idx] = {...spec, value: e.target.value}
                                        setProductForm({...productForm, specifications: newSpecs})
                                      }}
                                      placeholder="ex: ABS"
                                      className="w-full p-1.5 border border-gray-200 rounded text-xs"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newSpecs = productForm.specifications.filter((_, i) => i !== idx)
                                        setProductForm({...productForm, specifications: newSpecs})
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                          No specifications. Click &quot;Add specification&quot; to add.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Categories</label>
                    <div className="border border-gray-300 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                      {categories.filter(c => !c.parent_category_id).map(cat => {
                        const subcategories = categories.filter(sub => sub.parent_category_id === cat.id)
                        return (
                          <div key={cat.id} className="space-y-1">
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={productForm.categoryIds.includes(cat.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setProductForm({...productForm, categoryIds: [...productForm.categoryIds, cat.id]})
                                  } else {
                                    setProductForm({...productForm, categoryIds: productForm.categoryIds.filter(id => id !== cat.id)})
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="font-medium text-gray-900">{cat.name}</span>
                            </label>
                            {subcategories.length > 0 && (
                              <div className="ml-6 space-y-1">
                                {subcategories.map(sub => (
                                  <label key={sub.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                    <input
                                      type="checkbox"
                                      checked={productForm.categoryIds.includes(sub.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setProductForm({...productForm, categoryIds: [...productForm.categoryIds, sub.id]})
                                        } else {
                                          setProductForm({...productForm, categoryIds: productForm.categoryIds.filter(id => id !== sub.id)})
                                        }
                                      }}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">└ {sub.name}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {categories.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-2">No categories. Add categories in the Categories tab.</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Select one or more categories for this product.</p>
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Images ({productForm.images.length}/10)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                      {productForm.images.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url.startsWith('/') ? `/app${url}` : url} 
                            alt={`Image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded">Main</span>
                          )}
                        </div>
                      ))}
                      
                      {productForm.images.length < 10 && (
                        <label className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                          {uploadingImage ? (
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-gray-400" />
                              <span className="text-xs text-gray-500 mt-1">Add</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">First image = main thumbnail. Drag to reorder. Max 10 images.</p>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200 flex gap-3">
                  <button 
                    onClick={() => setShowProductModal(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                  >
                    Cancel
                  </button>
                  {editingProduct && (
                    <a
                      href={`https://www.YOUR_PNI_USERNAMEtrafic.ro/ro/products/${editingProduct.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 font-medium flex items-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Vezi pe Site
                    </a>
                  )}
                  <button 
                    onClick={handleSaveProduct}
                    disabled={!productForm.title || !productForm.price || savingProduct}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                  >
                    {savingProduct ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {savingProduct ? 'Saving...' : (editingProduct ? 'Save Changes' : 'Add Product')}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Delete Product</h3>
                    <p className="text-sm text-gray-500">This action moves the product to the trash</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    {showDeleteConfirm.thumbnail && (
                      <img 
                        src={showDeleteConfirm.thumbnail.startsWith('/') ? `/app${showDeleteConfirm.thumbnail}` : showDeleteConfirm.thumbnail}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{showDeleteConfirm.title}</p>
                      <p className="text-sm text-gray-500">{showDeleteConfirm.handle}</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete this product? You can recover it from the "Trash" tab.
                </p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                    disabled={deletingProduct}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDeleteProduct}
                    disabled={deletingProduct}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                  >
                    {deletingProduct ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {deletingProduct ? 'Deleting...' : 'Delete Product'}
                  </button>
                </div>
              </div>
            </div>
          )}


          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-500">Loading products...</span>
            </div>
          ) : (
            <>
              <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-sm text-gray-500">
                      <th className="px-4 py-4 font-medium w-12">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300" 
                          checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                          onChange={selectAll}
                        />
                      </th>
                      <th className="px-4 py-4 font-medium">Product</th>
                      <th className="px-4 py-4 font-medium">SKU</th>
                      <th className="px-4 py-4 font-medium text-green-700">💰 RRP</th>
                      <th className="px-4 py-4 font-medium text-orange-700">🏭 Supplier</th>
                      <th className="px-4 py-4 font-medium">Stock</th>
                      <th className="px-4 py-4 font-medium">Status</th>
                      <th className="px-4 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className={`border-t border-gray-200 hover:bg-gray-50 ${selectedIds.has(product.id) ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300" 
                            checked={selectedIds.has(product.id)}
                            onChange={() => toggleSelect(product.id)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${getProductImage(product) ? 'bg-gray-100' : 'bg-red-100'}`}>
                              {getProductImage(product) ? (
                                <img src={getProductImage(product)!} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Image className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              {editingProductId === product.id && inlineEdit.field === 'title' ? (
                                <input
                                  type="text"
                                  value={inlineEdit.value}
                                  onChange={(e) => setInlineEdit({...inlineEdit, value: e.target.value})}
                                  onBlur={() => saveInlineEdit(product.id)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit(product.id); if (e.key === 'Escape') cancelInlineEdit(); }}
                                  autoFocus
                                  className="w-full px-2 py-1 border border-blue-400 rounded text-sm font-medium"
                                />
                              ) : (
                                <p 
                                  className="font-medium text-gray-900 line-clamp-1 cursor-pointer hover:text-blue-600" 
                                  title="Click to edit"
                                  onClick={() => startInlineEdit(product.id, 'title', product.title)}
                                >
                                  {product.title}
                                </p>
                              )}
                              <p className="text-sm text-gray-500 truncate">{product.handle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-500 font-mono text-sm">{getProductSku(product)}</td>
                        {/* RRP Price Column */}
                        <td className="px-4 py-4">
                          <span className="font-semibold text-green-700">
                            {getProductRRPPrice(product) > 0 ? `${getProductRRPPrice(product).toFixed(2)} RON` : '-'}
                          </span>
                        </td>
                        {/* Supplier Price Column */}
                        <td className="px-4 py-4">
                          <span className="font-medium text-orange-600">
                            {getProductSupplierPrice(product) > 0 ? `${getProductSupplierPrice(product).toFixed(2)} RON` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {editingProductId === product.id && inlineEdit.field === 'stock' ? (
                            <input
                              type="number"
                              value={inlineEdit.value}
                              onChange={(e) => setInlineEdit({...inlineEdit, value: e.target.value})}
                              onBlur={() => saveInlineEdit(product.id)}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit(product.id); if (e.key === 'Escape') cancelInlineEdit(); }}
                              autoFocus
                              className="w-16 px-2 py-1 border border-blue-400 rounded text-sm"
                            />
                          ) : (
                            <span 
                              className={`cursor-pointer hover:text-blue-600 ${getProductStock(product) > 0 ? "text-green-600" : "text-red-600"}`}
                              title="Click to edit"
                              onClick={() => startInlineEdit(product.id, 'stock', String(getProductStock(product)))}
                            >
                              {getProductStock(product)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {getProductImage(product) ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle className="w-4 h-4" />OK
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-600 text-sm">
                              <AlertTriangle className="w-4 h-4" />Missing
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            <a 
                              href={`https://www.YOUR_PNI_USERNAMEtrafic.ro/ro/products/${product.handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg inline-flex"
                              title="View on site"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <button onClick={() => openEditProduct(product)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg" title="Edit"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteProduct(product)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-3">
                {filteredProducts.map((product) => (
                  <DataCard key={product.id}>
                    <div className="flex items-start gap-3">
                      <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${getProductImage(product) ? 'bg-gray-100' : 'bg-red-100'}`}>
                        {getProductImage(product) ? (
                          <img src={getProductImage(product)!} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Image className="w-6 h-6 text-red-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 line-clamp-2">{product.title}</p>
                        <p className="text-sm text-gray-500">{getProductSku(product)}</p>
                      </div>
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 mt-1" 
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-green-700">{getProductRRPPrice(product) > 0 ? `${getProductRRPPrice(product).toFixed(2)} RON` : '-'} <span className="text-xs text-gray-400">RRP</span></p>
                          <p className="text-sm text-orange-600">{getProductSupplierPrice(product) > 0 ? `${getProductSupplierPrice(product).toFixed(2)} RON` : '-'} <span className="text-xs text-gray-400">Purchase</span></p>
                          <p className="text-xs text-gray-500">Stock: {getProductStock(product)}</p>
                        </div>
                        {getProductImage(product) ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex gap-1">
                        <a 
                          href={`https://www.YOUR_PNI_USERNAMEtrafic.ro/ro/products/${product.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"
                          title="View on site"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                        <button onClick={() => openEditProduct(product)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleDeleteProduct(product)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  </DataCard>
                ))}
              </div>

              {totalPages > 1 && renderPagination()}
              
              <p className="text-center text-sm text-gray-500">
                Showing {(currentPage - 1) * productsPerPage + 1} - {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts} products
              </p>
            </>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900">Google Merchants</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Requires: GTIN/EAN, Brand, Image, Description, Price and Stock for approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{categories.length} categories</p>
            <button 
              onClick={openAddCategory}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />Add
            </button>
          </div>

          {/* Category Modal */}
          {showCategoryModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category (optional)</label>
                    <select
                      value={categoryForm.parentId}
                      onChange={(e) => setCategoryForm({...categoryForm, parentId: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="">-- Main Category --</option>
                      {categories.filter(c => !c.parent_category_id && c.id !== editingCategory?.id).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Select to create a subcategory</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value, handle: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="CB Stations"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                    <input
                      type="text"
                      value={categoryForm.handle}
                      onChange={(e) => setCategoryForm({...categoryForm, handle: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
                      placeholder="statii-cb"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      rows={3}
                      placeholder="Category description for SEO..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Image</label>
                    <div className="space-y-2">
                      {categoryForm.imageUrl && (
                        <div className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                          <img src={categoryForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setCategoryForm({...categoryForm, imageUrl: ''})}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setUploadingCategoryImage(true)
                            try {
                              const result = await uploadFile(file)
                              setCategoryForm({...categoryForm, imageUrl: result.url})
                            } catch (error) {
                              alert('Error uploading image!')
                            } finally {
                              setUploadingCategoryImage(false)
                            }
                          }}
                          className="hidden"
                          id="category-image-upload"
                        />
                        <label
                          htmlFor="category-image-upload"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          {uploadingCategoryImage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <span className="text-sm">{uploadingCategoryImage ? 'Uploading...' : 'Upload image'}</span>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">Recommended size: <strong>600×400px</strong> (3:2 ratio). Format: JPG, PNG or WebP.</p>
                    <p className="text-xs text-gray-400 mt-1">If you don&apos;t upload an image, one will be automatically generated with the category name.</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveCategory}
                    disabled={!categoryForm.name}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editingCategory ? 'Save' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-6 py-4 font-medium">Image</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Parent</th>
                  <th className="px-6 py-4 font-medium">Slug</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const parentCat = cat.parent_category_id ? categories.find(c => c.id === cat.parent_category_id) : null
                  const imageUrl = cat.metadata?.image_url || ''
                  return (
                    <tr key={cat.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={cat.name}
                            className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cat.name)}&size=120&background=e2e8f0&color=475569&bold=true&font-size=0.35` }}
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium">
                            {cat.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {cat.parent_category_id && <span className="text-gray-400 mr-2">└</span>}
                        {cat.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{parentCat?.name || '-'}</td>
                      <td className="px-6 py-4 text-gray-500">/{cat.handle}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEditCategory(cat)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteCategory(cat)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-3">
            {categories.map((cat) => {
              const parentCat = cat.parent_category_id ? categories.find(c => c.id === cat.parent_category_id) : null
              const imageUrl = cat.metadata?.image_url || ''
              return (
                <DataCard key={cat.id}>
                  <div className="flex items-center gap-3">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={cat.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cat.name)}&size=120&background=e2e8f0&color=475569&bold=true&font-size=0.35` }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 text-sm font-bold">
                        {cat.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900">
                          {cat.parent_category_id && <span className="text-gray-400 mr-1">└</span>}
                          {cat.name}
                        </p>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                      </div>
                      <p className="text-sm text-gray-500">/{cat.handle}</p>
                      {parentCat && <p className="text-xs text-blue-500">Parent: {parentCat.name}</p>}
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 pt-2 border-t border-gray-100">
                    <button onClick={() => openEditCategory(cat)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDeleteCategory(cat)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </DataCard>
              )
            })}
          </div>
        </div>
      )}

      
      {/* Brands Tab */}
      {activeTab === "brands" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{brands.length} branduri</p>
            <button 
              onClick={openAddBrand}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />Add Brand
            </button>
          </div>

          {/* Brand Modal */}
          {showBrandModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {editingBrand ? 'Edit Brand' : 'Add New Brand'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                      <input
                        type="text"
                        value={brandForm.name}
                        onChange={(e) => setBrandForm({...brandForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_')})}
                        placeholder="ex: President"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                      <input
                        type="text"
                        value={brandForm.slug}
                        onChange={(e) => setBrandForm({...brandForm, slug: e.target.value})}
                        placeholder="president"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={brandForm.description}
                      onChange={(e) => setBrandForm({...brandForm, description: e.target.value})}
                      placeholder="Brand description..."
                      rows={2}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={brandForm.country}
                        onChange={(e) => setBrandForm({...brandForm, country: e.target.value})}
                        placeholder="e.g.: Romania"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="url"
                        value={brandForm.website}
                        onChange={(e) => setBrandForm({...brandForm, website: e.target.value})}
                        placeholder="https://..."
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                    <input
                      type="text"
                      value={brandForm.logo}
                      onChange={(e) => setBrandForm({...brandForm, logo: e.target.value})}
                      placeholder="/brands/name.png"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    {brandForm.logo && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={brandForm.logo} alt="Preview" className="w-16 h-8 object-contain bg-gray-100 rounded" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <span className="text-xs text-gray-500">Preview logo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={brandForm.is_active}
                        onChange={(e) => setBrandForm({...brandForm, is_active: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={brandForm.is_featured}
                        onChange={(e) => setBrandForm({...brandForm, is_featured: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">Featured (homepage)</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowBrandModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={saveBrand} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {editingBrand ? 'Save' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Brands Grid */}
          {loadingBrands ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((brand) => (
                <div key={brand.id} className={`bg-white rounded-xl border p-4 ${brand.is_active ? 'border-gray-200' : 'border-red-200 bg-red-50/50'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {brand.logo ? (
                        <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-1" onError={(e) => e.currentTarget.style.display = 'none'} />
                      ) : null}
                      <span className={`text-xl font-bold text-gray-400 ${brand.logo ? 'hidden' : ''}`}>{brand.name.slice(0,2).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 truncate">{brand.name}</h4>
                        {brand.is_featured && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">★</span>}
                        {!brand.is_active && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">Inactive</span>}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{brand.description || 'No description'}</p>
                      {brand.country && <p className="text-xs text-gray-400 mt-1">🌍 {brand.country}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => openEditBrand(brand)} className="flex-1 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center gap-1">
                      <Edit className="w-3.5 h-3.5" />Edit
                    </button>
                    <button onClick={() => deleteBrand(brand.id)} className="flex-1 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loadingBrands && brands.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No brands</h3>
              <p className="text-gray-500 mt-1">Add the first brand for the store.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Orders ({totalOrders})</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search: name, email, phone, ID..."
                  value={ordersSearch}
                  onChange={(e) => setOrdersSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-80"
                />
              </div>
              <button onClick={loadOrders} className="p-2 hover:bg-gray-100 rounded-lg">
                <RefreshCw className={`w-5 h-5 ${loadingOrders ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Multi-select action bar */}
          {selectedOrders.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedOrders.size} orders selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAcceptMultipleOrders}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
                >
                  <Check className="w-4 h-4" />
                  Accept All
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Are you sure you want to DELETE ${selectedOrders.size} orders?\n\nThis action is permanent!`)) return
                    try {
                      const response = await fetch('/app/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'delete-multiple', orderIds: Array.from(selectedOrders) })
                      })
                      const data = await response.json()
                      if (data.success) {
                        setMessage({ type: 'success', text: `${data.deleted} orders deleted${data.failed > 0 ? `, ${data.failed} errors` : ''}` })
                        setSelectedOrders(new Set())
                        loadOrders()
                      } else {
                        setMessage({ type: 'error', text: data.error || 'Error deleting' })
                      }
                    } catch (error: any) {
                      setMessage({ type: 'error', text: error.message })
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {loadingOrders ? (
             <div className="text-center py-12">
               <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
               <p className="mt-2 text-gray-500">Loading orders...</p>
             </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No orders</h3>
              <p className="text-gray-500">No orders found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="px-4 py-3 font-medium w-12">
                      <input
                        type="checkbox"
                        checked={selectedOrders.size === orders.length && orders.length > 0}
                        onChange={toggleSelectAllOrders}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleViewOrderDetails(order)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          #{order.display_id || order.id.slice(-6)}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                         <div className="text-sm">
                           <p className="font-medium text-gray-900">
                             {order.shipping_address?.first_name || order.customer?.first_name || 'N/A'} {order.shipping_address?.last_name || order.customer?.last_name || ''}
                           </p>
                           <p className="text-xs text-gray-400">{order.billing_address?.company || ''}</p>
                         </div>
                      </td>
                      <td className="px-4 py-3">
                         <div className="text-sm">
                           <p className="text-gray-700">{order.email || order.customer?.email || '-'}</p>
                           <p className="text-xs text-gray-500">{order.shipping_address?.phone || order.customer?.phone || '-'}</p>
                         </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-US')}
                      </td>
                       <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status === 'pending' ? 'Pending' : 
                           order.status === 'completed' ? 'Completed' : 
                           order.status === 'canceled' ? 'Canceled' : order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.payment_status === 'captured' ? 'bg-green-100 text-green-700' :
                          order.payment_status === 'authorized' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.payment_status === 'captured' ? 'Paid' :
                           order.payment_status === 'authorized' ? 'Authorized' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {((order.total || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} {(order.currency_code || 'RON').toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {!order.metadata?.admin_accepted && !order.metadata?.warehouse_completed && order.status !== 'completed' && (
                            <button 
                              onClick={() => handleAcceptOrder(order)} 
                              disabled={processingOrder === order.id}
                              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1" 
                              title="Accept order"
                            >
                              {processingOrder === order.id ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" />...</>
                              ) : (
                                <><Check className="w-3.5 h-3.5" />Accept</>
                              )}
                            </button>
                          )}
                          
                          {(order.metadata?.admin_accepted || order.metadata?.warehouse_completed || order.status === 'completed') && !order.metadata?.invoice_generated && (
                            <button 
                              onClick={() => handleGenerateInvoice(order)} 
                              disabled={processingOrder === order.id}
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1" 
                              title="Generate invoice"
                            >
                              {processingOrder === order.id ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" />...</>
                              ) : (
                                <><FileText className="w-3.5 h-3.5" />Invoice</>
                              )}
                            </button>
                          )}
                          
                          {(order.metadata?.invoice_generated || (order.status === 'completed' && order.metadata?.awb_number)) && (
                            <div className="flex items-center gap-2">
                              {order.metadata?.awb_number ? (
                                <span className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg flex items-center gap-1">
                                  <Truck className="w-3.5 h-3.5" />
                                  AWB: {order.metadata.awb_number}
                                </span>
                              ) : (
                                <>
                                  <input
                                    type="text"
                                    placeholder="Nr. AWB"
                                    value={editingAWB[order.id] || ''}
                                    onChange={(e) => setEditingAWB(prev => ({ ...prev, [order.id]: e.target.value }))}
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-32"
                                  />
                                  <button
                                    onClick={() => handleSaveAWB(order)}
                                    disabled={savingAWB === order.id || !editingAWB[order.id]?.trim()}
                                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                                    title="Save AWB"
                                  >
                                    {savingAWB === order.id ? (
                                      <><Loader2 className="w-3.5 h-3.5 animate-spin" />...</>
                                    ) : (
                                      <><Truck className="w-3.5 h-3.5" />Save</>
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                          
                          <button 
                            onClick={() => handleDeleteOrder(order)} 
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg" 
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination */}
              {totalOrders > ordersPerPage && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {Math.min((ordersPage - 1) * ordersPerPage + 1, totalOrders)} - {Math.min(ordersPage * ordersPerPage, totalOrders)} of {totalOrders} orders
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                      disabled={ordersPage === 1}
                      className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                    <span className="text-sm px-3">
                      Page {ordersPage} of {Math.ceil(totalOrders / ordersPerPage)}
                    </span>
                    <button
                      onClick={() => setOrdersPage(p => Math.min(Math.ceil(totalOrders / ordersPerPage), p + 1))}
                      disabled={ordersPage >= Math.ceil(totalOrders / ordersPerPage)}
                      className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "inventory" && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-2xl font-bold text-blue-700">{totalProducts}</p>
              <p className="text-sm text-blue-600">Total Products</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-2xl font-bold text-green-700">{products.filter(p => p.status === 'published').length}</p>
              <p className="text-sm text-green-600">Published</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <p className="text-2xl font-bold text-yellow-700">{products.filter(p => p.status !== 'published').length}</p>
              <p className="text-sm text-yellow-600">Unpublished</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <p className="text-2xl font-bold text-red-700">{products.filter(p => getProductStock(p) <= 0).length}</p>
              <p className="text-sm text-red-600">Out of Stock</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <p className="text-2xl font-bold text-purple-700">{categories.length}</p>
              <p className="text-sm text-purple-600">Categories</p>
            </div>
          </div>

          {/* Inventory SubTabs */}
          <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
            {[
              { id: 'all', label: 'All Products', count: products.length },
              { id: 'no_stock', label: 'Out of Stock', count: products.filter(p => getProductStock(p) <= 0).length },
              { id: 'published', label: 'Published', count: products.filter(p => p.status === 'published').length },
              { id: 'unpublished', label: 'Unpublished', count: products.filter(p => p.status !== 'published').length },
              { id: 'api', label: 'API Imported', count: products.filter(p => p.metadata?.source === 'api').length },
            ].map(subtab => (
              <button
                key={subtab.id}
                onClick={() => setInventorySubTab(subtab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  inventorySubTab === subtab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {subtab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  inventorySubTab === subtab.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {subtab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Product</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">SKU</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Price</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600">Stock</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600">Source</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products
                  .filter(p => {
                    if (inventorySubTab === 'all') return true;
                    if (inventorySubTab === 'no_stock') return getProductStock(p) <= 0;
                    if (inventorySubTab === 'published') return p.status === 'published';
                    if (inventorySubTab === 'unpublished') return p.status !== 'published';
                    if (inventorySubTab === 'api') return p.metadata?.source === 'api';
                    return true;
                  })
                  .slice(0, 50)
                  .map(product => {
                    const stock = getProductStock(product);
                    const priceStr = getProductPrice(product);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {getProductImage(product) ? (
                                <img src={getProductImage(product)!} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{product.title}</p>
                              <p className="text-xs text-gray-500">{product.handle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{getProductSku(product)}</code>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-gray-900">{priceStr} RON</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            stock <= 0 ? 'bg-red-100 text-red-700' : 
                            stock <= 5 ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-green-100 text-green-700'
                          }`}>
                            {stock} pcs
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            product.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {product.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-xs text-gray-500">
                            {product.metadata?.source === 'api' ? '🔗 API' : '✏️ Manual'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => openEditProduct(product)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {products.filter(p => {
              if (inventorySubTab === 'all') return true;
              if (inventorySubTab === 'no_stock') return getProductStock(p) <= 0;
              if (inventorySubTab === 'published') return p.status === 'published';
              if (inventorySubTab === 'unpublished') return p.status !== 'published';
              if (inventorySubTab === 'api') return p.metadata?.source === 'api';
              return true;
            }).length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No products in this category</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "customers" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{customers.length} customers • Total sales: {customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString('en-US')} RON</p>
            <button 
              onClick={openAddCustomer}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />Add Customer
            </button>
          </div>

          {/* Customer Modal */}
          {showCustomerModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={customerForm.firstName}
                        onChange={(e) => setCustomerForm({...customerForm, firstName: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="Ion"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={customerForm.lastName}
                        onChange={(e) => setCustomerForm({...customerForm, lastName: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="Popescu"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="ion.popescu@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="0722 123 456"
                    />
                  </div>

                  {/* Password Reset Section */}
                  {editingCustomer && (
                    <div className="border-t border-gray-200 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowPasswordReset(!showPasswordReset)}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Shield className="w-4 h-4" />
                        {showPasswordReset ? 'Hide password reset' : 'Reset password'}
                      </button>
                      {showPasswordReset && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                              type="password"
                              value={customerForm.password}
                              onChange={(e) => setCustomerForm({...customerForm, password: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-lg"
                              placeholder="Minimum 8 characters"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => alert('Email de resetare trimis! (demo)')}
                            className="w-full py-2 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                          >
                            Send Password Reset Email
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                    <textarea
                      value={customerForm.notes}
                      onChange={(e) => setCustomerForm({...customerForm, notes: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      rows={3}
                      placeholder="Notes about customer (visible only in admin)..."
                    />
                  </div>

                  {/* Stats if editing */}
                  {editingCustomer && (
                    <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Orders placed</p>
                        <p className="text-lg font-bold text-gray-900">{editingCustomer.orders}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total spent</p>
                        <p className="text-lg font-bold text-green-600">{editingCustomer.totalSpent?.toLocaleString('en-US')} RON</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500">Registered</p>
                        <p className="font-medium">{new Date(editingCustomer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setShowCustomerModal(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveCustomer}
                    disabled={!customerForm.firstName || !customerForm.email}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editingCustomer ? 'Save' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Customers Table */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Phone</th>
                  <th className="px-6 py-4 font-medium">Orders</th>
                  <th className="px-6 py-4 font-medium">Total Spent</th>
                  <th className="px-6 py-4 font-medium">Registered</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                          {customer.firstName[0]}{customer.lastName?.[0] || ''}
                        </div>
                        <span className="font-medium text-gray-900">{customer.firstName} {customer.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{customer.email}</td>
                    <td className="px-6 py-4 text-gray-600">{customer.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">{customer.orders}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-green-600">{customer.totalSpent.toLocaleString('en-US')} RON</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{new Date(customer.createdAt).toLocaleDateString('en-US')}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEditCustomer(customer)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteCustomer(customer)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {customers.map((customer) => (
              <DataCard key={customer.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                      {customer.firstName[0]}{customer.lastName?.[0] || ''}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.firstName} {customer.lastName}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">{customer.totalSpent.toLocaleString('en-US')} RON</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">{customer.orders} orders</span>
                  <span className="text-gray-400">{new Date(customer.createdAt).toLocaleDateString('en-US')}</span>
                </div>
                <div className="flex justify-end gap-1 pt-2 border-t border-gray-100">
                  <button onClick={() => openEditCustomer(customer)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg"><Edit className="w-5 h-5" /></button>
                  <button onClick={() => handleDeleteCustomer(customer)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                </div>
              </DataCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === "promotions" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{coupons.length} coupons ({coupons.filter(c => c.isActive).length} active)</p>
            <button 
              onClick={openAddCoupon}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />Add Coupon
            </button>
          </div>

          {/* Coupon Modal */}
          {showCouponModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponForm.code}
                        onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                        className="flex-1 p-3 border border-gray-300 rounded-lg font-mono uppercase"
                        placeholder="SUMMER25"
                      />
                      <button 
                        onClick={generateCouponCode}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm whitespace-nowrap"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                      <select
                        value={couponForm.type}
                        onChange={(e) => setCouponForm({...couponForm, type: e.target.value as 'percentage' | 'fixed'})}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (RON)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={couponForm.value}
                          onChange={(e) => setCouponForm({...couponForm, value: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg pr-12"
                          placeholder={couponForm.type === 'percentage' ? '25' : '50'}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                          {couponForm.type === 'percentage' ? '%' : 'lei'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={couponForm.minOrder}
                          onChange={(e) => setCouponForm({...couponForm, minOrder: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg pr-12"
                          placeholder="100"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">lei</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                      <input
                        type="number"
                        value={couponForm.usageLimit}
                        onChange={(e) => setCouponForm({...couponForm, usageLimit: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={couponForm.expiryDate}
                      onChange={(e) => setCouponForm({...couponForm, expiryDate: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={couponForm.isActive}
                      onChange={(e) => setCouponForm({...couponForm, isActive: e.target.checked})}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Coupon active</span>
                  </label>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setShowCouponModal(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveCoupon}
                    disabled={!couponForm.code || !couponForm.value}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editingCoupon ? 'Save' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Coupons Table */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-6 py-4 font-medium">Code</th>
                  <th className="px-6 py-4 font-medium">Discount</th>
                  <th className="px-6 py-4 font-medium">Min. Order</th>
                  <th className="px-6 py-4 font-medium">Uses</th>
                  <th className="px-6 py-4 font-medium">Expires</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono font-bold text-blue-600">{coupon.code}</td>
                    <td className="px-6 py-4">
                      <span className="text-green-600 font-medium">
                        {coupon.type === 'percentage' ? `-${coupon.value}%` : `-${coupon.value} RON`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{coupon.minOrder > 0 ? `${coupon.minOrder} RON` : '-'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {coupon.usageCount}/{coupon.usageLimit || '∞'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString('en-US') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleCouponActive(coupon)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button onClick={() => openEditCoupon(coupon)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteCoupon(coupon)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {coupons.map((coupon) => (
              <DataCard key={coupon.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono font-bold text-blue-600">{coupon.code}</p>
                    <p className="text-lg font-medium text-green-600">
                      {coupon.type === 'percentage' ? `-${coupon.value}%` : `-${coupon.value} RON`}
                    </p>
                  </div>
                  <button 
                    onClick={() => toggleCouponActive(coupon)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-500 space-y-1">
                  {coupon.minOrder > 0 && <p>Min: {coupon.minOrder} RON</p>}
                  <p>Uses: {coupon.usageCount}/{coupon.usageLimit || '∞'}</p>
                  {coupon.expiryDate && <p>Expires: {new Date(coupon.expiryDate).toLocaleDateString('en-US')}</p>}
                </div>
                <div className="flex justify-end gap-1 pt-2 border-t border-gray-100">
                  <button onClick={() => openEditCoupon(coupon)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg"><Edit className="w-5 h-5" /></button>
                  <button onClick={() => handleDeleteCoupon(coupon)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                </div>
              </DataCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === "curieri" && (
        <div className="space-y-6">
          {/* Header with Save */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Shipping & VAT Settings</h2>
              <p className="text-sm text-gray-500">Configure shipping rate, VAT, personal pickup and couriers</p>
            </div>
            <button 
              onClick={saveShippingSettings}
              disabled={shippingSaving}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />{shippingSaving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>

          {/* ====== GLOBAL TVA SECTION ====== */}
          <div className="bg-white rounded-xl border border-blue-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">VAT (Value Added Tax)</h3>
                <p className="text-sm text-gray-500">Set the VAT percentage applied to all products in the store</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={shippingSettings.globalTVA}
                    onChange={(e) => setShippingSettings({...shippingSettings, globalTVA: parseFloat(e.target.value) || 0})}
                    className="w-32 p-2.5 border border-gray-300 rounded-lg text-sm font-bold text-center text-lg"
                  />
                  <span className="text-xl font-bold text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Standard RO: 19% · Redus: 9% / 5%</p>
              </div>
              <div className="md:col-span-2 flex items-center">
                <div className="bg-blue-50 rounded-lg p-3 w-full">
                  <p className="text-sm text-blue-800">
                    <strong>Application:</strong> The VAT rate of <strong>{shippingSettings.globalTVA}%</strong> is automatically applied to all products, shipping and invoices.
                    If legislation changes, modify the value here and save.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ====== FIXED SHIPPING RATE SECTION ====== */}
          <div className={`bg-white rounded-xl border ${shippingSettings.fixedRateEnabled ? 'border-green-200' : 'border-gray-200'} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Fixed Shipping Rate</h3>
                  <p className="text-sm text-gray-500">Fixed shipping rate applied to all orders (without courier API)</p>
                </div>
              </div>
              <button
                onClick={() => setShippingSettings({...shippingSettings, fixedRateEnabled: !shippingSettings.fixedRateEnabled})}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  shippingSettings.fixedRateEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
              >
                {shippingSettings.fixedRateEnabled ? '✅ Active' : '❌ Disabled'}
              </button>
            </div>
            
            {shippingSettings.fixedRateEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Price (RON)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={shippingSettings.fixedShippingRate}
                      onChange={(e) => setShippingSettings({...shippingSettings, fixedShippingRate: parseFloat(e.target.value) || 0})}
                      className="w-32 p-2.5 border border-gray-300 rounded-lg text-sm font-bold text-center text-lg"
                    />
                    <span className="text-sm font-medium text-gray-500">RON</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Price with VAT included shown to customers</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transport Gratuit peste (RON)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={shippingSettings.freeShippingThreshold}
                      onChange={(e) => setShippingSettings({...shippingSettings, freeShippingThreshold: parseFloat(e.target.value) || 0})}
                      className="w-32 p-2.5 border border-gray-300 rounded-lg text-sm font-bold text-center text-lg"
                    />
                    <span className="text-sm font-medium text-gray-500">RON</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Orders above this amount = FREE shipping. Set 0 to disable.</p>
                </div>
              </div>
            )}
            
            {shippingSettings.fixedRateEnabled && (
              <div className="mt-4 bg-green-50 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>Active:</strong> Orders under {shippingSettings.freeShippingThreshold} RON → <strong>{shippingSettings.fixedShippingRate} RON</strong> shipping.
                  {shippingSettings.freeShippingThreshold > 0 && <> Orders over {shippingSettings.freeShippingThreshold} RON → <strong>FREE</strong>.</>}
                </p>
              </div>
            )}
          </div>

          {/* ====== SHIPPING MODE SECTION ====== */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Shipping Mode</h3>
                <p className="text-sm text-gray-500">Choose how shipping is calculated</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'fixed', label: 'Fixed Rate', desc: 'Fixed shipping price for all orders', icon: '💰', enabled: true },
                { id: 'courier_api', label: 'Courier API', desc: 'Dynamic prices from FAN/Sameday/Cargus (requires API)', icon: '🔌', enabled: false },
                { id: 'combined', label: 'Combined', desc: 'Fixed rate + courier selection visible to customers', icon: '🔗', enabled: false },
              ].map(mode => (
                <div
                  key={mode.id}
                  onClick={() => mode.enabled && setShippingSettings({...shippingSettings, shippingMode: mode.id})}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    shippingSettings.shippingMode === mode.id
                      ? 'border-purple-500 bg-purple-50'
                      : mode.enabled
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="text-2xl mb-2">{mode.icon}</div>
                  <div className="font-bold text-sm text-gray-900">{mode.label}</div>
                  <p className="text-xs text-gray-500 mt-1">{mode.desc}</p>
                  {!mode.enabled && <span className="inline-block mt-2 text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded">Coming soon</span>}
                  {shippingSettings.shippingMode === mode.id && <span className="inline-block mt-2 text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded font-medium">Active</span>}
                </div>
              ))}
            </div>
          </div>

          {/* ====== PERSONAL PICKUP SECTION ====== */}
          <div className={`bg-white rounded-xl border ${shippingSettings.pickupEnabled ? 'border-orange-200' : 'border-gray-200'} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">🏪 Personal Pickup</h3>
                  <p className="text-sm text-gray-500">Customers can pick up orders directly from the office — FREE</p>
                </div>
              </div>
              <button
                onClick={() => setShippingSettings({...shippingSettings, pickupEnabled: !shippingSettings.pickupEnabled})}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  shippingSettings.pickupEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
              >
                {shippingSettings.pickupEnabled ? '✅ Active' : '❌ Disabled'}
              </button>
            </div>
            
            {shippingSettings.pickupEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
                  <input
                    type="text"
                    value={shippingSettings.pickupAddress}
                    onChange={(e) => setShippingSettings({...shippingSettings, pickupAddress: e.target.value})}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    placeholder="Str. Exemplu Nr. 1, Suceava"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Schedule</label>
                  <input
                    type="text"
                    value={shippingSettings.pickupSchedule}
                    onChange={(e) => setShippingSettings({...shippingSettings, pickupSchedule: e.target.value})}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    placeholder="Luni-Vineri: 09:00-18:00"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ====== COURIERS SECTION ====== */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Couriers (API Preparation)</h3>
                <p className="text-sm text-gray-500">Configure credentials for when API mode is activated. Currently fixed rate only.</p>
              </div>
            </div>

            <div className="space-y-3">
              {couriers.map(courier => (
                <div key={courier.id} className={`rounded-xl border ${courier.isActive ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200'} overflow-hidden`}>
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedCourier(expandedCourier === courier.id ? null : courier.id)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{courier.logo}</span>
                      <div>
                        <h4 className="font-bold text-gray-900">{courier.name}</h4>
                        <p className="text-sm text-gray-500">
                          {courier.basePrice > 0 ? `${courier.basePrice} RON • Free over ${courier.freeThreshold} RON • ${courier.estimatedDays} days` : 'Ready for API integration'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${courier.hasApi ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {courier.hasApi ? 'API Connected' : 'No API'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCourier(courier.id); }}
                        className={`px-3 py-1.5 rounded-lg font-medium text-xs ${courier.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
                      >
                        {courier.isActive ? 'Active' : 'Inactive'}
                      </button>
                      {expandedCourier === courier.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                  
                  {expandedCourier === courier.id && (
                    <div className="p-4 pt-0 border-t border-gray-100 space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
                          <input
                            type="text"
                            value={courier.apiUrl}
                            onChange={(e) => setCouriers(couriers.map(c => c.id === courier.id ? {...c, apiUrl: e.target.value} : c))}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                            placeholder="https://api.courier.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                          <input
                            type="text"
                            value={courier.clientId}
                            onChange={(e) => setCouriers(couriers.map(c => c.id === courier.id ? {...c, clientId: e.target.value} : c))}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                            placeholder="client_id"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                          <input
                            type="password"
                            value={courier.apiKey}
                            onChange={(e) => setCouriers(couriers.map(c => c.id === courier.id ? {...c, apiKey: e.target.value} : c))}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                            placeholder="••••••••••••"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
                          <input
                            type="password"
                            value={courier.apiSecret}
                            onChange={(e) => setCouriers(couriers.map(c => c.id === courier.id ? {...c, apiSecret: e.target.value} : c))}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                            placeholder="••••••••••••"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight Tiers (lei) — for future integration</label>
                        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                          {['1kg', '2kg', '5kg', '10kg', '20kg', '31kg'].map(weight => (
                            <div key={weight} className="text-center">
                              <p className="text-xs text-gray-500 mb-1">{weight}</p>
                              <input
                                type="number"
                                value={courier.tiers?.[weight as keyof typeof courier.tiers] || ''}
                                onChange={(e) => setCouriers(couriers.map(c => c.id === courier.id ? {...c, tiers: {...c.tiers, [weight]: parseFloat(e.target.value) || 0}} : c))}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm text-center"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Courier Base Price (lei)</label>
                          <input
                            type="number"
                            value={courier.basePrice}
                            onChange={(e) => setCouriers(couriers.map(c => c.id === courier.id ? {...c, basePrice: parseFloat(e.target.value) || 0} : c))}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Free over (lei)</label>
                          <input
                            type="number"
                            value={courier.freeThreshold}
                            onChange={(e) => setCouriers(couriers.map(c => c.id === courier.id ? {...c, freeThreshold: parseFloat(e.target.value) || 0} : c))}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ====== SUMMARY CARD ====== */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200 p-5">
            <h3 className="font-bold text-gray-900 mb-3">📋 Active Settings Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{shippingSettings.globalTVA}%</p>
                <p className="text-xs text-gray-500">TVA</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {shippingSettings.fixedRateEnabled ? `${shippingSettings.fixedShippingRate} RON` : 'OFF'}
                </p>
                <p className="text-xs text-gray-500">Fixed Shipping</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {shippingSettings.freeShippingThreshold > 0 ? `${shippingSettings.freeShippingThreshold} RON` : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">Free Over</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{shippingSettings.pickupEnabled ? 'YES' : 'NO'}</p>
                <p className="text-xs text-gray-500">Personal Pickup</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "plati" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{payments.filter(p => p.isActive).length} active methods of {payments.length}</p>
            <button 
              onClick={savePaymentSettings}
              disabled={paymentsSaving}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />{paymentsSaving ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Active Methods</p>
              <p className="text-2xl font-bold text-green-600">{payments.filter(p => p.isActive).length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Card Payment</p>
              <p className="text-2xl font-bold text-blue-600">{payments.filter(p => p.isActive && p.type === 'card').length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Cash on Delivery</p>
              <p className="text-2xl font-bold text-yellow-600">{payments.filter(p => p.isActive && p.type === 'cod').length > 0 ? 'Yes' : 'No'}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Installments (BNPL)</p>
              <p className="text-2xl font-bold text-purple-600">{payments.filter(p => p.isActive && p.type === 'bnpl').length > 0 ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Payment type legends */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Card</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Wallet</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Bank</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">COD</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Installments</span>
          </div>

          <div className="space-y-3">
            {payments.map(payment => {
              const typeColors: Record<string, string> = {
                card: 'bg-blue-100 text-blue-700',
                wallet: 'bg-purple-100 text-purple-700',
                bank: 'bg-gray-100 text-gray-700',
                cod: 'bg-yellow-100 text-yellow-700',
                bnpl: 'bg-green-100 text-green-700',
              }
              const needsApi = (payment.type === 'card' || payment.type === 'wallet' || payment.type === 'bnpl') && payment.id !== 'payu'
              return (
                <div key={payment.id} className={`bg-white rounded-xl border ${payment.isActive ? 'border-green-200' : 'border-gray-200'} overflow-hidden`}>
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedPayment(expandedPayment === payment.id ? null : payment.id)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{payment.logo}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{payment.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[payment.type]}`}>
                            {payment.type === 'card' ? 'Card' : payment.type === 'wallet' ? 'Wallet' : payment.type === 'bank' ? 'Bank' : payment.type === 'cod' ? 'COD' : 'Installments'}
                          </span>
                          {payment.testMode && <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">Test</span>}
                        </div>
                        <p className="text-sm text-gray-500">Commission: {payment.fee}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePayment(payment.id); }}
                        className={`px-4 py-2 rounded-lg font-medium text-sm ${payment.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
                      >
                        {payment.isActive ? 'Active' : 'Inactive'}
                      </button>
                      {expandedPayment === payment.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                  
                  {expandedPayment === payment.id && (
                    <div className="p-4 pt-0 border-t border-gray-100 space-y-4">
                      {/* PayU-specific fields */}
                      {payment.id === 'payu' && (
                        <div className="space-y-4">
                          {/* Production Setup Guide */}
                          <div className={`rounded-lg p-4 border-2 ${payment.testMode ? 'bg-orange-50 border-orange-300' : 'bg-green-50 border-green-300'}`}>
                            {payment.testMode ? (
                              <div>
                                <p className="text-sm font-bold text-orange-800 mb-2">⚠️ Sandbox Mode (Test) — For connection verification only</p>
                                <p className="text-sm text-orange-700 mb-2">PayU public sandbox works <strong>only with PLN (Polish zloty)</strong>, not with RON. Amounts on the PayU page will appear in PLN.</p>
                                <p className="text-sm text-orange-700 mb-3">For real payments in RON, switch to <strong>Production</strong> and enter credentials from your PayU Romania account.</p>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => {
                                      setPayments(payments.map(p => p.id === 'payu' ? {...p, testMode: false} : p))
                                      alert('✅ Switched to Production!\n\nEnter real PayU credentials (POS ID, Client ID, Client Secret) from the PayU panel:\nhttps://secure.payu.com/cpanel/\n\nThen press "Save" and "Test Connection".')
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm"
                                  >
                                    🚀 Switch to Production (RON)
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPayments(payments.map(p => p.id === 'payu' ? {
                                        ...p,
                                        merchantId: 'YOUR_PAYU_MERCHANT_ID',
                                        publicKey: 'YOUR_PAYU_MERCHANT_ID',
                                        apiKey: '2ee86a66e5d97e3fadc400c9f19b065d',
                                        webhookSecret: 'b6ca15b0d1020e8094d9b5f8d163db54',
                                        testMode: true,
                                      } : p))
                                      alert('Sandbox PLN credentials loaded (for connection test only).\nTest cards: 4444 3333 2222 1111 (CVV: 123, Exp: 12/29)')
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-orange-100 text-orange-800 border border-orange-300 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
                                  >
                                    🧪 Test Sandbox (PLN)
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm font-bold text-green-800 mb-2">🚀 Production Mode — Real payments in RON</p>
                                <p className="text-sm text-green-700 mb-2">Enter credentials from <a href="https://secure.payu.com/cpanel/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">PayU Panel</a> → POS → OAuth keys.</p>
                                <p className="text-xs text-green-600">Endpoint: secure.payu.com | Currency: RON | Test cards: N/A (real payments)</p>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">POS ID (merchantPosId) *</label>
                              <input
                                type="text"
                                value={payment.merchantId}
                                onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, merchantId: e.target.value} : p))}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                placeholder="Ex: 145227"
                              />
                              <p className="text-xs text-gray-500 mt-1">Found in PayU Panel → POS → ID</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">OAuth Client ID (client_id) *</label>
                              <input
                                type="text"
                                value={payment.publicKey}
                                onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, publicKey: e.target.value} : p))}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                placeholder="Ex: 460718"
                              />
                              <p className="text-xs text-gray-500 mt-1">client_id for OAuth authentication</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret (Second Key) *</label>
                              <input
                                type="password"
                                value={payment.apiKey}
                                onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, apiKey: e.target.value} : p))}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                placeholder="••••••••••••"
                              />
                              <p className="text-xs text-gray-500 mt-1">Second Key / client_secret from the PayU panel</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Signature Key (IPN)</label>
                              <input
                                type="password"
                                value={payment.webhookSecret}
                                onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, webhookSecret: e.target.value} : p))}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                placeholder="••••••••••••"
                              />
                              <p className="text-xs text-gray-500 mt-1">Key for verifying IPN notifications</p>
                            </div>
                          </div>

                          {/* PayU Test Mode Toggle */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Operating Mode</p>
                              <p className="text-xs text-gray-500">Sandbox = test transactions | Production = real payments</p>
                            </div>
                            <button
                              onClick={() => setPayments(payments.map(p => p.id === 'payu' ? {...p, testMode: !p.testMode} : p))}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${payment.testMode ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                            >
                              {payment.testMode ? '🧪 Sandbox (Test)' : '🚀 Production'}
                            </button>
                          </div>

                          {/* PayU Webhook URL */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">IPN Notification URL (set in PayU panel):</p>
                            <code className="text-xs text-blue-600 break-all select-all">https://YOUR_PNI_USERNAMEtrafic.ro/app/api/payu/notify</code>
                          </div>

                          {/* PayU Action Buttons */}
                          <div className="flex flex-wrap gap-3 pt-2">
                            <button
                              onClick={async () => {
                                // Save first, then test
                                setPaymentsSaving(true)
                                try {
                                  await fetch('/app/api/settings/payments', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ payments }),
                                  })
                                  const res = await fetch('/app/api/payu?action=test')
                                  const data = await res.json()
                                  if (data.success) {
                                    alert(`✅ PayU Connection OK!\n\nMode: ${data.mode}\nToken obtained successfully.\nPayU is configured correctly.`)
                                  } else {
                                    alert(`❌ PayU Error:\n\n${data.error || data.details || 'Check credentials.'}\n\nMake sure POS ID, Client ID and Client Secret are correct.`)
                                  }
                                } catch (err) {
                                  alert('❌ Error testing PayU connection. Check if the server is running.')
                                } finally {
                                  setPaymentsSaving(false)
                                }
                              }}
                              disabled={paymentsSaving || !payment.merchantId || !payment.publicKey || !payment.apiKey}
                              className="flex items-center gap-2 px-4 py-2.5 border-2 border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <TestTube className="w-4 h-4" />
                              {paymentsSaving ? 'Testing...' : '🔌 Test PayU Connection'}
                            </button>
                            <button
                              onClick={async () => {
                                setPaymentsSaving(true)
                                try {
                                  const res = await fetch('/app/api/settings/payments', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ payments }),
                                  })
                                  const data = await res.json()
                                  if (data.success) {
                                    alert('✅ PayU settings saved successfully!')
                                  } else {
                                    alert('❌ Error saving: ' + (data.error || 'Unknown'))
                                  }
                                } catch (err) {
                                  alert('❌ Error saving settings')
                                } finally {
                                  setPaymentsSaving(false)
                                }
                              }}
                              disabled={paymentsSaving}
                              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                              <Save className="w-4 h-4" />
                              {paymentsSaving ? 'Saving...' : '💾 Save PayU Settings'}
                            </button>
                          </div>

                          {/* PayU Status Info */}
                          {payment.isActive && payment.merchantId && payment.apiKey && (
                            <div className={`p-3 rounded-lg border ${payment.testMode ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                              <p className={`text-sm font-medium ${payment.testMode ? 'text-orange-800' : 'text-green-800'}`}>
                                {payment.testMode 
                                  ? '🧪 PayU is in SANDBOX mode — transactions are simulated, no real payments are made.' 
                                  : '🚀 PayU is in PRODUCTION mode — payments are real!'}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bank Transfer specific fields */}
                      {payment.type === 'bank' && (
                        <div className="space-y-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              <strong>💡 Bank Transfer Details:</strong> This information will be displayed to customers after placing an order.
                            </p>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                              <input
                                type="text"
                                value={payment.bankName || ''}
                                onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, bankName: e.target.value} : p))}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                placeholder="BCR, BRD, ING..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary *</label>
                              <input
                                type="text"
                                value={payment.beneficiary || ''}
                                onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, beneficiary: e.target.value} : p))}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                placeholder="SC QUBIT PAGE SRL"
                              />
                            </div>
                            <div className="lg:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">IBAN *</label>
                              <input
                                type="text"
                                value={payment.iban || ''}
                                onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, iban: e.target.value.toUpperCase()} : p))}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-mono"
                                placeholder="RO49 AAAA 1B31 0075 9384 0000"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">CUI / CIF</label>
                              <input
                                type="text"
                                value={payment.cui || ''}
                                onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, cui: e.target.value} : p))}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                placeholder="RO12345678"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Trade Registry No.</label>
                              <input
                                type="text"
                                value={payment.regCom || ''}
                                onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, regCom: e.target.value} : p))}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                placeholder="J40/1234/2020"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message for Customer</label>
                            <textarea
                              value={payment.bankDetails || ''}
                              onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, bankDetails: e.target.value} : p))}
                              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                              rows={3}
                              placeholder="Payment will be made to the account below. The order will be processed after payment confirmation."
                            />
                          </div>
                          {/* Preview */}
                          {(payment.iban || payment.beneficiary) && (
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                              <p className="text-xs font-medium text-gray-500 uppercase">Preview - What the customer will see:</p>
                              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-1 text-sm">
                                {payment.bankDetails && <p className="text-gray-600 mb-2">{payment.bankDetails}</p>}
                                <p><span className="text-gray-500">Bank:</span> <strong>{payment.bankName || '-'}</strong></p>
                                <p><span className="text-gray-500">Beneficiary:</span> <strong>{payment.beneficiary || '-'}</strong></p>
                                <p><span className="text-gray-500">IBAN:</span> <strong className="font-mono">{payment.iban || '-'}</strong></p>
                                {payment.cui && <p><span className="text-gray-500">CUI:</span> <strong>{payment.cui}</strong></p>}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {needsApi && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID</label>
                            <input
                              type="text"
                              value={payment.merchantId}
                              onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, merchantId: e.target.value} : p))}
                              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                              placeholder="merchant_id"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                            <input
                              type="text"
                              value={payment.publicKey}
                              onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, publicKey: e.target.value} : p))}
                              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                              placeholder="pk_..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">API Key / Secret Key</label>
                            <input
                              type="password"
                              value={payment.apiKey}
                              onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, apiKey: e.target.value} : p))}
                              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                              placeholder="••••••••••••"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
                            <input
                              type="password"
                              value={payment.webhookSecret}
                              onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, webhookSecret: e.target.value} : p))}
                              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                              placeholder="whsec_..."
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label>
                          <input
                            type="number"
                            step="0.1"
                            value={payment.feePercent}
                            onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, feePercent: parseFloat(e.target.value) || 0} : p))}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Commission (lei)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={payment.feeFixed}
                            onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, feeFixed: parseFloat(e.target.value) || 0} : p))}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Min Commission</label>
                          <input
                            type="number"
                            step="0.01"
                            value={payment.minFee}
                            onChange={(e) => setPayments(payments.map(p => p.id === payment.id ? {...p, minFee: parseFloat(e.target.value) || 0} : p))}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        {needsApi && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                            <button
                              onClick={() => setPayments(payments.map(p => p.id === payment.id ? {...p, testMode: !p.testMode} : p))}
                              className={`w-full p-2.5 rounded-lg text-sm font-medium ${payment.testMode ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}
                            >
                              {payment.testMode ? '🧪 Test Mode' : '🚀 Production'}
                            </button>
                          </div>
                        )}
                      </div>

                      {needsApi && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Webhook URL:</p>
                          <code className="text-xs text-blue-600 break-all">https://YOUR_PNI_USERNAMEtrafic.ro/webhooks/{payment.id}</code>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        {needsApi && (
                          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                            <TestTube className="w-4 h-4" />Test Connection
                          </button>
                        )}
                        {payment.id !== 'payu' && (
                          <button
                            onClick={savePaymentSettings}
                            disabled={paymentsSaving}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />{paymentsSaving ? 'Saving...' : 'Save'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* API Suppliers Tab */}
      {activeTab === "apis" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Globe className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">API Supplier Integrations</h2>
                <p className="text-sm text-gray-500">Connect to suppliers for automatic product import</p>
              </div>
            </div>
          </div>

          {/* Navigation Cards to Real Pages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {/* PNI Dashboard */}
            <a href="/app/magazin/api-furnizori" className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 block">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                  <Globe className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">PNI API Dashboard</h3>
                  <p className="text-sm text-gray-500">Status, manual sync, logs</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Monitor PNI API connection, view sync status,
                manage tokens and run manual syncs for stock, prices or full import.
              </p>
              <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
                <span>Open PNI Dashboard</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>

            {/* PNI Sync Settings */}
            <a href="/app/magazin/api-furnizori/pni/sync" className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:border-green-300 transition-all duration-300 block">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                  <RefreshCw className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">PNI Sync Settings</h3>
                  <p className="text-sm text-gray-500">Cron, scheduling, configuration</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Configure automatic synchronization: quick stock sync, price + stock sync, 
                full import. Set cron intervals and monitor active schedules.
              </p>
              <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                <span>Configure Sync</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>

            {/* Suppliers Management */}
            <a href="/app/magazin/furnizori" className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:border-purple-300 transition-all duration-300 block">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">Supplier Management</h3>
                  <p className="text-sm text-gray-500">Import manual/auto, XML/CSV</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Manage connected suppliers, import products manually or automatically,
                upload XML/CSV files and configure category mapping.
              </p>
              <div className="flex items-center gap-2 text-purple-600 font-medium text-sm">
                <span>Manage Suppliers</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>

            {/* CSV/XML Import Wizard */}
            <button
              onClick={() => setShowCsvImport(!showCsvImport)}
              className={`group bg-white rounded-xl border p-6 hover:shadow-xl transition-all duration-300 text-left ${
                showCsvImport ? 'border-amber-400 shadow-lg ring-2 ring-amber-100' : 'border-gray-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl transition-colors ${showCsvImport ? 'bg-amber-200' : 'bg-amber-100 group-hover:bg-amber-200'}`}>
                  <Upload className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold transition-colors ${showCsvImport ? 'text-amber-600' : 'text-gray-900 group-hover:text-amber-600'}`}>
                    Import CSV / XML
                  </h3>
                  <p className="text-sm text-gray-500">Step-by-step guided wizard</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Upload CSV or XML files, auto-map fields, preview data 
                and import products into the store with images and specifications.
              </p>
              <div className="flex items-center gap-2 text-amber-600 font-medium text-sm">
                <span>{showCsvImport ? '▼ Wizard open' : '▶ Open Import Wizard'}</span>
              </div>
            </button>
          </div>

          {/* CSV/XML Import Wizard - Inline Embed */}
          {showCsvImport && (
            <div className="mt-6 bg-white rounded-xl border border-amber-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Product Import Wizard</h3>
                    <p className="text-sm text-gray-500">Follow the steps to import products from CSV or XML files</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCsvImport(false)}
                  className="p-2 hover:bg-amber-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <ProductUploadTab />
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded-lg mt-0.5">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Quick Access</p>
                <p className="text-sm text-blue-700 mt-1">
                  Each section above opens a dedicated dashboard with full functionality.
                  For quick stock sync, access <strong>PNI API Dashboard</strong>.
                  For cron configuration and automatic scheduling, access <strong>Sync Settings</strong>.
                  For guided CSV/XML import, press <strong>Import CSV / XML</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trash Tab */}
      {activeTab === "trash" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Archive className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Trash</h2>
                <p className="text-sm text-gray-500">{trashedProducts.length} products in trash</p>
              </div>
            </div>
            {trashedProducts.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Empty the trash? All products will be permanently deleted!')) {
                    trashedProducts.forEach(p => handlePermanentDelete(p))
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Empty Trash
              </button>
            )}
          </div>

          {trashedProducts.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
              <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Trash is empty</h3>
              <p className="text-gray-500">Deleted products will appear here and can be restored</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Deleted at</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trashedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                            {getProductImage(product) ? (
                              <img src={getProductImage(product)!} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.title}</p>
                            <p className="text-sm text-gray-500">{product.handle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {product.metadata?.trashedAt ? new Date(product.metadata.trashedAt as string).toLocaleDateString('en-US') : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestoreProduct(product)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Restore
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(product)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Permanently
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {viewingOrder && (
        <OrderDetailsModal 
          order={viewingOrder} 
          onClose={() => setViewingOrder(null)} 
        />
      )}
    </div>
  )
}
