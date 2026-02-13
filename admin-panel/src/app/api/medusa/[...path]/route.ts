import { NextRequest, NextResponse } from 'next/server'

const MEDUSA_URL = "http://localhost:9000"
const PUBLISHABLE_KEY = "YOUR_MEDUSA_PUBLISHABLE_KEY"

// Admin credentials for internal API access
const ADMIN_EMAIL = "admin@example.com"
const ADMIN_PASSWORD = "YOUR_ADMIN_PASSWORD"

// Cache admin token
let adminToken: string | null = null
let tokenExpiry: number = 0

async function getAdminToken(): Promise<string> {
  // Return cached token if valid
  if (adminToken && Date.now() < tokenExpiry) {
    return adminToken
  }

  // Login to get new token using Medusa v2 auth route
  const response = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[Medusa Proxy] Admin auth failed:', response.status, error)
    throw new Error('Admin authentication failed: ' + error)
  }

  const data = await response.json()
  adminToken = data.token
  // Token expires in 24 hours, refresh after 23
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000
  console.log('[Medusa Proxy] Admin token refreshed')
  return adminToken!
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const endpoint = '/' + path.join('/')
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${MEDUSA_URL}${endpoint}${searchParams ? '?' + searchParams : ''}`
  const isAdmin = endpoint.startsWith('/admin')

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (isAdmin) {
      const token = await getAdminToken()
      headers['Authorization'] = `Bearer ${token}`
    } else {
      headers['x-publishable-api-key'] = PUBLISHABLE_KEY
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Medusa Proxy] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Medusa API', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const endpoint = '/' + path.join('/')
  const url = `${MEDUSA_URL}${endpoint}`
  const isAdmin = endpoint.startsWith('/admin')
  
  let body
  const contentType = request.headers.get('content-type') || ''
  
  // Check if it's a file upload (FormData automatically sets multipart/form-data with boundary)
  if (contentType.startsWith('multipart/form-data')) {
    // Handle file uploads - pass through the request
    const formData = await request.formData()
    const token = await getAdminToken()
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  }
  
  body = await request.json()

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (isAdmin) {
      const token = await getAdminToken()
      headers['Authorization'] = `Bearer ${token}`
    } else {
      headers['x-publishable-api-key'] = PUBLISHABLE_KEY
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Medusa Proxy] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Medusa API', details: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const endpoint = '/' + path.join('/')
  const url = `${MEDUSA_URL}${endpoint}`

  try {
    const token = await getAdminToken()
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (response.status === 204) {
      return NextResponse.json({ success: true }, { status: 200 })
    }
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Medusa Proxy] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete from Medusa API', details: String(error) },
      { status: 500 }
    )
  }
}
