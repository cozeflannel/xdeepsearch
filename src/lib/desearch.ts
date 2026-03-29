import { spawn } from 'child_process'
import { SearchFilters } from '@/types'

const CLI_PATH = `${process.env.HOME}/.openclaw/skills/desearch-x-search/scripts/desearch.py`

function buildArgs(command: string, args: Record<string, string | number | boolean | undefined>): string[] {
  const positionalArgs: string[] = []
  const flags: string[] = []

  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null) continue

    // Convert camelCase to kebab-case
    const kebabKey = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

    if (typeof value === 'boolean') {
      if (value) flags.push(`--${kebabKey}`)
    } else if (typeof value === 'number') {
      flags.push(`--${kebabKey}`, String(value))
    } else if (typeof value === 'string' && value !== '') {
      // Handle special cases for the CLI argument names
      if (key === 'query') {
        positionalArgs.push(String(value))
      } else if (key === 'extraQuery') {
        flags.push(`--query`, String(value))
      } else {
        flags.push(`--${kebabKey}`, String(value))
      }
    }
  }

  return [command, ...positionalArgs, ...flags]
}

export function callDesearch(command: string, args: Record<string, unknown> = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.DESEARCH_API_KEY

    if (!apiKey) {
      reject({ error: 'Invalid or missing API key. Configure DESEARCH_API_KEY.', details: 'Environment variable not set' })
      return
    }

    const env = {
      ...process.env,
      DESEARCH_API_KEY: apiKey,
    }

    // Build CLI arguments
    const cliArgs = buildArgs(command, args as Record<string, string | number | boolean | undefined>)

    const proc = spawn('python3', [CLI_PATH, ...cliArgs], {
      env,
      timeout: 30000,
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('error', (err) => {
      reject({ error: 'Request failed. Check connection and retry.', details: err.message })
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        // Try to parse error from stderr/stdout
        try {
          const parsed = JSON.parse(stdout || stderr)
          if (parsed?.detail) {
            // Handle 401/402 style errors
            if (parsed.detail.includes('Invalid or missing API key')) {
              resolve({ error: 'Invalid or missing API key. Configure DESEARCH_API_KEY.', status: 401 })
            } else if (parsed.detail.includes('balance') || parsed.detail.includes('funds')) {
              resolve({ error: 'Desearch balance depleted. Add funds at console.desearch.ai.', status: 402 })
            } else {
              resolve({ error: parsed.detail, status: code || 500 })
            }
          } else {
            resolve({ error: `Command failed: ${stderr || stdout}`, status: code || 500 })
          }
        } catch {
          resolve({ error: stderr || stdout || `Command exited with code ${code}`, status: code || 500 })
        }
        return
      }

      try {
        const parsed = JSON.parse(stdout)
        resolve(parsed)
      } catch {
        resolve({ error: 'Failed to parse response', details: stdout, status: 500 })
      }
    })
  })
}

export async function searchX(filters: SearchFilters) {
  const args: Record<string, unknown> = {
    query: filters.query,
    sort: filters.sort || 'Latest',
    count: filters.count || 20,
  }

  if (filters.user) args.user = filters.user
  if (filters.startDate) args.startDate = filters.startDate
  if (filters.endDate) args.endDate = filters.endDate
  if (filters.lang) args.lang = filters.lang
  if (filters.verified) args.verified = true
  if (filters.blueVerified) args.blueVerified = true
  if (filters.isQuote) args.isQuote = true
  if (filters.isVideo) args.isVideo = true
  if (filters.isImage) args.isImage = true
  if (filters.minRetweets !== undefined && filters.minRetweets > 0) args.minRetweets = filters.minRetweets
  if (filters.minReplies !== undefined && filters.minReplies > 0) args.minReplies = filters.minReplies
  if (filters.minLikes !== undefined && filters.minLikes > 0) args.minLikes = filters.minLikes

  return callDesearch('x', args)
}

export async function searchXUser(user: string, query: string, count?: number) {
  return callDesearch('x_user', {
    query: user,
    extraQuery: query,
    count: count || 20,
  })
}

export async function getTimeline(username: string, count?: number) {
  return callDesearch('x_timeline', {
    query: username,
    count: count || 20,
  })
}

export async function getReplies(user: string, query?: string, count?: number) {
  return callDesearch('x_replies', {
    query: user,
    extraQuery: query || '',
    count: count || 20,
  })
}

export async function getPostReplies(postId: string, query?: string, count?: number) {
  return callDesearch('x_post_replies', {
    query: postId,
    extraQuery: query || '',
    count: count || 20,
  })
}

export async function getRetweeters(postId: string, cursor?: string) {
  return callDesearch('x_retweeters', {
    query: postId,
    cursor: cursor || undefined,
  })
}

export async function getPost(id: string) {
  return callDesearch('x_post', { query: id })
}

export async function getPostsByUrls(urls: string[]) {
  return callDesearch('x_urls', { urls })
}
