'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, ChevronDown, ChevronUp, Sparkles, Loader2, AlertTriangle } from 'lucide-react'
import InsightsPanel, { AIInsights } from './InsightsPanel'
import TrendsPanel from './TrendsPanel'
import UserCard from './UserCard'
import { Tweet, User } from '@/types'
import { TweetSentiment } from '@/lib/sentiment'

type ScoredTweet = Tweet & { sentiment: TweetSentiment }

interface Section {
  id: string
  title: string
  expanded: boolean
}

interface InsightsDrawerProps {
  open: boolean
  onClose: () => void
  toggleButtonRef: React.RefObject<HTMLButtonElement | null>
  scoredTweets: ScoredTweet[]
  searchQuery: string
  aiInsights: AIInsights | null
  aiInsightsLoading: boolean
  aiInsightsError: string | null
  retweetersData: User[]
  retweetersError: string | null
  retweetersCursor: string | null
  loadingMore: boolean
  loadingRetweeters: boolean
  onLoadMoreRetweeters: () => void
  onUsernameClick: (username: string) => void
}

const INITIAL_SECTIONS: Section[] = [
  { id: 'insights', title: 'AI Insights', expanded: true },
  { id: 'trends', title: 'Trends & Mentions', expanded: true },
  { id: 'retweeters', title: 'Retweeters', expanded: true },
]

export default function InsightsDrawer({
  open,
  onClose,
  toggleButtonRef,
  scoredTweets,
  searchQuery,
  aiInsights,
  aiInsightsLoading,
  aiInsightsError,
  retweetersData,
  retweetersError,
  retweetersCursor,
  loadingMore,
  loadingRetweeters,
  onLoadMoreRetweeters,
  onUsernameClick,
}: InsightsDrawerProps) {
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS)
  const [mounted, setMounted] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Prevent transition flash on first render
  useEffect(() => { setMounted(true) }, [])

  // Move focus into drawer when it opens
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => closeButtonRef.current?.focus())
    }
  }, [open])

  // Escape key closes drawer and returns focus
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        toggleButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose, toggleButtonRef])

  const toggleSection = useCallback((id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, expanded: !s.expanded } : s))
    )
  }, [])

  const handleClose = useCallback(() => {
    onClose()
    toggleButtonRef.current?.focus()
  }, [onClose, toggleButtonRef])

  return (
    <>
      {/* Mobile backdrop — closes on tap */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="complementary"
        aria-label="Search insights"
        className={[
          'fixed top-0 right-0 h-full z-50 flex flex-col',
          'bg-[var(--surface)] border-l border-[var(--border)]',
          'w-full md:w-[380px] lg:w-[460px]',
          mounted ? 'transition-transform ease-out duration-300' : '',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        style={{ boxShadow: '-8px 0 32px rgba(0,0,0,0.35)' }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--blue)]" />
            <span className="text-[var(--text)] font-semibold text-sm">Insights</span>
          </div>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-[var(--muted)] hover:text-[var(--text)]"
            aria-label="Close insights panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <Accordion
            section={sections.find((s) => s.id === 'insights')!}
            onToggle={() => toggleSection('insights')}
          >
            <InsightsPanel
              insights={aiInsights}
              loading={aiInsightsLoading}
              error={aiInsightsError}
              tweetCount={scoredTweets.length}
              searchQuery={searchQuery}
            />
          </Accordion>

          <div className="border-t border-[var(--border)]" />

          <Accordion
            section={sections.find((s) => s.id === 'trends')!}
            onToggle={() => toggleSection('trends')}
          >
            <TrendsPanel tweets={scoredTweets} searchQuery={searchQuery} />
          </Accordion>

          <div className="border-t border-[var(--border)]" />

          <Accordion
            section={sections.find((s) => s.id === 'retweeters')!}
            onToggle={() => toggleSection('retweeters')}
          >
            <RetweetersContent
              data={retweetersData}
              error={retweetersError}
              cursor={retweetersCursor}
              loadingMore={loadingMore}
              loading={loadingRetweeters}
              onLoadMore={onLoadMoreRetweeters}
              onUsernameClick={onUsernameClick}
            />
          </Accordion>
        </div>
      </div>
    </>
  )
}

function Accordion({
  section,
  onToggle,
  children,
}: {
  section: Section
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors"
        aria-expanded={section.expanded}
      >
        <span className="text-sm font-semibold text-[var(--text)]">{section.title}</span>
        {section.expanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--muted)]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          section.expanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        role="region"
        aria-label={section.title}
      >
        {children}
      </div>
    </div>
  )
}

function RetweetersContent({
  data,
  error,
  cursor,
  loadingMore,
  loading,
  onLoadMore,
  onUsernameClick,
}: {
  data: User[]
  error: string | null
  cursor: string | null
  loadingMore: boolean
  loading: boolean
  onLoadMore: () => void
  onUsernameClick: (username: string) => void
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-20 gap-2 text-[var(--muted)]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-[#dc2626]">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-[var(--muted)] text-sm px-4 text-center">
        Enter a post ID to load retweeters
      </div>
    )
  }
  return (
    <div>
      {data.map((user) => (
        <UserCard key={user.id} user={user} compact onUsernameClick={onUsernameClick} />
      ))}
      {cursor && (
        <button
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full py-3 text-sm text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors disabled:opacity-50"
        >
          {loadingMore ? 'Loading...' : 'Load More'}
        </button>
      )}
      {!cursor && data.length > 0 && (
        <div className="py-2 text-center text-xs text-[var(--muted)]">All retweeters loaded</div>
      )}
    </div>
  )
}
