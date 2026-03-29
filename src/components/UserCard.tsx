'use client'

import { User } from '@/types'
import { MapPin, ExternalLink, Calendar } from 'lucide-react'
import { joinDate, formatCount, cn } from '@/lib/utils'

interface UserCardProps {
  user: User
  compact?: boolean
  onUsernameClick?: (username: string) => void
}

export default function UserCard({ user, compact = false, onUsernameClick }: UserCardProps) {
  if (compact) {
    return (
      <div className="flex items-start gap-3 py-3 border-b border-[#262626] last:border-0">
        {user.profile_image_url ? (
          <img
            src={user.profile_image_url}
            alt={user.name || user.username}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 cursor-pointer"
            onClick={() => onUsernameClick?.(user.username)}
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-[var(--muted)] flex-shrink-0">
            ?
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="font-semibold text-[var(--text)] text-sm cursor-pointer hover:text-[#1d9bf0]"
              onClick={() => onUsernameClick?.(user.username)}
            >
              {user.name || user.username}
            </span>
            {user.is_blue_verified && (
              <svg className="w-3.5 h-3.5 text-[#1d9bf0] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            )}
            {user.verified && (
              <svg className="w-3.5 h-3.5 text-[#ffad1f] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.286-.053-.398-.133l-4.5-4.5c-.2-.2-.2-.513 0-.713.2-.2.513-.2.713 0l3.157 3.157 2.07-2.507c.196-.237.51-.337.776-.337.266 0 .517.095.7.277l1.926 2.278c.203.203.203.513 0 .713-.2.2-.513.2-.713 0z" />
              </svg>
            )}
          </div>
          <span className="text-[var(--muted)] text-xs">@{user.username}</span>
          {user.description && (
            <p className="text-[var(--text)] text-sm mt-1 line-clamp-2">{user.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--muted)]">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {user.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <span>{formatCount(user.followers_count ?? null)} followers</span>
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Avatar + name row */}
      <div className="flex items-start gap-3 mb-3">
        {user.profile_image_url ? (
          <img
            src={user.profile_image_url}
            alt={user.name || user.username}
            className="w-16 h-16 rounded-full object-cover cursor-pointer"
            onClick={() => onUsernameClick?.(user.username)}
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#333] flex items-center justify-center text-[var(--muted)] text-2xl">
            ?
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-[var(--text)] text-xl">{user.name || user.username}</span>
            {user.is_blue_verified && (
              <svg className="w-5 h-5 text-[#1d9bf0] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            )}
            {user.verified && (
              <svg className="w-5 h-5 text-[#ffad1f] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.286-.053-.398-.133l-4.5-4.5c-.2-.2-.2-.513 0-.713.2-.2.513-.2.713 0l3.157 3.157 2.07-2.507c.196-.237.51-.337.776-.337.266 0 .517.095.7.277l1.926 2.278c.203.203.203.513 0 .713-.2.2-.513.2-.713 0z" />
              </svg>
            )}
          </div>
          <p className="text-[var(--muted)] text-sm">@{user.username}</p>
        </div>
      </div>

      {/* Bio */}
      {user.description && (
        <p className="text-[var(--text)] text-sm mb-3 whitespace-pre-wrap">{user.description}</p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-4 text-[var(--muted)] text-sm flex-wrap mb-3">
        {user.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {user.location}
          </span>
        )}
        {user.created_at && (
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Joined {joinDate(user.created_at)}
          </span>
        )}
        {user.url && (
          <a
            href={user.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#1d9bf0] hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Profile
          </a>
        )}
      </div>

      {/* Stat cards */}
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-[var(--text)]">{formatCount(user.followings_count ?? null)}</span>
          <span className="text-[var(--muted)] text-sm">Following</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-[var(--text)]">{formatCount(user.followers_count ?? null)}</span>
          <span className="text-[var(--muted)] text-sm">Followers</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-[var(--text)]">{formatCount(user.statuses_count ?? null)}</span>
          <span className="text-[var(--muted)] text-sm">Posts</span>
        </div>
      </div>
    </div>
  )
}
