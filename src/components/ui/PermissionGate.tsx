import type { ReactNode } from 'react'
import type { UserRole, Permission } from '@/types'
import { usePermissions } from '@/hooks/usePermissions'

interface PermissionGateProps {
  permission?: Permission | Permission[]
  role?: UserRole
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean
}

export default function PermissionGate({
  permission,
  role,
  children,
  fallback = null,
  requireAll = false,
}: PermissionGateProps) {
  const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions } = usePermissions()

  let granted = true

  if (role) {
    granted = granted && hasRole(role)
  }

  if (permission) {
    if (Array.isArray(permission)) {
      granted = granted && (requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission))
    } else {
      granted = granted && hasPermission(permission)
    }
  }

  if (!granted) return <>{fallback}</>

  return <>{children}</>
}
