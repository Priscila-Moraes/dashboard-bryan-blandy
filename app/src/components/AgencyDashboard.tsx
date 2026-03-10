import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Building2,
  DollarSign,
  ExternalLink,
  Eye,
  MousePointer,
  Play,
  RefreshCw,
  ShoppingCart,
  Target,
  Users,
} from 'lucide-react'
import { DatePicker } from './DatePicker'
import { Funnel } from './Funnel'
import { MetricCard } from './MetricCard'
import { formatCurrency, formatDateFull, formatNumber, formatPercent, getDateRange } from '../lib/utils'
import {
  aggregateCreatives,
  getAdCreativesByCampaignPatterns,
  type AdCreative,
} from '../lib/supabase'
import {
  agencyClients,
  type AgencyCampaignConfig,
  type AgencyClient,
  type AudienceMatcher,
  type CampaignObjective,
} from '../data/agencyDashboardData'

type ObjectiveFilter = 'all' | CampaignObjective

interface AudienceBreakdown {
  name: string
  spend: number
  conversions: number
  costPerConversion: number
}

interface CampaignCreativeView {
  name: string
  segment?: string
  conversions: number
  costPerConversion: number | null
  linkUrl?: string
  note?: string
}

interface AgencyCampaignView {
  id: string
  title: string
  objective: CampaignObjective
  spend: number
  impressions: number
  clicks: number
  pageViews: number
  thruplays: number
  video25Pct: number
  video50Pct: number
  video75Pct: number
  video95Pct: number
  conversions: number
  costPerConversion: number
  cpm: number
  ctr: number
  cpc: number
  loadRate: number
  conversionRateClicks: number
  conversionRatePageViews: number
  thruplayRate: number
  video25Rate: number
  video50Rate: number
  video75Rate: number
  video95Rate: number
  audiences?: AudienceBreakdown[]
  topCreatives: CampaignCreativeView[]
  sourceNote?: string
  highlights: string[]
  hasData: boolean
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function formatDecimal(value: number) {
  return value.toFixed(2).replace('.', ',')
}

function matchesPatterns(campaignName: string, patterns: string[]) {
  const normalizedName = normalizeText(campaignName)
  return patterns.some((pattern) => normalizedName.includes(normalizeText(pattern)))
}

function getCreativeConversions(row: AdCreative, objective: CampaignObjective) {
  if (objective === 'sales') {
    return row.sheet_purchases > 0 ? row.sheet_purchases : row.purchases || 0
  }
  if (objective === 'video') {
    return row.thruplays || 0
  }
  return row.sheet_leads_utm > 0 ? row.sheet_leads_utm : row.leads || 0
}

function getObjectiveLabel(objective: CampaignObjective) {
  if (objective === 'sales') return 'Vendas'
  if (objective === 'video') return 'Video'
  return 'Leads'
}

function getResultLabel(objective: CampaignObjective) {
  if (objective === 'sales') return 'Vendas'
  if (objective === 'video') return 'ThruPlays'
  return 'Leads'
}

function getCostLabel(objective: CampaignObjective) {
  if (objective === 'sales') return 'CPA'
  if (objective === 'video') return 'Custo/ThruPlay'
  return 'CPL'
}

function getZeroResultNote(objective: CampaignObjective) {
  if (objective === 'sales') return 'Sem venda no período.'
  if (objective === 'video') return 'Sem ThruPlay no período.'
  return 'Sem lead no período.'
}

function buildAudienceBreakdown(
  rows: AdCreative[],
  objective: CampaignObjective,
  matchers?: AudienceMatcher[]
): AudienceBreakdown[] | undefined {
  if (!matchers || matchers.length === 0) {
    return undefined
  }

  const breakdown = matchers
    .map((matcher) => {
      const matchedRows = rows.filter((row) => matchesPatterns(row.campaign_name || '', matcher.patterns))
      const spend = matchedRows.reduce((sum, row) => sum + (row.spend || 0), 0)
      const conversions = matchedRows.reduce((sum, row) => sum + getCreativeConversions(row, objective), 0)

      return {
        name: matcher.name,
        spend,
        conversions,
        costPerConversion: conversions > 0 ? spend / conversions : 0,
      }
    })
    .filter((item) => item.spend > 0 || item.conversions > 0)

  return breakdown.length > 0 ? breakdown.sort((a, b) => b.conversions - a.conversions) : undefined
}

function buildCampaignView(config: AgencyCampaignConfig, rows: AdCreative[]): AgencyCampaignView {
  const spend = rows.reduce((sum, row) => sum + (row.spend || 0), 0)
  const impressions = rows.reduce((sum, row) => sum + (row.impressions || 0), 0)
  const clicks = rows.reduce((sum, row) => sum + (row.link_clicks || 0), 0)
  const pageViews = rows.reduce((sum, row) => sum + (row.page_views || 0), 0)
  const thruplays = rows.reduce((sum, row) => sum + (row.thruplays || 0), 0)
  const video25Pct = rows.reduce((sum, row) => sum + (row.video_25_pct || 0), 0)
  const video50Pct = rows.reduce((sum, row) => sum + (row.video_50_pct || 0), 0)
  const video75Pct = rows.reduce((sum, row) => sum + (row.video_75_pct || 0), 0)
  const video95Pct = rows.reduce((sum, row) => sum + (row.video_95_pct || 0), 0)
  const conversions = rows.reduce((sum, row) => sum + getCreativeConversions(row, config.objective), 0)

  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
  const cpc = clicks > 0 ? spend / clicks : 0
  const loadRate = clicks > 0 ? (pageViews / clicks) * 100 : 0
  const conversionRateClicks = clicks > 0 ? (conversions / clicks) * 100 : 0
  const conversionRatePageViews = pageViews > 0 ? (conversions / pageViews) * 100 : 0
  const costPerConversion = conversions > 0 ? spend / conversions : 0
  const thruplayRate = impressions > 0 ? (thruplays / impressions) * 100 : 0
  const video25Rate = impressions > 0 ? (video25Pct / impressions) * 100 : 0
  const video50Rate = impressions > 0 ? (video50Pct / impressions) * 100 : 0
  const video75Rate = impressions > 0 ? (video75Pct / impressions) * 100 : 0
  const video95Rate = impressions > 0 ? (video95Pct / impressions) * 100 : 0

  const creatives = aggregateCreatives(rows)
    .map((creative) => {
      const conversionsForCreative =
        config.objective === 'sales'
          ? creative.sheetPurchases > 0
            ? creative.sheetPurchases
            : creative.purchases || 0
          : config.objective === 'video'
            ? creative.thruplays || 0
            : creative.sheetLeadsUtm > 0
              ? creative.sheetLeadsUtm
              : creative.leads || 0

      const overrideLink = config.creativeLinkOverrides?.[creative.ad_name]
      return {
        name: creative.ad_name || '(sem nome)',
        conversions: conversionsForCreative,
        costPerConversion: conversionsForCreative > 0 ? creative.spend / conversionsForCreative : null,
        linkUrl: creative.instagram_permalink || overrideLink,
        note: conversionsForCreative === 0 ? getZeroResultNote(config.objective) : undefined,
      }
    })
    .sort((left, right) => {
      if (right.conversions !== left.conversions) {
        return right.conversions - left.conversions
      }
      if (left.costPerConversion === null && right.costPerConversion === null) return 0
      if (left.costPerConversion === null) return 1
      if (right.costPerConversion === null) return -1
      return left.costPerConversion - right.costPerConversion
    })
    .slice(0, 5)

  return {
    id: config.id,
    title: config.title,
    objective: config.objective,
    spend,
    impressions,
    clicks,
    pageViews,
    thruplays,
    video25Pct,
    video50Pct,
    video75Pct,
    video95Pct,
    conversions,
    costPerConversion,
    cpm,
    ctr,
    cpc,
    loadRate,
    conversionRateClicks,
    conversionRatePageViews,
    thruplayRate,
    video25Rate,
    video50Rate,
    video75Rate,
    video95Rate,
    audiences: buildAudienceBreakdown(rows, config.objective, config.audiences),
    topCreatives: creatives,
    sourceNote: config.sourceNote,
    highlights: config.highlights,
    hasData: rows.length > 0,
  }
}

function AudienceBars({ data }: { data: AudienceBreakdown[] }) {
  const maxConversions = Math.max(...data.map((item) => item.conversions), 1)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-white">Publicos</h4>
          <p className="text-xs text-white/45">Comparativo de volume e custo por resultado.</p>
        </div>
        <Users className="h-4 w-4 text-cyan-300" />
      </div>

      <div className="space-y-3">
        {data.map((item) => {
          const width = Math.max((item.conversions / maxConversions) * 100, item.conversions > 0 ? 16 : 8)

          return (
            <div key={item.name} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-white/85">{item.name}</span>
                <span className="tabular-nums text-white/50">
                  {item.conversions} • {formatCurrency(item.costPerConversion)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CreativeList({
  creatives,
  objective,
}: {
  creatives: CampaignCreativeView[]
  objective: CampaignObjective
}) {
  const conversionLabel = getResultLabel(objective).toLowerCase()
  const costLabel = getCostLabel(objective)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-white">Top criativos</h4>
          <p className="text-xs text-white/45">Criativos puxados da base viva do Supabase.</p>
        </div>
        <BarChart3 className="h-4 w-4 text-yellow-300" />
      </div>

      <div className="space-y-3">
        {creatives.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/45">
            Sem criativos com dados no período selecionado.
          </div>
        )}

        {creatives.map((creative, index) => (
          <div
            key={`${creative.segment || 'geral'}-${creative.name}-${index}`}
            className="rounded-xl border border-white/8 bg-black/20 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-yellow-300">#{index + 1}</span>
                  {creative.segment && (
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-cyan-200">
                      {creative.segment}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm font-medium text-white">{creative.name}</div>
              </div>

              <div className="text-right text-sm">
                <div className="tabular-nums text-white/80">
                  {creative.conversions} {conversionLabel}
                </div>
                <div className="tabular-nums text-white/45">
                  {creative.costPerConversion !== null
                    ? `${costLabel} ${formatCurrency(creative.costPerConversion)}`
                    : 'Sem resultado'}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              {creative.note ? <p className="text-xs text-white/45">{creative.note}</p> : <span />}

              {creative.linkUrl ? (
                <a
                  href={creative.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20"
                >
                  Abrir criativo
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span className="text-xs text-white/30">Link indisponivel</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VideoRetentionPanel({
  campaign,
}: {
  campaign: AgencyCampaignView
}) {
  const stages = [
    { label: 'ThruPlay', value: campaign.thruplays, rate: campaign.thruplayRate, color: 'from-amber-400 to-orange-500' },
    { label: '25% do video', value: campaign.video25Pct, rate: campaign.video25Rate, color: 'from-cyan-400 to-blue-500' },
    { label: '50% do video', value: campaign.video50Pct, rate: campaign.video50Rate, color: 'from-sky-400 to-indigo-500' },
    { label: '75% do video', value: campaign.video75Pct, rate: campaign.video75Rate, color: 'from-violet-400 to-fuchsia-500' },
    { label: '95% do video', value: campaign.video95Pct, rate: campaign.video95Rate, color: 'from-pink-400 to-rose-500' },
  ]
  const maxValue = Math.max(...stages.map((stage) => stage.value), 1)

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-white">Retencao do video</h4>
          <p className="text-xs text-white/45">Marcos de consumo sobre as impressoes do periodo.</p>
        </div>
        <Play className="h-4 w-4 text-amber-300" />
      </div>

      <div className="space-y-3">
        {stages.map((stage) => {
          const width = Math.max((stage.value / maxValue) * 100, stage.value > 0 ? 14 : 8)

          return (
            <div key={stage.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-white/85">{stage.label}</span>
                <span className="tabular-nums text-white/50">
                  {formatNumber(stage.value)} • {formatPercent(stage.rate)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${stage.color}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CampaignCard({
  campaign,
  startDate,
  endDate,
}: {
  campaign: AgencyCampaignView
  startDate: string
  endDate: string
}) {
  const objectiveLabel = getObjectiveLabel(campaign.objective)
  const resultLabel = getResultLabel(campaign.objective)
  const costLabel = getCostLabel(campaign.objective)
  const isVideo = campaign.objective === 'video'

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="border-b border-white/8 bg-gradient-to-r from-white/8 to-white/0 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  campaign.objective === 'sales'
                    ? 'border border-green-400/30 bg-green-400/10 text-green-300'
                    : campaign.objective === 'video'
                      ? 'border border-amber-400/30 bg-amber-400/10 text-amber-200'
                      : 'border border-blue-400/30 bg-blue-400/10 text-blue-200'
                }`}
              >
                {objectiveLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/45">
                {formatDateFull(startDate)} a {formatDateFull(endDate)}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white">{campaign.title}</h3>
            {campaign.sourceNote && <p className="mt-2 max-w-3xl text-sm text-white/55">{campaign.sourceNote}</p>}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">{costLabel}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {campaign.conversions > 0 ? formatCurrency(campaign.costPerConversion) : '—'}
            </div>
            <div className="text-sm text-white/45">
              {campaign.conversions} {resultLabel.toLowerCase()}
            </div>
          </div>
        </div>
      </div>

      {!campaign.hasData ? (
        <div className="px-6 py-10 text-center text-sm text-white/45">
          Sem dados vivos no Supabase para esta campanha no periodo selecionado.
        </div>
      ) : (
        <div className="grid gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="space-y-6">
            {isVideo ? (
              <VideoRetentionPanel campaign={campaign} />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Funil</h4>
                    <p className="text-xs text-white/45">Leitura direta da jornada do clique ate o resultado.</p>
                  </div>
                  <Target className="h-4 w-4 text-green-300" />
                </div>
                <Funnel
                  impressions={campaign.impressions}
                  clicks={campaign.clicks}
                  pageViews={campaign.pageViews}
                  conversions={campaign.conversions}
                  conversionLabel={resultLabel}
                />
              </div>
            )}

            {isVideo ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Investimento</div>
                  <div className="mt-2 text-xl font-semibold tabular-nums text-white">{formatCurrency(campaign.spend)}</div>
                  <div className="mt-1 text-xs tabular-nums text-white/40">CPM {formatCurrency(campaign.cpm)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Entrega</div>
                  <div className="mt-2 text-xl font-semibold tabular-nums text-white">
                    {formatNumber(campaign.impressions)} impressoes
                  </div>
                  <div className="mt-1 text-xs tabular-nums text-white/40">25% {formatPercent(campaign.video25Rate)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">ThruPlays</div>
                  <div className="mt-2 text-xl font-semibold tabular-nums text-white">
                    {formatNumber(campaign.thruplays)} plays
                  </div>
                  <div className="mt-1 text-xs tabular-nums text-white/40">
                    {costLabel} {campaign.thruplays > 0 ? formatCurrency(campaign.costPerConversion) : '—'}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Retencao final</div>
                  <div className="mt-2 text-xl font-semibold tabular-nums text-white">{formatPercent(campaign.video95Rate)}</div>
                  <div className="mt-1 text-xs tabular-nums text-white/40">
                    95% {formatNumber(campaign.video95Pct)} • 50% {formatPercent(campaign.video50Rate)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Investimento</div>
                  <div className="mt-2 text-xl font-semibold tabular-nums text-white">{formatCurrency(campaign.spend)}</div>
                  <div className="mt-1 text-xs tabular-nums text-white/40">CPM {formatCurrency(campaign.cpm)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Trafego</div>
                  <div className="mt-2 text-xl font-semibold tabular-nums text-white">{formatNumber(campaign.clicks)} cliques</div>
                  <div className="mt-1 text-xs tabular-nums text-white/40">
                    CTR {formatPercent(campaign.ctr)} • CPC {formatCurrency(campaign.cpc)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Carregamento</div>
                  <div className="mt-2 text-xl font-semibold tabular-nums text-white">{formatPercent(campaign.loadRate)}</div>
                  <div className="mt-1 text-xs tabular-nums text-white/40">{formatNumber(campaign.pageViews)} page views</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Conversao</div>
                  <div className="mt-2 text-xl font-semibold tabular-nums text-white">
                    {formatPercent(campaign.conversionRateClicks)}
                  </div>
                  <div className="mt-1 text-xs tabular-nums text-white/40">
                    PV {formatPercent(campaign.conversionRatePageViews)}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <h4 className="text-sm font-semibold text-white">Leituras rapidas</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {campaign.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {campaign.audiences && campaign.audiences.length > 0 && <AudienceBars data={campaign.audiences} />}
            <CreativeList creatives={campaign.topCreatives} objective={campaign.objective} />
          </div>
        </div>
      )}
    </section>
  )
}

function ClientCard({
  client,
  selected,
  onClick,
}: {
  client: AgencyClient
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-3xl border p-4 text-left transition-all ${
        selected
          ? 'border-cyan-400/40 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">{client.name}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{client.brand}</div>
        </div>
        <Building2 className={`h-4 w-4 ${selected ? 'text-cyan-300' : 'text-white/35'}`} />
      </div>

      <p className="mt-4 text-sm leading-6 text-white/55">{client.summary}</p>
    </button>
  )
}

export function AgencyDashboard() {
  const [selectedClientId, setSelectedClientId] = useState(agencyClients[0]?.id ?? '')
  const [objectiveFilter, setObjectiveFilter] = useState<ObjectiveFilter>('all')
  const [dateRange, setDateRange] = useState(() => getDateRange('last30days'))
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [rawCreatives, setRawCreatives] = useState<AdCreative[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedClient = agencyClients.find((client) => client.id === selectedClientId) ?? agencyClients[0]

  const allPatterns = useMemo(
    () =>
      Array.from(
        new Set(selectedClient.campaigns.flatMap((campaign) => campaign.matchers.map((matcher) => matcher.trim())))
      ),
    [selectedClient]
  )

  async function loadData() {
    setLoading(true)
    setErrorMessage(null)

    try {
      const data = await getAdCreativesByCampaignPatterns(dateRange.start, dateRange.end, allPatterns)
      setRawCreatives(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error(error)
      setErrorMessage('Nao foi possivel carregar os dados vivos do Supabase.')
      setRawCreatives([])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [selectedClientId, dateRange.start, dateRange.end])

  useEffect(() => {
    const interval = setInterval(() => {
      loadData()
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [selectedClientId, dateRange.start, dateRange.end])

  const campaignViews = useMemo(() => {
    return selectedClient.campaigns.map((campaign) => {
      const matchedRows = rawCreatives.filter((row) => matchesPatterns(row.campaign_name || '', campaign.matchers))
      return buildCampaignView(campaign, matchedRows)
    })
  }, [rawCreatives, selectedClient])

  const visibleCampaigns = useMemo(() => {
    if (objectiveFilter === 'all') return campaignViews
    return campaignViews.filter((campaign) => campaign.objective === objectiveFilter)
  }, [campaignViews, objectiveFilter])

  const summary = useMemo(() => {
    const spend = visibleCampaigns.reduce((sum, campaign) => sum + campaign.spend, 0)
    const totalLeads = visibleCampaigns
      .filter((campaign) => campaign.objective === 'leads')
      .reduce((sum, campaign) => sum + campaign.conversions, 0)
    const totalSales = visibleCampaigns
      .filter((campaign) => campaign.objective === 'sales')
      .reduce((sum, campaign) => sum + campaign.conversions, 0)
    const totalThruplays = visibleCampaigns
      .filter((campaign) => campaign.objective === 'video')
      .reduce((sum, campaign) => sum + campaign.conversions, 0)
    const siteCampaigns = visibleCampaigns.filter((campaign) => campaign.objective !== 'video')
    const averageLoadRate =
      siteCampaigns.length > 0 ? siteCampaigns.reduce((sum, campaign) => sum + campaign.loadRate, 0) / siteCampaigns.length : 0

    return { spend, totalLeads, totalSales, totalThruplays, averageLoadRate }
  }, [visibleCampaigns])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
          <div>
            <div className="text-lg font-semibold">Agency Dashboard</div>
            <div className="text-sm text-white/45">
              Fonte viva no Supabase com atualizacao automatica a cada 60 segundos.
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-xs text-white/40">
                Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={loadData}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              title="Atualizar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 space-y-4 xl:col-span-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/40">Clientes</div>
                <div className="mt-1 text-sm text-white/55">Selecione o cliente e ajuste o periodo.</div>
              </div>
              <div className="space-y-3">
                {agencyClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    selected={client.id === selectedClient.id}
                    onClick={() => setSelectedClientId(client.id)}
                  />
                ))}
              </div>
            </div>
          </aside>

          <section className="col-span-12 space-y-6 xl:col-span-9">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-white/5 to-white/0 p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">Cliente selecionado</div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{selectedClient.name}</h1>
                  <p className="mt-3 text-sm leading-6 text-white/60">{selectedClient.summary}</p>
                  <p className="mt-3 text-xs text-white/35">
                    Recorte ativo: {formatDateFull(dateRange.start)} a {formatDateFull(dateRange.end)}
                  </p>
                </div>

                <div className="flex flex-col items-stretch gap-3 lg:items-end">
                  <DatePicker startDate={dateRange.start} endDate={dateRange.end} onChange={setDateRange} />

                  <div className="flex flex-wrap items-center gap-2">
                    {(['all', 'sales', 'leads', 'video'] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => setObjectiveFilter(option)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          objectiveFilter === option
                            ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
                            : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {option === 'all' ? 'Tudo' : option === 'sales' ? 'Vendas' : option === 'leads' ? 'Leads' : 'Video'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Investimento no filtro"
                value={formatCurrency(summary.spend)}
                icon={<DollarSign className="h-5 w-5" />}
                color="blue"
              />
              <MetricCard
                label="Leads"
                value={formatNumber(summary.totalLeads)}
                icon={<Users className="h-5 w-5" />}
                color="green"
              />
              <MetricCard
                label="Vendas"
                value={formatNumber(summary.totalSales)}
                icon={<ShoppingCart className="h-5 w-5" />}
                color="yellow"
              />
              <MetricCard
                label="ThruPlays"
                value={formatNumber(summary.totalThruplays)}
                icon={<Play className="h-5 w-5" />}
                color="red"
              />
              <MetricCard
                label="Media de carreg."
                value={formatPercent(summary.averageLoadRate)}
                icon={<MousePointer className="h-5 w-5" />}
                color="purple"
              />
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Frentes ativas</h2>
                  <p className="text-sm text-white/45">
                    {visibleCampaigns.length} campanhas filtradas para a visualizacao atual.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/55">
                  Frequencia ao vivo:{' '}
                  <span className="font-medium text-white">
                    {loading ? 'atualizando' : `${formatDecimal(summary.averageLoadRate / 100 || 0)}x de carregamento`}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {visibleCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                  />
                ))}
              </div>

              {visibleCampaigns.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm text-white/45">
                  Nenhuma campanha encontrada para o filtro atual.
                </div>
              )}
            </div>

            {objectiveFilter === 'video' && (
              <div className="rounded-3xl border border-amber-400/15 bg-amber-400/5 p-5">
                <div className="flex items-start gap-3">
                  <Eye className="mt-0.5 h-5 w-5 text-amber-300" />
                  <div>
                    <h2 className="text-sm font-semibold text-white">Leitura recomendada para video</h2>
                    <p className="mt-1 text-sm leading-6 text-white/60">
                      Para campanha de visualizacao, o KPI principal do dashboard passa a ser ThruPlay. Os quartis
                      ajudam a separar distribuicao de entrega de retencao real do criativo.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
