'use client'

import { useMemo } from 'react'
import { Tweet } from '@/types'
import { Hash, AtSign, TrendingUp, Wifi } from 'lucide-react'

interface TrendsPanelProps {
  tweets: (Tweet & { sentiment?: { classification: 'positive' | 'neutral' | 'negative'; score: number } })[]
  searchQuery: string
}

interface TrendItem {
  text: string
  count: number
  type: 'hashtag' | 'mention' | 'word'
}

// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'that', 'this', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
  'we', 'our', 'you', 'your', 'he', 'she', 'him', 'her', 'his',
  'i', 'me', 'my', 'what', 'which', 'who', 'whom', 'when', 'where',
  'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'about', 'into', 'over', 'after',
  'before', 'between', 'under', 'again', 'then', 'once', 'here', 'there',
  'up', 'down', 'out', 'off', 'now', 'also', 'back', 'well', 'even',
  'still', 'already', 'always', 'never', 'ever', 'still', 'while', 'though',
  'if', 'else', 'because', 'since', 'until', 'unless', 'although', 'though',
  'get', 'got', 'getting', 'make', 'made', 'making', 'go', 'going', 'went',
  'come', 'came', 'coming', 'take', 'took', 'taking', 'see', 'saw', 'seen',
  'know', 'knew', 'known', 'think', 'thought', 'want', 'wanted', 'wanting',
  'use', 'used', 'using', 'find', 'found', 'find', 'give', 'gave', 'given',
  'tell', 'told', 'tell', 'say', 'said', 'saying', 'let', 'lets',
  "i'm", "don't", "it's", "that's", "what's", "who's", "here's", "there's",
  "i've", "you've", "we've", "they've", "i'll", "you'll", "he'll", "she'll",
  "we'll", "they'll", "i'd", "you'd", "he'd", "she'd", "we'd", "they'd",
  "wouldn't", "couldn't", "shouldn't", "wasn't", "weren't", "isn't", "aren't",
  'rt', 'via', 'amp', 'https', 'http', 'co',
])

function extractTrends(tweets: Tweet[]): { hashtags: TrendItem[]; mentions: TrendItem[]; topWords: TrendItem[] } {
  const hashtagCounts: Record<string, number> = {}
  const mentionCounts: Record<string, number> = {}
  const wordCounts: Record<string, number> = {}

  tweets.forEach(({ text }) => {
    // Extract hashtags
    const hashtags = text.match(/#\w+/g) || []
    hashtags.forEach((tag) => {
      const lower = tag.toLowerCase()
      hashtagCounts[lower] = (hashtagCounts[lower] || 0) + 1
    })

    // Extract mentions
    const mentions = text.match(/@\w+/g) || []
    mentions.forEach((m) => {
      const lower = m.toLowerCase()
      mentionCounts[lower] = (mentionCounts[lower] || 0) + 1
    })

    // Extract words (filter short words, numbers, stop words)
    const words = text
      .toLowerCase()
      .replace(/[^\w\s#@]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))

    words.forEach((w) => {
      wordCounts[w] = (wordCounts[w] || 0) + 1
    })
  })

  const sort = (counts: Record<string, number>): TrendItem[] =>
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([text, count]) => ({ text, count, type: 'word' as const }))
      .slice(0, 20)

  return {
    hashtags: sort(hashtagCounts).map((t) => ({ ...t, type: 'hashtag' as const })),
    mentions: sort(mentionCounts).map((t) => ({ ...t, type: 'mention' as const })),
    topWords: sort(wordCounts).slice(0, 30),
  }
}

export default function TrendsPanel({ tweets, searchQuery }: TrendsPanelProps) {
  const { hashtags, mentions, topWords } = useMemo(() => extractTrends(tweets), [tweets])

  if (!searchQuery && tweets.length === 0) {
    return (
      <div className="p-5 flex flex-col items-center justify-center text-center min-h-[200px]">
        <div className="w-10 h-10 rounded-full bg-[#1d9bf0]/10 flex items-center justify-center mb-3">
          <TrendingUp className="w-5 h-5 text-[#1d9bf0]" />
        </div>
        <p className="text-[var(--muted)] text-sm">
          Trends will appear here
        </p>
        <p className="text-[var(--muted)] text-xs mt-1">
          Search for a topic to see trending hashtags, words, and mentions
        </p>
      </div>
    )
  }

  const maxWordCount = topWords[0]?.count || 1
  const maxHashtagCount = hashtags[0]?.count || 1

  return (
    <div className="p-4 space-y-5">
      {tweets.length > 0 && (
        <p className="text-xs text-[var(--muted)]">
          Based on {tweets.length} posts{searchQuery ? ` matching "${searchQuery}"` : ''}
        </p>
      )}

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <div>
          <h3 className="text-[var(--text)] text-sm font-semibold flex items-center gap-1.5 mb-3">
            <Hash className="w-3.5 h-3.5 text-[#1d9bf0]" />
            Trending Hashtags
          </h3>
          <div className="flex flex-wrap gap-2">
            {hashtags.map(({ text, count }) => {
              const pct = count / maxHashtagCount
              const size = 12 + pct * 8
              return (
                <span
                  key={text}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1d9bf0]/10 border border-[#1d9bf0]/20 hover:bg-[#1d9bf0]/20 transition-colors cursor-pointer"
                  style={{ fontSize: `${size}px` }}
                  title={`${count} occurrence${count > 1 ? 's' : ''}`}
                >
                  <span className="text-[#1d9bf0]">#</span>
                  <span className="text-[var(--text)]">{text.slice(1)}</span>
                  <span className="text-[var(--muted)] text-[10px]">×{count}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Top Words */}
      {topWords.length > 0 && (
        <div>
          <h3 className="text-[var(--text)] text-sm font-semibold flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-[#a78bfa]" />
            Top Words
          </h3>
          <div className="flex flex-wrap gap-2 items-center justify-center">
            {topWords.map(({ text, count }) => {
              const pct = count / maxWordCount
              const size = 11 + pct * 10
              const opacity = 0.5 + pct * 0.5
              return (
                <span
                  key={text}
                  className="inline-block px-2 py-0.5 rounded text-[var(--text)] hover:bg-[#a78bfa]/10 transition-colors cursor-pointer"
                  style={{
                    fontSize: `${size}px`,
                    fontWeight: pct > 0.6 ? '700' : pct > 0.3 ? '600' : '400',
                    opacity,
                  }}
                  title={`${count} occurrence${count > 1 ? 's' : ''}`}
                >
                  {text}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Top Mentions */}
      {mentions.length > 0 && (
        <div>
          <h3 className="text-[var(--text)] text-sm font-semibold flex items-center gap-1.5 mb-3">
            <AtSign className="w-3.5 h-3.5 text-[#00ba7c]" />
            Most Mentioned
          </h3>
          <div className="space-y-1.5">
            {mentions.slice(0, 10).map(({ text, count }, i) => (
              <div key={text} className="flex items-center gap-3 py-1.5 border-b border-[#1a1a1a] last:border-0">
                <span className="w-5 h-5 rounded-full bg-[#00ba7c]/10 text-[#00ba7c] text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <AtSign className="w-3 h-3 text-[var(--muted)] flex-shrink-0" />
                <span className="text-[var(--text)] text-sm font-medium">{text.slice(1)}</span>
                <span className="ml-auto text-[var(--muted)] text-xs">×{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
