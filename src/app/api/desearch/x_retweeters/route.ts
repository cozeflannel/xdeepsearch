import { NextRequest, NextResponse } from 'next/server'
import { getRetweeters } from '@/lib/desearch'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await getRetweeters(body.postId, body.cursor)

    if (result && typeof result === 'object' && 'error' in result) {
      const err = result as { error: string; status?: number }
      return NextResponse.json(result, { status: err.status || 500 })
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
