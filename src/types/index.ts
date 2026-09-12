export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type EndpointStatus = 'online' | 'offline' | 'isolated' | 'compromised'
export type OS = 'windows' | 'linux' | 'macos'

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SOC_TIER_5'
  | 'SOC_TIER_4'
  | 'SOC_TIER_3'
  | 'SOC_TIER_2'
  | 'SOC_TIER_1'
  | 'AUDITOR_3'
  | 'AUDITOR_2'
  | 'AUDITOR_1'
  | 'IT'
  | 'ANALYST'
  | 'VIEWER'

export type Permission =
  | 'endpoints:read'
  | 'endpoints:write'
  | 'endpoints:delete'
  | 'endpoints:isolate'
  | 'endpoints:restore'
  | 'endpoints:scan'
  | 'threats:read'
  | 'threats:write'
  | 'threats:delete'
  | 'threats:remediate'
  | 'threats:hunt'
  | 'alerts:read'
  | 'alerts:write'
  | 'alerts:acknowledge'
  | 'alerts:resolve'
  | 'alerts:assign'
  | 'timeline:read'
  | 'vulnerabilities:read'
  | 'vulnerabilities:write'
  | 'vulnerabilities:remediate'
  | 'firewall:read'
  | 'firewall:write'
  | 'firewall:delete'
  | 'usb:read'
  | 'usb:write'
  | 'usb:delete'
  | 'usb:allow_block'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'users:manage_roles'
  | 'settings:read'
  | 'settings:write'
  | 'audit:read'
  | 'dashboard:read'
  | 'integrations:read'
  | 'integrations:write'
  | 'integrations:delete'
  | 'response:execute'
  | 'response:collect_evidence'
  | 'scripts:execute'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  mfaEnabled: boolean
  createdAt: string
  lastLogin: string
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface MFASetupResponse {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export interface MFAVerifyResponse {
  verified: boolean
  token?: string
  user?: User
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: User
  mfaRequired?: boolean
  mfaToken?: string
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Endpoint {
  id: string
  hostname: string
  ipAddress: string
  os: OS
  osVersion: string
  manufacturer: string
  model: string
  cpu: string
  ram: number
  diskTotal: number
  diskUsed: number
  lastSeen: Date
  status: EndpointStatus
  agentVersion: string
  agentStatus: 'healthy' | 'updating' | 'error'
  riskScore: number
  user: string
  domain: string
  location: string
  departments: string[]
  tags: string[]
  macAddress: string
  installedSoftware: Software[]
  processes: Process[]
  networkConnections: NetworkConnection[]
}

export interface Software {
  name: string
  version: string
  publisher: string
  installDate: Date
  size: number
}

export interface Process {
  pid: number
  name: string
  path: string
  commandLine: string
  cpu: number
  memory: number
  user: string
  startTime: Date
  parentPid: number
  status: 'running' | 'suspended' | 'terminated'
}

export interface NetworkConnection {
  localAddress: string
  localPort: number
  remoteAddress: string
  remotePort: number
  protocol: string
  state: string
  process: string
  pid: number
}

export interface Threat {
  id: string
  name: string
  type: 'malware' | 'ransomware' | 'exploit' | 'suspicious' | 'policy'
  severity: Severity
  status: 'active' | 'investigating' | 'resolved' | 'false_positive'
  description: string
  endpointId: string
  endpointName: string
  detectedAt: Date
  mitreTactics: string[]
  mitreTechniques: string[]
  iocs: IOC[]
  ioc: string
  affectedFiles: string[]
  processTree: ProcessNode
  recommendedActions: string[]
  autoRemediated: boolean
}

export interface IOC {
  type: 'hash' | 'ip' | 'domain' | 'url' | 'file_path' | 'registry' | 'process'
  value: string
  confidence: number
}

export interface ProcessNode {
  pid: number
  name: string
  commandLine: string
  children: ProcessNode[]
}

export interface TimelineEvent {
  id: string
  endpointId: string
  timestamp: Date
  category: 'process' | 'network' | 'file' | 'registry' | 'usb' | 'auth' | 'policy' | 'threat' | 'software' | 'user'
  title: string
  description: string
  details: Record<string, unknown>
  severity: Severity
}

export interface Vulnerability {
  id: string
  cveId: string
  software: string
  version: string
  severity: Severity
  cvssScore: number
  description: string
  affectedEndpoints: number
  exploitedInTheWild: boolean
  patchAvailable: boolean
  publishDate: Date
  references: string[]
}

export interface Alert {
  id: string
  title: string
  severity: Severity
  source: string
  timestamp: Date
  endpointId: string
  endpointName: string
  description: string
  status: 'new' | 'acknowledged' | 'resolved' | 'investigating'
  assignedTo?: string
}

export interface Widget {
  id: string
  type: string
  title: string
  size: 'sm' | 'md' | 'lg' | 'xl'
  position: { x: number; y: number }
}

export interface FirewallRule {
  id: string
  name: string
  action: 'allow' | 'block'
  direction: 'inbound' | 'outbound'
  protocol: string
  localPort?: string
  remoteAddress?: string
  remotePort?: string
  enabled: boolean
  endpointId: string
}

export interface USBDevice {
  id: string
  vendorId: string
  productId: string
  deviceName: string
  serialNumber: string
  endpointId: string
  endpointName: string
  firstSeen: Date
  lastSeen: Date
  status: 'allowed' | 'blocked' | 'pending'
  deviceType: string
}

export interface DashboardStats {
  totalEndpoints: number
  onlineEndpoints: number
  offlineEndpoints: number
  totalThreats: number
  activeThreats: number
  criticalThreats: number
  blockedToday: number
  ransomwareStopped: number
  riskScore: number
  protectedAssets: number
  protectedUsers: number
  eventsLast24h: number
  blockedConnections: number
  vulnerabilitiesFound: number
  criticalVulns: number
  aiEngineStatus: string
  agentIntegrity: number
  anomalyScore: number
}

export interface AuditEntry {
  id: string
  action: string
  target: string
  details: Record<string, unknown>
  timestamp: Date
  userId: string
  userName: string
  ipAddress: string
}

export interface Integration {
  id: string
  name: string
  type: string
  category?: string
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, unknown>
  lastSync?: Date
  icon?: string
  description?: string
}

export interface SystemSettings {
  general: {
    organizationName: string
    timezone: string
    language: string
  }
  notifications: {
    emailEnabled: boolean
    slackEnabled: boolean
    webhookUrl?: string
  }
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    requireMfa: boolean
    passwordPolicy: string
  }
  retention: {
    auditLogDays: number
    eventDays: number
    threatIntelligenceDays: number
  }
}

export type RegistrationStatus = 'pending_registration' | 'agent_installed' | 'online' | 'offline'

export interface EndpointRegistration {
  id: string
  hostname: string
  ipAddress: string
  os: OS
  location: string
  department: string
  registrationToken: string
  installCommand: string
  status: RegistrationStatus
  registeredAt: Date
  lastHeartbeat: Date | null
  agentInstalledAt: Date | null
  registeredBy: string
}
