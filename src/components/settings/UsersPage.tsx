import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Search, Plus, Edit, Trash2, X, Loader2, Inbox,
  ShieldCheck, ShieldOff, UserCog, UserCheck,
} from 'lucide-react'
import { cn } from '@/utils/helpers'
import { api } from '@/services/api'
import { useToast } from '@/hooks'
import { usePermissions } from '@/hooks/usePermissions'
import PermissionGate from '@/components/ui/PermissionGate'
import { useAppStore } from '@/store'
import type { User, UserRole } from '@/types'

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  SOC_TIER_5: 'SOC Tier 5',
  SOC_TIER_4: 'SOC Tier 4',
  SOC_TIER_3: 'SOC Tier 3',
  SOC_TIER_2: 'SOC Tier 2',
  SOC_TIER_1: 'SOC Tier 1',
  AUDITOR_3: 'Auditor 3',
  AUDITOR_2: 'Auditor 2',
  AUDITOR_1: 'Auditor 1',
  IT: 'IT',
  ANALYST: 'Analyst',
  VIEWER: 'Viewer',
}

const ALL_ROLES = Object.keys(ROLE_LABELS) as UserRole[]

function roleBadgeClass(role: UserRole): string {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return 'bs-badge-danger'
  if (role.startsWith('SOC_TIER')) return 'bs-badge-info'
  if (role.startsWith('AUDITOR')) return 'bs-badge-warning'
  if (role === 'IT' || role === 'ANALYST') return 'bs-badge-success'
  return 'bs-badge'
}

interface UserFormState {
  name: string
  email: string
  password: string
  role: UserRole
}

const emptyForm: UserFormState = { name: '', email: '', password: '', role: 'ANALYST' }

