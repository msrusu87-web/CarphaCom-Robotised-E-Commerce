/**
 * AWB Tracking API
 * GET /api/tracking?awb=XXXX
 * 
 * Auto-detects Romanian courier from AWB pattern.
 * Attempts to fetch tracking status from courier tracking pages.
 * Returns structured tracking data with status timeline.
 */

import { NextRequest, NextResponse } from 'next/server'

interface TrackingEvent {
  date: string
  time: string
  status: string
  location: string
}

interface TrackingResult {
  awb: string
  courier: {
    id: string
    name: string
    icon: string
    trackUrl: string
  }
  detected: boolean
  currentStatus: string
  statusType: 'in_transit' | 'delivered' | 'picked_up' | 'processing' | 'returned' | 'unknown'
  estimatedDelivery: string | null
  events: TrackingEvent[]
  trackingUrl: string
  error?: string
}

// Courier detection patterns
const COURIER_PATTERNS: Array<{
  id: string
  name: string
  icon: string
  trackUrl: string
  detect: (awb: string) => boolean
}> = [
  {
    id: 'fan-courier',
    name: 'FAN Courier',
    icon: '🚚',
    trackUrl: 'https://www.fancourier.ro/awb-tracking/?awb=',
    detect: (awb) => {
      // FAN Courier: 13 digits, commonly starts with 2 or 7
      if (!/^\d{13}$/.test(awb)) return false
      return awb.startsWith('2') || awb.startsWith('7') || awb.startsWith('1')
    }
  },
  {
    id: 'sameday',
    name: 'Sameday',
    icon: '📦',
    trackUrl: 'https://www.sameday.ro/tracking-romania?awb_or_order_id=',
    detect: (awb) => {
      // Sameday: typically shorter (8-12 digits) or alphanumeric
      if (/^[A-Z]{2}\d+$/.test(awb)) return true
      if (/^\d{8,12}$/.test(awb) && !awb.startsWith('2') && !awb.startsWith('7') && !awb.startsWith('1')) return true
      return false
    }
  },
  {
    id: 'cargus',
    name: 'Cargus',
    icon: '🚛',
    trackUrl: 'https://www.cargus.ro/tracking-romania/?quicksearch=',
    detect: (awb) => {
      // Cargus: 10 digits typically starting with 3 or 4
      if (/^\d{10,12}$/.test(awb) && (awb.startsWith('3') || awb.startsWith('4'))) return true
      return false
    }
  },
  {
    id: 'gls',
    name: 'GLS Romania',
    icon: '🌐',
    trackUrl: 'https://gls-group.eu/RO/ro/urmarire-colete?match=',
    detect: (awb) => {
      // GLS: typically 11 digits starting with 5 or 6
      if (/^\d{11,14}$/.test(awb) && (awb.startsWith('5') || awb.startsWith('6'))) return true
      return false
    }
  },
  {
    id: 'dpd',
    name: 'DPD Romania',
    icon: '🏢',
    trackUrl: 'https://tracking.dpd.de/status/ro_RO/parcel/',
    detect: (awb) => {
      // DPD: typically starts with 0 followed by 13 digits, or 14 digits
      if (/^0\d{13,14}$/.test(awb)) return true
      return false
    }
  },
  {
    id: 'posta-romana',
    name: 'Romanian Post',
    icon: '📮',
    trackUrl: 'https://www.posta-romana.ro/cnpr-portal/cnpr-tnt/cnt-cautare-trimiteri?trimitere.barCode=',
    detect: (awb) => {
      // Romanian Post: typically starts with RR, RO, CP  
      if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(awb)) return true
      return false
    }
  },
  {
    id: 'urgent-cargus',
    name: 'Urgent Cargus',
    icon: '⚡',
    trackUrl: 'https://www.urgentcargus.ro/tracking-romania/?tracking=',
    detect: (awb) => {
      if (/^\d{10}$/.test(awb) && awb.startsWith('8')) return true
      return false
    }
  },
  {
    id: 'nemo',
    name: 'NEMO Express',
    icon: '🚀',
    trackUrl: 'https://www.nemoexpress.ro/urmarire-colet/',
    detect: (awb) => {
      if (/^\d{10}$/.test(awb) && awb.startsWith('9')) return true
      return false
    }
  }
]

function detectCourier(awb: string) {
  const cleaned = awb.trim().toUpperCase()
  for (const courier of COURIER_PATTERNS) {
    if (courier.detect(cleaned)) return courier
  }
  // Default fallback: try FAN Courier for any 13-digit AWB
  if (/^\d{13}$/.test(cleaned)) return COURIER_PATTERNS[0]
  return null
}

function inferStatusType(status: string): TrackingResult['statusType'] {
  const lower = status.toLowerCase()
  if (lower.includes('livrat') || lower.includes('delivered') || lower.includes('predat')) return 'delivered'
  if (lower.includes('tranzit') || lower.includes('transit') || lower.includes('transport') || lower.includes('ruta') || lower.includes('drum')) return 'in_transit'
  if (lower.includes('preluat') || lower.includes('picked') || lower.includes('ridicat') || lower.includes('colectat')) return 'picked_up'
  if (lower.includes('procesat') || lower.includes('sortat') || lower.includes('depozit') || lower.includes('hub') || lower.includes('agregat')) return 'processing'
  if (lower.includes('retur') || lower.includes('return') || lower.includes('refuzat')) return 'returned'
  return 'unknown'
}

