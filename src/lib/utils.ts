import { formatDistanceToNow, format } from 'date-fns'
import { Tweet, User, TimelineResponse, RetweetersResponse } from '@/types'

export function relativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return dateStr
  }
}

export function fullTimestamp(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return format(date, 'MMM d, yyyy \'at\' h:mm a')
  } catch {
    return dateStr
  }
}

export function joinDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return format(date, 'MMMM yyyy')
  } catch {
    return dateStr
  }
}

export function formatCount(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function isApiError(obj: unknown): obj is { error: string; status?: number } {
  return typeof obj === 'object' && obj !== null && 'error' in obj
}

export function extractPostId(input: string): string {
  // If it's a full URL like https://x.com/user/status/123
  const urlMatch = input.match(/status\/(\d+)/)
  if (urlMatch) return urlMatch[1]
  // If it's just a numeric ID
  if (/^\d+$/.test(input)) return input
  return input
}

export function isValidSearchResult(obj: unknown): obj is Tweet[] {
  return Array.isArray(obj)
}

export function isTimelineResponse(obj: unknown): obj is TimelineResponse {
  return typeof obj === 'object' && obj !== null && 'user' in obj && 'tweets' in obj
}

export function isRetweetersResponse(obj: unknown): obj is RetweetersResponse {
  return typeof obj === 'object' && obj !== null && 'users' in obj
}

export function isSingleTweet(obj: unknown): obj is Tweet {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'text' in obj
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
