import { useCallback } from 'react'
import type { UserRole, Permission } from '@/types'
import { useAppStore } from '@/store'

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 13,
  ADMIN: 12,
  SOC_TIER_5: 11,
  SOC_TIER_4: 10,
  SOC_TIER_3: 9,
  SOC_TIER_2: 8,
  SOC_TIER_1: 7,
  AUDITOR_3: 6,
  AUDITOR_2: 5,
  AUDITOR_1: 4,
  IT: 3,
  ANALYST: 2,
  VIEWER: 1,
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'endpoints:read', 'endpoints:write', 'endpoints:delete',
    'endpoints:isolate', 'endpoints:restore', 'endpoints:scan',
    'threats:read', 'threats:write', 'threats:delete',
    'threats:remediate', 'threats:hunt',
    'alerts:read', 'alerts:write', 'alerts:acknowledge',
    'alerts:resolve', 'alerts:assign',
    'timeline:read',
    'vulnerabilities:read', 'vulnerabilities:write', 'vulnerabilities:remediate',
    'firewall:read', 'firewall:write', 'firewall:delete',
    'usb:read', 'usb:write', 'usb:delete', 'usb:allow_block',
    'users:read', 'users:write', 'users:delete', 'users:manage_roles',
    'settings:read', 'settings:write',
    'audit:read',
    'dashboard:read',
    'integrations:read', 'integrations:write', 'integrations:delete',
    'response:execute', 'response:collect_evidence',
    'scripts:execute',
  ],
  ADMIN: [
    'endpoints:read', 'endpoints:write', 'endpoints:delete',
    'endpoints:isolate', 'endpoints:restore', 'endpoints:scan',
    'threats:read', 'threats:write', 'threats:delete',
    'threats:remediate', 'threats:hunt',
    'alerts:read', 'alerts:write', 'alerts:acknowledge',
    'alerts:resolve', 'alerts:assign',
    'timeline:read',
    'vulnerabilities:read', 'vulnerabilities:write', 'vulnerabilities:remediate',
    'firewall:read', 'firewall:write', 'firewall:delete',
    'usb:read', 'usb:write', 'usb:delete', 'usb:allow_block',
    'users:read', 'users:write', 'users:delete',
    'settings:read', 'settings:write',
    'audit:read',
    'dashboard:read',
    'integrations:read', 'integrations:write', 'integrations:delete',
    'response:execute', 'response:collect_evidence',
    'scripts:execute',
  ],
  SOC_TIER_5: [
    'endpoints:read', 'endpoints:write',
    'endpoints:isolate', 'endpoints:restore', 'endpoints:scan',
    'threats:read', 'threats:write',
    'threats:remediate', 'threats:hunt',
    'alerts:read', 'alerts:write', 'alerts:acknowledge',
    'alerts:resolve', 'alerts:assign',
    'timeline:read',
    'vulnerabilities:read', 'vulnerabilities:write', 'vulnerabilities:remediate',
    'firewall:read', 'firewall:write',
    'usb:read', 'usb:write', 'usb:allow_block',
    'users:read',
    'settings:read',
    'audit:read',
    'dashboard:read',
    'response:execute', 'response:collect_evidence',
    'scripts:execute',
  ],
  SOC_TIER_4: [
    'endpoints:read', 'endpoints:write',
    'endpoints:isolate', 'endpoints:restore', 'endpoints:scan',
    'threats:read', 'threats:write',
    'threats:remediate', 'threats:hunt',
    'alerts:read', 'alerts:write', 'alerts:acknowledge',
    'alerts:resolve', 'alerts:assign',
    'timeline:read',
    'vulnerabilities:read', 'vulnerabilities:write', 'vulnerabilities:remediate',
    'firewall:read', 'firewall:write',
    'usb:read', 'usb:write', 'usb:allow_block',
    'users:read',
    'settings:read',
    'audit:read',
    'dashboard:read',
    'response:execute', 'response:collect_evidence',
    'scripts:execute',
  ],
  SOC_TIER_3: [
    'endpoints:read', 'endpoints:write',
    'endpoints:isolate', 'endpoints:restore', 'endpoints:scan',
    'threats:read', 'threats:write',
    'threats:remediate', 'threats:hunt',
    'alerts:read', 'alerts:write', 'alerts:acknowledge',
    'alerts:resolve', 'alerts:assign',
    'timeline:read',
    'vulnerabilities:read', 'vulnerabilities:write', 'vulnerabilities:remediate',
    'firewall:read', 'firewall:write',
    'usb:read', 'usb:write', 'usb:allow_block',
    'users:read',
    'settings:read',
    'audit:read',
    'dashboard:read',
    'response:execute', 'response:collect_evidence',
    'scripts:execute',
  ],
  SOC_TIER_2: [
    'endpoints:read',
    'threats:read', 'threats:write',
    'threats:remediate',
    'alerts:read', 'alerts:write', 'alerts:acknowledge',
    'alerts:resolve',
    'timeline:read',
    'vulnerabilities:read',
    'firewall:read',
    'usb:read',
    'users:read',
    'settings:read',
    'dashboard:read',
    'response:execute',
    'scripts:execute',
  ],
  SOC_TIER_1: [
    'endpoints:read',
    'threats:read',
    'alerts:read', 'alerts:acknowledge',
    'timeline:read',
    'vulnerabilities:read',
    'firewall:read',
    'usb:read',
    'users:read',
    'settings:read',
    'dashboard:read',
  ],
  AUDITOR_3: [
    'endpoints:read',
    'threats:read',
    'alerts:read', 'alerts:acknowledge',
    'timeline:read',
    'vulnerabilities:read',
    'firewall:read',
    'usb:read',
    'users:read',
    'settings:read',
    'audit:read',
    'dashboard:read',
  ],
  AUDITOR_2: [
    'endpoints:read',
    'threats:read',
    'alerts:read', 'alerts:acknowledge',
    'timeline:read',
    'vulnerabilities:read',
    'firewall:read',
    'usb:read',
    'users:read',
    'settings:read',
    'audit:read',
    'dashboard:read',
  ],
  AUDITOR_1: [
    'endpoints:read',
    'threats:read',
    'alerts:read',
    'timeline:read',
    'vulnerabilities:read',
    'firewall:read',
    'usb:read',
    'users:read',
    'settings:read',
    'audit:read',
    'dashboard:read',
  ],
  IT: [
    'endpoints:read', 'endpoints:write',
    'endpoints:scan',
    'threats:read',
    'alerts:read',
    'timeline:read',
    'vulnerabilities:read',
    'firewall:read', 'firewall:write', 'firewall:delete',
    'usb:read', 'usb:write', 'usb:delete', 'usb:allow_block',
    'users:read',
    'settings:read',
    'dashboard:read',
    'scripts:execute',
  ],
  ANALYST: [
    'endpoints:read',
    'threats:read', 'threats:write',
    'threats:remediate', 'threats:hunt',
    'alerts:read', 'alerts:write', 'alerts:acknowledge',
    'alerts:resolve',
    'timeline:read',
    'vulnerabilities:read',
    'firewall:read',
    'usb:read',
    'users:read',
    'settings:read',
    'dashboard:read',
    'response:execute',
  ],
  VIEWER: [
    'dashboard:read',
    'endpoints:read',
    'threats:read',
    'alerts:read',
  ],
}

export function permissionCheck(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false
  return permissions.includes(permission)
}

export function hasRoleHierarchy(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

export function usePermissions() {
  const user = useAppStore((s) => s.user)
  const userRole = user?.role || 'VIEWER'

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissionCheck(userRole, permission)
    },
    [userRole]
  )

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return hasRoleHierarchy(userRole, role)
    },
    [userRole]
  )

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.some((p) => hasPermission(p))
    },
    [hasPermission]
  )

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.every((p) => hasPermission(p))
    },
    [hasPermission]
  )

  return {
    userRole,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    permissions: getRolePermissions(userRole),
  }
}
