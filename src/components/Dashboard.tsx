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
import InsightsPanel from '@/components/InsightsPanel'
import TrendsPanel from '@/components/TrendsPanel'

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

  // SEARCH
  const doSearch = useCallback(async () => {
    const query = state.searchQuery.trim()
    if (!query) return

    // Mark this query as active
    activeSearchQueryRef.current = query
    setLastSearchQuery(query)

    // Clear old results immediately so the panel knows to show loading
    setSearchResults([])
    setSearchError(null)
    setLoading((l) => ({ ...l, search: true }))

    try {
      const hasUsername = state.username.trim().length > 0
      let endpoint = '/api/desearch/x'
      const body: Record<string, unknown> = {
        query,
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
        body.query = query
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      // Ignore if this search has been superseded by a newer one
      if (activeSearchQueryRef.current !== query) return

      if (!res.ok || isApiError(data)) {
        handleApiError(data, setSearchError)
        setSearchResults([])
        return
      }

      if (isValidSearchResult(data)) {
        // Score each tweet with sentiment
        const scored = data.map((tweet: Tweet) => ({
          ...tweet,
          sentiment: analyzeTweet(tweet.text),
        })) as ScoredTweet[]

        // Apply sentiment filter if set
        const filtered = state.sentimentFilter === 'all'
          ? scored
          : scored.filter((t) => t.sentiment.classification === state.sentimentFilter)

        setSearchResults(data)
        setScoredTweets(scored)
      } else {
        setSearchResults([])
        setScoredTweets([])
        setSearchError('No results found for this query.')
      }
    } catch (err) {
      if (activeSearchQueryRef.current !== query) return
      handleApiError(err, setSearchError)
      setSearchResults([])
    } finally {
      if (activeSearchQueryRef.current === query) {
        setLoading((l) => ({ ...l, search: false }))
      }
    }
  }, [state, handleApiError])

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
  const doLoadTimeline = useCallback(async () => {
    const username = state.username.trim()
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
  const doFetchPost = useCallback(async () => {
    const id = extractPostId(state.postIdUrl)
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
    // Auto-load timeline for clicked username
    setTimeout(() => {
      setLoading((l) => ({ ...l, timeline: true }))
      setTimelineError(null)
      fetch('/api/desearch/x_timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, count: state.resultCount }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (!isApiError(data) && isTimelineResponse(data)) {
            setTimelineData(data)
          }
        })
        .catch(() => setTimelineError('Request failed. Check connection and retry.'))
        .finally(() => setLoading((l) => ({ ...l, timeline: false })))
    }, 0)
  }, [state.resultCount])

  const handlePostIdClick = useCallback((postId: string) => {
    setState((prev) => ({ ...prev, postIdUrl: postId }))
    setSinglePost(null)
    setPostError(null)
    setLoading((l) => ({ ...l, post: true }))
    fetch('/api/desearch/x_post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!isApiError(data) && isSingleTweet(data)) {
          setSinglePost(data)
        } else if (isApiError(data)) {
          handleApiError(data, setPostError)
        }
      })
      .catch((err) => handleApiError(err, setPostError))
      .finally(() => setLoading((l) => ({ ...l, post: false })))
  }, [handleApiError])

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
      />

      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            {/* Search Results — THE MAIN PANEL */}
            <Panel
              title="Search Results"
              subtitle={
                searchResults.length > 0
                  ? `${searchResults.length} posts for "${lastSearchQuery}"`
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
              <SearchResultsFeed
                tweets={filteredScoredTweets}
                searchQuery={lastSearchQuery}
                loading={loading.search}
                error={searchError}
                onRetry={doSearch}
                onUsernameClick={handleUsernameClick}
                onPostIdClick={handlePostIdClick}
                emptyMessage={
                  !state.searchQuery
                    ? null
                    : filteredScoredTweets.length === 0 && !loading.search && !searchError
                    ? `No results found for "${state.searchQuery}"`
                    : null
                }
              />
            </Panel>

            {/* AI Insights — below search results */}
            <Panel
              title="AI Insights"
              subtitle="Generated from loaded data"
            >
              <InsightsPanel
                tweets={(scoredTweets.length > 0 ? scoredTweets : (timelineData?.tweets ?? [])) as any}
                searchQuery={lastSearchQuery || state.searchQuery}
                onUsernameClick={handleUsernameClick}
                onPostIdClick={handlePostIdClick}
              />
            </Panel>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            {/* User Profile Card */}
            <Panel
              title="User Profile"
              loading={loading.timeline}
              error={timelineError}
              onRetry={doLoadTimeline}
              emptyMessage={state.username ? undefined : 'Enter a username to load profile'}
            >
              {timelineData?.user ? (
                <UserCard
                  user={timelineData.user}
                  onUsernameClick={handleUsernameClick}
                />
              ) : null}
            </Panel>

            {/* User Timeline / Replies */}
            <Panel
              title={activeTab === 'timeline' ? 'User Timeline' : 'User Replies'}
              loading={activeTab === 'timeline' ? loading.timeline : loading.replies}
              error={activeTab === 'timeline' ? timelineError : repliesError}
              emptyMessage={state.username ? undefined : 'Load a timeline to see posts'}
              action={
                state.username ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setActiveTab('timeline'); if (!timelineData) doLoadTimeline() }}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        activeTab === 'timeline' ? 'bg-[#1d9bf0] text-white' : 'text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      Timeline
                    </button>
                    <button
                      onClick={() => { setActiveTab('replies'); if (!repliesData.length) doLoadReplies() }}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        activeTab === 'replies' ? 'bg-[#1d9bf0] text-white' : 'text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      Replies
                    </button>
                  </div>
                ) : null
              }
            >
              <div>
                {activeTab === 'timeline' && timelineData?.tweets?.map((tweet) => (
                  <TweetCard
                    key={tweet.id}
                    tweet={tweet}
                    onUsernameClick={handleUsernameClick}
                    onPostIdClick={handlePostIdClick}
                  />
                ))}
                {activeTab === 'replies' && repliesData.map((tweet) => (
                  <div key={tweet.id}>
                    {tweet.in_reply_to_screen_name && (
                      <div className="px-4 py-1.5 text-xs text-[var(--muted)] border-b border-[#262626]">
                        Replying to{' '}
                        <button
                          className="text-[#1d9bf0] hover:underline"
                          onClick={() => handleUsernameClick(tweet.in_reply_to_screen_name!)}
                        >
                          @{tweet.in_reply_to_screen_name}
                        </button>
                      </div>
                    )}
                    <TweetCard
                      tweet={tweet}
                      onUsernameClick={handleUsernameClick}
                      onPostIdClick={handlePostIdClick}
                    />
                  </div>
                ))}
                {!state.username && (
                  <div className="flex items-center justify-center h-24 text-[var(--muted)] text-sm">
                    Enter a username to load
                  </div>
                )}
              </div>
            </Panel>

            {/* Retweeters */}
            <Panel
              title="Retweeters"
              loading={loading.retweeters}
              error={retweetersError}
              onRetry={() => doLoadRetweeters()}
              emptyMessage={state.postIdUrl ? undefined : 'Enter a post ID to see retweeters'}
            >
              <div>
                {retweetersData.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    compact
                    onUsernameClick={handleUsernameClick}
                  />
                ))}
                {retweetersCursor && (
                  <button
                    onClick={() => doLoadRetweeters(undefined, retweetersCursor ?? undefined)}
                    disabled={loadingMore}
                    className="w-full py-3 text-sm text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                )}
                {!retweetersCursor && retweetersData.length > 0 && (
                  <div className="py-2 text-center text-xs text-[var(--muted)]">
                    All retweeters loaded
                  </div>
                )}
                {!state.postIdUrl && (
                  <div className="flex items-center justify-center h-24 text-[var(--muted)] text-sm">
                    Enter a post ID to load
                  </div>
                )}
              </div>
            </Panel>

            {/* Trends + Word Cloud */}
            <Panel
              title="Trends & Word Cloud"
              subtitle={searchResults.length > 0 ? `${scoredTweets.length} posts analyzed` : undefined}
            >
              <TrendsPanel
                tweets={scoredTweets.length > 0 ? scoredTweets : []}
                searchQuery={lastSearchQuery}
              />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
