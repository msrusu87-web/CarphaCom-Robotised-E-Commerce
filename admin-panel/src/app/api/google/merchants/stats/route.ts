/**
 * API Route: Google Merchant Center Stats
 * GET /api/google/merchants/stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAuthService } from '@/lib/google/auth'
import { GoogleMerchantsService } from '@/lib/google/merchants'
import { GoogleTokenManager } from '@/lib/google/token-manager'
import { requireAdminSession } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const session = requireAdminSession(request)
    if (session instanceof NextResponse) return session

    // Load and verify tokens
    const tokens = await GoogleTokenManager.ensureValidTokens()
    if (!tokens) {
      return NextResponse.json(
        { error: 'Not authenticated. Please re-connect Google.' },
        { status: 401 }
      )
    }

    // Initialize services
    const authService = getGoogleAuthService()
    authService.setCredentials(tokens)
    const merchantsService = new GoogleMerchantsService(authService.getClient())

    // Fetch stats
    const stats = await merchantsService.getStats()

    return NextResponse.json(stats)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching merchant stats:', errorMsg)

    if (errorMsg.includes('has not been used in project') || errorMsg.includes('is disabled')) {
      return NextResponse.json({
        error: 'api_not_enabled',
        message: 'Google Merchant Center API is not enabled in the Google Cloud project.',
        enableUrl: 'https://console.developers.google.com/apis/api/merchantapi.googleapis.com/overview?project=YOUR_GOOGLE_PROJECT_ID',
        totalProducts: 0, approved: 0, pending: 0, disapproved: 0
      })
    }

    return NextResponse.json(
      { error: 'Failed to fetch Merchant Center statistics' },
      { status: 500 }
    )
  }
}
