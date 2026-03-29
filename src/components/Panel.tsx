'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface PanelProps {
  title: string
  subtitle?: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyMessage?: string | null
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export default function Panel({
  title,
  subtitle,
  loading = false,
  error = null,
  onRetry,
  emptyMessage = null,
  children,
  className,
  action,
}: PanelProps) {
  return (
    <div
      className={cn(
        'bg-[var(--surface)] rounded-lg border border-[#262626] overflow-hidden flex flex-col',
        className
      )}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626] flex-shrink-0">
        <div>
          <h2 className="text-[var(--text)] font-semibold text-sm">{title}</h2>
          {subtitle && <p className="text-[var(--muted)] text-xs mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-3 bg-[#dc2626]/10 border-b border-[#dc2626]/30">
          <p className="text-[#dc2626] text-sm">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs text-[#dc2626] underline hover:no-underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 gap-2 text-[var(--muted)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : error ? null : emptyMessage ? (
          <div className="flex items-center justify-center h-32 text-[var(--muted)] text-sm">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
