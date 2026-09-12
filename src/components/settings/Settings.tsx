import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Shield, Bell, Users, Key, Globe, Database, Server, Lock, Eye, Cpu, HardDrive, RefreshCw, Download, Trash2, Plus, Copy, EyeOff, CheckCircle, XCircle, Edit, Save, X } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { api } from '@/services/api'

interface UserEntry {
  id: number
  name: string
  email: string
  role: string
  status: string
  lastLogin: string
  mfa: boolean
}

interface Role {
  id: string
  name: string
  permissions: string
  users: number
}

interface ApiKey {
  id: number
  name: string
  key: string
  created: string
  lastUsed: string
  status: string
  scopes: string[]
}

interface Webhook {
  id: number
  name: string
  url: string
  events: string[]
  status: string
}

interface StorageItem {
  category: string
  size: string
  percentage: number
  retention: string
  trend: string
}

const tabs = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'api', label: 'API & Keys', icon: Key },
  { id: 'agent', label: 'Agent', icon: Cpu },
  { id: 'storage', label: 'Storage', icon: Database },
  { id: 'compliance', label: 'Compliance', icon: Lock },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [showCreateWebhook, setShowCreateWebhook] = useState(false)
  const [editingUser, setEditingUser] = useState<number | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<number[]>([])
  const [users, setUsers] = useState<UserEntry[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [storageUsage, setStorageUsage] = useState<StorageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notificationSettings, setNotificationSettings] = useState({
    email: { enabled: true, smtp: 'smtp.office365.com', port: '587', username: 'alerts@blacksentinel.io', password: '********', from: 'BlackSentinel Guardian <alerts@blacksentinel.io>' },
    slack: { enabled: true, webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx', channel: '#security-alerts', username: 'Guardian Bot' },
    teams: { enabled: true, webhookUrl: 'https://outlook.office.com/webhook/xxx', channelName: 'Security Alerts' },
    webhook: { enabled: false, url: '', method: 'POST', headers: '{}' },
    pagerduty: { enabled: false, integrationKey: '', serviceId: '' },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, rolesRes, keysRes, webhooksRes, storageRes] = await Promise.all([
          api.request<UserEntry[]>('/api/settings/users').catch(() => []),
          api.request<Role[]>('/api/settings/roles').catch(() => []),
          api.request<ApiKey[]>('/api/settings/api-keys').catch(() => []),
          api.request<Webhook[]>('/api/settings/webhooks').catch(() => []),
          api.request<StorageItem[]>('/api/settings/storage').catch(() => []),
        ])
        setUsers(usersRes)
        setRoles(rolesRes)
        setApiKeys(keysRes)
        setWebhooks(webhooksRes)
        setStorageUsage(storageRes)
      } catch {
        setUsers([])
        setRoles([])
        setApiKeys([])
        setWebhooks([])
        setStorageUsage([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const toggleKeyVisibility = (id: number) => {
    setVisibleKeys(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id])
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bs-white">Settings</h1>
        <p className="text-sm text-bs-gray-mid mt-0.5">Platform configuration and administration</p>
      </div>

      <div className="flex gap-6">
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id ? 'bg-bs-orange/10 text-bs-orange' : 'text-bs-gray-light hover:bg-bs-gray-dark'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="bs-card p-6">
                <h3 className="text-sm font-semibold text-bs-white mb-4">General Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Organization Name</label>
                    <input type="text" defaultValue="BlackSentinel Corp" className="bs-input text-sm w-full" />
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Time Zone</label>
                    <select className="bs-input text-sm w-full"><option>UTC</option><option>America/New_York</option><option>Europe/London</option><option>America/Mexico_City</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Data Retention (days)</label>
                    <input type="number" defaultValue="90" className="bs-input text-sm w-full" />
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Default Language</label>
                    <select className="bs-input text-sm w-full"><option>English</option><option>Spanish</option><option>Portuguese</option><option>French</option><option>German</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Date Format</label>
                    <select className="bs-input text-sm w-full"><option>YYYY-MM-DD</option><option>MM/DD/YYYY</option><option>DD/MM/YYYY</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Session Timeout (minutes)</label>
                    <input type="number" defaultValue="30" className="bs-input text-sm w-full" />
                  </div>
                </div>
                <button className="bs-btn-primary text-xs mt-4">Save Changes</button>
              </div>

              <div className="bs-card p-6">
                <h3 className="text-sm font-semibold text-bs-white mb-4">AI Engine Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Detection Sensitivity</label>
                    <select className="bs-input text-sm w-full"><option>High</option><option>Medium</option><option>Low</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Auto-Remediation</label>
                    <select className="bs-input text-sm w-full"><option>Enabled (Critical only)</option><option>Enabled (All severities)</option><option>Disabled</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Behavioral Baseline Period</label>
                    <select className="bs-input text-sm w-full"><option>7 days</option><option>14 days</option><option>30 days</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">ML Model Version</label>
                    <div className="flex items-center gap-2"><span className="bs-input text-sm flex-1">v3.2.1-stable</span><button className="bs-btn-secondary text-xs">Update</button></div>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Real-time Analysis</label>
                    <select className="bs-input text-sm w-full"><option>Enabled</option><option>Disabled</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Telemetry Collection</label>
                    <select className="bs-input text-sm w-full"><option>Full Telemetry</option><option>Security Events Only</option><option>Minimal</option></select>
                  </div>
                </div>
                <button className="bs-btn-primary text-xs mt-4">Save Changes</button>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bs-card p-6">
                <h3 className="text-sm font-semibold text-bs-white mb-4">Security Policies</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Zero Trust Mode', description: 'Enforce zero trust for all endpoint communications', enabled: true },
                    { label: 'MFA Required', description: 'Require multi-factor authentication for all users', enabled: true },
                    { label: 'SSO Integration', description: 'Enable Single Sign-On via SAML 2.0', enabled: true },
                    { label: 'Agent Tamper Protection', description: 'Prevent unauthorized agent modification', enabled: true },
                    { label: 'Encrypted Communication', description: 'End-to-end encryption for all data in transit', enabled: true },
                    { label: 'Immutable Audit Log', description: 'Prevent audit log modification or deletion', enabled: true },
                    { label: 'Certificate Pinning', description: 'Pin certificates for agent-backend communication', enabled: true },
                    { label: 'IP Allowlisting', description: 'Restrict API access to approved IP addresses', enabled: false },
                    { label: 'Session Recording', description: 'Record all administrative sessions for audit', enabled: false },
                  ].map((policy, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bs-gray-dark/30">
                      <div>
                        <p className="text-sm text-bs-white">{policy.label}</p>
                        <p className="text-[10px] text-bs-gray-mid">{policy.description}</p>
                      </div>
                      <div className={cn('w-10 h-5 rounded-full transition-colors cursor-pointer relative', policy.enabled ? 'bg-bs-green' : 'bg-bs-gray-mid')}>
                        <div className={cn('w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all', policy.enabled ? 'left-5.5' : 'left-0.5')} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Email Configuration Modal */}
              {showCreateUser && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowCreateUser(false)}>
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()} className="bg-bs-surface-elevated border border-bs-border rounded-2xl w-full max-w-lg shadow-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-bs-border">
                      <h3 className="text-sm font-semibold text-bs-white">Configure Email Notifications</h3>
                      <button onClick={() => setShowCreateUser(false)} className="p-1 rounded-lg hover:bg-bs-gray-dark"><X className="w-4 h-4 text-bs-gray-mid" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">SMTP Server</label>
                        <input type="text" defaultValue="smtp.office365.com" className="bs-input text-sm w-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Port</label>
                          <input type="text" defaultValue="587" className="bs-input text-sm w-full" />
                        </div>
                        <div>
                          <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Encryption</label>
                          <select className="bs-input text-sm w-full"><option>STARTTLS</option><option>SSL/TLS</option><option>None</option></select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Username</label>
                        <input type="text" defaultValue="alerts@blacksentinel.io" className="bs-input text-sm w-full" />
                      </div>
                      <div>
                        <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Password</label>
                        <input type="password" defaultValue="password123" className="bs-input text-sm w-full" />
                      </div>
                      <div>
                        <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">From Address</label>
                        <input type="text" defaultValue="BlackSentinel Guardian <alerts@blacksentinel.io>" className="bs-input text-sm w-full" />
                      </div>
                      <div>
                        <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Recipients (comma separated)</label>
                        <input type="text" defaultValue="soc@corp.com, admin@corp.com, ciso@corp.com" className="bs-input text-sm w-full" />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowCreateUser(false)} className="bs-btn-secondary text-xs">Cancel</button>
                        <button className="bs-btn-primary text-xs">Test & Save</button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              <div className="bs-card p-6">
                <h3 className="text-sm font-semibold text-bs-white mb-4">Notification Channels</h3>
                <div className="space-y-3">
                  {/* Email */}
                  <div className="p-4 rounded-lg bg-bs-gray-dark/30 border border-bs-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-bs-green" />
                        <div>
                          <p className="text-sm font-medium text-bs-white">Email (SMTP)</p>
                          <p className="text-[10px] text-bs-gray-mid">smtp.office365.com:587 | 3 recipients</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowCreateUser(true)} className="text-xs px-3 py-1.5 rounded-lg bg-bs-gray-dark text-bs-gray-light hover:bg-bs-gray-mid transition-colors">Configure</button>
                        <button className="text-xs px-3 py-1.5 rounded-lg bg-bs-orange text-white hover:bg-bs-orange-bright transition-colors">Test</button>
                      </div>
                    </div>
                  </div>

                  {/* Slack */}
                  <div className="p-4 rounded-lg bg-bs-gray-dark/30 border border-bs-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-bs-green" />
                        <div>
                          <p className="text-sm font-medium text-bs-white">Slack</p>
                          <p className="text-[10px] text-bs-gray-mid">Channel: #security-alerts | Bot: Guardian Bot</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowCreateUser(true)} className="text-xs px-3 py-1.5 rounded-lg bg-bs-gray-dark text-bs-gray-light hover:bg-bs-gray-mid transition-colors">Configure</button>
                        <button className="text-xs px-3 py-1.5 rounded-lg bg-bs-orange text-white hover:bg-bs-orange-bright transition-colors">Test</button>
                      </div>
                    </div>
                  </div>

                  {/* Microsoft Teams */}
                  <div className="p-4 rounded-lg bg-bs-gray-dark/30 border border-bs-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-bs-green" />
                        <div>
                          <p className="text-sm font-medium text-bs-white">Microsoft Teams</p>
                          <p className="text-[10px] text-bs-gray-mid">Channel: Security Alerts | Webhook active</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowCreateUser(true)} className="text-xs px-3 py-1.5 rounded-lg bg-bs-gray-dark text-bs-gray-light hover:bg-bs-gray-mid transition-colors">Configure</button>
                        <button className="text-xs px-3 py-1.5 rounded-lg bg-bs-orange text-white hover:bg-bs-orange-bright transition-colors">Test</button>
                      </div>
                    </div>
                  </div>

                  {/* Webhook */}
                  <div className="p-4 rounded-lg bg-bs-gray-dark/30 border border-bs-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-bs-gray-mid" />
                        <div>
                          <p className="text-sm font-medium text-bs-white">Custom Webhook</p>
                          <p className="text-[10px] text-bs-gray-mid">Not configured</p>
                        </div>
                      </div>
                      <button onClick={() => setShowCreateUser(true)} className="text-xs px-3 py-1.5 rounded-lg bg-bs-orange text-white hover:bg-bs-orange-bright transition-colors">Setup</button>
                    </div>
                  </div>

                  {/* PagerDuty */}
                  <div className="p-4 rounded-lg bg-bs-gray-dark/30 border border-bs-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-bs-gray-mid" />
                        <div>
                          <p className="text-sm font-medium text-bs-white">PagerDuty</p>
                          <p className="text-[10px] text-bs-gray-mid">Not configured</p>
                        </div>
                      </div>
                      <button onClick={() => setShowCreateUser(true)} className="text-xs px-3 py-1.5 rounded-lg bg-bs-orange text-white hover:bg-bs-orange-bright transition-colors">Setup</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bs-card p-6">
                <h3 className="text-sm font-semibold text-bs-white mb-4">Alert Rules</h3>
                <div className="space-y-2">
                  {[
                    { rule: 'Critical threats', notify: 'Email + Slack + Teams + PagerDuty', enabled: true },
                    { rule: 'High severity alerts', notify: 'Email + Slack', enabled: true },
                    { rule: 'Agent offline > 5 min', notify: 'Email', enabled: true },
                    { rule: 'New vulnerability detected', notify: 'Slack', enabled: false },
                    { rule: 'USB device connected', notify: 'Email', enabled: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bs-gray-dark/30">
                      <div>
                        <p className="text-sm text-bs-white">{item.rule}</p>
                        <p className="text-[10px] text-bs-gray-mid">{item.notify}</p>
                      </div>
                      <div className={cn('w-10 h-5 rounded-full transition-colors cursor-pointer relative', item.enabled ? 'bg-bs-green' : 'bg-bs-gray-mid')}>
                        <div className={cn('w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all', item.enabled ? 'left-5.5' : 'left-0.5')} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USERS & ROLES TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {showCreateUser && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowCreateUser(false)}>
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()} className="bg-bs-surface-elevated border border-bs-border rounded-2xl w-full max-w-lg shadow-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-bs-border">
                      <h3 className="text-sm font-semibold text-bs-white">Create New User</h3>
                      <button onClick={() => setShowCreateUser(false)} className="p-1 rounded-lg hover:bg-bs-gray-dark"><X className="w-4 h-4 text-bs-gray-mid" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Full Name</label>
                          <input type="text" placeholder="John Doe" className="bs-input text-sm w-full" />
                        </div>
                        <div>
                          <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Email</label>
                          <input type="email" placeholder="john@corp.com" className="bs-input text-sm w-full" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Role</label>
                          <select className="bs-input text-sm w-full"><option value="analyst">Security Analyst</option><option value="admin">Administrator</option><option value="viewer">Read-Only Viewer</option></select>
                        </div>
                        <div>
                          <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Department</label>
                          <select className="bs-input text-sm w-full"><option>Security</option><option>IT</option><option>Engineering</option><option>Executive</option></select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Temporary Password</label>
                        <input type="password" placeholder="Minimum 12 characters" className="bs-input text-sm w-full" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="forceMfa" className="rounded" defaultChecked />
                        <label htmlFor="forceMfa" className="text-xs text-bs-gray-light">Require MFA on first login</label>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowCreateUser(false)} className="bs-btn-secondary text-xs">Cancel</button>
                        <button className="bs-btn-primary text-xs">Create User</button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-bs-white">Team Members</h3>
                <button onClick={() => setShowCreateUser(true)} className="bs-btn-primary text-xs flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Add User</button>
              </div>

              <div className="bs-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-bs-border">
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">User</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Role</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">MFA</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Last Login</th>
                      <th className="w-20 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-bs-border/50 hover:bg-bs-gray-dark/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-bs-gray-dark flex items-center justify-center">
                              <span className="text-xs font-medium text-bs-white">{user.name.split(' ').map(n => n[0]).join('')}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-bs-white">{user.name}</p>
                              <p className="text-[10px] text-bs-gray-mid">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('bs-badge text-[10px]', user.role === 'admin' ? 'bs-badge-danger' : user.role === 'analyst' ? 'bs-badge-info' : 'bs-badge-success')}>{user.role}</span>
                        </td>
                        <td className="px-4 py-3"><span className={cn('w-2 h-2 rounded-full inline-block', user.status === 'active' ? 'bg-bs-green' : 'bg-bs-gray-mid')} /></td>
                        <td className="px-4 py-3"><span className={cn('text-[10px]', user.mfa ? 'text-bs-green' : 'text-bs-red')}>{user.mfa ? 'Enabled' : 'Disabled'}</span></td>
                        <td className="px-4 py-3 text-[10px] text-bs-gray-mid">{user.lastLogin}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button className="p-1 rounded hover:bg-bs-gray-dark"><Edit className="w-3.5 h-3.5 text-bs-gray-mid" /></button>
                            <button className="p-1 rounded hover:bg-bs-gray-dark"><Trash2 className="w-3.5 h-3.5 text-bs-gray-mid" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bs-card p-6">
                <h3 className="text-sm font-semibold text-bs-white mb-4">Roles & Permissions</h3>
                <div className="space-y-3">
                  {roles.map(role => (
                    <div key={role.id} className="p-4 rounded-lg bg-bs-gray-dark/30 border border-bs-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <span className={cn('bs-badge text-[10px]', role.id === 'admin' ? 'bs-badge-danger' : role.id === 'analyst' ? 'bs-badge-info' : 'bs-badge-success')}>{role.id}</span>
                          <span className="text-sm font-medium text-bs-white">{role.name}</span>
                        </div>
                        <span className="text-[10px] text-bs-gray-mid">{role.users} users</span>
                      </div>
                      <p className="text-xs text-bs-gray-mid">{role.permissions}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* API & KEYS TAB */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              {showCreateKey && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowCreateKey(false)}>
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()} className="bg-bs-surface-elevated border border-bs-border rounded-2xl w-full max-w-lg shadow-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-bs-border">
                      <h3 className="text-sm font-semibold text-bs-white">Generate New API Key</h3>
                      <button onClick={() => setShowCreateKey(false)} className="p-1 rounded-lg hover:bg-bs-gray-dark"><X className="w-4 h-4 text-bs-gray-mid" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Key Name</label>
                        <input type="text" placeholder="e.g., Production Integration" className="bs-input text-sm w-full" />
                      </div>
                      <div>
                        <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Description</label>
                        <input type="text" placeholder="What is this key used for?" className="bs-input text-sm w-full" />
                      </div>
                      <div>
                        <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Scopes</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {['read', 'write', 'admin', 'endpoints', 'threats', 'alerts', 'settings'].map(scope => (
                            <label key={scope} className="flex items-center gap-1.5 text-xs text-bs-gray-light">
                              <input type="checkbox" defaultChecked={scope === 'read'} className="rounded" />
                              {scope}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Expiration</label>
                        <select className="bs-input text-sm w-full"><option>Never</option><option>30 days</option><option>90 days</option><option>1 year</option></select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowCreateKey(false)} className="bs-btn-secondary text-xs">Cancel</button>
                        <button className="bs-btn-primary text-xs">Generate Key</button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-bs-white">API Keys</h3>
                <button onClick={() => setShowCreateKey(true)} className="bs-btn-primary text-xs flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Generate Key</button>
              </div>

              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div key={key.id} className={cn('bs-card p-4', key.status === 'revoked' && 'opacity-50')}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-bs-orange" />
                        <span className="text-sm font-medium text-bs-white">{key.name}</span>
                        <span className={cn('bs-badge text-[10px]', key.status === 'active' ? 'bs-badge-success' : 'bs-badge-danger')}>{key.status}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => toggleKeyVisibility(key.id)} className="p-1 rounded hover:bg-bs-gray-dark">
                          {visibleKeys.includes(key.id) ? <EyeOff className="w-3.5 h-3.5 text-bs-gray-mid" /> : <Eye className="w-3.5 h-3.5 text-bs-gray-mid" />}
                        </button>
                        <button className="p-1 rounded hover:bg-bs-gray-dark"><Copy className="w-3.5 h-3.5 text-bs-gray-mid" /></button>
                        <button className="p-1 rounded hover:bg-bs-gray-dark"><Trash2 className="w-3.5 h-3.5 text-bs-red" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-bs-gray-mid">
                      <span className="font-mono">{visibleKeys.includes(key.id) ? key.key : key.key.replace(/[*]{4}/g, '****')}</span>
                      <span>Scopes: {key.scopes.join(', ')}</span>
                      <span>Created: {key.created}</span>
                      <span>Last used: {key.lastUsed}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bs-card p-6">
                <h3 className="text-sm font-semibold text-bs-white mb-4">Webhooks</h3>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-bs-gray-mid">Outbound webhook integrations</p>
                  <button onClick={() => setShowCreateWebhook(true)} className="bs-btn-secondary text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Add Webhook</button>
                </div>
                <div className="space-y-2">
                  {webhooks.map(wh => (
                    <div key={wh.id} className="flex items-center justify-between p-3 rounded-lg bg-bs-gray-dark/30">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-2 h-2 rounded-full', wh.status === 'active' ? 'bg-bs-green' : 'bg-bs-yellow')} />
                        <div>
                          <p className="text-xs font-medium text-bs-white">{wh.name}</p>
                          <p className="text-[10px] text-bs-gray-mid font-mono truncate max-w-md">{wh.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-bs-gray-mid">{wh.events.join(', ')}</span>
                        <button className="bs-btn-secondary text-[10px] py-1">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bs-card p-6">
                <h3 className="text-sm font-semibold text-bs-white mb-4">Rate Limiting</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Requests per minute</label>
                    <input type="number" defaultValue="1000" className="bs-input text-sm w-full" />
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Burst limit</label>
                    <input type="number" defaultValue="5000" className="bs-input text-sm w-full" />
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Window (seconds)</label>
                    <input type="number" defaultValue="60" className="bs-input text-sm w-full" />
                  </div>
                </div>
                <button className="bs-btn-primary text-xs mt-4">Save Rate Limits</button>
              </div>
            </div>
          )}

          {/* AGENT TAB */}
          {activeTab === 'agent' && (
            <div className="space-y-6">
              <div className="bs-card p-6">
                <h3 className="text-sm font-semibold text-bs-white mb-4">Agent Management</h3>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="p-4 rounded-lg bg-bs-gray-dark/30"><p className="text-2xl font-bold text-bs-white">3.2.1</p><p className="text-xs text-bs-gray-mid">Latest Version</p></div>
                  <div className="p-4 rounded-lg bg-bs-gray-dark/30"><p className="text-2xl font-bold text-bs-green">6</p><p className="text-xs text-bs-gray-mid">Updated Agents</p></div>
                  <div className="p-4 rounded-lg bg-bs-gray-dark/30"><p className="text-2xl font-bold text-bs-yellow">2</p><p className="text-xs text-bs-gray-mid">Outdated Agents</p></div>
                  <div className="p-4 rounded-lg bg-bs-gray-dark/30"><p className="text-2xl font-bold text-bs-red">1</p><p className="text-xs text-bs-gray-mid">Offline Agents</p></div>
                </div>
                <div className="flex gap-2">
                  <button className="bs-btn-primary text-xs flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Force Update All</button>
                  <button className="bs-btn-secondary text-xs flex items-center gap-2"><Download className="w-3.5 h-3.5" /> Download Agent (Windows)</button>
                  <button className="bs-btn-secondary text-xs flex items-center gap-2"><Download className="w-3.5 h-3.5" /> Download Agent (Linux)</button>
                  <button className="bs-btn-secondary text-xs flex items-center gap-2"><Download className="w-3.5 h-3.5" /> Download Agent (macOS)</button>
                </div>
              </div>

              <div className="bs-card p-6">
                <h3 className="text-sm font-semibold text-bs-white mb-4">Agent Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Heartbeat Interval (seconds)</label>
                    <input type="number" defaultValue="30" className="bs-input text-sm w-full" />
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Scan Schedule</label>
                    <select className="bs-input text-sm w-full"><option>Every 4 hours</option><option>Every hour</option><option>Every 6 hours</option><option>Daily</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Log Level</label>
                    <select className="bs-input text-sm w-full"><option>Info</option><option>Debug</option><option>Warning</option><option>Error</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Max CPU Usage (%)</label>
                    <input type="number" defaultValue="25" className="bs-input text-sm w-full" />
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Max Memory Usage (MB)</label>
                    <input type="number" defaultValue="512" className="bs-input text-sm w-full" />
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Offline Cache Size (MB)</label>
                    <input type="number" defaultValue="100" className="bs-input text-sm w-full" />
                  </div>
                </div>
                <button className="bs-btn-primary text-xs mt-4">Save Agent Config</button>
              </div>
            </div>
          )}

          {/* STORAGE TAB */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div className="bs-card p-6">
                <h3 className="text-sm font-semibold text-bs-white mb-4">Storage Overview</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-bs-gray-dark/30">
                    <p className="text-2xl font-bold text-bs-white">4.2 TB</p>
                    <p className="text-xs text-bs-gray-mid">Total Used</p>
                  </div>
                  <div className="p-4 rounded-lg bg-bs-gray-dark/30">
                    <p className="text-2xl font-bold text-bs-orange">5.8 TB</p>
                    <p className="text-xs text-bs-gray-mid">Available</p>
                  </div>
                  <div className="p-4 rounded-lg bg-bs-gray-dark/30">
                    <p className="text-2xl font-bold text-bs-green">10 TB</p>
                    <p className="text-xs text-bs-gray-mid">Total Capacity</p>
                  </div>
                </div>

                <div className="w-full h-4 bg-bs-gray-dark rounded-full overflow-hidden mb-6">
                  <div className="h-full flex">
                    <div className="bg-bs-orange h-full" style={{ width: '48%' }} />
                    <div className="bg-bs-blue h-full" style={{ width: '3%' }} />
                    <div className="bg-bs-green h-full" style={{ width: '2%' }} />
                    <div className="bg-purple-500 h-full" style={{ width: '7%' }} />
                    <div className="bg-bs-yellow h-full" style={{ width: '1%' }} />
                    <div className="bg-cyan-500 h-full" style={{ width: '24%' }} />
                  </div>
                </div>

                <div className="space-y-3">
                  {storageUsage.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-bs-gray-dark/30">
                      <div className="w-32">
                        <p className="text-xs font-medium text-bs-white">{item.category}</p>
                      </div>
                      <div className="flex-1">
                        <div className="w-full h-2 bg-bs-gray-dark rounded-full overflow-hidden">
                          <div className="h-full bg-bs-orange rounded-full" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                      <div className="w-20 text-right">
                        <p className="text-xs font-medium text-bs-white">{item.size}</p>
                      </div>
                      <div className="w-16 text-right">
                        <p className="text-[10px] text-bs-gray-mid">{item.percentage}%</p>
                      </div>
                      <div className="w-32 text-right">
                        <p className="text-[10px] text-bs-gray-mid">Retention: {item.retention}</p>
                      </div>
                      <div className="w-24 text-right">
                        <p className="text-[10px] text-bs-gray-mid">{item.trend}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bs-card p-6">
                <h3 className="text-sm font-semibold text-bs-white mb-4">Retention Policies</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Telemetry Data Retention</label>
                    <select className="bs-input text-sm w-full"><option>90 days</option><option>30 days</option><option>180 days</option><option>365 days</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Threat Intelligence Retention</label>
                    <select className="bs-input text-sm w-full"><option>365 days</option><option>180 days</option><option>Unlimited</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Audit Log Retention</label>
                    <select className="bs-input text-sm w-full"><option>365 days</option><option>730 days</option><option>Unlimited</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Forensic Artifact Retention</label>
                    <select className="bs-input text-sm w-full"><option>180 days</option><option>365 days</option><option>Unlimited</option></select>
                  </div>
                </div>
                <button className="bs-btn-primary text-xs mt-4">Save Retention Policies</button>
              </div>

              <div className="bs-card p-6">
                <h3 className="text-sm font-semibold text-bs-white mb-4">Backup Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Backup Frequency</label>
                    <select className="bs-input text-sm w-full"><option>Daily</option><option>Every 6 hours</option><option>Weekly</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Backup Retention</label>
                    <select className="bs-input text-sm w-full"><option>30 days</option><option>60 days</option><option>90 days</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Backup Location</label>
                    <select className="bs-input text-sm w-full"><option>Local Storage</option><option>AWS S3</option><option>Azure Blob</option><option>Google Cloud Storage</option></select>
                  </div>
                  <div>
                    <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Encryption</label>
                    <select className="bs-input text-sm w-full"><option>AES-256</option><option>AES-128</option></select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="bs-btn-primary text-xs">Save Backup Config</button>
                  <button className="bs-btn-secondary text-xs">Run Backup Now</button>
                </div>
              </div>
            </div>
          )}

          {/* COMPLIANCE TAB */}
          {activeTab === 'compliance' && (
            <div className="bs-card p-6">
              <h3 className="text-sm font-semibold text-bs-white mb-4">Compliance Frameworks</h3>
              <div className="grid grid-cols-2 gap-3">
                {['SOC 2', 'ISO 27001', 'NIST CSF', 'HIPAA', 'PCI DSS', 'GDPR', 'CIS Controls', 'MITRE ATT&CK'].map((framework, i) => (
                  <div key={i} className="p-3 rounded-lg bg-bs-gray-dark/30 flex items-center justify-between">
                    <span className="text-sm text-bs-white">{framework}</span>
                    <span className="bs-badge-success text-[10px]">Mapped</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
