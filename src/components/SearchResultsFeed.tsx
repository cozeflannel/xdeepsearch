'use client'

import { Tweet } from '@/types'
import { relativeTime, formatCount } from '@/lib/utils'
import {
  Heart,
  Repeat2,
  MessageCircle,
  Quote,
  BarChart2,
  ExternalLink,
  Video,
  Image,
  TrendingUp,
  Minus,
  TrendingDown,
} from 'lucide-react'
import { useState } from 'react'

interface SearchResultsFeedProps {
  tweets: (Tweet & { sentiment?: { classification: 'positive' | 'neutral' | 'negative'; score: number } })[]
  searchQuery: string
  loading: boolean
  error: string | null
  onRetry: () => void
  onUsernameClick: (username: string) => void
  onPostIdClick: (postId: string) => void
  emptyMessage?: string | null
}

export default function SearchResultsFeed({
  tweets,
  searchQuery,
  loading,
  error,
  onRetry,
  onUsernameClick,
  onPostIdClick,
  emptyMessage,
}: SearchResultsFeedProps) {
  const [expandedTweet, setExpandedTweet] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--border)]" />
              <div className="flex-1">
                <div className="h-3 bg-[var(--border)] rounded w-32 mb-2" />
                <div className="h-2.5 bg-[var(--border)] rounded w-20" />
              </div>
            </div>
            <div className="space-y-2 ml-13">
              <div className="h-3 bg-[var(--border)] rounded w-full" />
              <div className="h-3 bg-[var(--border)] rounded w-4/5" />
              <div className="h-3 bg-[var(--border)] rounded w-3/5" />
            </div>
            <div className="flex gap-4 mt-3 ml-13">
              <div className="h-3 bg-[var(--border)] rounded w-16" />
              <div className="h-3 bg-[var(--border)] rounded w-16" />
              <div className="h-3 bg-[var(--border)] rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-5">
        <div className="bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-lg p-4">
          <p className="text-[#dc2626] text-sm font-medium">Search failed</p>
          <p className="text-[#f87171] text-xs mt-1">{error}</p>
          <button
            onClick={onRetry}
            className="mt-3 text-xs text-[#dc2626] underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-[#1d9bf0]/10 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-[#1d9bf0]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
        <p className="text-[var(--text)] font-medium text-sm mb-1">Search X for anything</p>
        <p className="text-[var(--muted)] text-xs max-w-xs">
          Enter keywords, hashtags, or topics in the search bar above to see real posts, top voices, and AI-powered insights
        </p>
      </div>
    )
  }

  if (tweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-[var(--text)] font-medium text-sm mb-1">No results found</p>
        <p className="text-[var(--muted)] text-xs">
          No posts match "{searchQuery}" — try different keywords or remove filters
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#1a1a1a]">
      {tweets.map((tweet, idx) => {
        const user = tweet.user
        const isExpanded = expandedTweet === tweet.id

        return (
          <div key={tweet.id} className="px-4 py-4 hover:bg-[var(--surface-hover)]/50 transition-colors">
            {/* Author row */}
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-shrink-0 cursor-pointer" onClick={() => user && onUsernameClick(user.username)}>
                {user?.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-[var(--muted)]">?</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="font-semibold text-[var(--text)] text-sm cursor-pointer hover:underline"
                    onClick={() => user && onUsernameClick(user.username)}
                  >
                    {user?.name || user?.username || 'Unknown'}
                  </span>
                  <span className="text-[var(--muted)] text-xs">@{user?.username || 'unknown'}</span>
                  {user?.is_blue_verified && (
                    <svg className="w-3.5 h-3.5 text-[#1d9bf0] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  )}
                  {user?.verified && (
                    <svg className="w-3.5 h-3.5 text-[#ffad1f] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.286-.053-.398-.133l-4.5-4.5c-.2-.2-.2-.513 0-.713.2-.2.513-.2.713 0l3.157 3.157 2.07-2.507c.196-.237.51-.337.776-.337.266 0 .517.095.7.277l1.926 2.278c.203.203.203.513 0 .713-.2.2-.513.2-.713 0z" />
                    </svg>
                  )}
                </div>

                {/* Follower count + post count */}
                <div className="flex items-center gap-2 text-xs text-[var(--muted)] mt-0.5">
                  <span className="font-medium">{formatCount(user?.followers_count ?? 0)} followers</span>
                  <span>·</span>
                  <span>{formatCount(user?.statuses_count ?? 0)} posts</span>
                  {tweet.lang && tweet.lang !== 'en' && (
                    <>
                      <span>·</span>
                      <span className="bg-[var(--border)] text-[10px] px-1.5 py-0.5 rounded uppercase">{tweet.lang}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Timestamp + source */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {/* Sentiment badge */}
                {tweet.sentiment && (
                  <SentimentBadge sentiment={tweet.sentiment.classification} />
                )}
                <span className="text-[var(--muted)] text-xs whitespace-nowrap" title={tweet.created_at}>
                  {relativeTime(tweet.created_at)}
                </span>
                {tweet.url && (
                  <a
                    href={tweet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--muted)] hover:text-[#1d9bf0] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Tweet body */}
            <div className="ml-13">
              <p className={`text-[var(--text)] text-sm leading-relaxed ${!isExpanded && tweet.text.length > 280 ? 'line-clamp-3' : ''}`}>
                {tweet.text}
              </p>

              {tweet.text.length > 280 && (
                <button
                  onClick={() => setExpandedTweet(isExpanded ? null : tweet.id)}
                  className="text-[#1d9bf0] text-xs mt-1 hover:underline"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}

              {/* Media */}
              {tweet.media && tweet.media.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tweet.media.slice(0, 2).map((m, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden bg-[var(--surface-hover)]">
                      {m.type === 'photo' && (
                        <img src={m.media_url} alt="" className="max-h-40 rounded-lg object-cover" loading="lazy" />
                      )}
                      {m.type === 'video' && (
                        <div className="relative">
                          <img src={m.media_url} alt="" className="max-h-40 opacity-80" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                              <Video className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>
                      )}
                      {m.type === 'animated_gif' && (
                        <div className="relative">
                          <img src={m.media_url} alt="" className="max-h-40 opacity-80" />
                          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded">GIF</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quoted tweet */}
              {tweet.quote && (
                <div className="border border-[#262626] rounded-lg p-3 mt-2 bg-[var(--surface)]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Quote className="w-3 h-3 text-[var(--muted)]" />
                    <span className="text-xs text-[var(--muted)]">Quoted post</span>
                  </div>
                  <p className="text-[var(--text)] text-sm leading-relaxed line-clamp-2">
                    {tweet.quote.text}
                  </p>
                  <p className="text-[var(--muted)] text-xs mt-1">
                    — @{tweet.quote.user?.username || 'unknown'}
                  </p>
                </div>
              )}

              {/* Engagement metrics */}
              <div className="flex items-center gap-4 mt-2">
                <button className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[#f4212e] transition-colors group">
                  <Heart className="w-4 h-4 group-hover:fill-current" />
                  <span className="text-xs">{formatCount(tweet.like_count)}</span>
                </button>
                <button className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[#00ba7c] transition-colors group">
                  <Repeat2 className="w-4 h-4" />
                  <span className="text-xs">{formatCount(tweet.retweet_count)}</span>
                </button>
                <button className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[#1d9bf0] transition-colors group">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">{formatCount(tweet.reply_count)}</span>
                </button>
                <button className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[#1d9bf0] transition-colors">
                  <BarChart2 className="w-4 h-4" />
                  <span className="text-xs">{tweet.view_count !== null ? formatCount(tweet.view_count) : '—'}</span>
                </button>
                <button
                  onClick={() => onPostIdClick(tweet.id)}
                  className="ml-auto text-[var(--muted)] hover:text-[#1d9bf0] text-xs transition-colors"
                >
                  #{idx + 1}
                </button>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-1.5">
                {tweet.is_retweet && (
                  <span className="flex items-center gap-1 text-[10px] text-[#00ba7c] bg-[#00ba7c]/10 px-1.5 py-0.5 rounded">
                    <Repeat2 className="w-2.5 h-2.5" /> RT
                  </span>
                )}
                {tweet.is_quote_tweet && (
                  <span className="flex items-center gap-1 text-[10px] text-[#1d9bf0] bg-[#1d9bf0]/10 px-1.5 py-0.5 rounded">
                    <Quote className="w-2.5 h-2.5" /> Quote
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SentimentBadge({ sentiment }: { sentiment: 'positive' | 'neutral' | 'negative' }) {
  if (sentiment === 'positive') {
    return (
      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#00ba7c]/10 text-[#00ba7c] border border-[#00ba7c]/20">
        <TrendingUp className="w-2.5 h-2.5" /> Positive
      </span>
    )
  }
  if (sentiment === 'negative') {
    return (
      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#f4212e]/10 text-[#f4212e] border border-[#f4212e]/20">
        <TrendingDown className="w-2.5 h-2.5" /> Negative
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#71717a]/10 text-[var(--muted)] border border-[#71717a]/20">
      <Minus className="w-2.5 h-2.5" /> Neutral
    </span>
  )
}
