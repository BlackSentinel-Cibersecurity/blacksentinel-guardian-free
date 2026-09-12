import { create } from 'zustand'
import type { User, Alert, Endpoint } from '@/types'

interface AuthSlice {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setRefreshToken: (refreshToken: string | null) => void
  setIsAuthenticated: (isAuthenticated: boolean) => void
  setIsLoading: (isLoading: boolean) => void
}

interface UISlice {
  currentPage: string
  setCurrentPage: (page: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  selectedEndpoint: Endpoint | null
  setSelectedEndpoint: (endpoint: Endpoint | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  notifications: Alert[]
  addNotification: (notification: Alert) => void
  dismissNotification: (id: string) => void
  clearNotifications: () => void
}

type AppState = AuthSlice & UISlice

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setRefreshToken: (refreshToken) => set({ refreshToken }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsLoading: (isLoading) => set({ isLoading }),

  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  selectedEndpoint: null,
  setSelectedEndpoint: (endpoint) => set({ selectedEndpoint: endpoint }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}))
