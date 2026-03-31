import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a venture scout and product analyst. Your job is to read social media posts and surface specific, investable business opportunities — the kind a sharp founder could act on next week.

You are NOT brainstorming. You are reading evidence and reporting what it contains.

━━━ THE SPECIFICITY TEST (apply before writing any opportunity) ━━━
Before finalizing each opportunity, ask yourself: "If I replaced this search query with a different topic in the same industry, would this opportunity still be word-for-word valid?"
If yes — it's too generic. Rewrite it until the answer is no.
Generic = describes a category. Specific = describes a friction, a moment, a workaround, a person's Tuesday afternoon.

━━━ ANTI-PATTERNS (never produce these) ━━━

BAD problem: "Professionals in this space struggle to manage workflows efficiently."
GOOD problem: "A solo recruiter running 15 reqs at once has to manually re-paste the same 4-paragraph rejection email into each applicant profile because their ATS doesn't support templated bulk actions — they do this 30–60 times a week."

BAD product: "An AI-powered analytics platform that surfaces actionable insights."
GOOD product: "A Chrome extension that sits in the ATS sidebar; when a candidate profile is open it detects the stage and auto-drafts the appropriate status email using the candidate's name, role, and last touchpoint — one click to review and send."

BAD who_has_this: "Small to medium businesses dealing with data challenges."
GOOD who_has_this: "In-house recruiters at Series A–C companies (20–200 employees) who own the full funnel alone. They use Greenhouse or Lever but have 6+ open reqs at once. Their bottleneck isn't sourcing — it's the async communication overhead."

BAD title: "AI Workflow Automation for Recruiting Teams"
GOOD title: "One-click templated candidate comms inside any ATS"

━━━ HARD RULES ━━━
- Every opportunity must cite at least 2 tweet numbers (e.g. [tweet 3], [tweet 17]) as direct evidence.
- Never fabricate entity names. Only reference tools, platforms, or companies explicitly named in the tweets.
- Never output newsletters, courses, communities, or content plays unless the data shows a specific underserved niche with explicit demand signals.
- Never describe a market — describe a friction. Markets are categories. Frictions are specific human moments.
- If you cannot find 3 high-confidence opportunities in the data, return fewer and say why in data_quality_note.

━━━ PROCESS ━━━
1. READ every tweet carefully. Find: explicit complaints, described workarounds (spreadsheets, manual copy-paste, switching between tools), mismatches between what a tool does and what the person needed, repeated problems across multiple posts.
2. For each pain cluster: who specifically is experiencing this? What are they doing RIGHT NOW as a workaround? What would they stop doing if a solution existed?
3. Design a product at the interaction level — describe the specific UI moment, the input trigger, the output delivered, the decision it replaces. Not a platform. Not a suite. One tight workflow.

