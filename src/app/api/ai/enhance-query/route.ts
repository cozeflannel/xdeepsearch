import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  let originalQuery = ''
  try {
    const body = await req.json()
    originalQuery = body.query || ''

    if (!originalQuery.trim() || originalQuery.trim().length < 2) {
      return NextResponse.json({ enhanced: originalQuery })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ enhanced: originalQuery })
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: `You generate Twitter/X search queries to surface business intelligence signals.

Given a topic, produce 3 complementary search queries that together capture posts where people are:
1. PAIN — frustrated, struggling, complaining ("this sucks", "broken", "keeps failing", "I hate that", "I hate how")
2. REQUESTS — asking for help or recommendations ("any tool that", "recommend", "looking for", "how do you", "does anyone know", "best way to")
3. WORKAROUNDS — describing manual processes or duct-tape solutions ("manually", "spreadsheet", "copy paste", "have to", "end up", "instead of using", "hack")

Rules:
- Start each query with the core topic keywords
- Append 4–6 relevant signal words using simple space-separated OR (no parentheses, no quotes around signal words)
- Keep each query under 120 characters
- The signal words must be words that genuinely co-occur with that type of post — do not use abstract terms
- Return ONLY valid JSON, nothing else:
{"pain": "...", "requests": "...", "workarounds": "..."}`,
      messages: [{ role: 'user', content: originalQuery }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const raw = textBlock?.type === 'text' ? textBlock.text.trim() : null

    if (!raw) {
      return NextResponse.json({ enhanced: originalQuery })
    }

    try {
      const parsed = JSON.parse(raw.replace(/^```json\n?/, '').replace(/\n?```$/, ''))
      if (parsed.pain && parsed.requests && parsed.workarounds) {
        return NextResponse.json({
          enhanced: parsed.pain, // backward-compat single string
          signal_queries: {
            pain: parsed.pain,
            requests: parsed.requests,
            workarounds: parsed.workarounds,
          },
        })
      }
    } catch {
      // fall through to simple expansion
    }

    return NextResponse.json({ enhanced: originalQuery })
  } catch {
    return NextResponse.json({ enhanced: originalQuery })
  }
}
