'use client'

import { useState } from 'react'
import { Search, User, Hash, Loader2, Sun, Moon, SlidersHorizontal, ArrowRight, Sparkles, X } from 'lucide-react'
import { DashboardState } from '@/types'
import { useTheme } from './ThemeProvider'

interface TopBarProps {
  state: DashboardState
  onChange: (state: Partial<DashboardState>) => void
  onSearch: () => void
  onLoadTimeline: () => void
  onLoadReplies: () => void
  onFetchPost: () => void
  onLoadRetweeters: () => void
  loading: boolean
  activeEndpoint: string | null
  drawerOpen: boolean
  onToggleDrawer: () => void
  hasInsightsData: boolean
  drawerToggleRef: React.RefObject<HTMLButtonElement | null>
}

const LANGUAGES = [
  { code: '', label: 'Any' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ar', label: 'Arabic' },
  { code: 'it', label: 'Italian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ru', label: 'Russian' },
]

export default function TopBar({
  state,
  onChange,
  onSearch,
  onLoadTimeline,
  onLoadReplies,
  onFetchPost,
  onLoadRetweeters,
  loading,
  activeEndpoint,
  drawerOpen,
  onToggleDrawer,
  hasInsightsData,
  drawerToggleRef,
}: TopBarProps) {
  const [showFilters, setShowFilters] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const hasSearchQuery = state.searchQuery.trim().length > 0
  const hasUsername = state.username.trim().length > 0
  const hasPostId = state.postIdUrl.trim().length > 0

  const endpointHint =
    hasSearchQuery && hasUsername
      ? 'x_user'
      : hasSearchQuery
      ? 'x (keyword search)'
      : hasUsername
      ? 'x_timeline + x_replies'
      : hasPostId
      ? 'x_post / x_urls'
      : null

  const getActionLabel = () => {
    if (hasPostId) return 'Fetch Post'
    if (hasSearchQuery) return 'Search'
    if (hasUsername) return 'Load Timeline'
    return 'Search'
  }

  const handlePrimaryAction = () => {
    if (hasPostId) onFetchPost()
    else if (hasSearchQuery) onSearch()
    else if (hasUsername) onLoadTimeline()
  }

  const inputClass = `w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] text-sm rounded-lg focus:outline-none focus:border-[var(--blue)] placeholder-[var(--muted)] transition-colors`
  const labelClass = 'text-[var(--muted)] text-xs mb-1 block'
  const filterGridClass = 'mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-4 gap-x-6 gap-y-3'

  return (
    <div
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Main bar */}
      <div className="px-4 py-3">
        {/* Row 1: Inputs + Controls */}
        <div className="flex gap-3 items-end">
          {/* Search input — takes most space */}
          <div className="flex-1 min-w-0">
            <label className={labelClass}>Search</label>
            <div className="flex">
              <span
                className="inline-flex items-center px-3 rounded-l-lg bg-[var(--input-bg)] border border-r-0"
                style={{ borderColor: 'var(--input-border)' }}
              >
                <Hash className="w-4 h-4" style={{ color: 'var(--muted)' }} />
              </span>
              <input
                type="text"
                value={state.searchQuery}
                onChange={(e) => onChange({ searchQuery: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                placeholder="Keyword, hashtag, or phrase..."
                className={inputClass}
                style={{ borderRadius: '0 8px 8px 0' }}
              />
            </div>
          </div>

          {/* Username */}
          <div className="w-36">
            <label className={labelClass}>@Username</label>
            <div className="flex">
              <span
                className="inline-flex items-center px-2.5 rounded-l-lg bg-[var(--input-bg)] border border-r-0"
                style={{ borderColor: 'var(--input-border)' }}
              >
                <User className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
              </span>
              <input
                type="text"
                value={state.username}
                onChange={(e) => onChange({ username: e.target.value.replace('@', '') })}
                placeholder="username"
                className={inputClass}
                style={{ borderRadius: '0 8px 8px 0' }}
              />
            </div>
          </div>

          {/* Post ID */}
          <div className="w-48">
            <label className={labelClass}>Post ID / URL</label>
            <input
              type="text"
              value={state.postIdUrl}
              onChange={(e) => onChange({ postIdUrl: e.target.value })}
              placeholder="ID or https://x.com/..."
              className={inputClass}
            />
          </div>

          {/* Divider */}
          <div className="w-px h-10 mb-0.5 flex-shrink-0" style={{ backgroundColor: 'var(--border)' }} />

          {/* Sort */}
          <div>
            <label className={labelClass}>Sort</label>
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--input-border)' }}
            >
              {(['Latest', 'Top'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => onChange({ sort: s })}
                  className="px-3 py-2 text-xs font-medium transition-colors"
                  style={
                    state.sort === s
                      ? { backgroundColor: 'var(--blue)', color: '#fff' }
                      : { backgroundColor: 'var(--input-bg)', color: 'var(--muted)' }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div>
            <label className={labelClass}>Filters</label>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors"
              style={
                showFilters
                  ? { backgroundColor: 'var(--blue)', borderColor: 'var(--blue)', color: '#fff' }
                  : { backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--muted)' }
              }
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-10 mb-0.5 flex-shrink-0" style={{ backgroundColor: 'var(--border)' }} />

          {/* Theme toggle */}
          <div>
            <label className={labelClass}>Theme</label>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-lg border transition-colors"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--muted)' }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Primary action */}
          <div>
            <label className={labelClass} style={{ opacity: 0 }}>Go</label>
            <button
              onClick={handlePrimaryAction}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
              style={{ backgroundColor: 'var(--blue)', color: '#fff' }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {getActionLabel()}
            </button>
          </div>

          {/* Insights drawer toggle */}
          <div>
            <label className={labelClass} style={{ opacity: 0 }}>Insights</label>
            <button
              ref={drawerToggleRef}
              onClick={onToggleDrawer}
              className="relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap"
              style={
                drawerOpen
                  ? { backgroundColor: 'var(--blue)', borderColor: 'var(--blue)', color: '#fff' }
                  : { backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--muted)' }
              }
              aria-label={drawerOpen ? 'Close insights panel' : 'Open insights panel'}
              aria-expanded={drawerOpen}
            >
              {drawerOpen ? <X className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              Insights
              {hasInsightsData && !drawerOpen && (
                <span
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--blue)]"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>

        {/* Endpoint hint */}
        {endpointHint && (
          <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
            Endpoint: <span style={{ color: 'var(--blue)' }}>{endpointHint}</span>
          </p>
        )}
      </div>

      {/* Expanded filters panel */}
      {showFilters && (
        <div className={filterGridClass} style={{ padding: '0 16px 12px' }}>
          {/* Date range */}
          <div>
            <label className={labelClass}>Start Date</label>
            <input
              type="date"
              value={state.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>End Date</label>
            <input
              type="date"
              value={state.endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Language */}
          <div>
            <label className={labelClass}>Language</label>
            <select
              value={state.lang}
              onChange={(e) => onChange({ lang: e.target.value })}
              className={inputClass}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Sentiment */}
          <div>
            <label className={labelClass}>Sentiment</label>
            <select
              value={state.sentimentFilter}
              onChange={(e) => onChange({ sentimentFilter: e.target.value as typeof state.sentimentFilter })}
              className={inputClass}
            >
              <option value="all">All</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          {/* Result count */}
          <div>
            <label className={labelClass}>Results (1–100)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={state.resultCount}
              onChange={(e) => onChange({ resultCount: Math.max(1, Math.min(100, parseInt(e.target.value) || 20)) })}
              className={inputClass}
            />
          </div>

          {/* Verification toggles */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>User Type</label>
            <div className="flex gap-4">
              <Toggle
                label="Verified"
                checked={state.verifiedOnly}
                onChange={(v) => onChange({ verifiedOnly: v })}
              />
              <Toggle
                label="Blue"
                checked={state.blueVerifiedOnly}
                onChange={(v) => onChange({ blueVerifiedOnly: v })}
              />
            </div>
          </div>

          {/* Media toggles */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Media Type</label>
            <div className="flex gap-4">
              <Toggle
                label="Video"
                checked={state.videoOnly}
                onChange={(v) => onChange({ videoOnly: v })}
              />
              <Toggle
                label="Images"
                checked={state.imageOnly}
                onChange={(v) => onChange({ imageOnly: v })}
              />
              <Toggle
                label="Quotes"
                checked={state.quoteOnly}
                onChange={(v) => onChange({ quoteOnly: v })}
              />
            </div>
          </div>

          {/* Min Likes */}
          <div>
            <label className={labelClass}>
              Min Likes: <span style={{ color: 'var(--text)' }}>{state.minLikes}</span>
            </label>
            <input
              type="range"
              min={0}
              max={1000}
              step={10}
              value={state.minLikes}
              onChange={(e) => onChange({ minLikes: parseInt(e.target.value) })}
              className="w-full"
              style={{ accentColor: 'var(--blue)' }}
            />
          </div>

          {/* Min RTs */}
          <div>
            <label className={labelClass}>
              Min RTs: <span style={{ color: 'var(--text)' }}>{state.minRetweets}</span>
            </label>
            <input
              type="range"
              min={0}
              max={500}
              step={5}
              value={state.minRetweets}
              onChange={(e) => onChange({ minRetweets: parseInt(e.target.value) })}
              className="w-full"
              style={{ accentColor: 'var(--green)' }}
            />
          </div>

          {/* Min Replies */}
          <div>
            <label className={labelClass}>
              Min Replies: <span style={{ color: 'var(--text)' }}>{state.minReplies}</span>
            </label>
            <input
              type="range"
              min={0}
              max={200}
              step={5}
              value={state.minReplies}
              onChange={(e) => onChange({ minReplies: parseInt(e.target.value) })}
              className="w-full"
              style={{ accentColor: 'var(--blue)' }}
            />
          </div>

          {/* Secondary actions */}
          <div className="flex items-center gap-2 col-span-4 border-t pt-3 mt-1" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Quick actions:</span>
            <button
              onClick={onLoadTimeline}
              disabled={loading || !hasUsername}
              className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--input-border)', color: 'var(--muted)', backgroundColor: 'var(--input-bg)' }}
            >
              Load Timeline
            </button>
            <button
              onClick={onLoadReplies}
              disabled={loading || !hasUsername}
              className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--input-border)', color: 'var(--muted)', backgroundColor: 'var(--input-bg)' }}
            >
              Load Replies
            </button>
            <button
              onClick={onLoadRetweeters}
              disabled={loading || !hasPostId}
              className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--input-border)', color: 'var(--muted)', backgroundColor: 'var(--input-bg)' }}
            >
              Load Retweeters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        className="w-8 h-4 rounded-full transition-colors relative flex-shrink-0"
        style={{ backgroundColor: checked ? 'var(--blue)' : 'var(--border)' }}
        onClick={() => onChange(!checked)}
      >
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(2px)' }}
        />
      </div>
      <span className="text-xs" style={{ color: 'var(--muted)' }}>{label}</span>
    </label>
  )
}
