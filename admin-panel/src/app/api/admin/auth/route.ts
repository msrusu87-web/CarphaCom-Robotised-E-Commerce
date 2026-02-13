import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// PostgreSQL connection
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'medusa_store',
  user: process.env.DB_USER || 'medusa',
  password: process.env.DB_PASSWORD || 'YOUR_DB_PASSWORD',
})

// Medusa backend URL - use internal localhost to avoid www redirect issues
const MEDUSA_BACKEND_URL = process.env.MEDUSA_INTERNAL_URL || 'http://127.0.0.1:9000'

/**
 * Verify password using Medusa's auth API
 * This properly uses Medusa's built-in scrypt verification
 */
async function verifyPasswordViaMedusa(email: string, password: string): Promise<{ success: boolean; token?: string }> {
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}/auth/user/emailpass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    
    if (response.ok) {
      const data = await response.json()
      return { success: true, token: data.token }
    }
    
    return { success: false }
  } catch (error) {
    console.error('Medusa auth error:', error)
    return { success: false }
  }
}

/**
 * POST /api/admin/auth
 * Authenticates admin user with email and password via Medusa API
 * Sets HTTP-only secure cookie with user session (7 days)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, action } = body

    // Logout action
    if (action === 'logout') {
      const cookieStore = await cookies()
      cookieStore.delete('admin_session')
      cookieStore.delete('admin_session_expires')
      cookieStore.delete('medusa_token')
      return NextResponse.json({ success: true, message: 'Logged out successfully' })
    }

    // Login action
    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      )
    }

    // Verify password using Medusa's auth API
    const authResult = await verifyPasswordViaMedusa(email, password)

    if (!authResult.success) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Get user details from database
    const userQuery = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name
      FROM "user" u
      WHERE u.email = $1 
        AND u.deleted_at IS NULL
      LIMIT 1
    `

    const result = await pool.query(userQuery, [email])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 401 }
      )
    }

    const user = result.rows[0]

    // All users in the "user" table are admin users (Medusa stores customers separately)
    const role = 'admin'
    
    // Create session data
    const sessionData = {
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role,
      authenticatedAt: new Date().toISOString(),
      sessionId: 'sess_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16),
    }

    // Set HTTP-only secure cookie with 30 day expiry
    const cookieStore = await cookies()
    const expiryDate = new Date()
    expiryDate.setTime(expiryDate.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days
    
    cookieStore.set('admin_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      expires: expiryDate,
      path: '/',
    })

    // Store Medusa token for API calls
    if (authResult.token) {
      cookieStore.set('medusa_token', authResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 1 day (token expiry)
        path: '/',
      })
    }

    // Also set expiry time cookie (non-httpOnly for client to check)
    cookieStore.set('admin_session_expires', expiryDate.toISOString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      expires: expiryDate,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      message: 'Authenticated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: sessionData.role,
      },
      sessionExpires: expiryDate.toISOString(),
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { message: 'Authentication error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/auth
 * Check if user is authenticated and session is valid
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin_session')
    const expiresAt = cookieStore.get('admin_session_expires')?.value

    if (!sessionCookie) {
      return NextResponse.json(
        { authenticated: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const sessionData = JSON.parse(sessionCookie.value)

    // Check if session is still valid (not expired)
    if (expiresAt && new Date(expiresAt) < new Date()) {
      // Session expired, delete cookies
      cookieStore.delete('admin_session')
      cookieStore.delete('admin_session_expires')
      cookieStore.delete('medusa_token')
      return NextResponse.json(
        { authenticated: false, message: 'Session expired' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: sessionData,
      sessionExpires: expiresAt,
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
        { authenticated: false, message: 'Session verification error' },
      { status: 500 }
    )
  }
}
