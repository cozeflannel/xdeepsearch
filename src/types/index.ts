export interface Media {
  media_url: string
  type: 'photo' | 'video' | 'animated_gif'
}

export interface Entities {
  hashtags: Array<{ text: string; indices: [number, number] }>
  symbols: Array<{ text: string; indices: [number, number] }>
  urls: Array<{ url: string; expanded_url: string; display_url: string; indices: [number, number] }>
  user_mentions: Array<{ id_str: string; name: string; screen_name: string; indices: [number, number] }>
}

export interface User {
  id: string
  username: string
  name: string | null
  url: string | null
  description: string | null
  followers_count: number | null
  followings_count: number | null
  statuses_count: number | null
  verified: boolean | null
  is_blue_verified: boolean | null
  location: string | null
  created_at: string | null
  profile_image_url: string | null
}

export interface Tweet {
  id: string
  text: string
  created_at: string
  url: string | null
  like_count: number
  retweet_count: number
  reply_count: number
  quote_count: number
  bookmark_count: number
  view_count: number | null
  lang: string | null
  is_retweet: boolean | null
  is_quote_tweet: boolean | null
  conversation_id: string | null
  in_reply_to_screen_name: string | null
  in_reply_to_status_id: string | null
  quoted_status_id: string | null
  media: Media[] | null
  entities: Entities | null
  quote: Tweet | null
  retweet: Tweet | null
  user: User | null
  replies: Tweet[] | null
  display_text_range: [number, number] | null
}

export interface TimelineResponse {
  user: User
  tweets: Tweet[]
}

export interface RetweetersResponse {
  users: User[]
  next_cursor: string | null
}

export interface ApiError {
  error: string
  details?: string
}

export interface SearchFilters {
  query?: string
  sort?: 'Top' | 'Latest'
  user?: string
  startDate?: string
  endDate?: string
  lang?: string
  verified?: boolean
  blueVerified?: boolean
  isQuote?: boolean
  isVideo?: boolean
  isImage?: boolean
  minRetweets?: number
  minReplies?: number
  minLikes?: number
  count?: number
}

export type SentimentFilter = 'all' | 'positive' | 'neutral' | 'negative'

export interface DashboardState {
  searchQuery: string
  username: string
  postIdUrl: string
  startDate: string
  endDate: string
  sort: 'Top' | 'Latest'
  lang: string
  verifiedOnly: boolean
  blueVerifiedOnly: boolean
  videoOnly: boolean
  imageOnly: boolean
  quoteOnly: boolean
  minLikes: number
  minRetweets: number
  minReplies: number
  resultCount: number
  sentimentFilter: SentimentFilter
}