async function fetchFanCourierTracking(awb: string): Promise<Partial<TrackingResult>> {
  try {
    // FAN Courier public tracking page - scrape the tracking info
    const res = await fetch(`https://www.fancourier.ro/awb-tracking/?awb=${awb}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    })
    const html = await res.text()
    
    // Try to find any tracking data in the HTML
    const events: TrackingEvent[] = []
    
    // Parse tracking table rows - FAN Courier uses a table format
    const tableRowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi
    const rows = html.match(tableRowRegex) || []
    
    for (const row of rows) {
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []
      if (cells.length >= 3) {
        const cleanCell = (c: string) => c.replace(/<[^>]+>/g, '').trim()
        const dateStr = cleanCell(cells[0])
        const status = cleanCell(cells[1])
        const location = cells[2] ? cleanCell(cells[2]) : ''
        
        if (dateStr && status && /\d/.test(dateStr)) {
          const [date, time] = dateStr.includes(' ') ? dateStr.split(' ') : [dateStr, '']
          events.push({ date, time: time || '', status, location })
        }
      }
    }
    
    // If no structured data found, try to detect status from page content
    const currentStatus = events.length > 0 
      ? events[0].status 
      : html.includes('livrat') ? 'Package delivered' 
      : html.includes('tranzit') ? 'In transit'
      : html.includes('preluat') ? 'Package picked up'
      : 'Processing information'

    return {
      currentStatus,
      statusType: inferStatusType(currentStatus),
      events,
    }
  } catch (err) {
    console.error('[Tracking] FAN Courier fetch error:', err)
    return {
      currentStatus: 'Could not retrieve tracking information',
      statusType: 'unknown',
      events: [],
    }
  }
}

async function fetchSamedayTracking(awb: string): Promise<Partial<TrackingResult>> {
  try {
    const res = await fetch(`https://api.sameday.ro/api/public/awb/${awb}/awb-history`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
      signal: AbortSignal.timeout(10000),
    })
    
    if (!res.ok) {
      return {
        currentStatus: 'AWB not found at Sameday',
        statusType: 'unknown',
        events: [],
      }
    }
    
    const data = await res.json()
    const events: TrackingEvent[] = []
    
    if (data?.awbHistory && Array.isArray(data.awbHistory)) {
      for (const entry of data.awbHistory) {
        events.push({
          date: entry.statusDate?.split('T')[0] || '',
          time: entry.statusDate?.split('T')[1]?.substring(0, 5) || '',
          status: entry.statusState || entry.status || '',
          location: entry.county || entry.transitLocation || '',
        })
      }
    }
    
    const currentStatus = events.length > 0 ? events[0].status : 'Processing'
    
    return {
      currentStatus,
      statusType: inferStatusType(currentStatus),
      events,
      estimatedDelivery: data?.estimatedDeliveryDate || null,
    }
  } catch (err) {
    console.error('[Tracking] Sameday fetch error:', err)
    return {
      currentStatus: 'Could not retrieve tracking information',
      statusType: 'unknown',
      events: [],
    }
  }
}

async function fetchGenericTracking(awb: string, courierId: string): Promise<Partial<TrackingResult>> {
  // For couriers without public API, return a structured response pointing to their tracking page
  return {
    currentStatus: 'Check status directly on the courier website',
    statusType: 'unknown',
    events: [],
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const awb = searchParams.get('awb')?.trim() || ''
  const forceCourier = searchParams.get('courier') || ''
  
  if (!awb) {
    return NextResponse.json({ error: 'AWB number is required' }, { status: 400 })
  }
  
  // Auto-detect or use forced courier
  let courier = forceCourier 
    ? COURIER_PATTERNS.find(c => c.id === forceCourier) 
    : detectCourier(awb)
  
  if (!courier) {
    // If we can't detect, return all possible couriers and let user choose
    return NextResponse.json({
      awb,
      detected: false,
      courier: null,
      currentStatus: 'Could not auto-detect the courier',
      statusType: 'unknown',
      events: [],
      trackingUrl: '',
      possibleCouriers: COURIER_PATTERNS.map(c => ({ id: c.id, name: c.name, icon: c.icon, trackUrl: c.trackUrl + awb })),
    })
  }
  
  // Fetch tracking data based on courier
  let trackingData: Partial<TrackingResult>
  
  switch (courier.id) {
    case 'fan-courier':
      trackingData = await fetchFanCourierTracking(awb)
      break
    case 'sameday':
      trackingData = await fetchSamedayTracking(awb)
      break
    default:
      trackingData = await fetchGenericTracking(awb, courier.id)
  }
  
  const result: TrackingResult = {
    awb,
    courier: {
      id: courier.id,
      name: courier.name,
      icon: courier.icon,
      trackUrl: courier.trackUrl,
    },
    detected: true,
    currentStatus: trackingData.currentStatus || 'Processing',
    statusType: trackingData.statusType || 'unknown',
    estimatedDelivery: trackingData.estimatedDelivery || null,
    events: trackingData.events || [],
    trackingUrl: courier.trackUrl + awb,
  }
  
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
