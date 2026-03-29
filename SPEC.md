# Desearch X Dashboard — SPEC

## 1. Concept & Vision

A real-time X/Twitter intelligence monitoring dashboard that pulls live data exclusively from the Desearch API. Built for builders and researchers who need to track conversations, analyze engagement, and monitor users without Twitter API access. Dark, dense, data-forward — like a Bloomberg terminal for social signals.

**Personality:** Professional intelligence tool. No decoration for decoration's sake. Every pixel earns its place by displaying signal.

---

## 2. Design Language

**Aesthetic:** Dark monitoring terminal — Twitter/X's dark mode as a starting point, elevated with clearer information hierarchy and tighter spacing.

**Color Palette:**
- Background: `#0f0f0f` (near-black)
- Surface: `#161616` (card/panel backgrounds)
- Border: `#262626` (subtle dividers)
- Text primary: `#e7e7e7`
- Text muted: `#71717a`
- Accent blue (replies): `#1d9bf0`
- Like red: `#f4212e`
- Retweet green: `#00ba7c`
- Quote blue: `#1d9bf0`
- Bookmark magenta: `#794bc4`
- Verified gold: `#ffad1f`
- Blue badge: `#1d9bf0`
- Error red: `#dc2626`
- Warning: `#f59e0b`

**Typography:**
- Font: `Inter` (Google Fonts) with system fallbacks
- Body: 14px/1.5
- Headings: 16px semi-bold
- Metadata/labels: 12px
- Tweet text: 15px/1.4

**Spatial System:**
- Base unit: 4px
- Card padding: 16px
- Gap between panels: 16px
- Panel border-radius: 8px

**Motion Philosophy:**
- Minimal and functional
- Loading: pulsing skeleton at 1.5s cycle
- Panel transitions: 150ms ease-out
- No decorative animations

**Icons:** Lucide React — consistent with existing project stack

---

## 3. Layout & Structure

