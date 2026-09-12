import type {
  Endpoint,
  Threat,
  TimelineEvent,
  Vulnerability,
  Alert,
  USBDevice,
  FirewallRule,
  User,
  UserRole,
  LoginResponse,
  RefreshTokenResponse,
  MFASetupResponse,
  MFAVerifyResponse,
  DashboardStats,
  AuditEntry,
  Integration,
  SystemSettings,
  PaginatedResponse,
  EndpointRegistration,
} from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  failedQueue = []
}

function getToken(): string | null {
  return localStorage.getItem('bs_token')
}

function setTokens(token: string, refreshToken: string) {
  localStorage.setItem('bs_token', token)
  localStorage.setItem('bs_refresh_token', refreshToken)
}

function clearTokens() {
  localStorage.removeItem('bs_token')
  localStorage.removeItem('bs_refresh_token')
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401 && retryCount === 0) {
    const refreshToken = localStorage.getItem('bs_refresh_token')

    if (refreshToken && !isRefreshing) {
      isRefreshing = true

      try {
        const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: refreshToken }),
        })

        if (refreshResponse.ok) {
          const data: RefreshTokenResponse = await refreshResponse.json()
          setTokens(data.token, data.refreshToken)
          processQueue(null, data.token)

          return request<T>(endpoint, options, 1)
        } else {
          clearTokens()
          processQueue(new Error('Refresh failed'), null)
          window.location.href = '/login'
          throw new Error('Session expired')
        }
      } catch (err) {
        clearTokens()
        processQueue(err, null)
        window.location.href = '/login'
        throw err
      } finally {
        isRefreshing = false
      }
    } else if (!refreshToken) {
      clearTokens()
      window.location.href = '/login'
      throw new Error('No refresh token')
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

interface BootstrapStatusResponse {
  bootstrapMode: boolean
  dbConnected: boolean
  hasUsers: boolean
  defaultCredentials?: {
    email: string
    password: string
  }
}

interface BootstrapLoginResponse {
  token: string
  bootstrap: boolean
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

interface BootstrapCompleteResponse {
  token: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    role: string
    mfaEnabled: boolean
  }
}

const auth = {
  async getStatus(): Promise<BootstrapStatusResponse> {
    return request<BootstrapStatusResponse>('/api/auth/status')
  },

  async bootstrapLogin(email: string, password: string): Promise<BootstrapLoginResponse> {
    return request<BootstrapLoginResponse>('/api/auth/bootstrap/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async bootstrapComplete(data: {
    email: string
    password: string
    confirmPassword: string
    name: string
  }): Promise<BootstrapCompleteResponse> {
    return request<BootstrapCompleteResponse>('/api/auth/bootstrap/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async testDatabaseConnection(db: {
    host: string
    port: string
    database: string
    user: string
    password: string
  }): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/auth/bootstrap/test-db', {
      method: 'POST',
      body: JSON.stringify(db),
    })
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async register(data: {
    email: string
    password: string
    name: string
    role: UserRole
  }): Promise<User> {
    return request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async refreshToken(token: string): Promise<RefreshTokenResponse> {
    return request<RefreshTokenResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' })
    } finally {
      clearTokens()
    }
  },

  async setupMfa(): Promise<MFASetupResponse> {
    return request<MFASetupResponse>('/api/auth/mfa/setup', {
      method: 'POST',
    })
  },

  async verifyMfa(code: string): Promise<MFAVerifyResponse> {
    return request<MFAVerifyResponse>('/api/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  },

  async validateMfa(mfaToken: string, code: string): Promise<LoginResponse> {
    return request<LoginResponse>('/api/auth/mfa/validate', {
      method: 'POST',
      body: JSON.stringify({ mfaToken, code }),
    })
  },

  async getMe(): Promise<User> {
    return request<User>('/api/auth/me')
  },

  async changePassword(data: {
    currentPassword: string
    newPassword: string
  }): Promise<void> {
    await request('/api/auth/password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

const users = {
  async list(): Promise<User[]> {
    return request<User[]>('/api/users')
  },

  async get(id: string): Promise<User> {
    return request<User>(`/api/users/${id}`)
  },

  async create(data: {
    email: string
    password: string
    name: string
    role: UserRole
  }): Promise<User> {
    return request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(
    id: string,
    data: Partial<Pick<User, 'name' | 'email' | 'role'>>
  ): Promise<User> {
    return request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    await request(`/api/users/${id}`, { method: 'DELETE' })
  },
}

const endpoints = {
  async list(): Promise<Endpoint[]> {
    return request<Endpoint[]>('/api/endpoints')
  },

  async get(id: string): Promise<Endpoint> {
    return request<Endpoint>(`/api/endpoints/${id}`)
  },

  async create(data: Partial<Endpoint>): Promise<Endpoint> {
    return request<Endpoint>('/api/endpoints', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<Endpoint>): Promise<Endpoint> {
    return request<Endpoint>(`/api/endpoints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    await request(`/api/endpoints/${id}`, { method: 'DELETE' })
  },

  async isolate(id: string): Promise<{ success: boolean }> {
    return request(`/api/endpoints/${id}/isolate`, { method: 'POST' })
  },

  async restore(id: string): Promise<{ success: boolean }> {
    return request(`/api/endpoints/${id}/release`, { method: 'POST' })
  },

  async scan(id: string): Promise<{ success: boolean; scanId: string }> {
    return request(`/api/endpoints/${id}/scan`, { method: 'POST' })
  },

  async updateAgent(id: string): Promise<{ success: boolean }> {
    return request(`/api/endpoints/${id}/update-agent`, { method: 'POST' })
  },
}

const registrations = {
  async list(): Promise<EndpointRegistration[]> {
    return request<EndpointRegistration[]>('/api/registrations')
  },

  async get(id: string): Promise<EndpointRegistration> {
    return request<EndpointRegistration>(`/api/registrations/${id}`)
  },

  async create(data: {
    hostname: string
    ipAddress: string
    os: string
    location: string
    department: string
  }): Promise<EndpointRegistration> {
    return request<EndpointRegistration>('/api/registrations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    await request(`/api/registrations/${id}`, { method: 'DELETE' })
  },

  async getInstallCommand(id: string): Promise<{ command: string; token: string }> {
    return request(`/api/registrations/${id}/install-command`)
  },
}

const threats = {
  async list(): Promise<Threat[]> {
    return request<Threat[]>('/api/threats')
  },

  async get(id: string): Promise<Threat> {
    return request<Threat>(`/api/threats/${id}`)
  },

  async update(id: string, data: Partial<Threat>): Promise<Threat> {
    return request<Threat>(`/api/threats/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async remediate(id: string): Promise<{ success: boolean }> {
    return request(`/api/threats/${id}/remediate`, { method: 'POST' })
  },
}

const alerts = {
  async list(): Promise<Alert[]> {
    return request<Alert[]>('/api/alerts')
  },

  async get(id: string): Promise<Alert> {
    return request<Alert>(`/api/alerts/${id}`)
  },

  async acknowledge(id: string): Promise<{ success: boolean }> {
    return request(`/api/alerts/${id}/acknowledge`, { method: 'POST' })
  },

  async resolve(id: string): Promise<{ success: boolean }> {
    return request(`/api/alerts/${id}/resolve`, { method: 'POST' })
  },

  async assign(
    id: string,
    userId: string
  ): Promise<{ success: boolean }> {
    return request(`/api/alerts/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  },
}

const timeline = {
  async list(params?: {
    endpointId?: string
    category?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<TimelineEvent>> {
    const searchParams = new URLSearchParams()
    if (params?.endpointId) searchParams.set('endpointId', params.endpointId)
    if (params?.category) searchParams.set('category', params.category)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))

    const query = searchParams.toString()
    return request<PaginatedResponse<TimelineEvent>>(
      `/api/timeline${query ? `?${query}` : ''}`
    )
  },
}

const vulnerabilities = {
  async list(): Promise<Vulnerability[]> {
    return request<Vulnerability[]>('/api/vulnerabilities')
  },

  async get(id: string): Promise<Vulnerability> {
    return request<Vulnerability>(`/api/vulnerabilities/${id}`)
  },

  async update(
    id: string,
    data: Partial<Vulnerability>
  ): Promise<Vulnerability> {
    return request<Vulnerability>(`/api/vulnerabilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async remediate(id: string): Promise<{ success: boolean }> {
    return request(`/api/vulnerabilities/${id}/remediate`, { method: 'POST' })
  },
}

const firewall = {
  async list(): Promise<FirewallRule[]> {
    return request<FirewallRule[]>('/api/firewall')
  },

  async create(data: Omit<FirewallRule, 'id'>): Promise<FirewallRule> {
    return request<FirewallRule>('/api/firewall', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(
    id: string,
    data: Partial<FirewallRule>
  ): Promise<FirewallRule> {
    return request<FirewallRule>(`/api/firewall/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    await request(`/api/firewall/${id}`, { method: 'DELETE' })
  },

  async toggle(id: string): Promise<{ success: boolean }> {
    return request(`/api/firewall/${id}/toggle`, { method: 'PUT' })
  },
}

const usb = {
  async list(): Promise<USBDevice[]> {
    return request<USBDevice[]>('/api/usb')
  },

  async create(data: Omit<USBDevice, 'id'>): Promise<USBDevice> {
    return request<USBDevice>('/api/usb', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<USBDevice>): Promise<USBDevice> {
    return request<USBDevice>(`/api/usb/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    await request(`/api/usb/${id}`, { method: 'DELETE' })
  },

  async allow(id: string): Promise<{ success: boolean }> {
    return request(`/api/usb/${id}/allow`, { method: 'POST' })
  },

  async block(id: string): Promise<{ success: boolean }> {
    return request(`/api/usb/${id}/block`, { method: 'POST' })
  },
}

const dashboard = {
  async getStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/api/dashboard')
  },
}

const audit = {
  async list(params?: {
    page?: number
    limit?: number
    action?: string
    userId?: string
    startDate?: string
    endDate?: string
  }): Promise<PaginatedResponse<AuditEntry>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.action) searchParams.set('action', params.action)
    if (params?.userId) searchParams.set('userId', params.userId)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)

    const query = searchParams.toString()
    return request<PaginatedResponse<AuditEntry>>(
      `/api/audit${query ? `?${query}` : ''}`
    )
  },
}

const integrations = {
  async list(): Promise<Integration[]> {
    return request<Integration[]>('/api/integrations')
  },

  async create(data: Omit<Integration, 'id'>): Promise<Integration> {
    return request<Integration>('/api/integrations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(
    id: string,
    data: Partial<Integration>
  ): Promise<Integration> {
    return request<Integration>(`/api/integrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    await request(`/api/integrations/${id}`, { method: 'DELETE' })
  },

  async connect(id: string): Promise<{ success: boolean }> {
    return request(`/api/integrations/${id}/connect`, { method: 'POST' })
  },

  async disconnect(id: string): Promise<{ success: boolean }> {
    return request(`/api/integrations/${id}/disconnect`, { method: 'POST' })
  },
}

const settings = {
  async get(): Promise<SystemSettings> {
    return request<SystemSettings>('/api/settings')
  },

  async update(data: Partial<SystemSettings>): Promise<{ success: boolean }> {
    return request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

const response = {
  async isolate(data: {
    endpointId: string
    reason?: string
  }): Promise<{ success: boolean; actionId: string }> {
    return request('/api/response/isolate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async killProcess(data: {
    endpointId: string
    pid: number
  }): Promise<{ success: boolean }> {
    return request('/api/response/kill-process', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async quarantine(data: {
    endpointId: string
    target: string
  }): Promise<{ success: boolean }> {
    return request('/api/response/quarantine', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async collectEvidence(endpointId: string): Promise<{
    success: boolean
    packageUrl: string
  }> {
    return request('/api/response/collect-evidence', {
      method: 'POST',
      body: JSON.stringify({ endpointId }),
    })
  },

  async executeScript(data: {
    endpointId: string
    script: string
    engine: string
  }): Promise<{ success: boolean; output: string }> {
    return request('/api/response/execute-script', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async blockHash(hash: string): Promise<{ success: boolean }> {
    return request('/api/response/block-hash', {
      method: 'POST',
      body: JSON.stringify({ hash }),
    })
  },

  async blockIP(ip: string): Promise<{ success: boolean }> {
    return request('/api/response/block-ip', {
      method: 'POST',
      body: JSON.stringify({ ip }),
    })
  },

  async blockDomain(domain: string): Promise<{ success: boolean }> {
    return request('/api/response/block-domain', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    })
  },

  async fullScan(endpointId: string): Promise<{
    success: boolean
    scanId: string
  }> {
    return request('/api/response/full-scan', {
      method: 'POST',
      body: JSON.stringify({ endpointId }),
    })
  },
}

type EventCallback = (event: string, data: unknown) => void
const eventListeners: Map<string, Set<EventCallback>> = new Map()

function on(event: string, callback: EventCallback): () => void {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set())
  }
  eventListeners.get(event)!.add(callback)
  return () => {
    eventListeners.get(event)?.delete(callback)
  }
}

function emit(event: string, data: unknown) {
  eventListeners.get(event)?.forEach(callback => callback(event, data))
}

export const api = {
  auth,
  users,
  endpoints,
  registrations,
  threats,
  alerts,
  timeline,
  vulnerabilities,
  firewall,
  usb,
  dashboard,
  audit,
  integrations,
  settings,
  response,
  request,
  on,
  emit,
}

export type { AuditEntry }
