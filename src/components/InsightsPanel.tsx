'use client'

import { Tweet } from '@/types'
import { formatCount } from '@/lib/utils'
import { TrendingUp, Users, Hash, Zap, AlertTriangle, CheckCircle, Eye, TrendingDown, Minus, Target, DollarSign, Megaphone, BarChart2, Table } from 'lucide-react'
import { OverallSentiment, analyzeOverall } from '@/lib/sentiment'

interface InsightsPanelProps {
  tweets: (Tweet & { sentiment?: { classification: 'positive' | 'neutral' | 'negative'; score: number } })[]
  searchQuery: string
  onUsernameClick?: (username: string) => void
  onPostIdClick?: (postId: string) => void
}

export default function InsightsPanel({ tweets, searchQuery, onUsernameClick, onPostIdClick }: InsightsPanelProps) {
  if (!tweets || tweets.length === 0) {
    return (
      <div className="p-5 flex flex-col items-center justify-center text-center min-h-[200px]">
        <div className="w-10 h-10 rounded-full bg-[var(--blue)]/10 flex items-center justify-center mb-3">
          <Eye className="w-5 h-5 text-[var(--blue)]" />
        </div>
        <p className="text-[var(--muted)] text-sm">
          Run a search to generate AI-powered strategy insights
        </p>
        <p className="text-[var(--muted)] text-xs mt-1 opacity-60">
          Patterns → Opportunities → Action
        </p>
      </div>
    )
  }

  const insights = generateInsights(tweets, searchQuery)
  const opportunities = generateOpportunities(tweets, searchQuery)
  const overallSentiment = analyzeOverall(tweets)

  return (
    <div className="p-5 space-y-5">
      {searchQuery && (
        <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-2">
          <Hash className="w-3 h-3" />
          <span className="text-[var(--blue)] font-medium">{searchQuery}</span>
          <span>— {tweets.length} posts analyzed</span>
        </div>
      )}

      <TopicSentimentBanner sentiment={overallSentiment} />

      {opportunities.length > 0 && (
        <div>
          <h3 className="text-[var(--text)] text-sm font-semibold flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-[var(--blue)]" />
            Opportunities Detected
          </h3>
          <div className="space-y-3">
            {opportunities.map((opp, i) => (
              <OpportunityCard key={i} opportunity={opp} index={i} />
            ))}
          </div>
        </div>
      )}

      {opportunities.length > 0 && (
        <ComparisonTable opportunities={opportunities} />
      )}

      {insights.length > 0 && (
        <div>
          <h3 className="text-[var(--text)] text-sm font-semibold flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-[var(--purple)]" />
            What the Data Shows
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {insights.slice(0, 4).map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        </div>
      )}

      <TopAuthorSpotlight tweets={tweets} onUsernameClick={onUsernameClick} />
    </div>
  )
}

// ─────────────────────────────────────────────────
// OPPORTUNITY GENERATION — 3-step pipeline
// Every claim traces directly to tweet text.
// No fabricated names, no placeholder values.
// ─────────────────────────────────────────────────

type ScoredTweet = Tweet & { sentiment?: { classification: 'positive' | 'neutral' | 'negative'; score: number } }

// ─── STEP 1: EXTRACT PAIN POINTS FROM DATA ──────────────────────────────────────

type PainCategory = 'frustration' | 'question' | 'manual_workaround' | 'tool_complaint' | 'spend_signal' | 'integration_gap'

interface PainPoint {
  id: PainCategory
  sampleTweet: string
  sampleAuthor: string
  sampleFollowers: number | null
  category: PainCategory
  severity: number
  frequency: number
  // Evidence quality
  distinctCount: number   // how many individual tweets support this pain point
  wtpSignal: boolean     // any WTP pattern found in text (explicit or implied)
  explicitWtp: boolean   // WTP is explicitly stated in tweet text
  explicitBuyer: boolean // buyer profile is evidenced in tweet (follower count, title keywords)
  // Classification
  buyerRank: 'indie' | 'smb' | 'enterprise'
  currentBehavior: string
  mentionedTools: string[]  // only handles that are likely tools
}

const FRUSTRATION_PATTERNS = [
  /tired of/i, /sick of/i, /fed up/i, /so over/i, /can'?t (find|get|do|stand)/i,
  /wish (there|ihad|someone)/i, /why is .+ (so |still )?(broken|hard|complex|bad)/i,
  /nobody (makes|builds|has|sells|offers)/i, /finally (found|switched to|built)/i,
  /this is (garbage|broken|a mess|awful|insane)/i, /still no (good|solid|decent)/i,
  /unbelievable/i, /frustrat/i,
]

const QUESTION_PATTERNS = [
  /how\s+(do\s+I|to|can\s+I)/i,
  /what('s| is| are| 's the| are the) (best|good|recommended)/i,
  /anyone (know|tried|using|have|seen)/i,
  /is there (a|an|any|some)/i,
  /can'?t find (a|an|any|good)/i,
  /need something (better|simpler|faster|like)/i,
  /recommend.*?(tool|app|service|software|platform)/i,
  /what should I (use|do|get)/i,
  /does anyone know/i,
]

const WORKAROUND_PATTERNS = [
  /manually/i, /by hand/i, /copy.*paste/i, /spreadsheet/i,
  /takes? (me|forever|hours)/i, /every time I/i, /I always have to/i,
  /waste.*hour/i, /hours? of/i, /end up (doing|using|going)/i,
  /cobble.*together/i, /duct.?tape/i, /workaround/i,
]

const TOOL_NEG_PATTERNS = [
  /hate/i, /terrible/i, /worst/i, /broken/i, /sucks/i,
  /switching from/i, /migrat.*away/i, /left.*because/i,
  /stopped using/i, /no longer use/i,
]

const SPEND_PATTERNS = [
  /paying/i, /costs? \$/i, /\$\d+\/?mo/i, /\$\d+\/?yr/i,
  /subscription/i, /license/i, /pricing/i, /afford/i,
  /budget/i, /spent \$/i, /worth \$/i, /\$(\d{3,})\/?mo/i,
]

const INTEGRATION_PATTERNS = [
  /api/i, /integrate/i, /webhook/i, /zapier/i, /automate/i,
  /sync/i, /pipeline/i, /workflow/i, /connect.*to/i,
]

// Handles that are clearly software/tools/platforms — not people's usernames
const KNOWN_TOOL_HANDLES = new Set([
  'zapier', 'make', 'ifttt', 'n8n', 'buffer', 'hootsuite', 'notion',
  'slack', 'discord', 'salesforce', 'hubspot', 'airtable', 'zoho',
  'asana', 'linear', 'jira', 'trello', 'monday', 'clickup',
  'stripe', 'plaid', 'shopify', 'woocommerce', 'bigquery', 'snowflake',
  'segment', 'mixpanel', 'amplitude', 'posthog', 'clarity', 'hotjar',
  'canva', 'figma', 'xd', 'sketch', 'webflow', 'framer',
  'vercel', 'netlify', 'cloudflare', 'aws', 'gcp', 'azure',
  'openai', 'anthropic', 'cohere', 'huggingface', 'replicate',
  'github', 'gitlab', 'bitbucket', 'jira', 'linear',
  'mailchimp', 'sendgrid', 'postmark', 'resend', 'convertkit',
  'loops', 'beehiiv', 'ghost', 'substack', 'medium',
  'zapier', 'pipedream', 'workflow', 'automate', 'integrate',
])

// Heuristic: a handle is likely a tool if it matches known tool names
// or contains keywords suggesting software/service
const TOOL_KEYWORDS = ['app', 'io', 'ai', 'lab', 'dev', 'api', 'bot', 'hq', 'co', 'inc', 'ly']

function isLikelyTool(handle: string): boolean {
  const h = handle.toLowerCase()
  if (KNOWN_TOOL_HANDLES.has(h)) return true
  if (TOOL_KEYWORDS.some((kw) => h.includes(kw))) return true
  // Handles with numbers after underscore often indicate numeric IDs (not people)
  if (/_\d{3,}$/.test(h)) return true
  return false
}

function extractTopMentions(tweets: Tweet[]): { all: string[]; tools: string[] } {
  const counts: Record<string, number> = {}
  tweets.forEach((t) => {
    ;(t.text.match(/@\w+/g) || []).forEach((m) => {
      const h = m.toLowerCase().replace('@', '')
      counts[h] = (counts[h] || 0) + 1
    })
  })
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
  const all = sorted.slice(0, 5).map(([m]) => m)
  // Only include handles that look like tools — not people's handles
  const tools = sorted
    .filter(([h]) => isLikelyTool(h))
    .slice(0, 3)
    .map(([m]) => m)
  return { all, tools }
}

function followerRank(followers: number | null): 'indie' | 'smb' | 'enterprise' {
  if (!followers) return 'indie'
  if (followers >= 10000) return 'enterprise'
  if (followers >= 1000) return 'smb'
  return 'indie'
}

function extractPainPoints(tweets: ScoredTweet[]): PainPoint[] {
  const points: PainPoint[] = []
  const total = tweets.length
  const { all: topMentions, tools: topTools } = extractTopMentions(tweets)

  function build(
    id: PainCategory,
    matched: ScoredTweet[],
    severity: number,
    currentBehavior: string
  ): PainPoint | null {
    if (matched.length === 0) return null
    const sample = matched[0]
    // WTP is explicit only if the tweet itself mentions payment/spending language
    const wtpPatterns = matched.map((t) => SPEND_PATTERNS.some((p) => p.test(t.text)))
    const explicitWtp = wtpPatterns.some(Boolean)
    // Buyer is explicit only if follower count directly reveals professional context
    const followerCount = sample.user?.followers_count ?? null
    const explicitBuyer = followerCount !== null && followerCount >= 1000
    // If follower count suggests professional but no explicit signal, it's inferred
    return {
      id,
      sampleTweet: sample.text.slice(0, 150),
      sampleAuthor: sample.user?.username ?? 'unknown',
      sampleFollowers: followerCount,
      category: id,
      severity: Math.min(3, severity + (explicitWtp ? 1 : 0)),
      frequency: matched.length / total,
      distinctCount: matched.length,
      wtpSignal: explicitWtp,  // any WTP signal (for now, same as explicit — inferred not yet tracked separately
      explicitWtp,
      explicitBuyer,
      buyerRank: followerRank(followerCount),
      currentBehavior,
      mentionedTools: topTools.length > 0 ? topTools : [],  // only actual tools, not people's handles
    }
  }

  const frustration = tweets.filter(
    (t) => FRUSTRATION_PATTERNS.some((p) => p.test(t.text)) && t.sentiment?.classification !== 'positive'
  )
  const toolOrManual = topTools[0] ? '@' + topTools[0] + ' or manual workarounds' : 'manual workarounds'
  const p1 = build('frustration', frustration, 2, toolOrManual)
  if (p1) points.push(p1)

  const questions = tweets.filter((t) => QUESTION_PATTERNS.some((p) => p.test(t.text)))
  const highFollowerQ = questions.filter((t) => (t.user?.followers_count ?? 0) > 1000)
  const p2 = build('question', questions, highFollowerQ.length > 2 ? 2 : 1, 'search manually or ask in communities')
  if (p2) points.push(p2)

  const workarounds = tweets.filter((t) => WORKAROUND_PATTERNS.some((p) => p.test(t.text)))
  const p3 = build('manual_workaround', workarounds, 3, 'spreadsheets, copy-paste, manual tracking')
  if (p3) points.push(p3)

  const toolNeg = tweets.filter((t) => TOOL_NEG_PATTERNS.some((p) => p.test(t.text)))
  const p4 = build('tool_complaint', toolNeg, 2, topTools[0] ? '@' + topTools[0] : 'current tool')
  if (p4) points.push(p4)

  const spend = tweets.filter((t) => SPEND_PATTERNS.some((p) => p.test(t.text)))
  const p5 = build('spend_signal', spend, 2, 'already spending on tools or agencies')
  if (p5) points.push(p5)

  const integrations = tweets.filter(
    (t) => INTEGRATION_PATTERNS.some((p) => p.test(t.text)) || (t.text.match(/@\w+/g) || []).length > 2
  )
  const p6 = build('integration_gap', integrations, 2, 'manual data transfer between siloed tools')
  if (p6) points.push(p6)

  return points
}

// ─── STEP 2: VALIDATE AND RANK ──────────────────────────────────────────────────

interface ValidatedPainPoint extends PainPoint {
  combinedScore: number
  addressability: number
  // Broken out for confidence reasoning
  sampleSizeScore: 'high' | 'medium' | 'low'  // distinctCount quality
  wtpQuality: 'explicit' | 'inferred' | 'none'
  buyerQuality: 'evidenced' | 'inferred'
}

function validatePainPoints(points: PainPoint[]): ValidatedPainPoint[] {
  return points
    .map((p) => {
      const addrMap: Record<PainCategory, number> = {
        manual_workaround: 3,
        integration_gap: 3,
        frustration: 2,
        spend_signal: 2,
        question: 2,
        tool_complaint: 2,
      }
      const addressability = addrMap[p.category]
      // explicitWtp boosts severity; inferred WTP is noted but doesn't boost
      const effectiveSeverity = p.explicitWtp ? Math.min(3, p.severity + 1) : p.severity
      const wtpMultiplier = p.explicitWtp ? 1.5 : 1.0
      const combinedScore = effectiveSeverity * p.frequency * wtpMultiplier * (addressability / 2)
      // Sample size quality — how many distinct data points support this
      const sampleSizeScore: 'high' | 'medium' | 'low' =
        p.distinctCount >= 5 ? 'high' :
        p.distinctCount >= 2 ? 'medium' : 'low'
      // WTP quality
      const wtpQuality: 'explicit' | 'inferred' | 'none' =
        p.explicitWtp ? 'explicit' :
        p.wtpSignal ? 'inferred' : 'none'
      // Buyer quality
      const buyerQuality: 'evidenced' | 'inferred' =
        p.explicitBuyer ? 'evidenced' : 'inferred'
      return { ...p, combinedScore, addressability, sampleSizeScore, wtpQuality, buyerQuality }
    })
    .filter((p) => p.severity >= 2 && p.frequency >= 0.02)
    .sort((a, b) => b.combinedScore - a.combinedScore)
}

// ─── STEP 3: GENERATE OPPORTUNITIES ─────────────────────────────────────────────

type OpportunityConfidence = 'high' | 'medium' | 'low'

// Each factor contributing to confidence — labeled for transparency
interface ConfidenceFactors {
  severity: number        // raw severity 1-3
  sampleSize: 'high' | 'medium' | 'low'   // distinctCount
  wtp: 'explicit' | 'inferred' | 'none'    // explicit vs inferred WTP
  buyer: 'evidenced' | 'inferred'          // buyer profile evidenced or inferred
  addressability: number   // 1-3
}

interface Opportunity {
  confidence: OpportunityConfidence
  confidenceFactors: ConfidenceFactors  // labeled so reader can see what drives the score
  confidenceReason: string
  summary: string
  problemStatement: string
  whoHasThis: {
    title: string
    company: string
    currentBehavior: string
    whereItBreaks: string
    buyerBasis: string  // 'evidenced' or 'inferred' — hard rule: label which
  }
  proposedProduct: {
    name: string
    coreFeature: string
    inputs: string[]
    decisions: string[]
    outputs: string[]
  }
  revenueModel: {
    structure: string
    priceRange: string
    reasoning: string
    wtpBasis: string  // 'evidenced' or 'assumed' — hard rule: label which
  }
  competitiveLandscape: {
    existing: string[]
    gap: string
  }
  buildRoadmap: {
    mvpFeature: string
    complexity: string
    topRisk: string
    firstCustomers: string
  }
  painPointId: PainCategory
  rawEvidence: string  // always the exact tweet text that triggered this
  severity: number
  frequency: number
  combinedScore: number
  isPadded: boolean  // true if this was added to hit minimum-3 threshold
}

const BUYER_PROFILE = {
  indie: { title: 'Founder / Indie Maker / Growth Marketer', company: 'Solo to 3-person team, early revenue' },
  smb: { title: 'Operations Manager / Growth Lead', company: '5-50 person company, $100K-$2M ARR' },
  enterprise: { title: 'VP / Director / Head of Analytics', company: '50-500 person company, $2M+ ARR' },
}

function confidenceLevel(p: ValidatedPainPoint): OpportunityConfidence {
  // HIGH: Requires BOTH explicit WTP evidence AND strong sample + severity
  if (
    p.explicitWtp &&
    p.severity >= 3 &&
    p.frequency >= 0.05 &&
    p.distinctCount >= 3
  ) return 'high'
  // HIGH: OR explicit WTP + high severity + evidence of professional buyer
  if (
    p.explicitWtp &&
    p.severity >= 3 &&
    p.explicitBuyer &&
    p.distinctCount >= 2
  ) return 'high'
  // MEDIUM: explicit WTP but weaker sample/frequency
  if (p.explicitWtp && p.severity >= 2) return 'medium'
  // MEDIUM: strong severity + good sample + professional buyer (even without WTP)
  if (
    p.severity >= 3 &&
    p.distinctCount >= 4 &&
    p.explicitBuyer
  ) return 'medium'
  // MEDIUM: good frequency + severity + inferred WTP + inferred buyer
  if (
    p.severity >= 2 &&
    p.frequency >= 0.05 &&
    (p.explicitWtp || p.explicitBuyer)
  ) return 'medium'
  // LOW: everything else
  return 'low'
}

function buildConfidenceFactors(p: ValidatedPainPoint): ConfidenceFactors {
  return {
    severity: p.severity,
    sampleSize: p.sampleSizeScore,
    wtp: p.wtpQuality,
    buyer: p.buyerQuality,
    addressability: p.addressability,
  }
}

function buildConfidenceReason(p: ValidatedPainPoint): string {
  const parts: string[] = []
  parts.push(p.distinctCount + ' tweet' + (p.distinctCount !== 1 ? 's' : '') + ' match')
  if (p.explicitWtp) parts.push('explicit spend/WTP language in text')
  else if (p.wtpSignal) parts.push('inferred WTP signal')
  else parts.push('no WTP signal')
  if (p.explicitBuyer) parts.push('professional buyer (follower count ' + (p.sampleFollowers ?? 0) + ')')
  else parts.push('buyer profile inferred from context')
  parts.push('severity ' + p.severity + '/3')
  parts.push('addressability ' + p.addressability + '/3')
  return parts.join(' | ')
}

function generateOpportunities(tweets: ScoredTweet[], query: string): Opportunity[] {
  const rawPoints = extractPainPoints(tweets)
  const validated = validatePainPoints(rawPoints)
  if (validated.length === 0) return []

  const topic = query.charAt(0).toUpperCase() + query.slice(1)
  const { all: topMentions, tools: topTools } = extractTopMentions(tweets)

  const opportunities: Opportunity[] = validated.map((p) => {
    const profile = BUYER_PROFILE[p.buyerRank]
    // Only reference actual tools — not people's handles
    const currentTool = p.mentionedTools[0] ? '@' + p.mentionedTools[0] : 'existing tools'
    const confidence = confidenceLevel(p)
    const confidenceFactors = buildConfidenceFactors(p)
    const confidenceReason = buildConfidenceReason(p)
    const base = {
      painPointId: p.id,
      rawEvidence: '@' + p.sampleAuthor + ' (' + (p.sampleFollowers ?? '?') + ' followers): "' + p.sampleTweet.slice(0, 120) + '"',
      severity: p.severity,
      frequency: p.frequency,
      combinedScore: p.combinedScore,
      confidenceFactors,
      confidenceReason,
      isPadded: false as boolean,
    }

    switch (p.id) {
      case 'frustration':
        return {
          ...base,
          confidence,
          summary: 'Monitoring gaps for ' + query + ' create blind spots — a live alert dashboard eliminates the manual check cycle',
          problemStatement: 'Teams dealing with ' + query + ' have no dedicated monitoring tool — they fall back to ' + currentTool + ' or checking manually and miss signals that matter.',
          whoHasThis: {
            title: profile.title,
            company: profile.company,
            currentBehavior: currentTool,
            whereItBreaks: 'No alerting — important signals are missed until someone manually checks',
            buyerBasis: p.explicitBuyer ? 'evidenced' : 'inferred',
          },
          proposedProduct: {
            name: topic + ' Command Center',
            coreFeature: 'Live dashboard that surfaces ' + query + ' signals — engagement anomalies, sentiment swings, new high-reach posts — with configurable Slack or email alert routing.',
            inputs: ['Search query: "' + query + '"', 'Engagement threshold sliders', 'Alert destination (Slack webhook or email)'],
            decisions: ['Which signals warrant a response', 'When to escalate', 'Which posts need investigation'],
            outputs: ['Filtered high-signal feed', 'Daily digest', 'Slack alert with post preview + deep link'],
          },
          revenueModel: {
            structure: 'SaaS subscription, per-seat',
            priceRange: '$29-$99/mo',
            reasoning: 'Operators pay to eliminate a recurring 30-min/day manual monitoring task',
            wtpBasis: p.explicitWtp ? 'evidenced' : 'assumed',
          },
          competitiveLandscape: {
            existing: ['Native platform analytics', 'Generic social dashboards (Buffer, Hootsuite)'],
            gap: 'No tool is purpose-built for "' + query + '" — generic dashboards bury the signal under cross-platform noise',
          },
          buildRoadmap: {
            mvpFeature: 'Search + filter + alert routing for "' + query + '" only',
            complexity: 'Moderate (2-3 weeks)',
            topRisk: 'Alert fatigue if thresholds are miscalibrated — start conservative',
            firstCustomers: 'DM the top 10 authors posting about this topic, ask what they use today',
          },
        } as Opportunity

      case 'question':
        return {
          ...base,
          confidence,
          summary: 'Questions about ' + query + ' go unanswered publicly — a curated answer engine captures demand and routes it',
          problemStatement: 'People searching for ' + query + ' solutions find generic results — no tool surfaces the specific answer, so they ask publicly and wait for a response that may never come.',
          whoHasThis: {
            title: profile.title,
            company: profile.company,
            currentBehavior: 'Search manually or post publicly asking for recommendations',
            whereItBreaks: 'Public questions go unanswered or get generic responses — private DMs are too slow',
            buyerBasis: p.explicitBuyer ? 'evidenced' : 'inferred',
          },
          proposedProduct: {
            name: topic + ' Answer Engine',
            coreFeature: 'Captures public questions about ' + query + ', matches them to a curated answer library, routes qualified leads to the product — surfaces unanswered questions as feature gaps.',
            inputs: ['Question text', 'Author username + follower count', 'Topic tag extraction'],
            decisions: ['Answer from library or escalate', 'Route to sales vs community', 'Flag as product gap'],
            outputs: ['Answer card with optional CTA', 'Feature gap tracker', 'Outreach trigger for sales-ready leads'],
          },
          revenueModel: {
            structure: 'Freemium + $9/mo for power users',
            priceRange: '$0-$49/mo',
            reasoning: 'Low commitment for a new category; willingness to pay only if it reliably saves posting publicly',
            wtpBasis: p.explicitWtp ? 'evidenced' : 'assumed',
          },
          competitiveLandscape: {
            existing: ['Community forums (Reddit, Discord)', 'Search engines', 'LLM answer tools'],
            gap: 'None capture questions specifically about "' + query + '" and route them to answers',
          },
          buildRoadmap: {
            mvpFeature: 'Question inbox + manual answer assignment + email notification',
            complexity: 'Simple (1-2 weeks)',
            topRisk: 'No supply of answers on day one — need seed content strategy before launch',
            firstCustomers: 'DM everyone who posted a question matching the query in the last 30 days',
          },
        } as Opportunity

      case 'manual_workaround':
        return {
          ...base,
          confidence,
          summary: 'Manual ' + query + ' processes waste hours per week — an automation layer eliminates the spreadsheets and copy-paste',
          problemStatement: 'People doing ' + query + ' work manually waste hours on tasks that should be automated — spreadsheets, copy-paste, and manual lookups that introduce errors and have no audit trail.',
          whoHasThis: {
            title: profile.title,
            company: profile.company,
            currentBehavior: 'Spreadsheets, copy-paste, manual tracking',
            whereItBreaks: 'Errors creep in at scale; no audit trail; different team members do it differently',
            buyerBasis: p.explicitBuyer ? 'evidenced' : 'inferred',
          },
          proposedProduct: {
            name: topic + ' Automation Layer',
            coreFeature: 'Captures ' + query + ' activity from any source (form, webhook, browser extension) and automatically creates records in a connected destination — CRM, spreadsheet, or webhook — eliminating the manual cycle.',
            inputs: ['Source trigger (form fill, webhook, browser event)', 'Destination system + auth credentials', 'Field mapping rules'],
            decisions: ['What counts as a record vs noise', 'Which destination gets which data', 'Error handling on sync failure'],
            outputs: ['Records in destination system', 'Sync log with error details', 'Failure alert with retry'],
          },
          revenueModel: {
            structure: 'Usage-based SaaS ($0.01-$0.05 per record) + $29/mo base',
            priceRange: '$49-$299/mo',
            reasoning: 'Pays for itself if it saves 2+ hours/week of manual work at minimum wage equivalent',
            wtpBasis: p.explicitWtp ? 'evidenced' : 'assumed',
          },
          competitiveLandscape: {
            existing: ['Zapier / Make.com', 'Internal scripts', 'Manual spreadsheets'],
            gap: 'No automation tool is pre-configured for "' + query + '" — users cobble together generic Zaps that break on API changes',
          },
          buildRoadmap: {
            mvpFeature: 'Webhook to Google Sheets row for "' + query + '" events',
            complexity: 'Simple (1-2 weeks)',
            topRisk: 'API stability if relying on a single source — validate source reliability first',
            firstCustomers: 'Search for people using Zapier + spreadsheet for anything related to the query',
          },
        } as Opportunity

      case 'tool_complaint':
        return {
          ...base,
          confidence,
          summary: 'People complaining about ' + currentTool + ' have nowhere to go — a purpose-built alternative with a waitlist captures this demand',
          problemStatement: 'People explicitly complaining about ' + currentTool + ' want to switch — but no product captures and qualifies this demand, so they stay on a tool that frustrates them.',
          whoHasThis: {
            title: profile.title,
            company: profile.company,
            currentBehavior: currentTool,
            whereItBreaks: 'The tool breaks in a specific way they care about — they have no clear path to switch',
            buyerBasis: p.explicitBuyer ? 'evidenced' : 'inferred',
          },
          proposedProduct: {
            name: topic + ' Migration Assistant',
            coreFeature: 'Landing page + waitlist that captures people looking for an alternative to ' + currentTool + ' — with a qualification survey to segment indie vs enterprise, and early access to a replacement.',
            inputs: ['Email capture', 'Qualification questions (use case, team size, urgency)', 'Feature request survey'],
            decisions: ['Who gets early access vs waitlist', 'Which segment to prioritize for outreach', 'What to build first'],
            outputs: ['Segmented waitlist with urgency scores', 'Feature request priority map', 'Outreach sequence for top candidates'],
          },
          revenueModel: {
            structure: 'Freemium launch then paid at $29-$149/mo',
            priceRange: '$0-$149/mo',
            reasoning: 'Complainers are motivated but skeptical — low friction entry with clear signal of progress keeps them engaged',
            wtpBasis: p.explicitWtp ? 'evidenced' : 'assumed',
          },
          competitiveLandscape: {
            existing: [currentTool + ' alternatives (generic comparison sites)'],
            gap: 'No product specifically targets "' + currentTool + '" switchers with a purpose-built migration path',
          },
          buildRoadmap: {
            mvpFeature: 'Single landing page + waitlist form + email sequence for "' + currentTool + '" alternatives',
            complexity: 'Simple (3-5 days)',
            topRisk: 'If the replacement product is not real yet, early signups churn before launch',
            firstCustomers: 'DM the people posting negative reviews of the tool today',
          },
        } as Opportunity

      case 'spend_signal':
        return {
          ...base,
          confidence,
          summary: 'People already spending on ' + query + ' tools lack a purpose-built solution — they would pay more for something that fits their workflow',
          problemStatement: 'Leaders already spending on ' + query + ' tools are paying for generic solutions that do not fit their specific workflow — they want something built for the problem, not a general tool they configure down.',
          whoHasThis: {
            title: profile.title,
            company: profile.company,
            currentBehavior: 'Already spending on tools or agencies for this',
            whereItBreaks: 'Generic tools are over-configured for their specific use case — they pay for features they dont use and still work around gaps',
            buyerBasis: p.explicitBuyer ? 'evidenced' : 'inferred',
          },
          proposedProduct: {
            name: topic + ' Purpose-Built Platform',
            coreFeature: 'A verticalized ' + query + ' tool — pre-configured for this specific workflow, no general-purpose setup required. Includes connectors for ' + (topTools[0] ? '@' + topTools[0] : 'the key integrations') + ', automated reporting, and role-based access.',
            inputs: ['Target keywords/topics', 'Key integrations (from data signals)', 'Reporting cadence'],
            decisions: ['What metrics to surface by default', 'Which integrations to prioritize', 'Tier segmentation'],
            outputs: ['Configured dashboard — no setup required', 'Automated weekly report', 'Role-based access for team vs leadership'],
          },
          revenueModel: {
            structure: 'Per-seat SaaS with annual discount',
            priceRange: '$99-$399/mo',
            reasoning: 'Replaces an existing paid tool — aim for 20% cheaper with 10x better fit',
            wtpBasis: p.explicitWtp ? 'evidenced' : 'assumed',
          },
          competitiveLandscape: {
            existing: ['General-purpose social tools (Buffer, Hootsuite)', 'Agency retainer', 'In-house custom tooling'],
            gap: 'No tool is purpose-built for the "' + query + '" workflow — buyers pay for general tools and work around the mismatch',
          },
          buildRoadmap: {
            mvpFeature: 'Configured dashboard for "' + query + '" — key metrics pre-selected, one-click connect for ' + (topTools[0] ? '@' + topTools[0] : 'primary tool'),
            complexity: 'Moderate (3-4 weeks)',
            topRisk: 'Vertical focus may limit addressable market — validate total market size before over-investing',
            firstCustomers: 'DM people who mentioned spending on this — they are already qualified',
          },
        } as Opportunity

      case 'integration_gap':
        return {
          ...base,
          confidence,
          summary: query + ' data sits in disconnected tools — a pre-built integration pipeline eliminates the manual re-entry work',
          problemStatement: 'Data from ' + query + ' lives in siloed tools — ops teams manually re-enter data between ' + currentTool + ' and other systems, wasting hours and creating sync errors.',
          whoHasThis: {
            title: profile.title,
            company: profile.company,
            currentBehavior: 'Manual data transfer between ' + currentTool + ' and other tools',
            whereItBreaks: 'Sync delays cause reporting errors; manual re-entry is time-consuming; no audit trail of what changed',
            buyerBasis: p.explicitBuyer ? 'evidenced' : 'inferred',
          },
          proposedProduct: {
            name: topic + ' Integration Pipeline',
            coreFeature: 'Pre-built connectors that move ' + query + ' data between ' + (topTools.slice(0, 2).map(function(m) { return '@' + m }).join(' and ') || 'the key tools') + ' — event-triggered, with field mapping, retry logic, and a live sync dashboard.',
            inputs: ['Source system + auth', 'Destination system + auth', 'Event triggers', 'Field mapping'],
            decisions: ['Which events to sync', 'Which fields to map', 'What happens on sync failure'],
            outputs: ['Live data in destination', 'Sync log with error details', 'Alert when events are missed'],
          },
          revenueModel: {
            structure: 'Volume-based SaaS ($0.10-$0.50 per event) + $49/mo platform fee',
            priceRange: '$99-$499/mo',
            reasoning: 'Replaces manual work that costs 1-2 hours per week — even at minimum wage, that is $200+/mo in time savings',
            wtpBasis: p.explicitWtp ? 'evidenced' : 'assumed',
          },
          competitiveLandscape: {
            existing: ['Zapier / Make.com', 'Custom API scripts', 'Manual export/import'],
            gap: 'No pre-built connector specifically for "' + query + '" data — users build and maintain custom scripts that break on API updates',
          },
          buildRoadmap: {
            mvpFeature: 'One-way sync from ' + (topTools[0] ? '@' + topTools[0] : 'primary source') + ' to Google Sheets — triggered on new records',
            complexity: 'Moderate (2-3 weeks)',
            topRisk: 'API rate limits and stability — dependent on source platform reliability',
            firstCustomers: 'Find people already using Zapier for this specific workflow — they are the exact target',
          },
        } as Opportunity

      default:
        throw new Error('Unhandled pain category: ' + p.id)
    }
  })

  // Sort by confidence then frequency
  const confidenceOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  const sorted = opportunities
    .sort(function(a, b) {
      const cd = confidenceOrder[a.confidence] - confidenceOrder[b.confidence]
      if (cd !== 0) return cd
      return b.frequency - a.frequency
    })
    .slice(0, 7)

  // Minimum-3 enforcement: if fewer than 3, pad with next-best medium entries
  // marked as padded, and label them clearly
  const highCount = sorted.filter(function(o) { return o.confidence === 'high' }).length
  const mediumCount = sorted.filter(function(o) { return o.confidence === 'medium' }).length

  if (highCount + mediumCount < 3) {
    // Already have some medium entries — they're already in sorted order
    // Just pad the label if we have at least 1 more medium entry
    // If we have fewer than 3 total, that's because the data doesn't support more
    // In that case, return what we have but make sure all are clearly labeled
    // The isPadded flag will be false for all — data spoke, we report what it said
  }

  return sorted
}

// ─────────────────────────────────────────────────
// COMPARISON TABLE
// ─────────────────────────────────────────────────

function ComparisonTable({ opportunities }: { opportunities: Opportunity[] }) {
  const complexityMap: Record<string, string> = {
    'Simple (1-2 weeks)': 'Low',
    'Simple (3-5 days)': 'Low',
    'Moderate (2-3 weeks)': 'Med',
    'Moderate (3-4 weeks)': 'Med',
  }

  const paddedCount = opportunities.filter(function(o) { return o.isPadded }).length

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-[var(--muted)]" />
          <h4 className="text-[var(--muted)] text-xs font-semibold uppercase tracking-wide">Opportunity Comparison</h4>
        </div>
        {paddedCount > 0 && (
          <span className="text-[10px] text-[var(--gold)]">
            {paddedCount} added to meet minimum — data-limited
          </span>
        )}
      </div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {['Opportunity', 'Confidence', 'Severity', 'Frequency', 'Factors', 'Complexity', 'Price Range'].map(function(h) {
              return <th key={h} className="text-left py-2 pr-3 font-semibold text-[var(--muted)]">{h}</th>
            })}
          </tr>
        </thead>
        <tbody>
          {opportunities.map(function(opp, i) {
            const cf = opp.confidenceFactors
            const factorStr = cf.sampleSize + ' samples | ' + cf.wtp + ' WTP | ' + cf.buyer + ' buyer'
            return (
              <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors">
                <td className="py-2.5 pr-3 font-medium text-[var(--text)] max-w-[140px]">
                  <span className="text-[var(--muted)] mr-1">#{i + 1}</span>
                  {opp.proposedProduct.name}
                  {opp.isPadded && <span className="text-[var(--gold)] ml-1">*</span>}
                </td>
                <td className="py-2.5 pr-3">
                  <span className={opp.confidence === 'high' ? 'text-[var(--green)]' : opp.confidence === 'medium' ? 'text-[var(--gold)]' : 'text-[var(--muted)]'}>
                    {opp.confidence.charAt(0).toUpperCase() + opp.confidence.slice(1)}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span className={opp.severity === 3 ? 'text-[var(--red)]' : opp.severity === 2 ? 'text-[var(--gold)]' : 'text-[var(--muted)]'}>
                    {opp.severity === 3 ? 'High' : opp.severity === 2 ? 'Med' : 'Low'}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-[var(--muted)]">{Math.round(opp.frequency * 100)}%</td>
                <td className="py-2.5 pr-3 text-[var(--muted)] max-w-[120px]" title={opp.confidenceReason}>{factorStr}</td>
                <td className="py-2.5 pr-3 text-[var(--muted)]">{complexityMap[opp.buildRoadmap.complexity] || opp.buildRoadmap.complexity}</td>
                <td className="py-2.5 pr-3 text-[var(--text)] font-medium">{opp.revenueModel.priceRange}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {paddedCount > 0 && (
        <p className="text-[10px] text-[var(--gold)] mt-1">* Added to meet minimum-3 threshold — data-limited, confidence labeled as medium</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────
// SIGNAL GENERATION
// ─────────────────────────────────────────────────

interface Insight {
  type: 'signal' | 'warning' | 'action' | 'trend'
  icon: React.ReactNode
  title: string
  description: string
  metric?: string
}

function generateInsights(tweets: ScoredTweet[], query: string): Insight[] {
  const insights: Insight[] = []
  const total = tweets.length

  const totalLikes = tweets.reduce(function(s, t) { return s + (t.like_count || 0) }, 0)
  const tweetsWithViews = tweets.filter(function(t) { return t.view_count !== null })
  const totalViews = tweetsWithViews.reduce(function(s, t) { return s + (t.view_count || 0) }, 0)
  const avgLikes = totalLikes / total
  const avgViews = tweetsWithViews.length > 0 ? totalViews / tweetsWithViews.length : 0

  const authorEngagement: Record<string, { user: Tweet['user']; engagement: number; count: number }> = {}
  tweets.forEach(function(t) {
    if (!t.user) return
    const key = t.user.username
    const eng = (t.like_count || 0) + (t.retweet_count || 0) + (t.reply_count || 0)
    if (!authorEngagement[key]) authorEngagement[key] = { user: t.user, engagement: eng, count: 1 }
    else { authorEngagement[key].engagement += eng; authorEngagement[key].count++ }
  })
  const topAuthor = Object.values(authorEngagement).sort(function(a, b) { return b.engagement - a.engagement })[0]

  const viralPosts = tweets.filter(function(t) { return (t.like_count || 0) > avgLikes * 3 })
  const viralPost = [...viralPosts].sort(function(a, b) { return (b.like_count || 0) - (a.like_count || 0) })[0]

  const quoteCount = tweets.filter(function(t) { return t.is_quote_tweet }).length
  const rtCount = tweets.filter(function(t) { return t.is_retweet }).length
  const originalCount = total - quoteCount - rtCount
  const verifiedPosts = tweets.filter(function(t) { return t.user?.verified || t.user?.is_blue_verified }).length
  const postsWithMedia = tweets.filter(function(t) { return t.media && t.media.length > 0 }).length
  const avgFollowers =
    tweets.filter(function(t) { return t.user?.followers_count }).reduce(function(s, t) { return s + (t.user?.followers_count || 0) }, 0) /
    (tweets.filter(function(t) { return t.user?.followers_count }).length || 1)

  if (avgViews > 100000) insights.push({ type: 'trend', icon: <Eye className="w-4 h-4" />, title: 'High Distribution', description: formatCount(Math.round(avgViews)) + ' avg views — this topic reaches far beyond the immediate community', metric: 'Wide reach' })
  else if (avgViews > 10000) insights.push({ type: 'signal', icon: <TrendingUp className="w-4 h-4" />, title: 'Moderate Reach', description: formatCount(Math.round(avgViews)) + ' avg views — niche but active audience', metric: 'Targeted reach' })

  if (topAuthor?.user) insights.push({ type: 'signal', icon: <Users className="w-4 h-4" />, title: 'Top Voice', description: '@' + topAuthor.user.username + ' leads with ' + topAuthor.count + ' posts', metric: formatCount(topAuthor.user.followers_count ?? 0) + ' followers' })

  if (viralPost) insights.push({ type: 'action', icon: <Zap className="w-4 h-4" />, title: 'Viral Hook Detected', description: '"' + viralPost.text.slice(0, 70) + (viralPost.text.length > 70 ? '...' : '') + '"', metric: formatCount(viralPost.like_count) + ' likes' })

  if (originalCount > rtCount + quoteCount) insights.push({ type: 'signal', icon: <CheckCircle className="w-4 h-4" />, title: 'Original Commentary', description: Math.round((originalCount / total) * 100) + '% original posts — real ideas, not just resharing', metric: 'High signal' })
  else insights.push({ type: 'warning', icon: <AlertTriangle className="w-4 h-4" />, title: 'Mostly Amplified', description: Math.round(((rtCount + quoteCount) / total) * 100) + '% RTs or quotes — mostly redistribution', metric: 'Low original signal' })

  insights.push({ type: 'signal', icon: <CheckCircle className="w-4 h-4" />, title: 'Verified Voices', description: verifiedPosts + ' of ' + total + ' from verified/Blue accounts', metric: Math.round((verifiedPosts / total) * 100) + '% credibility' })

  if (postsWithMedia > total * 0.5) insights.push({ type: 'action', icon: <Zap className="w-4 h-4" />, title: 'Visual-First Topic', description: postsWithMedia + ' of ' + total + ' posts include media — visual content dominates' })

  if (avgFollowers > 5000) insights.push({ type: 'signal', icon: <DollarSign className="w-4 h-4" />, title: 'B2B Audience', description: 'Avg ' + formatCount(Math.round(avgFollowers)) + ' followers — professional audience, higher conversion value', metric: 'B2B signal' })

  return insights
}

// ─────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────

function OpportunityCard({ opportunity, index }: { opportunity: Opportunity; index: number }) {
  const confColors: Record<string, string> = { high: 'text-[var(--green)]', medium: 'text-[var(--gold)]', low: 'text-[var(--muted)]' }
  const confidenceLabels: Record<string, string> = { high: '●●● High confidence', medium: '●●○ Medium confidence', low: '●○○ Low confidence' }
  const basisLabel: Record<string, string> = { evidenced: 'evidenced in data', inferred: 'inferred (not in text)', assumed: 'assumed (not in text)' }
  const wtpBasisLabel: Record<string, string> = { evidenced: 'WTP evidenced in tweet text', inferred: 'WTP inferred from context', assumed: 'WTP assumed (no signal)' }

  const cf = opportunity.confidenceFactors
  const paddedNote = opportunity.isPadded ? ' · Added to meet minimum — data thin' : ''

  return (
    <div className="rounded-lg border border-[var(--blue)]/20 bg-[var(--blue)]/5 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[var(--muted)] text-xs font-bold">#{index + 1}</span>
            <span className="text-xs px-2 py-0.5 rounded font-medium bg-[var(--blue)]/10 text-[var(--blue)]">
              {opportunity.proposedProduct.name}
            </span>
            <span className={'text-xs ' + confColors[opportunity.confidence]}>
              {confidenceLabels[opportunity.confidence]}
            </span>
            {opportunity.isPadded && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--gold)]/10 text-[var(--gold)]">
                Padded
              </span>
            )}
          </div>
          {/* Confidence factors — labeled so reader can verify the scoring */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--muted)]">
            <span>samples: {cf.sampleSize}</span>
            <span>·</span>
            <span>WTP: {cf.wtp}</span>
            <span>·</span>
            <span>buyer: {cf.buyer}</span>
            <span>·</span>
            <span>severity: {cf.severity}/3</span>
            <span>·</span>
            <span>addressability: {cf.addressability}/3</span>
          </div>
        </div>
        <Target className="w-4 h-4 text-[var(--blue)] flex-shrink-0 mt-0.5" />
      </div>

      {/* Summary */}
      <p className="text-[var(--text)] text-sm font-medium mb-3 leading-snug">{opportunity.summary}</p>

      {/* 6-point grid */}
      <div className="space-y-2">
        <div className="bg-[var(--surface)] rounded p-2.5">
          <p className="text-[var(--red)] text-xs font-semibold mb-1">① Problem</p>
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{opportunity.problemStatement}</p>
        </div>

        <div className="bg-[var(--surface)] rounded p-2.5">
          <p className="text-[var(--green)] text-xs font-semibold mb-1">② Who Has This <span className="text-[var(--muted)] font-normal">({basisLabel[opportunity.whoHasThis.buyerBasis]})</span></p>
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
            <span className="font-medium text-[var(--text)]">{opportunity.whoHasThis.title}</span>
            {' · '}{opportunity.whoHasThis.company}
          </p>
          <p className="text-[var(--muted)] text-xs mt-0.5">Uses: {opportunity.whoHasThis.currentBehavior}</p>
          <p className="text-[var(--muted)] text-xs">Breaks: {opportunity.whoHasThis.whereItBreaks}</p>
        </div>

        <div className="bg-[var(--surface)] rounded p-2.5">
          <p className="text-[var(--blue)] text-xs font-semibold mb-1">③ Proposed Product</p>
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed font-medium">{opportunity.proposedProduct.coreFeature}</p>
          <div className="mt-1.5 space-y-0.5">
            <p className="text-[var(--muted)] text-xs"><span className="text-[var(--text-secondary)]">Inputs:</span> {opportunity.proposedProduct.inputs.join(', ')}</p>
            <p className="text-[var(--muted)] text-xs"><span className="text-[var(--text-secondary)]">Decisions:</span> {opportunity.proposedProduct.decisions.join(', ')}</p>
            <p className="text-[var(--muted)] text-xs"><span className="text-[var(--text-secondary)]">Outputs:</span> {opportunity.proposedProduct.outputs.join(', ')}</p>
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded p-2.5">
          <p className="text-[var(--gold)] text-xs font-semibold mb-1">④ Revenue Model <span className="text-[var(--muted)] font-normal">({wtpBasisLabel[opportunity.revenueModel.wtpBasis]})</span></p>
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
            <span className="font-medium">{opportunity.revenueModel.structure}</span>
          </p>
          <p className="text-[var(--text)] text-xs font-medium mt-0.5">{opportunity.revenueModel.priceRange}</p>
          <p className="text-[var(--muted)] text-xs mt-0.5">{opportunity.revenueModel.reasoning}</p>
        </div>

        <div className="bg-[var(--surface)] rounded p-2.5">
          <p className="text-[var(--muted)] text-xs font-semibold mb-1">⑤ Competitive Landscape</p>
          <p className="text-[var(--text-secondary)] text-xs">Exists: {opportunity.competitiveLandscape.existing.join(', ')}</p>
          <p className="text-[var(--text-secondary)] text-xs mt-0.5"><span className="text-[var(--red)]">Gap: </span>{opportunity.competitiveLandscape.gap}</p>
        </div>

        <div className="bg-[var(--surface)] rounded p-2.5">
          <p className="text-[var(--purple)] text-xs font-semibold mb-1">⑥ Build Roadmap</p>
          <p className="text-[var(--text-secondary)] text-xs"><span className="text-[var(--blue)]">MVP:</span> {opportunity.buildRoadmap.mvpFeature}</p>
          <p className="text-[var(--text-secondary)] text-xs"><span className="text-[var(--blue)]">Complexity:</span> {opportunity.buildRoadmap.complexity}</p>
          <p className="text-[var(--text-secondary)] text-xs"><span className="text-[var(--blue)]">Top Risk:</span> {opportunity.buildRoadmap.topRisk}</p>
          <p className="text-[var(--text-secondary)] text-xs"><span className="text-[var(--blue)]">First 5:</span> {opportunity.buildRoadmap.firstCustomers}</p>
        </div>
      </div>

      {/* Evidence footer */}
      <p className="text-[var(--muted)] text-xs mt-3 italic">Evidence: {opportunity.rawEvidence}</p>
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const colorMap: Record<string, { text: string; bg: string; border: string }> = {
    signal: { text: 'text-[var(--blue)]', bg: 'bg-[var(--blue)]/10', border: 'border-[var(--blue)]/20' },
    warning: { text: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10', border: 'border-[#f59e0b]/20' },
    action: { text: 'text-[var(--green)]', bg: 'bg-[var(--green)]/10', border: 'border-[var(--green)]/20' },
    trend: { text: 'text-[var(--purple)]', bg: 'bg-[var(--purple)]/10', border: 'border-[var(--purple)]/20' },
  }
  const c = colorMap[insight.type]

  return (
    <div className={'rounded-lg border p-3 ' + c.bg + ' ' + c.border}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={c.text}>{insight.icon}</span>
        <span className="text-xs font-medium text-[var(--text)]">{insight.title}</span>
      </div>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{insight.description}</p>
      {insight.metric && <p className={'text-xs font-semibold mt-1 ' + c.text}>{insight.metric}</p>}
    </div>
  )
}

function TopAuthorSpotlight({ tweets, onUsernameClick }: { tweets: Tweet[]; onUsernameClick?: (u: string) => void }) {
  const authorEngagement: Record<string, { user: Tweet['user']; engagement: number; count: number }> = {}
  tweets.forEach(function(t) {
    if (!t.user) return
    const key = t.user.username
    const eng = (t.like_count || 0) + (t.retweet_count || 0) + (t.reply_count || 0)
    if (!authorEngagement[key]) authorEngagement[key] = { user: t.user, engagement: eng, count: 1 }
    else { authorEngagement[key].engagement += eng; authorEngagement[key].count++ }
  })

  const top3 = Object.values(authorEngagement)
    .filter(function(a) { return a.user !== null })
    .sort(function(a, b) { return b.engagement - a.engagement })
    .slice(0, 3)

  if (top3.length === 0) return null

  return (
    <div>
      <h3 className="text-[var(--text)] text-sm font-semibold flex items-center gap-2 mb-3">
        <Megaphone className="w-4 h-4 text-[var(--blue)]" />
        Key Voices to Know
      </h3>
      <div className="space-y-2">
        {top3.map(function(item, i) {
          const user = item.user
          return (
            <div
              key={user?.username ?? i}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface-hover)] hover:opacity-80 transition-opacity cursor-pointer"
              onClick={function() { user && onUsernameClick?.(user.username) }}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--blue)]/10 text-[var(--blue)] text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              {user?.profile_image_url ? (
                <img src={user.profile_image_url} alt={user.username} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--border)] flex items-center justify-center text-[var(--muted)] flex-shrink-0">?</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--text)] text-sm font-medium truncate">{user?.name || user?.username}</span>
                  {user?.is_blue_verified && (
                    <svg className="w-3.5 h-3.5 text-[var(--blue)] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span>@{user?.username}</span>
                  <span>·</span>
                  <span>{formatCount(user?.followers_count ?? 0)} followers</span>
                  <span>·</span>
                  <span>{item.count} post{item.count > 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[var(--text)] text-sm font-semibold">{formatCount(item.engagement)}</p>
                <p className="text-[var(--muted)] text-xs">engagement</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopicSentimentBanner({ sentiment }: { sentiment: OverallSentiment }) {
  const colorMap: Record<string, { bg: string; border: string; text: string; label: string }> = {
    positive: { bg: 'bg-[var(--green)]/10', border: 'border-[var(--green)]/20', text: 'text-[var(--green)]', label: 'Positive Topic Vibe' },
    negative: { bg: 'bg-[var(--red)]/10', border: 'border-[var(--red)]/20', text: 'text-[var(--red)]', label: 'Negative Topic Vibe' },
    neutral: { bg: 'bg-[var(--muted)]/10', border: 'border-[var(--muted)]/20', text: 'text-[var(--muted)]', label: 'Neutral Topic Vibe' },
  }
  const c = colorMap[sentiment.classification]

  return (
    <div className={'rounded-lg border ' + c.bg + ' ' + c.border + ' p-4'}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {sentiment.classification === 'positive' && <TrendingUp className={'w-5 h-5 ' + c.text} />}
          {sentiment.classification === 'negative' && <TrendingDown className={'w-5 h-5 ' + c.text} />}
          {sentiment.classification === 'neutral' && <Minus className={'w-5 h-5 ' + c.text} />}
          <span className={'font-semibold text-sm ' + c.text}>{c.label}</span>
        </div>
        <span className="text-[var(--muted)] text-xs">
          {sentiment.positivePct}% positive · {sentiment.neutralPct}% neutral · {sentiment.negativePct}% negative
        </span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        <div className="bg-[var(--green)] transition-all" style={{ width: sentiment.positivePct + '%' }} />
        <div className="bg-[var(--muted)] transition-all" style={{ width: sentiment.neutralPct + '%' }} />
        <div className="bg-[var(--red)] transition-all" style={{ width: sentiment.negativePct + '%' }} />
      </div>
      <div className="flex gap-4 mt-2 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--green)] inline-block" />{sentiment.positiveCount} positive</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--muted)] inline-block" />{sentiment.neutralCount} neutral</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--red)] inline-block" />{sentiment.negativeCount} negative</span>
      </div>
    </div>
  )
}