### Desktop Layout (primary)
```
┌─────────────────────────────────────────────────────┐
│  TOP BAR (full width, sticky)                       │
│  [Search Input] [Username] [Post ID/URL] [Filters]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────┐  ┌────────────────────┐   │
│  │                     │  │   USER PROFILE     │   │
│  │   SEARCH RESULTS    │  │   CARD (Panel 2)   │   │
│  │   FEED (Panel 1)    │  ├────────────────────┤   │
│  │                     │  │   USER TIMELINE    │   │
│  │                     │  │   FEED (Panel 3)   │   │
│  ├─────────────────────┤  ├────────────────────┤   │
│  │   ANALYTICS SUMMARY │  │   REPLIES PANEL    │   │
│  │   (Panel 7)         │  │   (Panel 4)        │   │
│  ├─────────────────────┤  ├────────────────────┤   │
│  │   SINGLE POST VIEW  │  │   RETWEETERS       │   │
│  │   (Panel 6)         │  │   PANEL (Panel 5) │   │
│  └─────────────────────┘  └────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Left column:** Search results, analytics summary, single post viewer (65% width)
**Right column:** User profile, timeline, replies, retweeters (35% width)

### Mobile Layout
Single column stack. Panels fill width, collapse to scrollable sections.

---

## 4. Features & Interactions

### Top Bar Controls

| Control | Type | Default | Behavior |
|---------|------|---------|----------|
| Search Input | text | empty | Enter/click Search → `x` or `x_user` |
| Username Input | text | empty | Used with timeline/replies actions |
| Post ID / URL Input | text | empty | Fetches single post or multiple via URL |
| Date Range Start | date (YYYY-MM-DD) | empty | Maps to `--start-date` |
| Date Range End | date (YYYY-MM-DD) | empty | Maps to `--end-date` |
| Sort Toggle | Top / Latest | Latest | Maps to `--sort` |
| Language Filter | dropdown/input | empty | Maps to `--lang` |
| Verified Only | toggle | off | Maps to `--verified` |
| Blue Verified Only | toggle | off | Maps to `--blue-verified` |
| Video Only | toggle | off | Maps to `--is-video` |
| Image Only | toggle | off | Maps to `--is-image` |
| Quote Tweets Only | toggle | off | Maps to `--is-quote` |
| Min Likes | slider + input | 0 | Maps to `--min-likes` |
| Min Retweets | slider + input | 0 | Maps to `--min-retweets` |
| Min Replies | slider + input | 0 | Maps to `--min-replies` |
| Result Count | input (1-100) | 20 | Maps to `--count` |

### Endpoint Routing Logic
- Search input only → `x` endpoint
- Search input + username → `x_user` endpoint
- Username only → `x_timeline` + `x_replies`
- Post ID/URL → `x_post` or `x_urls`
- Reply to post ID → `x_post_replies`
- Retweeters → `x_retweeters` with cursor pagination

### Interaction Details

**Tweet Card Click:**
- Clicking @username → populates Username Input → triggers timeline load
- Clicking post URL ID → populates Post ID Input → triggers post fetch
- Clicking quoted tweet author → same as clicking @username

**Replies Panel:**
- Shows "Replying to @screen_name" context line when available
- Parent post ID shown as clickable link

**Retweeters Panel:**
- Shows user cards with profile info
- "Load More" appends to existing list (not replacement)
- Shows "All retweeters loaded" when `next_cursor` is null

**Analytics Panel:**
- Computed from whatever data is currently loaded (Panel 1 or Panel 3)
- Recomputes on every new data load
- Empty state: "Run a search or load a timeline to see analytics"
- Excludes null view_count from avg views calculation

### Error States

| Error | Display |
|-------|---------|
| 401 Unauthorized | Red banner: "Invalid or missing API key. Configure DESEARCH_API_KEY." |
| 402 Payment Required | Red banner: "Desearch balance depleted. Add funds at console.desearch.ai." |
| Network/timeout | Red banner: "Request failed. Check connection and retry." + Retry button |
| Empty results | Panel message: "No results found for this query." |
| Field is null | Show "—" not "null" or "0" |

---

## 5. Component Inventory

### TweetCard
- **Default:** Full tweet with author row, body, media thumbnails, engagement metrics, metadata
- **Compact:** Used in quoted tweet nested display and analytics top-post
- **States:** loading (skeleton), error (banner), empty (never — always rendered if data exists)

### UserCard
- **Default:** Avatar, name, @handle, bio, location, join date, stats, badges
- **Compact:** Used in retweeters list — truncated bio, smaller avatar

### UserCardRetweeter (extends UserCard)
- Compact variant + follower count + description (2-line truncate)

### AnalyticsSummary
- Stat rows: total posts, avg likes/retweets/replies/views
- Top post: compact tweet card
- Media breakdown: horizontal bar chart (CSS-based, no chart library)
- Original vs amplified: donut chart (CSS-based)

### Panel Container
- Consistent panel wrapper with title, optional subtitle
- Loading state: pulsing skeleton within panel
- Empty state: centered message
- Error state: red banner at top of panel

### ControlBar
- Sticky top bar
- Input group styling with consistent heights
- Toggle switches (dark-themed)
- Sliders with number input alongside

---

## 6. Technical Approach

### Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + CSS variables
- **Icons:** Lucide React
- **Date formatting:** date-fns + date-fns-tz

### API Routes

All routes under `/api/desearch/` — accept POST with JSON body, call `desearch.py` CLI, return parsed JSON.

```
POST /api/desearch/x
  Body: { query, sort?, user?, startDate?, endDate?, lang?, verified?, blueVerified?, isQuote?, isVideo?, isImage?, minRetweets?, minReplies?, minLikes?, count? }
  CLI: desearch.py x "<query>" [filters]

POST /api/desearch/x_user
  Body: { user, query, count? }
  CLI: desearch.py x_user <user> --query "<query>" --count <n>

POST /api/desearch/x_timeline
  Body: { username, count? }
  CLI: desearch.py x_timeline <username> --count <n>

POST /api/desearch/x_replies
  Body: { user, query?, count? }
  CLI: desearch.py x_replies <user> --query "<query>" --count <n>

POST /api/desearch/x_post_replies
  Body: { postId, query?, count? }
  CLI: desearch.py x_post_replies <postId> --query "<query>" --count <n>

POST /api/desearch/x_retweeters
  Body: { postId, cursor?, count? }
  CLI: desearch.py x_retweeters <postId> [--cursor <cursor>]

POST /api/desearch/x_post
  Body: { id }
  CLI: desearch.py x_post <id>

POST /api/desearch/x_urls
  Body: { urls: string[] }
  CLI: desearch.py x_urls <url1> <url2> ...
```

### API Response Handling
- Parse CLI stdout as JSON
- On HTTP error from CLI (non-zero exit): extract error from JSON detail field or stderr
- Return raw error messages to frontend — no substitution

### Data Model

```typescript
interface Tweet {
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
  media: Media[] | null
  entities: Entities | null
  quote: Tweet | null
  retweet: Tweet | null
  user: User | null
}

interface User {
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

interface Media {
  media_url: string
  type: 'photo' | 'video' | 'animated_gif'
}

interface Entities {
  hashtags: any[]
  symbols: any[]
  urls: any[]
  user_mentions: any[]
}
```

### Environment
- `DESEARCH_API_KEY` must be set in `.env.local`
- CLI path: `~/.openclaw/skills/desearch-x-search/scripts/desearch.py`
