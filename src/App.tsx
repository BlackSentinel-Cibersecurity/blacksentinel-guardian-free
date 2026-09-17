import { useState, useEffect } from 'react'
import Login from '@/pages/Login'
import SetupPage from '@/pages/SetupPage'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Dashboard from '@/components/dashboard/Dashboard'
import EndpointInventory from '@/components/endpoints/EndpointInventory'
import EndpointOnboarding from '@/components/endpoints/EndpointOnboarding'
import DeviceTimeline from '@/components/timeline/DeviceTimeline'
import ThreatDetection from '@/components/detection/ThreatDetection'
import BehavioralEngine from '@/components/behavioral/BehavioralEngine'
import ResponseCenter from '@/components/response/ResponseCenter'
import Vulnerabilities from '@/components/vulnerabilities/Vulnerabilities'
import USBControl from '@/components/usb/USBControl'
import FirewallManagement from '@/components/firewall/FirewallManagement'
import DeviceIsolation from '@/components/isolation/DeviceIsolation'
import ScriptControl from '@/components/scripts/ScriptControl'
import Integrations from '@/components/integrations/Integrations'
import SettingsPage from '@/components/settings/Settings'
import AuditLog from '@/components/settings/AuditLog'
import UsersPage from '@/components/settings/UsersPage'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ToastContainer } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { useKeyboardShortcuts, useToast, useConfirmDialog, useRealTimeAlerts } from '@/hooks'
import { api } from '@/services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const { toasts, addToast, dismissToast } = useToast()
  const { dialog, closeDialog } = useConfirmDialog()
  const { realtimeAlerts, clearAlerts } = useRealTimeAlerts()
  const {
    bootstrapMode,
    checkBootstrapStatus,
    isAuthenticated,
  } = useAuth()

  useKeyboardShortcuts()

  useEffect(() => {
    checkBootstrapStatus()
  }, [checkBootstrapStatus])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setCurrentPage('audit')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const unsub = api.on('threat:detected', (_event, data) => {
      const alert = data as { name: string; severity: string; endpoint: string }
      if (alert.severity === 'critical' || alert.severity === 'high') {
        addToast(`${alert.severity.toUpperCase()}: ${alert.name} on ${alert.endpoint}`, alert.severity === 'critical' ? 'error' : 'warning')
      }
    })
    return unsub
  }, [addToast])

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
  }

  const renderPage = () => {
    const pageMap: Record<string, React.ReactNode> = {
      dashboard: <Dashboard />,
      endpoints: <EndpointInventory />,
      'endpoint-onboarding': <EndpointOnboarding />,
      onboarding: <EndpointOnboarding />,
      timeline: <DeviceTimeline />,
      detection: <ThreatDetection />,
      behavioral: <BehavioralEngine />,
      response: <ResponseCenter />,
      vulnerabilities: <Vulnerabilities />,
      usb: <USBControl />,
      firewall: <FirewallManagement />,
      isolation: <DeviceIsolation />,
      scripts: <ScriptControl />,
      integrations: <Integrations />,
      settings: <SettingsPage />,
      audit: <AuditLog />,
      users: <UsersPage />,
    }
    const page = pageMap[currentPage] || <Dashboard />
    return <ErrorBoundary key={currentPage}>{page}</ErrorBoundary>
  }

  // Loading state: checking bootstrap status
  if (bootstrapMode === null && !isAuthenticated && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-bs-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-bs-orange/10 border border-bs-orange/30 flex items-center justify-center mx-auto mb-4">
            <img src="/logo.png" alt="BlackSentinel" className="w-10 h-10" />
          </div>
          <div className="text-lg font-bold text-bs-white mb-1">BLACKSENTINEL GUARDIAN</div>
          <div className="text-sm text-bs-gray-mid">Initializing system...</div>
        </div>
      </div>
    )
  }

  // Bootstrap mode: show setup wizard (first-time setup)
  if (bootstrapMode === true && !isAuthenticated && !isLoggedIn) {
    return (
      <SetupPage
        onComplete={() => {
          checkBootstrapStatus()
          setIsLoggedIn(true)
        }}
      />
    )
  }

  // Not logged in: show login page
  if (!isLoggedIn) {
    return (
      <Login
        onLogin={() => setIsLoggedIn(true)}
        onSetupMode={() => {
          localStorage.setItem('bs_force_setup', 'true')
          window.location.reload()
        }}
      />
    )
  }

  // Main application
  return (
    <div className="flex h-screen overflow-hidden bg-bs-black">
      <Sidebar
        currentPage={currentPage}
        onPageChange={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-bs-black">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} onNavigate={handleNavigate} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog {...dialog} onClose={closeDialog} />

      {realtimeAlerts.length > 0 && (
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={clearAlerts}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bs-red/10 border border-bs-red/20 text-bs-red text-xs font-medium hover:bg-bs-red/20 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-bs-red animate-pulse" />
            {realtimeAlerts.length} new alert{realtimeAlerts.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}
