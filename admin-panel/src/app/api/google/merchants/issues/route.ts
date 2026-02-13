/**
 * API Route: Google Merchant Center - Product Issues
 * GET /api/google/merchants/issues
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

    const tokens = await GoogleTokenManager.ensureValidTokens()
    if (!tokens) {
      return NextResponse.json({ error: 'Not authenticated. Please re-connect Google.' }, { status: 401 })
    }

    const authService = getGoogleAuthService()
    authService.setCredentials(tokens)
    const merchantsService = new GoogleMerchantsService(authService.getClient())

    const issues = await merchantsService.getProductIssues()

    return NextResponse.json({ issues })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching product issues:', errorMsg)

    if (errorMsg.includes('has not been used in project') || errorMsg.includes('is disabled')) {
      return NextResponse.json({
        error: 'api_not_enabled',
        message: 'Google Merchant Center API is not enabled in the Google Cloud project.',
        enableUrl: 'https://console.developers.google.com/apis/api/merchantapi.googleapis.com/overview?project=YOUR_GOOGLE_PROJECT_ID',
        issues: []
      })
    }

    return NextResponse.json(
      { error: 'Failed to fetch product issues' },
      { status: 500 }
    )
  }
}
