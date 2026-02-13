"use client"

import { useState, useEffect } from "react"
import { 
  Store, Globe, CreditCard, Truck, Bell, Shield, Palette, Database, Mail,
  Settings, Save, TestTube, Check, X, Loader2, Eye, Edit, Trash2, Plus,
  Send, FileText, RefreshCw, AlertTriangle, CheckCircle, BarChart3, TrendingUp
} from "lucide-react"

interface EmailStats {
  today: {
    date: string
    sent: number
    remaining: number
    limit: number
    percentage: number
    byType: Record<string, number>
  }
  weekly: {
    total: number
    average: number
    peak: number
  }
  status: 'healthy' | 'warning' | 'critical'
}

interface EmailSettings {
  provider: 'brevo' | 'smtp' | 'none'
  brevoApiKey: string
  brevoSenderId: string
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPass: string
  smtpSecure: boolean
  fromEmail: string
  fromName: string
  replyTo: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
  type: 'welcome' | 'order_confirm' | 'order_shipped' | 'password_reset' | 'contact' | 'newsletter'
  isActive: boolean
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome',
    subject: 'Welcome to {{store_name}}!',
    body: `<h1>Welcome, {{first_name}}!</h1>
<p>Thank you for registering at <strong>{{store_name}}</strong>.</p>
<p>Now you can:</p>
<ul>
  <li>Track your orders</li>
  <li>Save favorite products</li>
  <li>Receive exclusive offers</li>
</ul>
<p><a href="{{store_url}}/account" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Visit Your Account</a></p>
<p>Best regards,<br>The {{store_name}} Team</p>`,
    variables: ['first_name', 'last_name', 'email', 'store_name', 'store_url'],
    type: 'welcome',
    isActive: true
  },
  {
    id: 'order_confirm',
    name: 'Order Confirmation',
    subject: 'Order #{{order_number}} has been placed',
    body: `<h1>Thank you for your order!</h1>
<p>Dear {{first_name}},</p>
<p>Your order <strong>#{{order_number}}</strong> has been placed successfully.</p>
<h3>Order details:</h3>
<p>Total: <strong>{{order_total}} RON</strong></p>
<p>Status: {{order_status}}</p>
<p><a href="{{store_url}}/account/orders/{{order_id}}" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Order</a></p>`,
    variables: ['first_name', 'order_number', 'order_id', 'order_total', 'order_status', 'store_name', 'store_url'],
    type: 'order_confirm',
    isActive: true
  },
  {
    id: 'order_shipped',
    name: 'Order Shipped',
    subject: 'Order #{{order_number}} has been shipped!',
    body: `<h1>Your order is on the way! 📦</h1>
<p>Dear {{first_name}},</p>
<p>Order <strong>#{{order_number}}</strong> has been shipped.</p>
<h3>Package tracking:</h3>
<p>Courier: {{courier_name}}</p>
<p>AWB: <a href="{{tracking_url}}">{{tracking_number}}</a></p>
<p>Estimated delivery: {{estimated_delivery}}</p>`,
    variables: ['first_name', 'order_number', 'courier_name', 'tracking_number', 'tracking_url', 'estimated_delivery'],
    type: 'order_shipped',
    isActive: true
  },
  {
    id: 'password_reset',
    name: 'Password Reset',
    subject: 'Reset your password',
    body: `<h1>Password Reset</h1>
<p>You requested a password reset for your account at {{store_name}}.</p>
<p><a href="{{reset_url}}" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Reset Password</a></p>
<p>If you did not request this, please ignore this email.</p>
<p>The link expires in 24 hours.</p>`,
    variables: ['reset_url', 'store_name', 'email'],
    type: 'password_reset',
    isActive: true
  },
  {
    id: 'contact',
    name: 'Contact Message',
    subject: 'New message: {{subject}}',
    body: `<h2>New message from the website</h2>
<p><strong>From:</strong> {{name}} ({{email}})</p>
<p><strong>Phone:</strong> {{phone}}</p>
<p><strong>Subject:</strong> {{subject}}</p>
<hr>
<p>{{message}}</p>`,
    variables: ['name', 'email', 'phone', 'subject', 'message'],
    type: 'contact',
    isActive: true
  }
]

