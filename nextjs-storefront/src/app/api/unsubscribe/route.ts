import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: `postgresql://medusa:YOUR_DB_PASSWORD@localhost:5432/medusa_store`,
  max: 3,
})

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")

  if (!token || token.length < 10) {
    return new NextResponse(htmlPage("Invalid Token", "The unsubscribe link is not valid.", "error"), {
      status: 400, headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  const client = await pool.connect()
  try {
    // Look up the contact by unsubscribe token
    const { rows } = await client.query(
      `UPDATE mkt_contacts SET unsubscribed = true, updated_at = NOW()
       WHERE unsubscribe_token = $1 AND unsubscribed = false
       RETURNING id, email, company_name`,
      [token]
    )

    if (rows.length > 0) {
      const contact = rows[0]
      console.log(`[Unsubscribe] Contact ${contact.id} (${contact.email || contact.company_name}) unsubscribed`)
      return new NextResponse(
        htmlPage(
          "Unsubscribe Confirmed",
          `The address <strong>${contact.email || "yours"}</strong> has been removed from our newsletter list.<br/><br/>You will no longer receive marketing emails from StațiiInfoTrafic.ro.`,
          "success"
        ),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      )
    }

    // Check if already unsubscribed
    const existing = await client.query(
      `SELECT id, unsubscribed FROM mkt_contacts WHERE unsubscribe_token = $1`,
      [token]
    )

    if (existing.rows.length > 0 && existing.rows[0].unsubscribed) {
      return new NextResponse(
        htmlPage("Already Unsubscribed", "This email address is already unsubscribed from our list.", "info"),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      )
    }

    return new NextResponse(
      htmlPage("Unknown Token", "No subscription was found associated with this link.", "error"),
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    )
  } catch (err) {
    console.error("[Unsubscribe] Error:", err)
    return new NextResponse(
      htmlPage("Error", "An error occurred. Please try again or contact us directly.", "error"),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    )
  } finally {
    client.release()
  }
}

function htmlPage(title: string, message: string, type: "success" | "error" | "info") {
  const colors = {
    success: { bg: "#ecfdf5", border: "#10b981", icon: "✓", iconBg: "#d1fae5", text: "#065f46" },
    error: { bg: "#fef2f2", border: "#ef4444", icon: "✕", iconBg: "#fee2e2", text: "#991b1b" },
    info: { bg: "#eff6ff", border: "#3b82f6", icon: "ℹ", iconBg: "#dbeafe", text: "#1e40af" },
  }
  const c = colors[type]

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — StațiiInfoTrafic.ro</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb; padding: 20px; }
    .card { max-width: 480px; width: 100%; background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; text-align: center; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px 24px; }
    .header h1 { color: white; font-size: 20px; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 4px; }
    .body { padding: 40px 32px; }
    .icon { width: 64px; height: 64px; border-radius: 50%; background: ${c.iconBg}; border: 3px solid ${c.border}; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 20px; color: ${c.border}; }
    .body h2 { font-size: 22px; color: #111827; margin-bottom: 12px; }
    .body p { font-size: 15px; color: #6b7280; line-height: 1.6; }
    .footer { padding: 20px 32px; border-top: 1px solid #f3f4f6; }
    .footer a { color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>StațiiInfoTrafic.ro</h1>
      <p>Email Preferences Management</p>
    </div>
    <div class="body">
      <div class="icon">${c.icon}</div>
      <h2>${title}</h2>
      <p>${message}</p>
    </div>
    <div class="footer">
      <a href="https://YOUR_PNI_USERNAMEtrafic.ro">← Back to StațiiInfoTrafic.ro</a>
    </div>
  </div>
</body>
</html>`
}
