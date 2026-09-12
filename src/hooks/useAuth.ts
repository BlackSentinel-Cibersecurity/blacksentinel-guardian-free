import { useState, useEffect, useCallback } from 'react'
import type { User, LoginResponse } from '@/types'
import { api } from '@/services/api'
import { useAppStore } from '@/store'

const BOOTSTRAP_CREDENTIALS = {
  email: 'setup@blacksentinel.io',
  password: 'Guardian$etup2024!',
}

export function useAuth() {
  const { setUser, setToken, setRefreshToken, setIsAuthenticated, setIsLoading } =
    useAppStore()
  const user = useAppStore((s) => s.user)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const isLoading = useAppStore((s) => s.isLoading)
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaToken, setMfaToken] = useState<string | null>(null)
  const [bootstrapMode, setBootstrapMode] = useState<boolean | null>(null)

  const checkBootstrapStatus = useCallback(async () => {
    if (localStorage.getItem('bs_force_setup') === 'true') {
      localStorage.removeItem('bs_force_setup')
      setBootstrapMode(true)
      return { bootstrapMode: true, dbConnected: false, hasUsers: false }
    }
    try {
      const status = await api.auth.getStatus()
      setBootstrapMode(status.bootstrapMode)
      return status
    } catch {
      setBootstrapMode(true)
      return { bootstrapMode: true, dbConnected: false, hasUsers: false }
    }
  }, [])

  const handleOfflineLogin = useCallback(
    (email: string, password: string): boolean => {
      if (email === BOOTSTRAP_CREDENTIALS.email && password === BOOTSTRAP_CREDENTIALS.password) {
        const bootstrapUser: User = {
          id: 'bootstrap-setup',
          email: BOOTSTRAP_CREDENTIALS.email,
          name: 'System Setup',
          role: 'SUPER_ADMIN' as User['role'],
          mfaEnabled: false,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        }
        setUser(bootstrapUser)
        const fakeToken = 'bootstrap-token-' + Date.now()
        setToken(fakeToken)
        localStorage.setItem('bs_token', fakeToken)
        setIsAuthenticated(true)
        setIsLoading(false)
        setBootstrapMode(true)
        return true
      }

      const offlineEmail = localStorage.getItem('bs_offline_admin_email')
      const offlinePassword = localStorage.getItem('bs_offline_admin_password')
      if (offlineEmail && offlinePassword && email === offlineEmail && password === offlinePassword) {
        const savedUser = localStorage.getItem('bs_user')
        if (savedUser) {
          const parsed = JSON.parse(savedUser) as User
          setUser(parsed)
          const fakeToken = 'offline-token-' + Date.now()
          setToken(fakeToken)
          localStorage.setItem('bs_token', fakeToken)
          setIsAuthenticated(true)
          setIsLoading(false)
          return true
        }
      }
      return false
    },
    [setUser, setToken, setIsAuthenticated, setIsLoading]
  )

  const bootstrapLogin = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      if (handleOfflineLogin(email, password)) {
        return { success: true }
      }
      try {
        const data = await api.auth.bootstrapLogin(email, password)
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role as User['role'],
          mfaEnabled: false,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        })
        setToken(data.token)
        localStorage.setItem('bs_token', data.token)
        setIsAuthenticated(true)
        setIsLoading(false)
        return { success: true }
      } catch {
        setIsLoading(false)
        return { success: false, error: 'Invalid credentials' }
      }
    },
    [handleOfflineLogin, setUser, setToken, setIsAuthenticated, setIsLoading]
  )

  const bootstrapComplete = useCallback(
    async (userData: {
      email: string
      password: string
      confirmPassword: string
      name: string
    }): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      try {
        const data = await api.auth.bootstrapComplete(userData)
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role as User['role'],
          mfaEnabled: data.user.mfaEnabled,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        })
        setToken(data.token)
        setRefreshToken(data.refreshToken)
        localStorage.setItem('bs_token', data.token)
        localStorage.setItem('bs_refresh_token', data.refreshToken)
        setIsAuthenticated(true)
        setIsLoading(false)
        setBootstrapMode(false)
        return { success: true }
      } catch {
        // Offline fallback: save to localStorage
        const newUser: User = {
          id: 'user-' + Date.now(),
          email: userData.email,
          name: userData.name,
          role: 'SUPER_ADMIN' as User['role'],
          mfaEnabled: false,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        }
        localStorage.setItem('bs_user', JSON.stringify(newUser))
        localStorage.setItem('bs_offline_setup', 'true')
        localStorage.setItem('bs_offline_admin_email', userData.email)
        localStorage.setItem('bs_offline_admin_password', userData.password)
        setUser(newUser)
        const fakeToken = 'offline-token-' + Date.now()
        setToken(fakeToken)
        localStorage.setItem('bs_token', fakeToken)
        setIsAuthenticated(true)
        setIsLoading(false)
        return { success: true }
      }
    },
    [setUser, setToken, setRefreshToken, setIsAuthenticated, setIsLoading]
  )

  const handleAuthResponse = useCallback(
    (data: LoginResponse) => {
      if (data.mfaRequired) {
        setMfaRequired(true)
        setMfaToken(data.mfaToken || null)
        setIsLoading(false)
        return
      }
      if (data.user) {
        setUser(data.user)
      }
      if (data.token) {
        setToken(data.token)
        setRefreshToken(data.refreshToken)
        localStorage.setItem('bs_token', data.token)
        localStorage.setItem('bs_refresh_token', data.refreshToken)
      }
      setIsAuthenticated(true)
      setIsLoading(false)
      setMfaRequired(false)
      setMfaToken(null)
    },
    [setUser, setToken, setRefreshToken, setIsAuthenticated, setIsLoading]
  )

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      if (handleOfflineLogin(email, password)) {
        return { success: true }
      }
      try {
        const data = await api.auth.login(email, password)
        handleAuthResponse(data)
        return { success: true }
      } catch {
        setIsLoading(false)
        return { success: false, error: 'Invalid credentials' }
      }
    },
    [handleOfflineLogin, handleAuthResponse, setIsLoading]
  )

  const loginWithMfa = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      if (!mfaToken) {
        return { success: false, error: 'No MFA token' }
      }
      setIsLoading(true)
      try {
        const data = await api.auth.validateMfa(mfaToken, code)
        handleAuthResponse(data)
        return { success: true }
      } catch (err) {
        setIsLoading(false)
        const message = err instanceof Error ? err.message : 'MFA verification failed'
        return { success: false, error: message }
      }
    },
    [mfaToken, handleAuthResponse, setIsLoading]
  )

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } finally {
      setUser(null)
      setToken(null)
      setRefreshToken(null)
      setIsAuthenticated(false)
      localStorage.removeItem('bs_token')
      localStorage.removeItem('bs_refresh_token')
    }
  }, [setUser, setToken, setRefreshToken, setIsAuthenticated])

  const register = useCallback(
    async (userData: {
      email: string
      password: string
      name: string
      role: string
    }): Promise<{ success: boolean; error?: string; user?: User }> => {
      setIsLoading(true)
      try {
        const newUser = await api.auth.register({
          ...userData,
          role: userData.role as User['role'],
        })
        setIsLoading(false)
        return { success: true, user: newUser }
      } catch (err) {
        setIsLoading(false)
        const message = err instanceof Error ? err.message : 'Registration failed'
        return { success: false, error: message }
      }
    },
    [setIsLoading]
  )

  const refreshToken = useCallback(async () => {
    const currentRefreshToken = localStorage.getItem('bs_refresh_token')
    if (!currentRefreshToken) {
      setIsAuthenticated(false)
      return
    }
    try {
      const data = await api.auth.refreshToken(currentRefreshToken)
      setToken(data.token)
      setRefreshToken(data.refreshToken)
      localStorage.setItem('bs_token', data.token)
      localStorage.setItem('bs_refresh_token', data.refreshToken)
    } catch {
      setUser(null)
      setToken(null)
      setRefreshToken(null)
      setIsAuthenticated(false)
      localStorage.removeItem('bs_token')
      localStorage.removeItem('bs_refresh_token')
    }
  }, [setToken, setRefreshToken, setUser, setIsAuthenticated])

  const setupMfa = useCallback(async () => {
    return api.auth.setupMfa()
  }, [])

  const verifyMfa = useCallback(async (code: string) => {
    return api.auth.verifyMfa(code)
  }, [])

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
      try {
        await api.auth.changePassword({ currentPassword, newPassword })
        return { success: true }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Password change failed'
        return { success: false, error: message }
      }
    },
    []
  )

  useEffect(() => {
    // Skip token validation in bootstrap/offline mode
    if (localStorage.getItem('bs_offline_setup') === 'true') {
      const savedUser = localStorage.getItem('bs_user')
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as User
        setUser(parsed)
        const token = localStorage.getItem('bs_token')
        if (token) {
          setToken(token)
        }
        setIsAuthenticated(true)
      }
      setIsLoading(false)
      return
    }

    const token = localStorage.getItem('bs_token')
    if (token && !token.startsWith('bootstrap-') && !token.startsWith('offline-')) {
      setIsLoading(true)
      api.auth.getMe()
        .then((userData) => {
          setUser(userData)
          setToken(token)
          setIsAuthenticated(true)
          setIsLoading(false)
        })
        .catch(() => {
          localStorage.removeItem('bs_token')
          localStorage.removeItem('bs_refresh_token')
          setIsLoading(false)
        })
    }
  }, [setUser, setToken, setIsAuthenticated, setIsLoading])

  return {
    user,
    isAuthenticated,
    isLoading,
    mfaRequired,
    bootstrapMode,
    checkBootstrapStatus,
    bootstrapLogin,
    bootstrapComplete,
    login,
    loginWithMfa,
    logout,
    register,
    refreshToken,
    setupMfa,
    verifyMfa,
    changePassword,
  }
}
