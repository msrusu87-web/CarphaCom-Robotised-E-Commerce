import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const SETTINGS_FILE = path.join(DATA_DIR, 'shipping-settings.json')

// ==================== INTERFACES ====================

export interface ShippingCourier {
  id: string
  name: string
  logo: string
  isActive: boolean
  basePrice: number          // Fixed price in RON (e.g., 30)
  freeThreshold: number      // Free shipping over X RON (e.g., 600)
  estimatedDays: string      // e.g., "1-2"
  apiUrl: string
  clientId: string
  apiKey: string
  apiSecret: string
  hasApi: boolean            // Whether API integration is available
  tiers: Record<string, number>  // Weight-based pricing
}

export interface ShippingSettings {
  // Global shipping settings
  globalTVA: number              // TVA % for the entire shop (default 19)
  fixedShippingRate: number      // Current fixed shipping rate in RON (e.g., 30)
  freeShippingThreshold: number  // Free shipping over X RON (e.g., 600)
  fixedRateEnabled: boolean      // Toggle fixed rate on/off
  pickupEnabled: boolean         // Personal pickup on/off
  pickupAddress: string          // Address for pickup
  pickupSchedule: string         // Business hours for pickup
  shippingMode: 'fixed' | 'courier_api' | 'combined'  // Which mode is active
  // Couriers
  couriers: ShippingCourier[]
  // Metadata
  updatedAt: string
}

// ==================== DEFAULTS ====================

const DEFAULT_SETTINGS: ShippingSettings = {
  globalTVA: 19,
  fixedShippingRate: 30,
  freeShippingThreshold: 600,
  fixedRateEnabled: true,
  pickupEnabled: true,
  pickupAddress: 'Calea Unirii nr 35, Suceava',
  pickupSchedule: 'Monday-Friday: 09:00-18:00',
  shippingMode: 'fixed',
  couriers: [
    {
      id: 'fancourier',
      name: 'FAN Courier',
      logo: '📦',
      isActive: false,
      basePrice: 20,
      freeThreshold: 200,
      estimatedDays: '1-2',
      apiUrl: 'https://api.fancourier.ro',
      clientId: '',
      apiKey: '',
      apiSecret: '',
      hasApi: false,
      tiers: { '1kg': 15, '2kg': 18, '5kg': 22, '10kg': 28, '20kg': 35, '31kg': 45 },
    },
    {
      id: 'cargus',
      name: 'Urgent Cargus',
      logo: '🚚',
      isActive: false,
      basePrice: 18,
      freeThreshold: 250,
      estimatedDays: '1-3',
      apiUrl: 'https://cargus.ro/api',
      clientId: '',
      apiKey: '',
      apiSecret: '',
      hasApi: false,
      tiers: { '1kg': 14, '2kg': 17, '5kg': 20, '10kg': 26, '20kg': 32, '31kg': 40 },
    },
    {
      id: 'sameday',
      name: 'Sameday',
      logo: '⚡',
      isActive: false,
      basePrice: 25,
      freeThreshold: 150,
      estimatedDays: '0-1',
      apiUrl: 'https://api.sameday.ro',
      clientId: '',
      apiKey: '',
      apiSecret: '',
      hasApi: false,
      tiers: { '1kg': 20, '2kg': 23, '5kg': 28, '10kg': 35, '20kg': 45, '31kg': 55 },
    },
    {
      id: 'gls',
      name: 'GLS Romania',
      logo: '📬',
      isActive: false,
      basePrice: 22,
      freeThreshold: 300,
      estimatedDays: '2-4',
      apiUrl: 'https://api.gls-group.eu',
      clientId: '',
      apiKey: '',
      apiSecret: '',
      hasApi: false,
      tiers: { '1kg': 16, '2kg': 19, '5kg': 24, '10kg': 30, '20kg': 38, '31kg': 48 },
    },
    {
      id: 'dpd',
      name: 'DPD Romania',
      logo: '🔴',
      isActive: false,
      basePrice: 21,
      freeThreshold: 280,
      estimatedDays: '1-3',
      apiUrl: 'https://api.dpd.ro',
      clientId: '',
      apiKey: '',
      apiSecret: '',
      hasApi: false,
      tiers: { '1kg': 15, '2kg': 18, '5kg': 23, '10kg': 29, '20kg': 36, '31kg': 46 },
    },
  ],
  updatedAt: new Date().toISOString(),
}

// ==================== HELPERS ====================

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadSettings(): ShippingSettings {
  ensureDataDir()
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      // Merge with defaults for new fields
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (err) {
    console.error('Error loading shipping settings:', err)
  }
  // First run — save defaults
  saveSettings(DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}

function saveSettings(settings: ShippingSettings) {
  ensureDataDir()
  settings.updatedAt = new Date().toISOString()
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
}

// ==================== API HANDLERS ====================

// GET — read shipping settings
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const publicOnly = searchParams.get('public') === '1'
  
  const settings = loadSettings()
  
  if (publicOnly) {
    // Return only safe fields for storefront consumption
    const publicSettings = {
      fixedShippingRate: settings.fixedShippingRate,
      freeShippingThreshold: settings.freeShippingThreshold,
      fixedRateEnabled: settings.fixedRateEnabled,
      pickupEnabled: settings.pickupEnabled,
      pickupAddress: settings.pickupAddress,
      pickupSchedule: settings.pickupSchedule,
      shippingMode: settings.shippingMode,
      globalTVA: settings.globalTVA,
      couriers: settings.couriers
        .filter(c => c.isActive)
        .map(c => ({
          id: c.id,
          name: c.name,
          logo: c.logo,
          basePrice: c.basePrice,
          freeThreshold: c.freeThreshold,
          estimatedDays: c.estimatedDays,
          hasApi: c.hasApi,
        })),
    }
    return NextResponse.json({ success: true, settings: publicSettings }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  }
  
  // Full settings for admin
  return NextResponse.json({ success: true, settings })
}

// POST — save shipping settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (typeof body.fixedShippingRate !== 'number' && body.fixedShippingRate !== undefined) {
      return NextResponse.json({ error: 'fixedShippingRate must be a number' }, { status: 400 })
    }
    
    const current = loadSettings()
    
    // Merge incoming settings with current
    const updated: ShippingSettings = {
      ...current,
      ...body,
      // Ensure couriers array is properly handled
      couriers: body.couriers || current.couriers,
      updatedAt: new Date().toISOString(),
    }
    
    saveSettings(updated)
    
    return NextResponse.json({
      success: true,
      message: 'Shipping settings saved successfully',
      settings: updated,
    })
  } catch (error) {
    console.error('Error saving shipping settings:', error)
    return NextResponse.json({ error: 'Failed to save shipping settings' }, { status: 500 })
  }
}

// OPTIONS — CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
