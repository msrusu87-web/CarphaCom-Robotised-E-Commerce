/**
 * Admin Users CRUD API
 * GET  /api/admin/users     — List all admin users with roles
 * POST /api/admin/users     — Create/Update/Delete users
 * 
 * Roles: admin, support, client
 * - admin:   Full access to everything
 * - support: Facturare + Magazin (orders, invoices, AWB, sales)
 * - client:  Client dashboard only (no admin access, for reference only)
 */

import { NextRequest, NextResponse } from 'next/server'

const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'medusa_store',
  user: process.env.DB_USER || 'medusa',
  password: process.env.DB_PASSWORD || 'YOUR_DB_PASSWORD',
})

const MEDUSA_BACKEND_URL = process.env.MEDUSA_INTERNAL_URL || 'http://127.0.0.1:9000'

// Ensure admin_users table exists
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      role VARCHAR(50) NOT NULL DEFAULT 'support',
      permissions JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN DEFAULT true,
      medusa_user_id VARCHAR(255),
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)
  
  // Seed default admin if table is empty
  const count = await pool.query('SELECT COUNT(*) FROM admin_users')
  if (parseInt(count.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO admin_users (email, first_name, last_name, role, permissions, medusa_user_id)
      SELECT u.email, u.first_name, u.last_name, 'admin', 
        '["dashboard","magazin","cms","marketing","seo","securitate","google","facturare","logs","settings","utilizatori"]'::jsonb,
        u.id
      FROM "user" u 
      WHERE u.deleted_at IS NULL 
      LIMIT 1
    `)
  }
}

// Role permission presets
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['dashboard', 'magazin', 'cms', 'marketing', 'seo', 'securitate', 'google', 'facturare', 'logs', 'settings', 'utilizatori'],
  support: ['dashboard', 'magazin', 'facturare'],
  client: [],
}

export async function GET() {
  try {
    await ensureTable()
    
    const result = await pool.query(`
      SELECT 
        au.id, au.email, au.first_name, au.last_name, au.role, 
        au.permissions, au.is_active, au.medusa_user_id, 
        au.last_login, au.created_at, au.updated_at
      FROM admin_users au
      ORDER BY 
        CASE au.role WHEN 'admin' THEN 1 WHEN 'support' THEN 2 WHEN 'client' THEN 3 ELSE 4 END,
        au.created_at ASC
    `)
    
    // Also get Medusa users for reference
    let medusaUsers: any[] = []
    try {
      const mu = await pool.query(`
        SELECT id, email, first_name, last_name 
        FROM "user" 
        WHERE deleted_at IS NULL 
        ORDER BY created_at ASC
      `)
      medusaUsers = mu.rows
    } catch {}
    
    return NextResponse.json({
      users: result.rows,
      medusaUsers,
      rolePresets: ROLE_PERMISSIONS,
    })
  } catch (error: any) {
    console.error('[Users API] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable()
    
    const body = await request.json()
    const { action } = body
    
    switch (action) {
      case 'create': {
        const { email, first_name, last_name, role, permissions, password } = body
        
        if (!email || !role) {
          return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
        }
        
        // Check if user already exists
        const existing = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email])
        if (existing.rows.length > 0) {
          return NextResponse.json({ error: 'User already exists' }, { status: 409 })
        }
        
        // If role is admin or support, create Medusa user too (so they can login)
        let medusaUserId = null
        if ((role === 'admin' || role === 'support') && password) {
          try {
            // Create user in Medusa via admin API
            const medusaTokenCookie = request.cookies.get('medusa_token')
            const token = medusaTokenCookie?.value
            
            if (token) {
              const createRes = await fetch(`${MEDUSA_BACKEND_URL}/admin/users`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ email, first_name, last_name }),
              })
              
              if (createRes.ok) {
                const userData = await createRes.json()
                medusaUserId = userData.user?.id
              }
            }
            
            // Also register auth identity
            try {
              await fetch(`${MEDUSA_BACKEND_URL}/auth/user/emailpass/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
              })
            } catch {}
          } catch (err) {
            console.error('[Users API] Medusa user creation failed:', err)
          }
        }
        
        const perms = permissions || ROLE_PERMISSIONS[role] || []
        
        const result = await pool.query(`
          INSERT INTO admin_users (email, first_name, last_name, role, permissions, medusa_user_id)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [email, first_name || '', last_name || '', role, JSON.stringify(perms), medusaUserId])
        
        return NextResponse.json({ success: true, user: result.rows[0] })
      }
      
      case 'update': {
        const { id, first_name, last_name, role, permissions, is_active } = body
        
        if (!id) return NextResponse.json({ error: 'User ID missing' }, { status: 400 })
        
        const perms = permissions || (role ? ROLE_PERMISSIONS[role] : undefined)
        
        const result = await pool.query(`
          UPDATE admin_users 
          SET 
            first_name = COALESCE($2, first_name),
            last_name = COALESCE($3, last_name),
            role = COALESCE($4, role),
            permissions = COALESCE($5, permissions),
            is_active = COALESCE($6, is_active),
            updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `, [id, first_name, last_name, role, perms ? JSON.stringify(perms) : null, is_active])
        
        if (result.rows.length === 0) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        
        return NextResponse.json({ success: true, user: result.rows[0] })
      }
      
      case 'delete': {
        const { id } = body
        if (!id) return NextResponse.json({ error: 'User ID missing' }, { status: 400 })
        
        // Don't allow deleting the last admin
        const admins = await pool.query("SELECT COUNT(*) FROM admin_users WHERE role = 'admin' AND is_active = true")
        const user = await pool.query('SELECT role FROM admin_users WHERE id = $1', [id])
        
        if (user.rows[0]?.role === 'admin' && parseInt(admins.rows[0].count) <= 1) {
          return NextResponse.json({ error: 'Cannot delete the last administrator' }, { status: 400 })
        }
        
        await pool.query('DELETE FROM admin_users WHERE id = $1', [id])
        return NextResponse.json({ success: true })
      }
      
      case 'toggle': {
        const { id } = body
        if (!id) return NextResponse.json({ error: 'User ID missing' }, { status: 400 })
        
        const result = await pool.query(`
          UPDATE admin_users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *
        `, [id])
        
        return NextResponse.json({ success: true, user: result.rows[0] })
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[Users API] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
