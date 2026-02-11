import { useEffect, useMemo, useState } from 'react'
import { formatCurrency, formatPercent } from '../lib/utils'
import { ExternalLink, Trophy, ArrowUpDown } from 'lucide-react'
import type { AggregatedCreative } from '../lib/supabase'

type SortKey = 'conversions' | 'spend' | 'clicks' | 'cpc' | 'cost_per' | 'ctr'
type LeadsView = 'leads' | 'mql'

interface SortOption {
  key: SortKey
  label: string
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
  isMqlPrimary?: boolean
  showMqlInSales?: boolean
  totalSheetSales?: number
  totalSheetLeads?: number
  totalSheetMqls?: number
}

export function CreativesTable({
  data,
  isSales,
  isMqlPrimary = false,
  showMqlInSales = false,
  totalSheetSales,
  totalSheetLeads,
  totalSheetMqls,
}: CreativesTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>('conversions')
  const [leadsView, setLeadsView] = useState<LeadsView>(() => {
    if (isMqlPrimary) return 'mql'
    if (typeof totalSheetMqls === 'number' && totalSheetMqls > 0) return 'mql'
    return 'leads'
  })

  useEffect(() => {
    if (isSales) return
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

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-white/40">Sem dados de criativos para o período</div>
  }

  const viewLabel = isSales ? 'Vendas' : leadsView === 'mql' ? 'MQLs' : 'Leads'

  // Calcular conversões sem atribuição (diferença entre total da planilha e soma atribuída por ad_id)
  const totals = useMemo(() => {
    const attributedSales = data.reduce((sum, c) => sum + (c.sheetPurchases || 0), 0)
    const attributedLeads = data.reduce((sum, c) => sum + (c.sheetLeadsUtm || 0), 0)
    const attributedMqls = data.reduce((sum, c) => sum + (c.sheetMqls || 0), 0)

    const unattributedSales =
      isSales && typeof totalSheetSales === 'number' ? totalSheetSales - attributedSales : 0
    const unattributedLeads =
      !isSales && typeof totalSheetLeads === 'number' ? totalSheetLeads - attributedLeads : 0
    const unattributedMqls =
      !isSales && typeof totalSheetMqls === 'number' ? totalSheetMqls - attributedMqls : 0

    return {
      attributedSales,
      attributedLeads,
      attributedMqls,
      unattributedSales,
      unattributedLeads,
      unattributedMqls,
    }
  }, [data, isSales, totalSheetLeads, totalSheetMqls, totalSheetSales])

  const unattributedConversions = isSales
    ? totals.unattributedSales
    : leadsView === 'mql'
      ? totals.unattributedMqls
      : totals.unattributedLeads

  const sortOptions: SortOption[] = [
    { key: 'conversions', label: viewLabel },
    { key: 'spend', label: 'Gasto' },
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

    const conversions = isSales ? realPurchases : leadsView === 'mql' ? realMqls : realLeads
    const costPer = isSales
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
      case 'clicks':
        return c.link_clicks || 0
      case 'cpc':
        return cpc
      case 'cost_per':
        return costPer
      case 'ctr':
        return c.ctr || 0
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
      {!isSales && (
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
              <th className="pb-3 pr-4 text-right">Cliques</th>
              <th className="pb-3 pr-4 text-right">CPC</th>
              {isSales ? (
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
              <th className="pb-3 pr-4 text-right">CTR</th>
              <th className="pb-3 text-center">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sorted.slice(0, 10).map((creative, index) => {
              const cpc = creative.link_clicks > 0 ? creative.spend / creative.link_clicks : 0
              const realPurchases = creative.sheetPurchases > 0 ? creative.sheetPurchases : creative.purchases || 0
              const realLeads = creative.sheetLeadsUtm > 0 ? creative.sheetLeadsUtm : creative.leads || 0
              const realMqls = creative.sheetMqls || 0
              const conversions = isSales ? realPurchases : leadsView === 'mql' ? realMqls : realLeads
              const costPerConversion = isSales
                ? creative.cpa
                : leadsView === 'mql'
                  ? conversions > 0
                    ? creative.spend / conversions
                    : 0
                  : creative.cpl
              const costPerMql = realMqls > 0 ? creative.spend / realMqls : 0
              const cplContext = realLeads > 0 ? creative.spend / realLeads : 0
              const displayCreativeName =
                CREATIVE_NAME_OVERRIDES[String(creative.ad_id || '')] || creative.ad_name
              const creativeLink =
                creative.instagram_permalink ||
                CREATIVE_LINK_OVERRIDES[String(creative.ad_id || '')] ||
                CREATIVE_NAME_LINK_OVERRIDES[String(displayCreativeName || '').trim()] ||
                null

              return (
                <tr key={creative.ad_id + index} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 pr-4">
                    {index < 3 ? (
                      <Trophy className={`w-4 h-4 ${getMedalColor(index)}`} />
                    ) : (
                      <span className="text-white/40">{index + 1}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="max-w-[200px] truncate font-medium" title={displayCreativeName}>
                      {displayCreativeName}
                    </div>
                    <div className="text-xs text-white/30 truncate max-w-[200px]" title={creative.campaign_name}>
                      {creative.campaign_name}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right text-white/80">{formatCurrency(creative.spend)}</td>
                  <td className="py-3 pr-4 text-right text-white/80">{creative.link_clicks}</td>
                  <td className="py-3 pr-4 text-right text-white/80">{formatCurrency(cpc)}</td>
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

            {unattributedConversions > 0 && (
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
                <td className="py-3 pr-4 text-right text-white/30">—</td>
                <td className="py-3 pr-4 text-right">
                  <span className="text-yellow-400 font-bold">{unattributedConversions}</span>
                </td>
                {isSales && showMqlInSales && <td className="py-3 pr-4 text-right text-white/30">—</td>}
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
