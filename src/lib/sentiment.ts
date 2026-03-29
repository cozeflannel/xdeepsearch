// eslint-disable-next-line @typescript-eslint/no-require-imports
const Sentiment = require('sentiment')

const analyzer = new Sentiment()

export type SentimentScore = 'positive' | 'neutral' | 'negative'

export interface TweetSentiment {
  score: number // raw AFINN score
  comparative: number // score normalized by word count
  classification: SentimentScore
}

export interface OverallSentiment {
  classification: SentimentScore
  score: number // avg comparative score across all tweets
  positiveCount: number
  negativeCount: number
  neutralCount: number
  positivePct: number
  negativePct: number
  neutralPct: number
}

export function analyzeTweet(text: string): TweetSentiment {
  const result = analyzer.analyze(text)
  const comparative = result.comparative

  let classification: SentimentScore
  if (comparative > 0.05) {
    classification = 'positive'
  } else if (comparative < -0.05) {
    classification = 'negative'
  } else {
    classification = 'neutral'
  }

  return {
    score: result.score,
    comparative,
    classification,
  }
}

export function analyzeOverall(tweets: { text: string }[]): OverallSentiment {
  if (tweets.length === 0) {
    return {
      classification: 'neutral',
      score: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      positivePct: 0,
      negativePct: 0,
      neutralPct: 0,
    }
  }

  let totalComparative = 0
  let positiveCount = 0
  let negativeCount = 0
  let neutralCount = 0

  tweets.forEach(({ text }) => {
    const { comparative, classification } = analyzeTweet(text)
    totalComparative += comparative
    if (classification === 'positive') positiveCount++
    else if (classification === 'negative') negativeCount++
    else neutralCount++
  })

  const avgComparative = totalComparative / tweets.length

  const positivePct = Math.round((positiveCount / tweets.length) * 100)
  const negativePct = Math.round((negativeCount / tweets.length) * 100)
  const neutralPct = 100 - positivePct - negativePct

  let classification: SentimentScore
  if (avgComparative > 0.03) classification = 'positive'
  else if (avgComparative < -0.03) classification = 'negative'
  else classification = 'neutral'

  return {
    classification,
    score: avgComparative,
    positiveCount,
    negativeCount,
    neutralCount,
    positivePct,
    negativePct,
    neutralPct,
  }
}
