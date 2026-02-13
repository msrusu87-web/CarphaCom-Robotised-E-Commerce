import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, brevoApiKey, smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure } = body

    if (provider === 'none') {
      return NextResponse.json({ success: true, message: 'Email disabled - no connection to test' })
    }

    // If using Brevo, test both API and SMTP
    if (provider === 'brevo' && brevoApiKey) {
      // Test Brevo API connection
      const brevoResponse = await fetch('https://api.brevo.com/v3/account', {
        headers: {
          'api-key': brevoApiKey,
          'accept': 'application/json'
        }
      })
      
      if (!brevoResponse.ok) {
        return NextResponse.json({ 
          success: false, 
          message: `Brevo API: ${brevoResponse.status} - Check API Key` 
        })
      }
      
      const account = await brevoResponse.json()
      return NextResponse.json({ 
        success: true, 
        message: `Connected to Brevo: ${account.email}. Credits: ${account.plan?.[0]?.credits || 'N/A'}` 
      })
    }

    // Test SMTP connection
    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      })

      await transporter.verify()
      return NextResponse.json({ success: true, message: 'SMTP connection successful!' })
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Incomplete configuration - fill in required fields' 
    })

  } catch (error: any) {
    console.error('Email test connection error:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Error testing connection' 
    })
  }
}