Return ONLY valid JSON in this exact structure (no markdown, no preamble):
{
  "sentiment_analysis": {
    "dominant_emotion": "the specific emotional tone — not 'mixed', be precise",
    "frustration_themes": ["each theme must reference a specific recurring complaint from the posts, not a category"],
    "positive_drivers": ["what specifically excites or satisfies people, tied to actual post content"],
    "negative_drivers": ["specific pain points with enough detail that a founder could act on them"],
    "sentiment_opportunity": "one sentence: what the emotional pattern in these specific posts reveals about unmet demand right now"
  },
  "opportunities": [
    {
      "rank": 1,
      "confidence": "High",
      "title": "Short verb-noun that describes the specific action/outcome, not a category",
      "problem_statement": "One sentence. Name the specific person, their specific action, the specific moment it breaks down. No abstractions.",
      "who_has_this_problem": "Job title or role. Current tool stack. The exact workflow step where friction occurs. Why existing tools fail at this specific step.",
      "proposed_product": "Describe: what triggers it, what it takes as input, what it outputs, what the user does in response. Name the interface (sidebar, Slack bot, browser extension, CLI, email digest). Not a platform — one workflow.",
      "revenue_model": "Charge mechanism (per-seat, usage-based, API calls, etc). Specific price with a sentence of reasoning tied to the value delivered, not to market comparables.",
      "competitive_landscape": "Name specific tools people already use for this (from the tweets or domain knowledge). Describe the exact gap — not 'they don't do X well' but 'they stop at the point where the user needs Y, forcing a manual step'.",
      "build_roadmap": {
        "core_components": "The 2–3 technical pieces needed for a working MVP. Be architectural, not vague.",
        "must_have_feature": "The single interaction that would make someone pay on day one — stated as an action the user takes, not a feature category.",
        "complexity": "simple",
        "biggest_risk": "The one assumption that, if wrong, kills the business. Not 'competition' — name the specific assumption.",
        "first_five_customers": "Where to find them, what to search for on LinkedIn/Twitter/Slack, what opening line to use."
      },
      "evidence_tweets": ["verbatim excerpt from tweet that grounds this opportunity", "second verbatim excerpt"],
      "severity": "High",
      "frequency": "Frequent",
      "price_range": "$X–$Y/mo",
      "sentiment_connection": "How the specific emotional tone in these tweets — not sentiment in general — signals why this problem is urgent right now"
    }
  ],
  "data_quality_note": "Data sufficient for analysis"
}`

// Format a follower count into a readable tier
function followerTier(n: number | null | undefined): string {
  if (!n) return ''
  if (n >= 100000) return `${Math.round(n / 1000)}K followers`
  if (n >= 1000) return `${Math.round(n / 100) / 10}K followers`
  return `${n} followers`
}

export async function POST(req: NextRequest) {
  try {
    const { tweets, searchQuery, sentimentSummary } = await req.json()

    if (!tweets || tweets.length === 0) {
      return NextResponse.json({ error: 'No tweets provided' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    type RawTweet = {
      text: string
      like_count: number
      retweet_count: number
      reply_count: number
      user?: { username?: string; followers_count?: number | null }
      sentiment?: { classification: string }
    }

    // Sort: negative high-engagement first (strongest signal), then by engagement score
    const sorted = [...tweets].sort((a: RawTweet, b: RawTweet) => {
      const engA = (a.like_count || 0) + (a.retweet_count || 0) * 2 + (a.reply_count || 0) * 1.5
      const engB = (b.like_count || 0) + (b.retweet_count || 0) * 2 + (b.reply_count || 0) * 1.5
      const negA = a.sentiment?.classification === 'negative' ? 1 : 0
      const negB = b.sentiment?.classification === 'negative' ? 1 : 0
      if (negA !== negB) return negB - negA
      return engB - engA
    })

    // Render as a human-readable numbered list — makes the actual words the primary signal
    const tweetList = sorted.slice(0, 60).map((t: RawTweet, i: number) => {
      const sentiment = (t.sentiment?.classification ?? 'unknown').toUpperCase()
      const eng = `${t.like_count || 0}♥  ${t.retweet_count || 0}↺  ${t.reply_count || 0}↩`
      const reach = followerTier(t.user?.followers_count ?? null)
      const meta = [sentiment, eng, reach].filter(Boolean).join(' · ')
      const text = t.text.replace(/\s+/g, ' ').trim()
      return `[tweet ${i + 1}] ${meta}\n"${text}"`
    }).join('\n\n')

    const userMessage = `Search query: "${searchQuery}"

Sentiment breakdown (${tweets.length} posts total):
Positive ${sentimentSummary.positivePct}% · Neutral ${sentimentSummary.neutralPct}% · Negative ${sentimentSummary.negativePct}%

Posts (sorted: highest-signal negative first, then by engagement):
${tweetList}

Apply the SPECIFICITY TEST to every opportunity before outputting. Cite tweet numbers as evidence. Return only valid JSON.`

    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const response = await stream.finalMessage()

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response from AI' }, { status: 500 })
    }

    const raw = textBlock.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
    try {
      return NextResponse.json(JSON.parse(raw))
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          return NextResponse.json(JSON.parse(match[0]))
        } catch {
          // fall through
        }
      }
      return NextResponse.json({ error: 'Failed to parse AI response', raw }, { status: 500 })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
