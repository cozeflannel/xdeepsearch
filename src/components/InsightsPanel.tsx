'use client'

import { useState } from 'react'
import {
  Loader2,
  AlertTriangle,
  Target,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  DollarSign,
  Users,
  Cpu,
  Map,
  Eye,
  ShieldAlert,
  Quote,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIOpportunity {
  rank: number
  confidence: 'High' | 'Medium' | 'Low'
  title: string
  problem_statement: string
  who_has_this_problem: string
  proposed_product: string
  revenue_model: string
  competitive_landscape: string
  build_roadmap: {
    core_components: string
    must_have_feature: string
    complexity: 'simple' | 'moderate' | 'significant'
    biggest_risk: string
    first_five_customers: string
  }
  severity: 'Low' | 'Medium' | 'High'
  frequency: 'Rare' | 'Occasional' | 'Frequent'
  price_range: string
  sentiment_connection: string
  evidence_tweets?: string[]
}

export interface AIInsights {
  sentiment_analysis: {
    dominant_emotion: string
    frustration_themes: string[]
    positive_drivers: string[]
    negative_drivers: string[]
    sentiment_opportunity: string
  }
  opportunities: AIOpportunity[]
  data_quality_note: string
}

interface InsightsPanelProps {
  insights: AIInsights | null
  loading: boolean
  error: string | null
  tweetCount: number
  searchQuery: string
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InsightsPanel({
  insights,
  loading,
  error,
  tweetCount,
  searchQuery,
}: InsightsPanelProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  if (!searchQuery) {
    return (
      <div className="p-5 flex flex-col items-center justify-center text-center min-h-[200px]">
        <div className="w-10 h-10 rounded-full bg-[var(--blue)]/10 flex items-center justify-center mb-3">
          <Target className="w-5 h-5 text-[var(--blue)]" />
        </div>
        <p className="text-[var(--muted)] text-sm">Business opportunities appear here after a search</p>
        <p className="text-[var(--muted)] text-xs mt-1 opacity-60">
          AI analyzes post data to surface real problems worth building for
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-5 flex flex-col items-center justify-center min-h-[200px] gap-3">
        <Loader2 className="w-6 h-6 text-[var(--blue)] animate-spin" />
        <div className="text-center">
          <p className="text-[var(--text)] text-sm font-medium">Analyzing {tweetCount} posts</p>
          <p className="text-[var(--muted)] text-xs mt-0.5">Mining for hidden pain points and business opportunities...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-5">
        <div className="bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-[#dc2626]" />
            <p className="text-[#dc2626] text-sm font-medium">Analysis failed</p>
          </div>
          <p className="text-[#f87171] text-xs">{error}</p>
        </div>
      </div>
    )
  }

  if (!insights) return null

  const { sentiment_analysis, opportunities, data_quality_note } = insights

  return (
    <div className="p-4 space-y-5">
      {/* Sentiment section */}
      <SentimentSection sentiment={sentiment_analysis} />

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div>
          <h3 className="text-[var(--text)] text-sm font-semibold flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-[var(--blue)]" />
            Business Opportunities
            <span className="text-xs font-normal text-[var(--muted)]">({opportunities.length} identified)</span>
          </h3>
          <div className="space-y-2">
            {opportunities.map((opp, i) => (
              <OpportunityCard
                key={i}
                opportunity={opp}
                expanded={expandedIdx === i}
                onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Comparison table */}
      {opportunities.length > 1 && <ComparisonTable opportunities={opportunities} />}

      {/* Data quality note */}
      {data_quality_note && data_quality_note !== 'Data sufficient for analysis' && (
        <p className="text-xs text-[var(--muted)] italic border-t border-[var(--border)] pt-3">
          {data_quality_note}
        </p>
      )}
    </div>
  )
}

// ─── Sentiment Section ────────────────────────────────────────────────────────

function SentimentSection({ sentiment }: { sentiment: AIInsights['sentiment_analysis'] }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <Eye className="w-3.5 h-3.5 text-[var(--muted)]" />
        <span className="text-xs font-semibold text-[var(--text)]">Sentiment Intelligence</span>
        <span className="ml-auto text-xs text-[var(--muted)] italic">{sentiment.dominant_emotion}</span>
      </div>
      <div className="p-4 space-y-3">
        {/* Opportunity sentence */}
        <p className="text-sm text-[var(--text)] leading-relaxed">{sentiment.sentiment_opportunity}</p>

        <div className="grid grid-cols-2 gap-3">
          {sentiment.frustration_themes.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingDown className="w-3 h-3 text-[#f4212e]" />
                <span className="text-xs font-medium text-[var(--muted)]">Pain signals</span>
              </div>
              <ul className="space-y-1">
                {sentiment.frustration_themes.slice(0, 4).map((t, i) => (
                  <li key={i} className="text-xs text-[var(--text)] flex items-start gap-1.5">
                    <span className="text-[#f4212e] mt-0.5 flex-shrink-0">·</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sentiment.positive_drivers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3 h-3 text-[#00ba7c]" />
                <span className="text-xs font-medium text-[var(--muted)]">Positive signals</span>
              </div>
              <ul className="space-y-1">
                {sentiment.positive_drivers.slice(0, 4).map((d, i) => (
                  <li key={i} className="text-xs text-[var(--text)] flex items-start gap-1.5">
                    <span className="text-[#00ba7c] mt-0.5 flex-shrink-0">·</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Opportunity Card ─────────────────────────────────────────────────────────

const CONFIDENCE_STYLES = {
  High: 'bg-[#00ba7c]/10 text-[#00ba7c] border-[#00ba7c]/20',
  Medium: 'bg-[#1d9bf0]/10 text-[#1d9bf0] border-[#1d9bf0]/20',
  Low: 'bg-[#71717a]/10 text-[var(--muted)] border-[#71717a]/20',
}

const COMPLEXITY_LABEL = {
  simple: { label: 'Days to build', color: 'text-[#00ba7c]' },
  moderate: { label: 'Weeks to build', color: 'text-[#1d9bf0]' },
  significant: { label: 'Months to build', color: 'text-[#f59e0b]' },
}

function OpportunityCard({
  opportunity: opp,
  expanded,
  onToggle,
}: {
  opportunity: AIOpportunity
  expanded: boolean
  onToggle: () => void
}) {
  const complexityMeta = COMPLEXITY_LABEL[opp.build_roadmap.complexity] ?? COMPLEXITY_LABEL.moderate

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 hover:bg-[var(--surface-hover)]/40 transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className="text-xs font-bold text-[var(--muted)] mt-0.5 w-4 flex-shrink-0">#{opp.rank}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CONFIDENCE_STYLES[opp.confidence]}`}
              >
                {opp.confidence} Confidence
              </span>
              <span className={`text-[10px] ${complexityMeta.color}`}>{complexityMeta.label}</span>
              <span className="text-[10px] text-[var(--muted)] ml-auto">{opp.price_range}</span>
            </div>
            <p className="text-sm font-semibold text-[var(--text)] leading-snug">{opp.title}</p>
            <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">{opp.problem_statement}</p>
          </div>
          <div className="flex-shrink-0 mt-0.5">
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-[var(--muted)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[var(--border)] space-y-4">
          {/* Evidence tweets — verbatim excerpts from the data */}
          {opp.evidence_tweets && opp.evidence_tweets.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Quote className="w-3 h-3 text-[var(--muted)]" />
                <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">Evidence from posts</span>
              </div>
              {opp.evidence_tweets.map((excerpt, i) => (
                <blockquote
                  key={i}
                  className="border-l-2 border-[var(--blue)]/40 pl-3 text-xs text-[var(--text)] italic opacity-80 leading-relaxed"
                >
                  {excerpt}
                </blockquote>
              ))}
            </div>
          )}

          {/* Sentiment connection */}
          <div className="bg-[#a78bfa]/5 border border-[#a78bfa]/20 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Minus className="w-3 h-3 text-[#a78bfa]" />
              <span className="text-[10px] font-semibold text-[#a78bfa] uppercase tracking-wide">Sentiment signal</span>
            </div>
            <p className="text-xs text-[var(--text)]">{opp.sentiment_connection}</p>
          </div>

          <DetailSection icon={<Users className="w-3.5 h-3.5 text-[var(--blue)]" />} label="Who has this problem">
            <p className="text-xs text-[var(--text)] leading-relaxed">{opp.who_has_this_problem}</p>
          </DetailSection>

          <DetailSection icon={<Zap className="w-3.5 h-3.5 text-[#00ba7c]" />} label="The product">
            <p className="text-xs text-[var(--text)] leading-relaxed">{opp.proposed_product}</p>
          </DetailSection>

          <DetailSection icon={<DollarSign className="w-3.5 h-3.5 text-[#f59e0b]" />} label="Revenue model">
            <p className="text-xs text-[var(--text)] leading-relaxed">{opp.revenue_model}</p>
          </DetailSection>

          <DetailSection icon={<ShieldAlert className="w-3.5 h-3.5 text-[#f4212e]" />} label="Competitive landscape">
            <p className="text-xs text-[var(--text)] leading-relaxed">{opp.competitive_landscape}</p>
          </DetailSection>

          <DetailSection icon={<Cpu className="w-3.5 h-3.5 text-[var(--muted)]" />} label="Build roadmap">
            <div className="space-y-1.5">
              <RoadmapRow label="Core" value={opp.build_roadmap.core_components} />
              <RoadmapRow label="Day-1 feature" value={opp.build_roadmap.must_have_feature} highlight />
              <RoadmapRow label="Biggest risk" value={opp.build_roadmap.biggest_risk} />
              <RoadmapRow label="First 5 customers" value={opp.build_roadmap.first_five_customers} />
            </div>
          </DetailSection>

          <DetailSection icon={<Map className="w-3.5 h-3.5 text-[var(--muted)]" />} label="Where to start">
            <p className="text-xs text-[var(--text)] leading-relaxed">{opp.build_roadmap.first_five_customers}</p>
          </DetailSection>
        </div>
      )}
    </div>
  )
}

function DetailSection({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">{label}</span>
      </div>
      {children}
    </div>
  )
}

function RoadmapRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-[10px] text-[var(--muted)] w-24 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-xs leading-relaxed ${highlight ? 'text-[var(--text)] font-medium' : 'text-[var(--text)]'}`}>
        {value}
      </span>
    </div>
  )
}

// ─── Comparison Table ─────────────────────────────────────────────────────────

function ComparisonTable({ opportunities }: { opportunities: AIOpportunity[] }) {
  const SEV_COLOR = { High: 'text-[#f4212e]', Medium: 'text-[#f59e0b]', Low: 'text-[var(--muted)]' }
  const FREQ_COLOR = { Frequent: 'text-[#00ba7c]', Occasional: 'text-[#1d9bf0]', Rare: 'text-[var(--muted)]' }

  return (
    <div>
      <h4 className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">Quick comparison</h4>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">Opportunity</th>
              <th className="text-center px-2 py-2 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">Conf.</th>
              <th className="text-center px-2 py-2 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">Severity</th>
              <th className="text-center px-2 py-2 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">Freq.</th>
              <th className="text-center px-2 py-2 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">Build</th>
              <th className="text-right px-3 py-2 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">Price</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp, i) => (
              <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)]/30">
                <td className="px-3 py-2 max-w-[160px]">
                  <span className="text-[var(--text)] line-clamp-1 font-medium">{opp.title}</span>
                </td>
                <td className="px-2 py-2 text-center">
                  <span className={`text-[10px] font-semibold ${CONFIDENCE_STYLES[opp.confidence].split(' ')[1]}`}>
                    {opp.confidence}
                  </span>
                </td>
                <td className={`px-2 py-2 text-center text-[10px] font-medium ${SEV_COLOR[opp.severity]}`}>
                  {opp.severity}
                </td>
                <td className={`px-2 py-2 text-center text-[10px] font-medium ${FREQ_COLOR[opp.frequency]}`}>
                  {opp.frequency}
                </td>
                <td className="px-2 py-2 text-center text-[10px] text-[var(--muted)] capitalize">
                  {opp.build_roadmap.complexity}
                </td>
                <td className="px-3 py-2 text-right text-[10px] text-[var(--muted)] whitespace-nowrap">
                  {opp.price_range}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
