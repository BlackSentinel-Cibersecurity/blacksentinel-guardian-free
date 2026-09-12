import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Shield, Monitor, Clock, Bug, Brain, Swords,
  AlertTriangle, ShieldAlert, Usb, Network, Lock, Code,
  Settings, Link, ChevronLeft, ChevronRight, LogOut,
  Zap, X, UserPlus, Users, Download
} from 'lucide-react'
import { cn } from '@/utils/helpers'
import { usePermissions } from '@/hooks/usePermissions'
import type { UserRole } from '@/types'

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

interface NavItem {
  id: string
  label: string
  icon: typeof LayoutDashboard
  group: string
  minRole?: UserRole
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'overview' },
  { id: 'endpoints', label: 'Endpoint Inventory', icon: Monitor, group: 'overview', minRole: 'SOC_TIER_1' },
  { id: 'endpoint-onboarding', label: 'Endpoint Onboarding', icon: UserPlus, group: 'overview', minRole: 'SOC_TIER_1' },
  { id: 'timeline', label: 'Device Timeline', icon: Clock, group: 'overview', minRole: 'SOC_TIER_2' },
  { id: 'detection', label: 'Threat Detection', icon: Bug, group: 'protection', minRole: 'SOC_TIER_1' },
  { id: 'behavioral', label: 'Behavioral Engine', icon: Brain, group: 'protection', minRole: 'SOC_TIER_3' },
  { id: 'response', label: 'Response Center', icon: Swords, group: 'response', minRole: 'SOC_TIER_2' },
  { id: 'vulnerabilities', label: 'Vulnerabilities', icon: ShieldAlert, group: 'defense', minRole: 'SOC_TIER_1' },
  { id: 'usb', label: 'USB Control', icon: Usb, group: 'defense', minRole: 'SOC_TIER_1' },
  { id: 'firewall', label: 'Firewall', icon: Network, group: 'defense', minRole: 'IT' },
  { id: 'isolation', label: 'Device Isolation', icon: Lock, group: 'defense', minRole: 'SOC_TIER_3' },
  { id: 'scripts', label: 'Script Control', icon: Code, group: 'defense', minRole: 'SOC_TIER_3' },
  { id: 'integrations', label: 'Integrations', icon: Link, group: 'platform', minRole: 'ADMIN' },
  { id: 'audit', label: 'Audit Log', icon: Shield, group: 'platform', minRole: 'AUDITOR_1' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'platform', minRole: 'ADMIN' },
  { id: 'users', label: 'Users', icon: Users, group: 'platform', minRole: 'ADMIN' },
  { id: 'onboarding', label: 'Endpoint Onboarding (Legacy)', icon: Download, group: 'platform', minRole: 'IT' },
]

const groups = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'protection', label: 'PROTECTION' },
  { id: 'response', label: 'RESPONSE' },
  { id: 'defense', label: 'DEFENSE' },
  { id: 'platform', label: 'PLATFORM' },
]

const MENU_ROLE_OVERRIDES: Record<string, UserRole[]> = {
  endpoints: ['SOC_TIER_1', 'ADMIN', 'SUPER_ADMIN', 'IT', 'ANALYST'],
  timeline: ['SOC_TIER_2', 'ADMIN', 'SUPER_ADMIN', 'AUDITOR_1', 'AUDITOR_2', 'AUDITOR_3'],
  detection: ['SOC_TIER_1', 'ADMIN', 'SUPER_ADMIN', 'ANALYST'],
  behavioral: ['SOC_TIER_3', 'ADMIN', 'SUPER_ADMIN'],
  response: ['SOC_TIER_2', 'ADMIN', 'SUPER_ADMIN'],
  vulnerabilities: ['SOC_TIER_1', 'ADMIN', 'SUPER_ADMIN', 'IT', 'ANALYST', 'AUDITOR_1', 'AUDITOR_2', 'AUDITOR_3'],
  usb: ['SOC_TIER_1', 'IT', 'ADMIN', 'SUPER_ADMIN'],
  firewall: ['IT', 'ADMIN', 'SUPER_ADMIN'],
  isolation: ['SOC_TIER_3', 'ADMIN', 'SUPER_ADMIN'],
  scripts: ['SOC_TIER_3', 'IT', 'ADMIN', 'SUPER_ADMIN'],
  integrations: ['ADMIN', 'SUPER_ADMIN'],
  settings: ['ADMIN', 'SUPER_ADMIN'],
  audit: ['AUDITOR_1', 'AUDITOR_2', 'AUDITOR_3', 'ADMIN', 'SUPER_ADMIN'],
  users: ['ADMIN', 'SUPER_ADMIN'],
  onboarding: ['IT', 'ADMIN', 'SUPER_ADMIN'],
}

const ALL_ROLES: UserRole[] = [
  'SUPER_ADMIN', 'ADMIN', 'SOC_TIER_5', 'SOC_TIER_4', 'SOC_TIER_3',
  'SOC_TIER_2', 'SOC_TIER_1', 'AUDITOR_3', 'AUDITOR_2', 'AUDITOR_1',
  'IT', 'ANALYST', 'VIEWER',
]

function isRoleAllowed(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

export default function Sidebar({ currentPage, onPageChange, collapsed, onToggleCollapse }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const { userRole } = usePermissions()

  const filteredItems = navItems.filter((item) => {
    const override = MENU_ROLE_OVERRIDES[item.id]
    if (override) {
      return isRoleAllowed(userRole, override)
    }
    return true
  })

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: filteredItems.filter((item) => item.group === group.id),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <motion.aside
      className={cn(
        'h-screen bg-bs-black-sec border-r border-bs-border flex flex-col z-50 transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      <div className={cn('flex items-center h-16 border-b border-bs-border px-4', collapsed && 'justify-center')}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 flex-1"
          >
            <img src="/logo.png" alt="BlackSentinel Guardian" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <div className="text-sm font-bold text-bs-white tracking-tight">BlackSentinel</div>
              <div className="text-[10px] text-bs-gray-mid font-medium tracking-widest uppercase">Guardian</div>
            </div>
          </motion.div>
        )}
        {collapsed && (
          <img src="/logo.png" alt="BlackSentinel Guardian" className="w-8 h-8 rounded-lg object-cover" />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {visibleGroups.map((group) => (
          <div key={group.id} className="mb-2">
            {!collapsed && (
              <div className="px-3 py-1.5 text-[10px] font-semibold text-bs-gray-mid tracking-widest">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = currentPage === item.id
              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => onPageChange(item.id)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-bs-orange/10 text-bs-orange border border-bs-orange/20'
                        : 'text-bs-gray-light hover:bg-bs-gray-dark hover:text-bs-white',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <item.icon className={cn('w-4.5 h-4.5 shrink-0', isActive ? 'text-bs-orange' : '')} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                  {collapsed && hoveredItem === item.id && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-bs-gray-dark border border-bs-border rounded-lg text-xs text-bs-white whitespace-nowrap z-50 shadow-xl">
                      {item.label}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-bs-border p-2">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-bs-green" />
              <span className="text-xs font-medium text-bs-green">AI Engine Active</span>
            </div>
            <div className="w-full bg-bs-gray-dark rounded-full h-1">
              <div className="bg-gradient-to-r from-bs-green to-bs-green h-1 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-3 px-3 py-2 rounded-lg text-sm text-bs-gray-light hover:bg-bs-gray-dark hover:text-bs-white transition-all"
        >
          {collapsed ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronLeft className="w-4.5 h-4.5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  )
}
