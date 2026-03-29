'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { DashboardState, Tweet, TimelineResponse, RetweetersResponse, User } from '@/types'
import {
  extractPostId,
  isApiError,
  isValidSearchResult,
  isTimelineResponse,
  isRetweetersResponse,
  isSingleTweet,
} from '@/lib/utils'
import { TweetSentiment, analyzeTweet, analyzeOverall } from '@/lib/sentiment'
import TopBar from '@/components/TopBar'
import Panel from '@/components/Panel'
import AnimatedBackground from '@/components/AnimatedBackground'
import SearchResultsFeed from '@/components/SearchResultsFeed'
import TweetCard from '@/components/TweetCard'
import UserCard from '@/components/UserCard'
import { AIInsights } from '@/components/InsightsPanel'
import InsightsDrawer from '@/components/InsightsDrawer'
import UserProfileModal from '@/components/UserProfileModal'

export type ScoredTweet = Tweet & { sentiment: TweetSentiment }

const DEFAULT_STATE: DashboardState = {
  searchQuery: '',
  username: '',
  postIdUrl: '',
  startDate: '',
  endDate: '',
  sort: 'Latest',
  lang: '',
  verifiedOnly: false,
  blueVerifiedOnly: false,
  videoOnly: false,
  imageOnly: false,
  quoteOnly: false,
  minLikes: 0,
  minRetweets: 0,
  minReplies: 0,
  resultCount: 20,
  sentimentFilter: 'all',
}

type LoadingState = {
  search: boolean
  timeline: boolean
  replies: boolean
  retweeters: boolean
  post: boolean
}

