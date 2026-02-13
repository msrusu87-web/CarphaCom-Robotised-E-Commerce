/**
 * API Route: Google Analytics Stats
 * GET /api/google/analytics/stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAuthService } from '@/lib/google/auth'
import { GoogleAnalyticsService } from '@/lib/google/analytics'
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

    // Check if GA4 property ID is configured
    const propertyId = (process.env.GOOGLE_ANALYTICS_PROPERTY_ID || '').replace(/^properties\//, '')
    if (!propertyId || propertyId === 'YOUR_GA4_PROPERTY_ID') {
      return NextResponse.json({
        error: 'GA4 not configured',
        message: 'Google Analytics 4 property ID is not set. Set GOOGLE_ANALYTICS_PROPERTY_ID in .env.local.',
        stats: { users: 0, sessions: 0, pageviews: 0, bounceRate: '0%', avgSessionDuration: '0:00', conversionRate: '0%' },
        topPages: [],
        realtimeUsers: 0,
      })
    }

    const analyticsService = new GoogleAnalyticsService(authService.getClient())

    const stats = await analyticsService.getStats()
    const topPages = await analyticsService.getTopPages(10)
    const realtimeUsers = await analyticsService.getRealtimeUsers()

    return NextResponse.json({
      stats,
      topPages,
      realtimeUsers,
    })
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || 'Unknown error'
    console.error('Error fetching analytics stats:', errorMsg)

    // Check if it's an API-not-enabled error
    if (errorMsg.includes('has not been used in project') || errorMsg.includes('is disabled')) {
      return NextResponse.json({
        error: 'api_not_enabled',
        message: 'Google Analytics Data API is not enabled. Enable it from Google Cloud Console.',
        enableUrl: 'https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=YOUR_GOOGLE_PROJECT_ID',
        stats: { users: 0, sessions: 0, pageviews: 0, bounceRate: '0%', avgSessionDuration: '0:00', conversionRate: '0%' },
        topPages: [],
        realtimeUsers: 0,
      })
    }

    return NextResponse.json(
      { error: 'Failed to fetch Google Analytics data', details: errorMsg },
      { status: 500 }
    )
  }
}
