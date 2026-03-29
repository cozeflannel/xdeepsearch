'use client'

import { Tweet } from '@/types'
import { relativeTime, fullTimestamp, formatCount, cn } from '@/lib/utils'
import {
  Heart,
  Repeat2,
  MessageCircle,
  Quote,
  BarChart2,
  ExternalLink,
  Video,
  Image,
  Repeat,
} from 'lucide-react'

interface TweetCardProps {
  tweet: Tweet
  compact?: boolean
  onUsernameClick?: (username: string) => void
  onPostIdClick?: (postId: string) => void
  showRetweetHeader?: boolean
  retweetedBy?: string
}

export default function TweetCard({
  tweet,
  compact = false,
  onUsernameClick,
  onPostIdClick,
  showRetweetHeader = false,
  retweetedBy,
}: TweetCardProps) {
  const user = tweet.user

  return (
    <div className={cn('border-b border-[#262626] last:border-0', compact ? 'py-3 px-3' : 'p-4')}>
      {/* Retweet header */}
      {showRetweetHeader && retweetedBy && (
        <div className="flex items-center gap-1 text-muted text-xs mb-2">
          <Repeat className="w-3 h-3" />
          <span>Retweeted by @{retweetedBy}</span>
        </div>
      )}

      {/* Retweet original */}
      {tweet.is_retweet && tweet.retweet && (
        <div className="border-l-2 border-[#00ba7c] pl-3 mb-2">
          <TweetCard tweet={tweet.retweet} compact />
        </div>
      )}

      {/* Author identity row */}
      {user && (
        <div className="flex items-center gap-2 mb-2">
          {user.profile_image_url ? (
            <img
              src={user.profile_image_url}
              alt={user.name || user.username}
              className={cn('rounded-full object-cover', compact ? 'w-8 h-8' : 'w-10 h-10')}
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div
              className={cn(
                'rounded-full bg-[#333] flex items-center justify-center text-[var(--muted)]',
                compact ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
              )}
            >
              ?
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={cn('font-semibold text-[var(--text)]', compact ? 'text-sm' : 'text-[15px]')}
              >
                {user.name || user.username}
              </span>
              <span className="text-[var(--muted)] text-sm">@{user.username}</span>
              {user.is_blue_verified && (
                <svg
                  className="w-4 h-4 text-[#1d9bf0] flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              )}
              {user.verified && (
                <svg
                  className="w-4 h-4 text-[#ffad1f] flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.286-.053-.398-.133l-4.5-4.5c-.2-.2-.2-.513 0-.713.2-.2.513-.2.713 0l3.157 3.157 2.07-2.507c.196-.237.51-.337.776-.337.266 0 .517.095.7.277l1.926 2.278c.203.203.203.513 0 .713-.2.2-.513.2-.713 0z" />
                </svg>
              )}
            </div>
          </div>
          {tweet.url && (
            <a
              href={tweet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--muted)] hover:text-[#1d9bf0] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Tweet body */}
      <p
        className={cn('text-[var(--text)] whitespace-pre-wrap break-words mb-2', compact ? 'text-sm' : 'text-[15px] leading-[1.4]')}
        style={{ wordBreak: 'break-word' }}
      >
        {tweet.text}
      </p>

      {/* Media previews */}
      {tweet.media && tweet.media.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tweet.media.map((m, i) => (
            <div key={i} className="relative">
              {m.type === 'photo' && (
                <img
                  src={m.media_url}
                  alt=""
                  className="rounded-lg max-h-48 object-cover"
                  loading="lazy"
                />
              )}
              {m.type === 'video' && (
                <div className="relative rounded-lg overflow-hidden bg-[#222]">
                  <img src={m.media_url} alt="" className="max-h-48 object-cover opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                      <Video className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              )}
              {m.type === 'animated_gif' && (
                <div className="relative rounded-lg overflow-hidden bg-[#222]">
                  <img src={m.media_url} alt="" className="max-h-48 object-cover opacity-80" />
                  <div className="absolute bottom-2 left-2 bg-black/60 text-xs text-white px-1.5 py-0.5 rounded">
                    GIF
                  </div>
                </div>
              )}
              <span
                className={cn(
                  'absolute bottom-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded',
                  m.type === 'photo' ? 'bg-[#1d9bf0]/80 text-white' : 'bg-black/60 text-white'
                )}
              >
                {m.type === 'photo' ? <Image className="w-3 h-3 inline" /> : m.type === 'video' ? <Video className="w-3 h-3 inline" /> : 'GIF'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quoted tweet */}
      {tweet.quote && (
        <div className="border border-[#262626] rounded-lg p-3 mb-2 bg-[var(--surface)]">
          <TweetCard tweet={tweet.quote} compact />
        </div>
      )}

      {/* Metadata row */}
      <div className="flex items-center gap-4 text-[var(--muted)] text-xs flex-wrap">
        <span
          className="cursor-help"
          title={fullTimestamp(tweet.created_at)}
        >
          {relativeTime(tweet.created_at)}
        </span>
        {tweet.lang && tweet.lang !== 'en' && (
          <span className="bg-[var(--border)] text-[var(--muted)] px-1.5 py-0.5 rounded text-[10px] uppercase">
            {tweet.lang}
          </span>
        )}
        {tweet.is_retweet && (
          <span className="flex items-center gap-0.5 text-[#00ba7c]">
            <Repeat className="w-3 h-3" /> Retweet
          </span>
        )}
        {tweet.is_quote_tweet && (
          <span className="flex items-center gap-0.5 text-[#1d9bf0]">
            <Quote className="w-3 h-3" /> Quote
          </span>
        )}
      </div>

      {/* Engagement metrics */}
      <div className="flex items-center gap-4 mt-2">
        <span className="flex items-center gap-1 text-[var(--muted)] text-sm">
          <MessageCircle className="w-4 h-4" />
          <span className={tweet.reply_count > 0 ? 'text-[var(--text)]' : ''}>
            {formatCount(tweet.reply_count)}
          </span>
        </span>
        <span className="flex items-center gap-1 text-[var(--muted)] text-sm">
          <Repeat2 className="w-4 h-4" />
          <span className={tweet.retweet_count > 0 ? 'text-[var(--text)]' : ''}>
            {formatCount(tweet.retweet_count)}
          </span>
        </span>
        <span className="flex items-center gap-1 text-[var(--muted)] text-sm">
          <Heart className="w-4 h-4" />
          <span className={tweet.like_count > 0 ? 'text-[var(--text)]' : ''}>
            {formatCount(tweet.like_count)}
          </span>
        </span>
        <span className="flex items-center gap-1 text-[var(--muted)] text-sm">
          <Quote className="w-4 h-4" />
          <span className={tweet.quote_count > 0 ? 'text-[var(--text)]' : ''}>
            {formatCount(tweet.quote_count)}
          </span>
        </span>
        <span className="flex items-center gap-1 text-[var(--muted)] text-sm">
          <BarChart2 className="w-4 h-4" />
          <span className={tweet.view_count ? 'text-[var(--text)]' : ''}>
            {tweet.view_count !== null ? formatCount(tweet.view_count) : '—'}
          </span>
        </span>
      </div>

      {/* Clickable post ID */}
      {tweet.id && onPostIdClick && (
        <button
          onClick={() => onPostIdClick(tweet.id)}
          className="text-[var(--muted)] text-xs mt-2 hover:text-[#1d9bf0] transition-colors"
        >
          ID: {tweet.id}
        </button>
      )}
    </div>
  )
}