export default function Dashboard() {
  const [state, setState] = useState<DashboardState>(DEFAULT_STATE)
  const [loading, setLoading] = useState<LoadingState>({
    search: false,
    timeline: false,
    replies: false,
    retweeters: false,
    post: false,
  })
  const [activeTab, setActiveTab] = useState<'timeline' | 'replies'>('timeline')

  // Search results — these are the source of truth for BOTH display and analytics
  const [searchResults, setSearchResults] = useState<Tweet[]>([])
  // Sentiment-scored versions — derived from searchResults, filtered by sentiment
  const [scoredTweets, setScoredTweets] = useState<ScoredTweet[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('')

  // Timeline + profile
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null)
  const [timelineError, setTimelineError] = useState<string | null>(null)

  // Replies
  const [repliesData, setRepliesData] = useState<Tweet[]>([])
  const [repliesError, setRepliesError] = useState<string | null>(null)

  // Retweeters
  const [retweetersData, setRetweetersData] = useState<User[]>([])
  const [retweetersError, setRetweetersError] = useState<string | null>(null)
  const [retweetersCursor, setRetweetersCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  // Single post
  const [singlePost, setSinglePost] = useState<Tweet | null>(null)
  const [postError, setPostError] = useState<string | null>(null)

  // AI insights
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false)
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null)

  // AI tweet summaries — keyed by tweet ID
  const [tweetSummaries, setTweetSummaries] = useState<Record<string, string>>({})

  // Enhanced query shown after search
  const [enhancedQuery, setEnhancedQuery] = useState<string | null>(null)

  // User profile modal
  const [modalUser, setModalUser] = useState<User | null>(null)

  // Insights drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerToggleRef = useRef<HTMLButtonElement>(null)

  // Search query ref — used to ignore stale responses
  const activeSearchQueryRef = useRef<string>('')

  const updateState = useCallback((updates: Partial<DashboardState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleApiError = useCallback((err: unknown, setter: (err: string) => void) => {
    if (isApiError(err)) {
      setter(err.error)
    } else if (err instanceof Error) {
      setter(err.message)
    } else {
      setter('Request failed. Check connection and retry.')
    }
  }, [])

  // AI INSIGHTS — fire after search results arrive
  const fetchInsights = useCallback(async (
    query: string,
    scored: ScoredTweet[]
  ) => {
    setAiInsights(null)
    setAiInsightsLoading(true)
    setAiInsightsError(null)
    try {
      const sentimentSummary = analyzeOverall(scored)
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweets: scored.map((t) => ({
            id: t.id,
            text: t.text,
            like_count: t.like_count,
            retweet_count: t.retweet_count,
            reply_count: t.reply_count,
            user: { username: t.user?.username, followers_count: t.user?.followers_count ?? null },
            sentiment: t.sentiment,
          })),
          searchQuery: query,
          sentimentSummary,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setAiInsightsError(data.error || 'AI analysis failed')
      } else {
        setAiInsights(data as AIInsights)
      }
    } catch {
      setAiInsightsError('AI analysis failed — check your ANTHROPIC_API_KEY')
    } finally {
      setAiInsightsLoading(false)
    }
  }, [])

  // TWEET SUMMARIES — fire after search results arrive
  const fetchTweetSummaries = useCallback(async (tweets: Tweet[]) => {
    try {
      const res = await fetch('/api/ai/tweet-summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweets: tweets.slice(0, 30).map((t) => ({ id: t.id, text: t.text })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (!data.error) setTweetSummaries(data as Record<string, string>)
      }
    } catch {
      // Summaries are supplementary — fail silently
    }
  }, [])

  // SEARCH
  const doSearch = useCallback(async () => {
    const rawQuery = state.searchQuery.trim()
    if (!rawQuery) return

    // Mark this query as active
    activeSearchQueryRef.current = rawQuery
    setLastSearchQuery(rawQuery)

    // Clear old results and AI state
    setSearchResults([])
    setSearchError(null)
    setEnhancedQuery(null)
    setAiInsights(null)
    setTweetSummaries({})
    setLoading((l) => ({ ...l, search: true }))

    // Enhance query (best-effort — don't block on failure)
    let queryToUse = rawQuery
    try {
      const enhRes = await fetch('/api/ai/enhance-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: rawQuery }),
      })
      if (enhRes.ok) {
        const enhData = await enhRes.json()
        if (enhData.enhanced && enhData.enhanced !== rawQuery) {
          queryToUse = enhData.enhanced
          setEnhancedQuery(enhData.enhanced)
        }
      }
    } catch {
      // Enhancement failed silently
    }

    try {
      const hasUsername = state.username.trim().length > 0
      let endpoint = '/api/desearch/x'
      const body: Record<string, unknown> = {
        query: queryToUse,
        sort: state.sort,
        count: state.resultCount,
        startDate: state.startDate || undefined,
        endDate: state.endDate || undefined,
        lang: state.lang || undefined,
        verified: state.verifiedOnly || undefined,
        blueVerified: state.blueVerifiedOnly || undefined,
        isQuote: state.quoteOnly || undefined,
        isVideo: state.videoOnly || undefined,
        isImage: state.imageOnly || undefined,
        minRetweets: state.minRetweets || undefined,
        minReplies: state.minReplies || undefined,
        minLikes: state.minLikes || undefined,
      }

      if (hasUsername) {
        endpoint = '/api/desearch/x_user'
        body.user = state.username
        body.query = queryToUse
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      // Ignore if this search has been superseded by a newer one
      if (activeSearchQueryRef.current !== rawQuery) return

      if (!res.ok || isApiError(data)) {
        handleApiError(data, setSearchError)
        setSearchResults([])
        return
      }

      if (isValidSearchResult(data)) {
        const scored = data.map((tweet: Tweet) => ({
          ...tweet,
          sentiment: analyzeTweet(tweet.text),
        })) as ScoredTweet[]

        setSearchResults(data)
        setScoredTweets(scored)

        // Fire AI calls asynchronously — don't await, they update state independently
        if (activeSearchQueryRef.current === rawQuery) {
          fetchInsights(rawQuery, scored)
          fetchTweetSummaries(data)
        }
      } else {
        setSearchResults([])
        setScoredTweets([])
        setSearchError('No results found for this query.')
      }
    } catch (err) {
      if (activeSearchQueryRef.current !== rawQuery) return
      handleApiError(err, setSearchError)
      setSearchResults([])
    } finally {
      if (activeSearchQueryRef.current === rawQuery) {
        setLoading((l) => ({ ...l, search: false }))
      }
    }
  }, [state, handleApiError, fetchInsights, fetchTweetSummaries])

  // Re-filter scored tweets when sentiment filter changes
  const [filteredScoredTweets, setFilteredScoredTweets] = useState<ScoredTweet[]>([])

  useEffect(() => {
    if (scoredTweets.length === 0) {
      setFilteredScoredTweets([])
      return
    }
    if (state.sentimentFilter === 'all') {
      setFilteredScoredTweets(scoredTweets)
    } else {
      setFilteredScoredTweets(
        scoredTweets.filter((t) => t.sentiment.classification === state.sentimentFilter)
      )
    }
  }, [scoredTweets, state.sentimentFilter])

  // TIMELINE
  const doLoadTimeline = useCallback(async (usernameOverride?: string) => {
    const username = (usernameOverride ?? state.username).trim()
    if (!username) return
    setLoading((l) => ({ ...l, timeline: true }))
    setTimelineError(null)
    setActiveTab('timeline')
    try {
      const res = await fetch('/api/desearch/x_timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, count: state.resultCount }),
      })
      const data = await res.json()
      if (!res.ok || isApiError(data)) {
        handleApiError(data, setTimelineError)
        setTimelineData(null)
        return
      }
      if (isTimelineResponse(data)) {
        setTimelineData(data)
      } else {
        setTimelineData(null)
        setTimelineError('Failed to load timeline.')
      }
    } catch (err) {
      handleApiError(err, setTimelineError)
      setTimelineData(null)
    } finally {
      setLoading((l) => ({ ...l, timeline: false }))
    }
  }, [state.username, state.resultCount, handleApiError])

  // REPLIES
  const doLoadReplies = useCallback(async () => {
    const username = state.username.trim()
    if (!username) return
    setLoading((l) => ({ ...l, replies: true }))
    setRepliesError(null)
    setActiveTab('replies')
    try {
      const res = await fetch('/api/desearch/x_replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: username, count: state.resultCount }),
      })
      const data = await res.json()
      if (!res.ok || isApiError(data)) {
        handleApiError(data, setRepliesError)
        setRepliesData([])
        return
      }
      if (isValidSearchResult(data)) {
        setRepliesData(data)
      } else {
        setRepliesData([])
      }
    } catch (err) {
      handleApiError(err, setRepliesError)
      setRepliesData([])
    } finally {
      setLoading((l) => ({ ...l, replies: false }))
    }
  }, [state.username, state.resultCount, handleApiError])

  // RETWEETERS
  const doLoadRetweeters = useCallback(async (postId?: string, cursor?: string) => {
    const id = postId || extractPostId(state.postIdUrl)
    if (!id) return
    if (!cursor) {
      setLoading((l) => ({ ...l, retweeters: true }))
      setRetweetersError(null)
      setRetweetersData([])
      setRetweetersCursor(null)
    } else {
      setLoadingMore(true)
    }
    try {
      const res = await fetch('/api/desearch/x_retweeters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id, cursor }),
      })
      const data = await res.json()
      if (!res.ok || isApiError(data)) {
        handleApiError(data, setRetweetersError)
        return
      }
      if (isRetweetersResponse(data)) {
        if (cursor) {
          setRetweetersData((prev) => [...prev, ...data.users])
        } else {
          setRetweetersData(data.users)
        }
        setRetweetersCursor(data.next_cursor)
      }
    } catch (err) {
      handleApiError(err, setRetweetersError)
    } finally {
      setLoading((l) => ({ ...l, retweeters: false }))
      setLoadingMore(false)
    }
  }, [state.postIdUrl, handleApiError])

  // FETCH POST
  const doFetchPost = useCallback(async (postIdOverride?: string) => {
    const id = postIdOverride ? extractPostId(postIdOverride) : extractPostId(state.postIdUrl)
    if (!id) return
    setLoading((l) => ({ ...l, post: true }))
    setPostError(null)
    setSinglePost(null)
    try {
      const res = await fetch('/api/desearch/x_post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok || isApiError(data)) {
        handleApiError(data, setPostError)
        setSinglePost(null)
        return
      }
      if (isSingleTweet(data)) {
        setSinglePost(data)
      } else {
        setSinglePost(null)
        setPostError('No post found.')
      }
    } catch (err) {
      handleApiError(err, setPostError)
      setSinglePost(null)
    } finally {
      setLoading((l) => ({ ...l, post: false }))
    }
  }, [state.postIdUrl, handleApiError])

  // Load post replies into the replies panel
  const doLoadPostReplies = useCallback(async (postId: string) => {
    setActiveTab('replies')
    setRepliesError(null)
    setLoading((l) => ({ ...l, replies: true }))
    try {
      const res = await fetch('/api/desearch/x_post_replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, count: state.resultCount }),
      })
      const data = await res.json()
      if (!res.ok || isApiError(data)) {
        handleApiError(data, setRepliesError)
        setRepliesData([])
        return
      }
      if (isValidSearchResult(data)) {
        setRepliesData(data)
      } else {
        setRepliesData([])
      }
    } catch (err) {
      handleApiError(err, setRepliesError)
      setRepliesData([])
    } finally {
      setLoading((l) => ({ ...l, replies: false }))
    }
  }, [state.resultCount, handleApiError])

  // Click handlers
  const handleUsernameClick = useCallback((username: string) => {
    setState((prev) => ({ ...prev, username }))
    doLoadTimeline(username)
  }, [doLoadTimeline])

  const handlePostIdClick = useCallback((postId: string) => {
    setState((prev) => ({ ...prev, postIdUrl: postId }))
    doFetchPost(postId)
  }, [doFetchPost])

  // Opens the user profile modal with whatever data we already have from the tweet
  const handleUserClick = useCallback((user: User) => {
    setModalUser(user)
  }, [])

  const activeLoadingEndpoint =
    loading.search ? 'search' :
    loading.timeline ? 'timeline' :
    loading.replies ? 'replies' :
    loading.retweeters ? 'retweeters' :
    loading.post ? 'post' : null

  return (
    <div className="min-h-screen bg-[var(--input-bg)] relative overflow-hidden">
      <AnimatedBackground />
      <TopBar
        state={state}
        onChange={updateState}
        onSearch={doSearch}
        onLoadTimeline={doLoadTimeline}
        onLoadReplies={doLoadReplies}
        onFetchPost={doFetchPost}
        onLoadRetweeters={() => doLoadRetweeters()}
        loading={!!activeLoadingEndpoint}
        activeEndpoint={activeLoadingEndpoint}
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen((o) => !o)}
        hasInsightsData={scoredTweets.length > 0 || !!aiInsights || retweetersData.length > 0}
        drawerToggleRef={drawerToggleRef}
      />

      <div className="p-4">
        <div className="flex justify-center">
          <div className="w-full max-w-3xl">
            <Panel
              title="Search Results"
              subtitle={
                searchResults.length > 0
                  ? `${searchResults.length} posts for "${lastSearchQuery}"${enhancedQuery ? ` · expanded query` : ''}`
                  : state.searchQuery
                  ? `Searching for "${state.searchQuery}"...`
                  : undefined
              }
              loading={loading.search}
              error={searchError}
              onRetry={doSearch}
              emptyMessage={
                !state.searchQuery ? null : searchResults.length === 0 && !loading.search && !searchError ? null : undefined
              }
            >
              {enhancedQuery && searchResults.length > 0 && (
                <div className="px-4 py-2 border-b border-[var(--border)] text-xs text-[var(--muted)]">
                  <span className="opacity-70">Query expanded to: </span>
                  <span className="text-[var(--blue)]">{enhancedQuery}</span>
                </div>
              )}
              <SearchResultsFeed
                tweets={filteredScoredTweets}
                searchQuery={lastSearchQuery}
                loading={loading.search}
                error={searchError}
                onRetry={doSearch}
                onUsernameClick={handleUsernameClick}
                onPostIdClick={handlePostIdClick}
                onUserClick={handleUserClick}
                tweetSummaries={tweetSummaries}
                emptyMessage={
                  !state.searchQuery
                    ? null
                    : filteredScoredTweets.length === 0 && !loading.search && !searchError
                    ? `No results found for "${state.searchQuery}"`
                    : null
                }
              />
            </Panel>
          </div>
        </div>
      </div>

      {/* Insights slide-over drawer */}
      <InsightsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        toggleButtonRef={drawerToggleRef}
        scoredTweets={scoredTweets}
        searchQuery={lastSearchQuery}
        aiInsights={aiInsights}
        aiInsightsLoading={aiInsightsLoading}
        aiInsightsError={aiInsightsError}
        retweetersData={retweetersData}
        retweetersError={retweetersError}
        retweetersCursor={retweetersCursor}
        loadingMore={loadingMore}
        loadingRetweeters={loading.retweeters}
        onLoadMoreRetweeters={() => doLoadRetweeters(undefined, retweetersCursor ?? undefined)}
        onUsernameClick={handleUsernameClick}
      />

      {/* User profile modal */}
      {modalUser && (
        <UserProfileModal
          user={modalUser}
          onClose={() => setModalUser(null)}
          onViewTimeline={() => setModalUser(null)}
        />
      )}
    </div>
  )
}
