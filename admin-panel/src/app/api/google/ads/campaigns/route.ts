/**
 * API Route: Google Ads Campaign Management
 * GET  /api/google/ads/campaigns  → list campaigns with stats
 * POST /api/google/ads/campaigns  → create new campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleAdsService, createGoogleAdsService } from '@/lib/google/ads'
import { GoogleTokenManager } from '@/lib/google/token-manager'
import { requireAdminSession } from '@/lib/api-auth'

async function getAdsService(): Promise<GoogleAdsService | null> {
  const tokens = await GoogleTokenManager.ensureValidTokens()
  if (!tokens?.access_token) return null
  return createGoogleAdsService(tokens.access_token)
}

export async function GET(request: NextRequest) {
  try {
    const session = requireAdminSession(request)
    if (session instanceof NextResponse) return session

    // Check if configured
    const { configured, missing } = GoogleAdsService.isConfigured()
    if (!configured) {
      return NextResponse.json({
        configured: false,
        missing,
        message: 'Google Ads is not configured. Add the missing variables to .env.local.',
        setupSteps: [
          'Create a Google Ads account at ads.google.com',
          'Create a Manager account (MCC) at ads.google.com/home/tools/manager-accounts',
          'Apply for a Developer Token from API Center (Tools → API Center)',
          'Set GOOGLE_ADS_DEVELOPER_TOKEN in .env.local',
          'Set GOOGLE_ADS_CUSTOMER_ID (10 digits, no dashes) in .env.local',
          'Re-connect Google OAuth to approve the new scope (adwords)',
        ],
      })
    }

    const service = await getAdsService()
    if (!service) {
      return NextResponse.json({ error: 'Google OAuth is not connected.' }, { status: 401 })
    }

    // Get campaigns and account stats
    const [campaigns, stats, accountInfo] = await Promise.all([
      service.getCampaigns().catch(e => { console.error('getCampaigns error:', e.message); return [] }),
      service.getAccountStats().catch(e => { console.error('getAccountStats error:', e.message); return null }),
      service.getAccountInfo().catch(e => { console.error('getAccountInfo error:', e.message); return null }),
    ])

    return NextResponse.json({
      configured: true,
      account: accountInfo,
      stats,
      campaigns,
    })
  } catch (error: any) {
    console.error('Google Ads campaigns GET error:', error)

    if (error.message?.includes('DEVELOPER_TOKEN_NOT_APPROVED')) {
      return NextResponse.json({
        configured: true,
        error: 'developer_token_pending',
        message: 'Developer Token is pending. Use a Test Account or wait for approval.',
      })
    }

    return NextResponse.json({ error: 'Error loading campaigns', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireAdminSession(request)
    if (session instanceof NextResponse) return session

    const { configured, missing } = GoogleAdsService.isConfigured()
    if (!configured) {
      return NextResponse.json({ error: 'Google Ads is not configured', missing }, { status: 400 })
    }

    const service = await getAdsService()
    if (!service) {
      return NextResponse.json({ error: 'Google OAuth is not connected' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
    }
    if (!body.dailyBudget || body.dailyBudget < 1) {
      return NextResponse.json({ error: 'Daily budget must be at least 1 RON' }, { status: 400 })
    }

    const result = await service.createCampaign({
      name: body.name.trim(),
      type: body.type || 'SEARCH',
      dailyBudget: Number(body.dailyBudget),
      biddingStrategy: body.biddingStrategy || 'MAXIMIZE_CLICKS',
      targetCpa: body.targetCpa ? Number(body.targetCpa) : undefined,
      startDate: body.startDate,
      endDate: body.endDate,
      geoTargets: body.geoTargets || ['2642'],
      keywords: body.keywords || [],
      adHeadlines: body.adHeadlines || [],
      adDescriptions: body.adDescriptions || [],
      finalUrl: body.finalUrl || '',
    })

    return NextResponse.json({
      success: true,
      campaignId: result.campaignId,
      message: 'Campaign created successfully (PAUSED). Activate it when you are ready.',
    })
  } catch (error: any) {
    console.error('Google Ads create campaign error:', error)
    return NextResponse.json({ error: 'Error creating campaign', details: error.message }, { status: 500 })
  }
}
