import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, Shield, ChevronDown, Settings, User, LogOut, X, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { useAlerts } from '@/hooks'
import { usePermissions } from '@/hooks/usePermissions'
import RoleBadge from '@/components/ui/RoleBadge'

// The AI Security Copilot is a paid-plan feature not included in this
// free/open-source edition — see the full BlackSentinel Guardian product.
export default function Header() {
  const { alerts } = useAlerts()
  const { userRole } = usePermissions()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const criticalAlerts = alerts.filter(a => a.severity === 'critical')

  return (
    <header className="h-16 bg-bs-black-sec border-b border-bs-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bs-gray-mid" />
          <input
            type="text"
            placeholder="Search endpoints, threats, events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bs-gray-dark border border-bs-border rounded-lg pl-10 pr-4 py-2 text-sm text-bs-gray-light placeholder:text-bs-gray-mid focus:outline-none focus:border-bs-orange focus:ring-1 focus:ring-bs-orange/30 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-bs-gray-mid hover:text-bs-white" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bs-green/10 border border-bs-green/20 mr-2">
          <div className="w-2 h-2 rounded-full bg-bs-green animate-pulse" />
          <span className="text-xs font-medium text-bs-green">Protected</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg hover:bg-bs-gray-dark transition-colors"
          >
            <Bell className="w-5 h-5 text-bs-gray-light" />
            {criticalAlerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-bs-red rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                {criticalAlerts.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute right-0 top-full mt-2 w-96 bg-bs-surface-elevated border border-bs-border rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-bs-border">
                  <h3 className="text-sm font-semibold text-bs-white">Notifications</h3>
                  <span className="text-xs text-bs-gray-mid">{alerts.length} total</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {alerts.slice(0, 6).map((alert) => (
                    <div key={alert.id} className="px-4 py-3 border-b border-bs-border/50 hover:bg-bs-gray-dark/50 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-1.5 shrink-0',
                          alert.severity === 'critical' && 'bg-bs-red',
                          alert.severity === 'high' && 'bg-bs-orange-alert',
                          alert.severity === 'medium' && 'bg-bs-yellow',
                          alert.severity === 'low' && 'bg-bs-blue',
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-bs-white truncate">{alert.title}</p>
                          <p className="text-[11px] text-bs-gray-mid mt-0.5">{alert.endpointName}</p>
                          <p className="text-[10px] text-bs-gray-mid mt-1">
                            {alert.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-bs-border">
                  <button className="w-full text-xs font-medium text-bs-orange hover:text-bs-orange-bright transition-colors">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bs-gray-dark transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-bs-orange to-bs-orange-bright flex items-center justify-center">
              <span className="text-xs font-bold text-white">AK</span>
            </div>
            <RoleBadge role={userRole} />
            <ChevronDown className="w-3.5 h-3.5 text-bs-gray-mid" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute right-0 top-full mt-2 w-56 bg-bs-surface-elevated border border-bs-border rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-bs-border">
                  <p className="text-sm font-medium text-bs-white">Alex Kumar</p>
                  <div className="mt-1">
                    <RoleBadge role={userRole} />
                  </div>
                </div>
                <div className="py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-bs-gray-light hover:bg-bs-gray-dark transition-colors">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-bs-gray-light hover:bg-bs-gray-dark transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-bs-gray-light hover:bg-bs-gray-dark transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
