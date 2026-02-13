"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Users, UserPlus, Shield, ShieldCheck, ShieldAlert, 
  Edit, Trash2, ToggleLeft, ToggleRight, Loader2,
  Eye, EyeOff, X, Check, AlertTriangle
} from "lucide-react"

interface AdminUser {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'support' | 'client'
  permissions: string[]
  is_active: boolean
  medusa_user_id: string | null
  last_login: string | null
  created_at: string
  updated_at: string
}

const ROLE_CONFIG = {
  admin: { 
    label: 'Administrator', 
    icon: ShieldCheck, 
    color: 'bg-purple-100 text-purple-700 border-purple-200', 
    dotColor: 'bg-purple-500',
    description: 'Full access to all features: Dashboard, Store, CMS, Marketing, SEO, Security, Google, Billing, Logs, Settings, Users.'
  },
  support: { 
    label: 'Support / Sales', 
    icon: Shield, 
    color: 'bg-blue-100 text-blue-700 border-blue-200', 
    dotColor: 'bg-blue-500',
    description: 'Limited access: Dashboard, Store (orders, AWB, inventory), Billing (invoices, printing). Ideal for the sales/support team.'
  },
  client: { 
    label: 'Client', 
    icon: ShieldAlert, 
    color: 'bg-gray-100 text-gray-600 border-gray-200', 
    dotColor: 'bg-gray-400',
    description: 'Client dashboard access only (storefront). Cannot access the admin panel.'
  },
}

const ALL_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard', group: 'General' },
  { id: 'magazin', label: 'Store', group: 'General' },
  { id: 'cms', label: 'CMS', group: 'General' },
  { id: 'marketing', label: 'Marketing', group: 'Marketing' },
  { id: 'seo', label: 'SEO', group: 'Marketing' },
  { id: 'google', label: 'Google / Ads', group: 'Marketing' },
  { id: 'securitate', label: 'Security', group: 'System' },
  { id: 'facturare', label: 'Billing', group: 'Financial' },
  { id: 'logs', label: 'Logs', group: 'System' },
  { id: 'settings', label: 'Settings', group: 'System' },
  { id: 'utilizatori', label: 'Users', group: 'System' },
]

const ROLE_PRESETS: Record<string, string[]> = {
  admin: ALL_PERMISSIONS.map(p => p.id),
  support: ['dashboard', 'magazin', 'facturare'],
  client: [],
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'support' as 'admin' | 'support' | 'client',
    password: '',
    permissions: ROLE_PRESETS.support as string[],
  })

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/app/api/admin/users')
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Load users error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const openAddUser = () => {
    setEditingUser(null)
    setForm({ email: '', first_name: '', last_name: '', role: 'support', password: '', permissions: ROLE_PRESETS.support })
    setShowModal(true)
  }

  const openEditUser = (user: AdminUser) => {
    setEditingUser(user)
    setForm({
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role,
      password: '',
      permissions: user.permissions || ROLE_PRESETS[user.role] || [],
    })
    setShowModal(true)
  }

  const handleRoleChange = (role: 'admin' | 'support' | 'client') => {
    setForm(prev => ({
      ...prev,
      role,
      permissions: ROLE_PRESETS[role] || [],
    }))
  }

  const togglePermission = (permId: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId],
    }))
  }

  const handleSave = async () => {
    if (!form.email || !form.role) return
    setSaving(true)
    try {
      const res = await fetch('/app/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingUser ? 'update' : 'create',
          id: editingUser?.id,
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
          permissions: form.permissions,
          password: form.password || undefined,
        }),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      
      setShowModal(false)
      loadUsers()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: number) => {
    try {
      await fetch('/app/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id }),
      })
      loadUsers()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch('/app/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDeleteConfirm(null)
      loadUsers()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const adminCount = users.filter(u => u.role === 'admin' && u.is_active).length
  const supportCount = users.filter(u => u.role === 'support' && u.is_active).length
  const totalActive = users.filter(u => u.is_active).length

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            Users & Groups
          </h1>
          <p className="text-gray-500 mt-1">Manage team access and permissions</p>
        </div>
        <button
          onClick={openAddUser}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium shadow-lg shadow-blue-500/25 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {Object.entries(ROLE_CONFIG).map(([key, config]) => {
          const Icon = config.icon
          const count = key === 'admin' ? adminCount : key === 'support' ? supportCount : users.filter(u => u.role === 'client').length
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${config.color} border flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{config.label}</p>
                  <p className="text-sm text-gray-500">{count} user{count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{config.description}</p>
            </div>
          )
        })}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Permissions</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.client
                  const RoleIcon = roleConfig.icon
                  return (
                    <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm">
                            {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : '—'}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${roleConfig.color}`}>
                          <RoleIcon className="w-3.5 h-3.5" />
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(user.permissions || []).slice(0, 4).map(p => (
                            <span key={p} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md capitalize">
                              {p}
                            </span>
                          ))}
                          {(user.permissions || []).length > 4 && (
                            <span className="text-xs text-gray-400">+{user.permissions.length - 4}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                          <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('en-US')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditUser(user)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggle(user.id)} className="p-2 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors" title={user.is_active ? 'Deactivate' : 'Activate'}>
                            {user.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          {deleteConfirm === user.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Confirm deletion">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDeleteConfirm(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg" title="Cancel">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(user.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      No users found. Add the first user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {users.map((user) => {
              const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.client
              const RoleIcon = roleConfig.icon
              return (
                <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm">
                        {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.email}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${roleConfig.color}`}>
                      <RoleIcon className="w-3 h-3" />
                      {roleConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${user.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => openEditUser(user)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggle(user.id)} className="p-2 text-gray-400 hover:text-orange-600 rounded-lg">
                        {user.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Role Access Matrix */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Role Access Matrix
          </h2>
          <p className="text-sm text-gray-500 mt-1">Quick view of permissions for each role</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Module</th>
                {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                  <th key={key} className="px-4 py-3 text-center font-medium text-gray-500">{cfg.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((perm) => (
                <tr key={perm.id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 font-medium text-gray-700">{perm.label}</td>
                  {Object.keys(ROLE_CONFIG).map((role) => {
                    const has = ROLE_PRESETS[role]?.includes(perm.id)
                    return (
                      <td key={role} className="px-4 py-2.5 text-center">
                        {has ? (
                          <Check className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Smith"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="email@example.com"
                  disabled={!!editingUser}
                />
              </div>

              {/* Password (only for new users) */}
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password (for admin login)</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Secure password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Required for Admin and Support roles (panel login)</p>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon
                    const selected = form.role === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleRoleChange(key as 'admin' | 'support' | 'client')}
                        className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                          selected 
                            ? 'border-blue-500 bg-blue-50 shadow-sm' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-1 ${selected ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`text-xs font-medium ${selected ? 'text-blue-700' : 'text-gray-600'}`}>
                          {config.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">{ROLE_CONFIG[form.role]?.description}</p>
              </div>

              {/* Custom Permissions */}
              {form.role !== 'client' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom permissions</label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
                    {ALL_PERMISSIONS.map((perm) => {
                      const checked = form.permissions.includes(perm.id)
                      return (
                        <label key={perm.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(perm.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={`text-sm ${checked ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                            {perm.label}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Warning for client role */}
              {form.role === 'client' && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Client Role</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Users with the Client role cannot access the admin panel. They can only place orders 
                      and manage their account on the storefront.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.email || !form.role || saving}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
