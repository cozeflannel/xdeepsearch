'use client'

import { Tweet } from '@/types'
import { formatCount } from '@/lib/utils'
import TweetCard from './TweetCard'

interface AnalyticsSummaryProps {
  tweets: Tweet[]
  onUsernameClick?: (username: string) => void
  onPostIdClick?: (postId: string) => void
}

export default function AnalyticsSummary({
  tweets,
  onUsernameClick,
  onPostIdClick,
}: AnalyticsSummaryProps) {
  if (!tweets || tweets.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-[var(--muted)] text-sm">
        Run a search or load a timeline to see analytics
      </div>
    )
  }

  // Calculate averages
  const totalPosts = tweets.length

  const totalLikes = tweets.reduce((sum, t) => sum + (t.like_count || 0), 0)
  const totalRetweets = tweets.reduce((sum, t) => sum + (t.retweet_count || 0), 0)
  const totalReplies = tweets.reduce((sum, t) => sum + (t.reply_count || 0), 0)

  // View count — exclude nulls
  const tweetsWithViews = tweets.filter((t) => t.view_count !== null)
  const totalViews = tweetsWithViews.reduce((sum, t) => sum + (t.view_count || 0), 0)

  const avgLikes = totalLikes / totalPosts
  const avgRetweets = totalRetweets / totalPosts
  const avgReplies = totalReplies / totalPosts
  const avgViews = tweetsWithViews.length > 0 ? totalViews / tweetsWithViews.length : 0

  // Top post by engagement
  const topPost = tweets.reduce((best, t) => {
    const score = (t.like_count || 0) + (t.retweet_count || 0) + (t.quote_count || 0)
    const bestScore = (best.like_count || 0) + (best.retweet_count || 0) + (best.quote_count || 0)
    return score > bestScore ? t : best
  }, tweets[0])

  // Media breakdown
  const photoCount = tweets.filter((t) => t.media?.some((m) => m.type === 'photo')).length
  const videoCount = tweets.filter((t) => t.media?.some((m) => m.type === 'video')).length
  const gifCount = tweets.filter((t) => t.media?.some((m) => m.type === 'animated_gif')).length
  const noMediaCount = tweets.filter((t) => !t.media || t.media.length === 0).length

  // Original vs amplified
  const originalCount = tweets.filter((t) => !t.is_retweet && !t.is_quote_tweet).length
  const retweetCount = tweets.filter((t) => t.is_retweet).length
  const quoteCount = tweets.filter((t) => t.is_quote_tweet && !t.is_retweet).length

  const maxMediaCount = Math.max(photoCount, videoCount, gifCount, noMediaCount)

  return (
    <div className="p-4 space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Posts" value={String(totalPosts)} />
        <StatCard label="Avg Likes" value={formatCount(Math.round(avgLikes))} />
        <StatCard label="Avg Retweets" value={formatCount(Math.round(avgRetweets))} />
        <StatCard label="Avg Replies" value={formatCount(Math.round(avgReplies))} />
      </div>

      {avgViews > 0 && (
        <StatCard label="Avg Views" value={formatCount(Math.round(avgViews))} />
      )}

      {/* Top post */}
      {topPost && (
        <div>
          <h3 className="text-[var(--muted)] text-xs font-medium mb-2 uppercase tracking-wider">
            Top Post
          </h3>
          <div className="bg-[var(--input-bg)] rounded-lg p-3">
            <TweetCard
              tweet={topPost}
              compact
              onUsernameClick={onUsernameClick}
              onPostIdClick={onPostIdClick}
            />
          </div>
        </div>
      )}

      {/* Media breakdown */}
      <div>
        <h3 className="text-[var(--muted)] text-xs font-medium mb-2 uppercase tracking-wider">
          Media Breakdown
        </h3>
        <div className="space-y-1.5">
          <BarRow label="Photos" count={photoCount} max={maxMediaCount} color="bg-[#1d9bf0]" />
          <BarRow label="Videos" count={videoCount} max={maxMediaCount} color="bg-[#00ba7c]" />
          <BarRow label="GIFs" count={gifCount} max={maxMediaCount} color="bg-[#794bc4]" />
          <BarRow label="No Media" count={noMediaCount} max={maxMediaCount} color="bg-[#71717a]" />
        </div>
      </div>

      {/* Original vs amplified */}
      <div>
        <h3 className="text-[var(--muted)] text-xs font-medium mb-2 uppercase tracking-wider">
          Original vs Amplified
        </h3>
        <div className="flex gap-1 h-4 rounded-full overflow-hidden">
          {originalCount > 0 && (
            <div
              className="bg-[#1d9bf0] h-full transition-all"
              style={{ width: `${(originalCount / totalPosts) * 100}%` }}
              title={`Original: ${originalCount}`}
            />
          )}
          {retweetCount > 0 && (
            <div
              className="bg-[#00ba7c] h-full transition-all"
              style={{ width: `${(retweetCount / totalPosts) * 100}%` }}
              title={`Retweets: ${retweetCount}`}
            />
          )}
          {quoteCount > 0 && (
            <div
              className="bg-[#794bc4] h-full transition-all"
              style={{ width: `${(quoteCount / totalPosts) * 100}%` }}
              title={`Quotes: ${quoteCount}`}
            />
          )}
        </div>
        <div className="flex gap-3 mt-1.5 text-xs text-[var(--muted)]">
          {originalCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1d9bf0] inline-block" /> {originalCount} original</span>}
          {retweetCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00ba7c] inline-block" /> {retweetCount} RT</span>}
          {quoteCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#794bc4] inline-block" /> {quoteCount} quotes</span>}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--input-bg)] rounded-lg p-3">
      <p className="text-[var(--muted)] text-xs mb-0.5">{label}</p>
      <p className="text-[var(--text)] text-xl font-bold">{value}</p>
    </div>
  )
}

function BarRow({
  label,
  count,
  max,
  color,
}: {
  label: string
  count: number
  max: number
  color: string
}) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--muted)] text-xs w-20 text-right">{label}</span>
      <div className="flex-1 bg-[var(--border)] rounded-full h-2 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[var(--text)] text-xs w-6 text-right">{count}</span>
    </div>
  )
}
