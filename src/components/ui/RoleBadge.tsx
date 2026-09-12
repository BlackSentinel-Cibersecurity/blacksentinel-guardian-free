import type { UserRole } from '@/types'
import { cn } from '@/utils/helpers'

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

const ROLE_STYLES: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-red-500/15 text-red-400 border-red-500/30',
  ADMIN: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  SOC_TIER_5: 'bg-blue-600/15 text-blue-300 border-blue-600/30',
  SOC_TIER_4: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  SOC_TIER_3: 'bg-blue-400/15 text-blue-300 border-blue-400/30',
  SOC_TIER_2: 'bg-blue-400/10 text-blue-200 border-blue-400/25',
  SOC_TIER_1: 'bg-blue-300/10 text-blue-200 border-blue-300/25',
  AUDITOR_3: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  AUDITOR_2: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/25',
  AUDITOR_1: 'bg-yellow-400/10 text-yellow-300 border-yellow-400/25',
  IT: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  ANALYST: 'bg-green-500/15 text-green-400 border-green-500/30',
  VIEWER: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  SOC_TIER_5: 'SOC Tier 5',
  SOC_TIER_4: 'SOC Tier 4',
  SOC_TIER_3: 'SOC Tier 3',
  SOC_TIER_2: 'SOC Tier 2',
  SOC_TIER_1: 'SOC Tier 1',
  AUDITOR_3: 'Auditor 3',
  AUDITOR_2: 'Auditor 2',
  AUDITOR_1: 'Auditor 1',
  IT: 'IT',
  ANALYST: 'Analyst',
  VIEWER: 'Viewer',
}

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
        ROLE_STYLES[role],
        className
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
