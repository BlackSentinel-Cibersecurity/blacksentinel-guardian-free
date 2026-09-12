import { useState, useEffect, useCallback } from 'react'
import type { Endpoint, Threat, TimelineEvent, Vulnerability, Alert, USBDevice, FirewallRule, DashboardStats, EndpointRegistration } from '@/types'
import { api } from '@/services/api'
import { useAppStore } from '@/store'
import { useAuth } from './useAuth'
import { usePermissions } from './usePermissions'

export { useAuth }
export { usePermissions }
export { permissionCheck, hasRoleHierarchy, getRolePermissions } from './usePermissions'

export function useEndpoints() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.endpoints.list()
      setEndpoints(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch endpoints')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { endpoints, loading, error, refresh }
}

export function useRegistrations() {
  const [registrations, setRegistrations] = useState<EndpointRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.registrations.list()
      setRegistrations(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch registrations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { registrations, loading, error, refresh }
}

export function useThreats() {
  const [threats, setThreats] = useState<Threat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.threats.list()
      setThreats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch threats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { threats, loading, error, refresh }
}

export function useTimeline(endpointId?: string) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.timeline.list({ endpointId })
      setEvents(data.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timeline')
    } finally {
      setLoading(false)
    }
  }, [endpointId])

  useEffect(() => { refresh() }, [refresh])

  return { events, loading, error, refresh }
}

export function useVulnerabilities() {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.vulnerabilities.list()
      setVulnerabilities(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vulnerabilities')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { vulnerabilities, loading, error, refresh }
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.alerts.list()
      setAlerts(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { alerts, loading, error, refresh }
}

export function useUSBDevices() {
  const [devices, setDevices] = useState<USBDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.usb.list()
      setDevices(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch USB devices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { devices, loading, error, refresh }
}

export function useFirewallRules() {
  const [rules, setRules] = useState<FirewallRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.firewall.list()
      setRules(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch firewall rules')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { rules, loading, error, refresh }
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.dashboard.getStats()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { stats, loading, error, refresh }
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info'; timestamp: Date }>>([])

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = `toast-${Date.now()}`
    setToasts(prev => [...prev, { id, message, type, timestamp: new Date() }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, dismissToast }
}

export function useConfirmDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    variant: 'danger' | 'warning' | 'info'
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'danger',
    onConfirm: () => {},
  })

  const confirm = useCallback((options: {
    title: string
    message: string
    confirmText?: string
    variant?: 'danger' | 'warning' | 'info'
  }) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirm',
        variant: options.variant || 'danger',
        onConfirm: () => {
          setDialog(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
      })
    })
  }, [])

  const closeDialog = useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }))
  }, [])

  return { dialog, confirm, closeDialog }
}

export function useRealTimeAlerts() {
  const [realtimeAlerts, setRealtimeAlerts] = useState<Array<{ id: string; message: string; severity: string }>>([])

  useEffect(() => {
    const unsub = api.on('threat:detected', (_event, data) => {
      const alert = data as { name: string; severity: string; endpoint: string }
      setRealtimeAlerts(prev => [...prev, {
        id: `alert-${Date.now()}`,
        message: `${alert.severity.toUpperCase()}: ${alert.name} on ${alert.endpoint}`,
        severity: alert.severity,
      }])
    })
    return unsub
  }, [])

  const clearAlerts = useCallback(() => {
    setRealtimeAlerts([])
  }, [])

  return { realtimeAlerts, clearAlerts }
}

export function useKeyboardShortcuts() {
  const { setCommandPaletteOpen } = useAppStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault()
            setCommandPaletteOpen(true)
            break
          case '/':
            e.preventDefault()
            break
        }
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCommandPaletteOpen])
}