export default function UsersPage() {
  const { addToast } = useToast()
  const { hasPermission } = usePermissions()
  const currentUser = useAppStore((s) => s.user)

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')

  const [showAddModal, setShowAddModal] = useState(false)
  const [createForm, setCreateForm] = useState<UserFormState>(emptyForm)
  const [creating, setCreating] = useState(false)

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'ANALYST' as UserRole })
  const [saving, setSaving] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.users.list()
      setUsers(data)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to load users', 'error')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { refresh() }, [refresh])

  const filteredUsers = users.filter((u) => {
    if (searchQuery && !u.name.toLowerCase().includes(searchQuery.toLowerCase()) && !u.email.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    return true
  })

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').length,
    mfaEnabled: users.filter((u) => u.mfaEnabled).length,
    mfaDisabled: users.filter((u) => !u.mfaEnabled).length,
  }

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      addToast('Name, email, and password are required', 'error')
      return
    }
    setCreating(true)
    try {
      await api.users.create(createForm)
      addToast('User created', 'success')
      setShowAddModal(false)
      setCreateForm(emptyForm)
      refresh()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create user', 'error')
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setEditForm({ name: user.name, email: user.email, role: user.role })
  }

  const handleUpdate = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      await api.users.update(editingUser.id, editForm)
      addToast('User updated', 'success')
      setEditingUser(null)
      refresh()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update user', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) return
    setDeletingId(user.id)
    try {
      await api.users.delete(user.id)
      addToast('User removed', 'success')
      refresh()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to remove user', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bs-white">Users</h1>
          <p className="text-sm text-bs-gray-mid mt-0.5">{users.length} accounts with platform access</p>
        </div>
        <PermissionGate permission="users:write">
          <button
            onClick={() => setShowAddModal(true)}
            className="bs-btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add User
          </button>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-blue/15 flex items-center justify-center"><Users className="w-5 h-5 text-bs-blue" /></div>
            <div><div className="text-xl font-bold text-bs-white">{stats.total}</div><div className="text-xs text-bs-gray-mid">Total Users</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-red/15 flex items-center justify-center"><UserCog className="w-5 h-5 text-bs-red" /></div>
            <div><div className="text-xl font-bold text-bs-white">{stats.admins}</div><div className="text-xs text-bs-gray-mid">Admins</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-green/15 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-bs-green" /></div>
            <div><div className="text-xl font-bold text-bs-white">{stats.mfaEnabled}</div><div className="text-xs text-bs-gray-mid">MFA Enabled</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-yellow/15 flex items-center justify-center"><ShieldOff className="w-5 h-5 text-bs-yellow" /></div>
            <div><div className="text-xl font-bold text-bs-white">{stats.mfaDisabled}</div><div className="text-xs text-bs-gray-mid">MFA Disabled</div></div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bs-gray-mid" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bs-input pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
          className="bs-input text-sm cursor-pointer"
        >
          <option value="all">All Roles</option>
          {ALL_ROLES.map((role) => (
            <option key={role} value={role}>{ROLE_LABELS[role]}</option>
          ))}
        </select>
      </div>

      <div className="bs-card overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-bs-gray-mid animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-bs-gray-dark flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7 text-bs-gray-mid" />
            </div>
            <h3 className="text-sm font-medium text-bs-white mb-1">No users found</h3>
            <p className="text-xs text-bs-gray-mid text-center max-w-sm">
              {users.length === 0 ? 'No user accounts exist yet.' : 'No users match your current filters. Try adjusting your search.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-bs-border">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">MFA</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Last Login</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Joined</th>
                <th className="w-20 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-bs-border/50 hover:bg-bs-gray-dark/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-bs-gray-dark flex items-center justify-center">
                        <span className="text-xs font-medium text-bs-white">{user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-bs-white flex items-center gap-1.5">
                          {user.name}
                          {user.id === currentUser?.id && <span className="bs-badge text-[10px]">You</span>}
                        </p>
                        <p className="text-[10px] text-bs-gray-mid">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px]', roleBadgeClass(user.role))}>{ROLE_LABELS[user.role]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('flex items-center gap-1 text-[10px]', user.mfaEnabled ? 'text-bs-green' : 'text-bs-red')}>
                      {user.mfaEnabled ? <UserCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                      {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-bs-gray-mid">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-bs-gray-mid">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <PermissionGate permission="users:write">
                        <button onClick={() => openEdit(user)} className="p-1 rounded hover:bg-bs-gray-dark" title="Edit user">
                          <Edit className="w-3.5 h-3.5 text-bs-gray-mid" />
                        </button>
                      </PermissionGate>
                      <PermissionGate permission="users:delete">
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={user.id === currentUser?.id || deletingId === user.id}
                          className="p-1 rounded hover:bg-bs-red/15 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={user.id === currentUser?.id ? 'Cannot delete your own account' : 'Delete user'}
                        >
                          {deletingId === user.id ? (
                            <Loader2 className="w-3.5 h-3.5 text-bs-gray-mid animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 text-bs-gray-mid hover:text-bs-red" />
                          )}
                        </button>
                      </PermissionGate>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowAddModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-bs-surface-elevated border border-bs-border rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-bs-border">
              <h3 className="text-sm font-semibold text-bs-white">Create New User</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-bs-gray-dark"><X className="w-4 h-4 text-bs-gray-mid" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Full Name</label>
                  <input type="text" placeholder="John Doe" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="bs-input text-sm w-full" />
                </div>
                <div>
                  <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Email</label>
                  <input type="email" placeholder="john@corp.com" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="bs-input text-sm w-full" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Role</label>
                <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })} className="bs-input text-sm w-full">
                  {ALL_ROLES.map((role) => (
                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Temporary Password</label>
                <input type="password" placeholder="Minimum 12 characters" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="bs-input text-sm w-full" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddModal(false)} className="bs-btn-secondary text-xs">Cancel</button>
                <button onClick={handleCreate} disabled={creating} className="bs-btn-primary text-xs disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setEditingUser(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-bs-surface-elevated border border-bs-border rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-bs-border">
              <h3 className="text-sm font-semibold text-bs-white">Edit User</h3>
              <button onClick={() => setEditingUser(null)} className="p-1 rounded-lg hover:bg-bs-gray-dark"><X className="w-4 h-4 text-bs-gray-mid" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Full Name</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bs-input text-sm w-full" />
                </div>
                <div>
                  <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="bs-input text-sm w-full" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                  disabled={!hasPermission('users:manage_roles') && editingUser.id !== currentUser?.id}
                  className="bs-input text-sm w-full disabled:opacity-50"
                >
                  {ALL_ROLES.map((role) => (
                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingUser(null)} className="bs-btn-secondary text-xs">Cancel</button>
                <button onClick={handleUpdate} disabled={saving} className="bs-btn-primary text-xs disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
