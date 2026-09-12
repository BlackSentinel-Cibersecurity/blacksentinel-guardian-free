import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-bs-red'
    case 'high': return 'text-bs-orange-alert'
    case 'medium': return 'text-bs-yellow'
    case 'low': return 'text-bs-blue'
    default: return 'text-bs-gray-light'
  }
}

export function getSeverityBadge(severity: string): string {
  switch (severity) {
    case 'critical': return 'bs-badge-danger'
    case 'high': return 'bs-badge-orange'
    case 'medium': return 'bs-badge-warning'
    case 'low': return 'bs-badge-info'
    default: return 'bs-badge-info'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'online': return 'text-bs-green'
    case 'offline': return 'text-bs-gray-mid'
    case 'isolated': return 'text-bs-yellow'
    case 'compromised': return 'text-bs-red'
    default: return 'text-bs-gray-light'
  }
}