const tabs = [
  { id: 'brevo', label: 'Brevo / Email', icon: Mail },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'store', label: 'Store', icon: Store },
  { id: 'security', label: 'Security', icon: Shield },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('brevo')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null)
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    provider: 'brevo',
    brevoApiKey: '',
    brevoSenderId: '',
    smtpHost: 'smtp-relay.brevo.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    smtpSecure: true,
    fromEmail: 'noreply@YOUR_PNI_USERNAMEtrafic.ro',
    fromName: 'Demo Store',
    replyTo: 'contact@YOUR_PNI_USERNAMEtrafic.ro'
  })
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Fetch email stats
  const fetchEmailStats = async () => {
    setLoadingStats(true)
    try {
      const response = await fetch('/app/api/email/stats?includeBrevo=true')
      if (response.ok) {
        const data = await response.json()
        setEmailStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch email stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('emailSettings')
    if (saved) {
      try {
        setEmailSettings(JSON.parse(saved))
      } catch (e) {}
    }
    const savedTemplates = localStorage.getItem('emailTemplates')
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates))
      } catch (e) {}
    }
    // Fetch email stats on mount
    fetchEmailStats()
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem('emailSettings', JSON.stringify(emailSettings))
      
      // Also save to server API
      await fetch('/app/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings)
      }).catch(() => {})
      
      alert('Settings saved successfully!')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const response = await fetch('/app/api/email/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings)
      })
      const data = await response.json()
      setTestResult({ success: data.success, message: data.message || (data.success ? 'Connection successful!' : 'Connection failed') })
    } catch (error: any) {
      setTestResult({ success: false, message: error.message })
    } finally {
      setTesting(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert('Enter an email address for testing')
      return
    }
    setSendingTest(true)
    try {
      const response = await fetch('/app/api/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...emailSettings, to: testEmail })
      })
      const data = await response.json()
      alert(data.success ? 'Test email sent!' : `Error: ${data.message}`)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSendingTest(false)
    }
  }

  const saveTemplate = (template: EmailTemplate) => {
    const updated = templates.map(t => t.id === template.id ? template : t)
    setTemplates(updated)
    localStorage.setItem('emailTemplates', JSON.stringify(updated))
    setShowTemplateModal(false)
    setEditingTemplate(null)
    alert('Template saved!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Email, store, and preferences configuration</p>
        </div>
        
        {/* Tabs */}
        <div className="px-6 flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Brevo / Email Tab */}
        {activeTab === 'brevo' && (
          <div className="max-w-4xl space-y-6">
            {/* Email Usage Stats */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Email Usage - Brevo (300/day)
                </h2>
                <button 
                  onClick={fetchEmailStats}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  disabled={loadingStats}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {emailStats ? (
                <>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-3xl font-bold">{emailStats.today.sent}</div>
                      <div className="text-white/80 text-sm">Sent today</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-3xl font-bold">{emailStats.today.remaining}</div>
                      <div className="text-white/80 text-sm">Available</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-3xl font-bold">{emailStats.weekly?.average || 0}</div>
                      <div className="text-white/80 text-sm">Avg/day (7 days)</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-3xl font-bold">{emailStats.weekly?.peak || 0}</div>
                      <div className="text-white/80 text-sm">Weekly peak</div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="bg-white/20 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        emailStats.today.percentage > 80 ? 'bg-red-400' :
                        emailStats.today.percentage > 50 ? 'bg-yellow-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${emailStats.today.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>{emailStats.today.percentage}% used</span>
                    <span className={`flex items-center gap-1 ${
                      emailStats.status === 'healthy' ? 'text-green-300' :
                      emailStats.status === 'warning' ? 'text-yellow-300' : 'text-red-300'
                    }`}>
                      {emailStats.status === 'healthy' && <CheckCircle className="w-4 h-4" />}
                      {emailStats.status === 'warning' && <AlertTriangle className="w-4 h-4" />}
                      {emailStats.status === 'critical' && <AlertTriangle className="w-4 h-4" />}
                      {emailStats.status === 'healthy' ? 'Healthy' : 
                       emailStats.status === 'warning' ? 'Near limit' : 'Critical'}
                    </span>
                  </div>
                  
                  {/* Per-type breakdown */}
                  {Object.keys(emailStats.today.byType || {}).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="text-sm font-medium mb-2">Breakdown by type:</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(emailStats.today.byType).map(([type, count]) => (
                          <span key={type} className="bg-white/20 px-3 py-1 rounded-full text-sm">
                            {type}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-white/60">
                  {loadingStats ? 'Loading...' : 'Could not load statistics'}
                </div>
              )}
            </div>

            {/* Provider Selection */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Email Provider</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'brevo', name: 'Brevo (Sendinblue)', desc: 'API + SMTP included' },
                  { id: 'smtp', name: 'SMTP Custom', desc: 'Custom server' },
                  { id: 'none', name: 'Disabled', desc: 'No email' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setEmailSettings({ ...emailSettings, provider: p.id as any })}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      emailSettings.provider === p.id 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-500">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Brevo API Settings */}
            {emailSettings.provider === 'brevo' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Brevo Configuration</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={emailSettings.brevoApiKey}
                      onChange={(e) => setEmailSettings({ ...emailSettings, brevoApiKey: e.target.value })}
                      placeholder="xkeysib-..."
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get it from <a href="https://app.brevo.com/settings/keys/api" target="_blank" className="text-blue-600 hover:underline">Brevo Dashboard → API Keys</a>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID (optional)</label>
                    <input
                      type="text"
                      value={emailSettings.brevoSenderId}
                      onChange={(e) => setEmailSettings({ ...emailSettings, brevoSenderId: e.target.value })}
                      placeholder="Demo Store"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SMTP Settings */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">
                {emailSettings.provider === 'brevo' ? 'SMTP (Brevo Relay)' : 'SMTP Configuration'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                    placeholder="smtp-relay.brevo.com"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                  <input
                    type="text"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                    placeholder="587"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username / Login</label>
                  <input
                    type="text"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                    placeholder="your-email@domain.com"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password / Key</label>
                  <input
                    type="password"
                    value={emailSettings.smtpPass}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPass: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={emailSettings.smtpSecure}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpSecure: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Use TLS/SSL</span>
                </label>
              </div>
            </div>

            {/* From Settings */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Sender Settings</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Email</label>
                  <input
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                    placeholder="noreply@store.com"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
                  <input
                    type="text"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                    placeholder="Online Store"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reply To</label>
                  <input
                    type="email"
                    value={emailSettings.replyTo}
                    onChange={(e) => setEmailSettings({ ...emailSettings, replyTo: e.target.value })}
                    placeholder="contact@store.com"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Test & Save */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Connection Test</h2>
              <div className="flex items-center gap-4">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="email@test.com"
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={testConnection}
                  disabled={testing}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                  Test Connection
                </button>
                <button
                  onClick={sendTestEmail}
                  disabled={sendingTest || !testEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Test
                </button>
              </div>
              {testResult && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {testResult.success ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  {testResult.message}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="max-w-4xl space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Email Templates</h2>
            </div>
            
            <div className="grid gap-4">
              {templates.map(template => (
                <div key={template.id} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-gray-500">Subject: {template.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingTemplate(template); setShowTemplateModal(true) }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const updated = templates.map(t => t.id === template.id ? { ...t, isActive: !t.isActive } : t)
                          setTemplates(updated)
                          localStorage.setItem('emailTemplates', JSON.stringify(updated))
                        }}
                        className={`p-2 rounded-lg ${template.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      >
                        {template.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Variables: {template.variables.map(v => `{{${v}}}`).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Store Tab */}
        {activeTab === 'store' && (
          <div className="max-w-4xl">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Store Information</h2>
              <p className="text-gray-500">Store settings - under development</p>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="max-w-4xl">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Security</h2>
              <p className="text-gray-500">Security settings - under development</p>
            </div>
          </div>
        )}
      </div>

      {/* Template Edit Modal */}
      {showTemplateModal && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit: {editingTemplate.name}</h2>
              <button onClick={() => { setShowTemplateModal(false); setEditingTemplate(null) }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                  <input
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Content (HTML)</label>
                  <textarea
                    value={editingTemplate.body}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                    rows={15}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  <strong>Available variables:</strong> {editingTemplate.variables.map(v => `{{${v}}}`).join(', ')}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => { setShowTemplateModal(false); setEditingTemplate(null) }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button onClick={() => saveTemplate(editingTemplate)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Save className="w-4 h-4" />
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
