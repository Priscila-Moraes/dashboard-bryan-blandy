import { useEffect, useMemo, useState } from 'react'
import {
  calculateCompletionRate,
  calculateCostPer,
  calculateHoldRate,
  calculateHookRate,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../lib/utils'
import { ExternalLink, Trophy, ArrowUpDown } from 'lucide-react'
import type { AggregatedCreative } from '../lib/supabase'

type SortKey =
  | 'conversions'
  | 'spend'
  | 'impressions'
  | 'clicks'
  | 'load_rate'
  | 'cpc'
  | 'cost_per'
  | 'ctr'
  | 'video_25_pct'
  | 'video_50_pct'
  | 'video_75_pct'
  | 'video_95_pct'
  | 'hook_rate'
  | 'hold_rate'
  | 'completion_rate'
type LeadsView = 'leads' | 'mql'

interface SortOption {
  key: SortKey
  label: string
  title?: string
}



const CREATIVE_LINK_OVERRIDES: Record<string, string> = {
  '120240232224840245': 'https://www.instagram.com/p/DUB6KFLAInA/#advertiser',
}

const CREATIVE_NAME_LINK_OVERRIDES: Record<string, string> = {
  ADS005_VENDA_IMAGEM_FEEDeSTORIES: 'https://www.instagram.com/p/DUB6KFLAInA/#advertiser',
}

const CREATIVE_NAME_OVERRIDES: Record<string, string> = {
  '120240232224840245': 'ADS005_VENDA_IMAGEM_FEEDeSTORIES',
}

interface CreativesTableProps {
  data: AggregatedCreative[]
  isSales: boolean
  isVideoView?: boolean
  isMqlPrimary?: boolean
  showMqlInSales?: boolean
  showDeliveryMetrics?: boolean
  totalSheetSales?: number
  totalSheetLeads?: number
  totalSheetMqls?: number
}

export function CreativesTable({
  data,
  isSales,
  isVideoView = false,
  isMqlPrimary = false,
  showMqlInSales = false,
  showDeliveryMetrics = false,
  totalSheetSales,
  totalSheetLeads,
  totalSheetMqls,
}: CreativesTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>(isVideoView ? 'hold_rate' : 'conversions')
  const [leadsView, setLeadsView] = useState<LeadsView>(() => {
    if (isMqlPrimary) return 'mql'
    if (typeof totalSheetMqls === 'number' && totalSheetMqls > 0) return 'mql'
    return 'leads'
  })

  useEffect(() => {
    if (isSales || isVideoView) return
    if (isMqlPrimary) {
      setLeadsView('mql')
      return
    }
    if (typeof totalSheetMqls === 'number' && totalSheetMqls > 0) {
      setLeadsView('mql')
      return
    }
    setLeadsView('leads')
  }, [isSales, isMqlPrimary, totalSheetMqls])

  useEffect(() => {
    setSortBy(isVideoView ? 'hold_rate' : 'conversions')
  }, [isVideoView])

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-white/40">Sem dados de criativos para o período</div>
  }

  const viewLabel = isVideoView ? 'ThruPlays' : isSales ? 'Vendas' : leadsView === 'mql' ? 'MQLs' : 'Leads'

  // Calcular conversões sem atribuição (diferença entre total da planilha e soma atribuída por ad_id)
  const totals = useMemo(() => {
    if (isVideoView) {
      return {
        attributedSales: 0,
        attributedLeads: 0,
        attributedMqls: 0,
        unattributedSales: 0,
        unattributedLeads: 0,
        unattributedMqls: 0,
      }
    }

    const attributedSales = data.reduce((sum, c) => sum + (c.sheetPurchases || 0), 0)
    const attributedLeads = data.reduce((sum, c) => sum + (c.sheetLeadsUtm || 0), 0)
    const attributedMqls = data.reduce((sum, c) => sum + (c.sheetMqls || 0), 0)

    const unattributedSales =
      isSales && typeof totalSheetSales === 'number'
        ? Math.max(0, totalSheetSales - attributedSales)
        : 0
    const unattributedLeads =
      !isSales && typeof totalSheetLeads === 'number'
        ? Math.max(0, totalSheetLeads - attributedLeads)
        : 0
    const unattributedMqls =
      typeof totalSheetMqls === 'number' ? Math.max(0, totalSheetMqls - attributedMqls) : 0

    return {
      attributedSales,
      attributedLeads,
      attributedMqls,
      unattributedSales,
      unattributedLeads,
      unattributedMqls,
    }
  }, [data, isSales, isVideoView, totalSheetLeads, totalSheetMqls, totalSheetSales])

  const unattributedConversions = isSales
    ? totals.unattributedSales
    : leadsView === 'mql'
      ? totals.unattributedMqls
      : totals.unattributedLeads

  const unattributedMqlsInSales = isSales && showMqlInSales ? totals.unattributedMqls : 0

  const showUnattributedRow = isSales
    ? totals.unattributedSales > 0 || unattributedMqlsInSales > 0
    : unattributedConversions > 0

  const sortOptions: SortOption[] = isVideoView
    ? [
        { key: 'conversions', label: viewLabel },
        { key: 'spend', label: 'Gasto' },
        { key: 'impressions', label: 'Impressões' },
        { key: 'video_50_pct', label: '50%' },
        { key: 'video_75_pct', label: '75%' },
        { key: 'cost_per', label: 'Custo/TP' },
        { key: 'hook_rate', label: 'Hook Rate', title: '3s Views / Impressões' },
        { key: 'hold_rate', label: 'Hold Rate', title: 'ThruPlays / 3s Views' },
        { key: 'completion_rate', label: 'Completion Rate', title: '95% do vídeo / Impressões' },
      ]
    : [
        { key: 'conversions', label: viewLabel },
        { key: 'spend', label: 'Gasto' },
        ...(showDeliveryMetrics
          ? [
              { key: 'impressions' as const, label: 'Impressões' },
              { key: 'load_rate' as const, label: 'Taxa Carreg.' },
            ]
          : []),
        { key: 'clicks', label: 'Cliques' },
        { key: 'cpc', label: 'CPC' },
        { key: 'cost_per', label: isSales ? 'CPA' : leadsView === 'mql' ? 'Custo/MQL' : 'CPL' },
        { key: 'ctr', label: 'CTR' },
      ]

  const getSortValue = (c: AggregatedCreative, key: SortKey): number => {
    const cpc = c.link_clicks > 0 ? c.spend / c.link_clicks : 0
    const realPurchases = c.sheetPurchases > 0 ? c.sheetPurchases : c.purchases || 0
    const realLeads = c.sheetLeadsUtm > 0 ? c.sheetLeadsUtm : c.leads || 0
    const realMqls = c.sheetMqls || 0
    const hookRate = calculateHookRate(c.video_3s_views || 0, c.impressions || 0)
    const holdRate = calculateHoldRate(c.thruplays || 0, c.video_3s_views || 0)
    const completionRate = calculateCompletionRate(c.video_95_pct || 0, c.impressions || 0)

    const conversions = isVideoView ? c.thruplays || 0 : isSales ? realPurchases : leadsView === 'mql' ? realMqls : realLeads
    const costPer = isVideoView
      ? calculateCostPer(c.spend || 0, conversions)
      : isSales
      ? c.cpa || 0
      : leadsView === 'mql'
        ? conversions > 0
          ? c.spend / conversions
          : 0
        : c.cpl || 0

    switch (key) {
      case 'conversions':
        return conversions
      case 'spend':
        return c.spend || 0
      case 'impressions':
        return c.impressions || 0
      case 'clicks':
        return c.link_clicks || 0
      case 'load_rate':
        return c.load_rate || 0
      case 'cpc':
        return cpc
      case 'cost_per':
        return costPer
      case 'ctr':
        return c.ctr || 0
      case 'video_25_pct':
        return c.video_25_pct || 0
      case 'video_50_pct':
        return c.video_50_pct || 0
      case 'video_75_pct':
        return c.video_75_pct || 0
      case 'video_95_pct':
        return c.video_95_pct || 0
      case 'hook_rate':
        return hookRate
      case 'hold_rate':
        return holdRate
      case 'completion_rate':
        return completionRate
      default:
        return 0
    }
  }

  const sorted = [...data].sort((a, b) => {
    const va = getSortValue(a, sortBy)
    const vb = getSortValue(b, sortBy)
    if (sortBy === 'cpc' || sortBy === 'cost_per') {
      if (va === 0 && vb === 0) return 0
      if (va === 0) return 1
      if (vb === 0) return -1
      return va - vb
    }
    return vb - va
  })

  const winnerKey = useMemo(() => {
    if (!isVideoView || data.length === 0) return null

    const maxThruplays = Math.max(...data.map((creative) => creative.thruplays || 0), 0)
    const minimumThruplays = Math.max(30, Math.ceil(maxThruplays * 0.1))
    const candidates = data.filter((creative) => (creative.thruplays || 0) >= minimumThruplays)
    const pool = candidates.length > 0 ? candidates : data

    const winner = [...pool].sort((a, b) => {
      const holdDiff =
        calculateHoldRate(b.thruplays || 0, b.video_3s_views || 0) -
        calculateHoldRate(a.thruplays || 0, a.video_3s_views || 0)
      if (Math.abs(holdDiff) > 0.0001) return holdDiff

      const costDiff =
        calculateCostPer(a.spend || 0, a.thruplays || 0) -
        calculateCostPer(b.spend || 0, b.thruplays || 0)
      if (Math.abs(costDiff) > 0.0001) return costDiff

      return (b.thruplays || 0) - (a.thruplays || 0)
    })[0]

    if (!winner) return null

    return `${winner.ad_name}-${winner.ad_id || winner.grouped_ad_ids?.[0] || ''}`
  }, [data, isVideoView])

  const topRows = sorted.slice(0, 10)

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return 'text-yellow-400'
      case 1:
        return 'text-gray-300'
      case 2:
        return 'text-amber-600'
      default:
        return 'text-white/40'
    }
  }

  return (
    <div>
      {!isSales && !isVideoView && (
        <div className="flex items-center gap-2 mb-4">
          <div className="text-xs text-white/40">Visualização:</div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setLeadsView('leads')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                leadsView === 'leads'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              Leads
            </button>
            <button
              onClick={() => setLeadsView('mql')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                leadsView === 'mql'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                MQL
                {isMqlPrimary && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-green-500/40 bg-green-500/20 text-green-300 uppercase tracking-wide">
                    principal
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Ordenar por:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              title={opt.title}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                sortBy === opt.key
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-white/50 uppercase border-b border-white/10">
              <th className="pb-3 pr-4">#</th>
              <th className="pb-3 pr-4">Criativo</th>
              <th className="pb-3 pr-4 text-right">Gasto</th>
              {(showDeliveryMetrics || isVideoView) && <th className="pb-3 pr-4 text-right">Impressões</th>}
              {!isVideoView && <th className="pb-3 pr-4 text-right">Cliques</th>}
              {showDeliveryMetrics && !isVideoView && <th className="pb-3 pr-4 text-right">Taxa Carreg.</th>}
              {!isVideoView && <th className="pb-3 pr-4 text-right">CPC</th>}
              {isVideoView ? (
                <>
                  <th className="pb-3 pr-4 text-right">ThruPlays</th>
                  <th className="pb-3 pr-4 text-right">Custo/TP</th>
                  <th className="pb-3 pr-4 text-right">50%</th>
                  <th className="pb-3 pr-4 text-right">75%</th>
                  <th className="pb-3 pr-4 text-right" title="3s Views / Impressões">Hook Rate</th>
                  <th className="pb-3 pr-4 text-right" title="ThruPlays / 3s Views">Hold Rate</th>
                  <th className="pb-3 pr-4 text-right" title="95% do vídeo / Impressões">Completion Rate</th>
                </>
              ) : isSales ? (
                <>
                  <th className="pb-3 pr-4 text-right">Vendas</th>
                  {showMqlInSales && <th className="pb-3 pr-4 text-right">MQLs</th>}
                  <th className="pb-3 pr-4 text-right">CPA</th>
                  {showMqlInSales && <th className="pb-3 pr-4 text-right">Custo/MQL</th>}
                </>
              ) : (
                <>
                  <th className="pb-3 pr-4 text-right">{leadsView === 'mql' ? 'MQLs' : 'Leads'}</th>
                  <th className="pb-3 pr-4 text-right">{leadsView === 'mql' ? 'Custo/MQL' : 'CPL'}</th>
                </>
              )}
              {!isVideoView && <th className="pb-3 pr-4 text-right">CTR</th>}
              <th className="pb-3 text-center">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {topRows.map((creative, index) => {
              const cpc = creative.link_clicks > 0 ? creative.spend / creative.link_clicks : 0
              const realPurchases = creative.sheetPurchases > 0 ? creative.sheetPurchases : creative.purchases || 0
              const realLeads = creative.sheetLeadsUtm > 0 ? creative.sheetLeadsUtm : creative.leads || 0
              const realMqls = creative.sheetMqls || 0
              const hookRate = calculateHookRate(creative.video_3s_views || 0, creative.impressions || 0)
              const holdRate = calculateHoldRate(creative.thruplays || 0, creative.video_3s_views || 0)
              const completionRate = calculateCompletionRate(creative.video_95_pct || 0, creative.impressions || 0)
              const conversions = isVideoView ? creative.thruplays || 0 : isSales ? realPurchases : leadsView === 'mql' ? realMqls : realLeads
              const costPerConversion = isVideoView
                ? calculateCostPer(creative.spend || 0, conversions)
                : isSales
                ? creative.cpa
                : leadsView === 'mql'
                  ? conversions > 0
                    ? creative.spend / conversions
                    : 0
                  : creative.cpl
              const costPerMql = realMqls > 0 ? creative.spend / realMqls : 0
              const cplContext = realLeads > 0 ? creative.spend / realLeads : 0
              const groupedAdIds = (creative.grouped_ad_ids || [])
                .map((id) => String(id || '').trim())
                .filter(Boolean)
              if (groupedAdIds.length === 0 && creative.ad_id) {
                groupedAdIds.push(String(creative.ad_id).trim())
              }
              const groupedIdsCount = creative.grouped_ids_count || groupedAdIds.length || 1
              const hasMultipleIds = groupedIdsCount > 1
              const displayCreativeName =
                groupedAdIds
                  .map((id) => CREATIVE_NAME_OVERRIDES[id])
                  .find(Boolean) ||
                CREATIVE_NAME_OVERRIDES[String(creative.ad_id || '')] ||
                creative.ad_name
              const creativeLinkOverrideById = groupedAdIds
                .map((id) => CREATIVE_LINK_OVERRIDES[id])
                .find(Boolean)
              const creativeLink =
                creative.instagram_permalink ||
                creativeLinkOverrideById ||
                CREATIVE_LINK_OVERRIDES[String(creative.ad_id || '')] ||
                CREATIVE_NAME_LINK_OVERRIDES[String(displayCreativeName || '').trim()] ||
                null
              const groupedIdsTooltip = hasMultipleIds
                ? `Consolidado de ${groupedIdsCount} IDs: ${groupedAdIds.join(', ')}`
                : ''
              const groupedNames = (creative.grouped_names || [])
                .map((name) => String(name || '').trim())
                .filter(Boolean)
              const groupedNamesCount = creative.grouped_names_count || groupedNames.length || 1
              const hasMultipleNames = groupedNamesCount > 1
              const groupedNamesTooltip = hasMultipleNames
                ? `Mesmo criativo com ${groupedNamesCount} variações de nome: ${groupedNames.join(' | ')}`
                : ''
              const primaryAdId = groupedAdIds[0] || creative.ad_id || ''
              const shortPrimaryAdId =
                primaryAdId.length > 10
                  ? `${primaryAdId.slice(0, 6)}...${primaryAdId.slice(-4)}`
                  : primaryAdId
              const rowKey = `${displayCreativeName}-${groupedAdIds[0] || creative.ad_id || index}`
              const isWinner = isVideoView && winnerKey === `${creative.ad_name}-${creative.ad_id || creative.grouped_ad_ids?.[0] || ''}`

              return (
                <tr
                  key={rowKey}
                  className={isWinner ? 'bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors' : 'hover:bg-white/5 transition-colors'}
                >
                  <td className="py-3 pr-4">
                    {isWinner ? (
                      <Trophy className="w-4 h-4 text-emerald-300" />
                    ) : index < 3 ? (
                      <Trophy className={`w-4 h-4 ${getMedalColor(index)}`} />
                    ) : (
                      <span className="text-white/40">{index + 1}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-start gap-2 max-w-[250px]">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium leading-snug break-words" title={displayCreativeName}>
                          {displayCreativeName}
                        </div>
                        {isWinner && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                              Vencedor
                            </span>
                          </div>
                        )}
                        {shortPrimaryAdId && (
                          <div className="text-[11px] text-white/35 mt-1" title={primaryAdId}>
                            ID {shortPrimaryAdId}
                          </div>
                        )}
                      </div>
                      {hasMultipleIds && (
                        <span
                          className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-300 uppercase tracking-wide"
                          title={groupedIdsTooltip}
                        >
                          {groupedIdsCount} IDs
                        </span>
                      )}
                      {hasMultipleNames && (
                        <span
                          className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border border-sky-500/40 bg-sky-500/15 text-sky-300 uppercase tracking-wide"
                          title={groupedNamesTooltip}
                        >
                          {groupedNamesCount} nomes
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/30 truncate max-w-[200px]" title={creative.campaign_name}>
                      {creative.campaign_name}
                    </div>
                    {isVideoView && creative.adset_name && (
                      <div className="text-xs text-white/25 truncate max-w-[200px]" title={creative.adset_name}>
                        {creative.adset_name}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right text-white/80">{formatCurrency(creative.spend)}</td>
                  {(showDeliveryMetrics || isVideoView) && (
                    <td className="py-3 pr-4 text-right text-white/80">{formatNumber(creative.impressions || 0)}</td>
                  )}
                  {!isVideoView && <td className="py-3 pr-4 text-right text-white/80">{creative.link_clicks}</td>}
                  {showDeliveryMetrics && !isVideoView && (
                    <td className="py-3 pr-4 text-right">
                      {creative.load_rate !== null ? (
                        <span className="text-cyan-300">{formatPercent(creative.load_rate)}</span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                  )}
                  {!isVideoView && <td className="py-3 pr-4 text-right text-white/80">{formatCurrency(cpc)}</td>}
                  {isVideoView ? (
                    <>
                      <td className="py-3 pr-4 text-right">
                        <span className={conversions > 0 ? 'text-green-400 font-semibold' : 'text-white/40'}>
                          {formatNumber(conversions)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {costPerConversion > 0 ? (
                          <span className="text-yellow-400">{formatCurrency(costPerConversion)}</span>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right text-white/80">{formatNumber(creative.video_50_pct || 0)}</td>
                      <td className="py-3 pr-4 text-right text-white/80">{formatNumber(creative.video_75_pct || 0)}</td>
                      <td className="py-3 pr-4 text-right text-cyan-300">{formatPercent(hookRate)}</td>
                      <td className="py-3 pr-4 text-right text-green-300">{formatPercent(holdRate)}</td>
                      <td className="py-3 pr-4 text-right text-purple-300">{formatPercent(completionRate)}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 pr-4 text-right">
                        <span className={conversions > 0 ? 'text-green-400 font-semibold' : 'text-white/40'}>{conversions}</span>
                        {!isSales && leadsView === 'mql' && (
                          <div className="text-[11px] text-white/35 mt-0.5">{realLeads} leads</div>
                        )}
                      </td>
                      {isSales && showMqlInSales && (
                        <td className="py-3 pr-4 text-right">
                          <span className={realMqls > 0 ? 'text-green-400 font-semibold' : 'text-white/40'}>{realMqls}</span>
                        </td>
                      )}
                      <td className="py-3 pr-4 text-right">
                        {costPerConversion > 0 ? (
                          <>
                            <span
                              className={
                                costPerConversion < 500
                                  ? 'text-green-400'
                                  : costPerConversion > 1000
                                    ? 'text-red-400'
                                    : 'text-yellow-400'
                              }
                            >
                              {formatCurrency(costPerConversion)}
                            </span>
                            {!isSales && leadsView === 'mql' && cplContext > 0 && (
                              <div className="text-[11px] text-white/35 mt-0.5">CPL {formatCurrency(cplContext)}</div>
                            )}
                          </>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      {isSales && showMqlInSales && (
                        <td className="py-3 pr-4 text-right">
                          {costPerMql > 0 ? (
                            <span
                              className={
                                costPerMql < 500
                                  ? 'text-green-400'
                                  : costPerMql > 1000
                                    ? 'text-red-400'
                                    : 'text-yellow-400'
                              }
                            >
                              {formatCurrency(costPerMql)}
                            </span>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 pr-4 text-right text-blue-400">{formatPercent(creative.ctr)}</td>
                    </>
                  )}
                  <td className="py-3 text-center">
                    {creativeLink ? (
                      <a
                        href={creativeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-400" />
                      </a>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                </tr>
              )
            })}


            {!isVideoView && showUnattributedRow && (
              <tr className="bg-yellow-500/5">
                <td className="py-3 pr-4">
                  <span className="text-yellow-400 font-semibold">!</span>
                </td>
                <td className="py-3 pr-4">
                  <div className="font-semibold text-yellow-400">
                    {isSales
                      ? 'Sem atribuição (UTM ausente)'
                      : leadsView === 'mql'
                        ? 'Sem atribuição (MQL sem match)'
                        : 'Sem atribuição (Lead sem match)'}
                  </div>
                  <div className="text-xs text-white/40">Incluído no total, mas sem ad_id para vincular ao criativo.</div>
                </td>
                <td className="py-3 pr-4 text-right text-white/30">—</td>
                <td className="py-3 pr-4 text-right text-white/30">—</td>
                {showDeliveryMetrics && <td className="py-3 pr-4 text-right text-white/30">—</td>}
                {showDeliveryMetrics && <td className="py-3 pr-4 text-right text-white/30">—</td>}
                <td className="py-3 pr-4 text-right text-white/30">—</td>
                <td className="py-3 pr-4 text-right">
                  <span className="text-yellow-400 font-bold">{isSales ? totals.unattributedSales : unattributedConversions}</span>
                </td>
                {isSales && showMqlInSales && (
                  <td className="py-3 pr-4 text-right">
                    {unattributedMqlsInSales > 0 ? (
                      <span className="text-yellow-400 font-bold">{unattributedMqlsInSales}</span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                )}
                <td className="py-3 pr-4 text-right text-white/30">—</td>
                {isSales && showMqlInSales && <td className="py-3 pr-4 text-right text-white/30">—</td>}
                <td className="py-3 pr-4 text-right text-white/30">—</td>
                <td className="py-3 text-center text-white/30">—</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
