import { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { formatCurrency, formatPercent } from '../lib/utils'
import type { AggregatedCampaign } from '../lib/supabase'

type SortKey = 'conversions' | 'spend' | 'clicks' | 'cpc' | 'load_rate' | 'cost_per' | 'ctr'

interface SortOption {
  key: SortKey
  label: string
}

interface CampaignsTableProps {
  data: AggregatedCampaign[]
  isSales: boolean
  isMqlPrimary?: boolean
  activeNames?: string[]
  activeDate?: string | null
  showActiveFilter?: boolean
}

export function CampaignsTable({
  data,
  isSales,
  isMqlPrimary = false,
  activeNames,
  activeDate = null,
  showActiveFilter = false,
}: CampaignsTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>('spend')
  const [onlyActive, setOnlyActive] = useState<boolean>(showActiveFilter)
  const activeSet = useMemo(() => new Set((activeNames || []).map((n) => (n || '').trim())), [activeNames])

  useEffect(() => {
    if (showActiveFilter) {
      setOnlyActive(true)
    } else {
      setOnlyActive(false)
    }
  }, [showActiveFilter, activeNames?.length])

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-white/40">Sem dados de campanhas para o período</div>
  }

  const conversionLabel = isSales ? 'Vendas' : isMqlPrimary ? 'MQLs' : 'Leads'
  const costLabel = isSales ? 'CPA' : isMqlPrimary ? 'Custo/MQL' : 'CPL'

  const sortOptions: SortOption[] = [
    { key: 'spend', label: 'Gasto' },
    { key: 'conversions', label: conversionLabel },
    { key: 'clicks', label: 'Cliques' },
    { key: 'load_rate', label: 'Taxa Carreg.' },
    { key: 'cpc', label: 'CPC' },
    { key: 'cost_per', label: costLabel },
    { key: 'ctr', label: 'CTR' },
  ]

  const getConversions = (campaign: AggregatedCampaign) => {
    if (isSales) return campaign.sheetPurchases > 0 ? campaign.sheetPurchases : campaign.purchases
    if (isMqlPrimary) return campaign.sheetMqls || 0
    return campaign.sheetLeadsUtm > 0 ? campaign.sheetLeadsUtm : campaign.leads
  }

  const getCostPer = (campaign: AggregatedCampaign) => {
    const conversions = getConversions(campaign)
    return conversions > 0 ? campaign.spend / conversions : 0
  }

  const getSortValue = (campaign: AggregatedCampaign, key: SortKey) => {
    switch (key) {
      case 'conversions':
        return getConversions(campaign)
      case 'spend':
        return campaign.spend || 0
      case 'clicks':
        return campaign.link_clicks || 0
      case 'load_rate':
        return campaign.load_rate || 0
      case 'cpc':
        return campaign.cpc || 0
      case 'cost_per':
        return getCostPer(campaign)
      case 'ctr':
        return campaign.ctr || 0
      default:
        return 0
    }
  }

  const rows = onlyActive && activeSet.size > 0
    ? data.filter((campaign) => activeSet.has((campaign.campaign_name || '').trim()))
    : data

  const sorted = [...rows].sort((a, b) => {
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

  const topRows = sorted.slice(0, 10)

  return (
    <div>
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
        {showActiveFilter && (
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setOnlyActive(true)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                onlyActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              Somente ativas
            </button>
            <button
              onClick={() => setOnlyActive(false)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                !onlyActive
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              Todas
            </button>
            {onlyActive && activeDate && (
              <span className="text-[11px] text-white/40">
                Base: {activeDate.split('-').reverse().join('/')}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-white/50 uppercase border-b border-white/10">
              <th className="pb-3 pr-4">#</th>
              <th className="pb-3 pr-4">Campanha</th>
              <th className="pb-3 px-2 text-center">Gasto</th>
              <th className="pb-3 px-2 text-center">Cliques</th>
              <th className="pb-3 px-2 text-center">Taxa Carreg.</th>
              <th className="pb-3 px-2 text-center">CPC</th>
              <th className="pb-3 px-2 text-center">{conversionLabel}</th>
              <th className="pb-3 px-2 text-center">{costLabel}</th>
              <th className="pb-3 px-2 text-center">CTR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {topRows.map((campaign, index) => {
              const conversions = getConversions(campaign)
              const costPer = getCostPer(campaign)

              return (
                <tr key={`${campaign.campaign_name}-${index}`} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 pr-4 text-white/50">{index + 1}</td>
                  <td className="py-3 pr-4">
                    <div className="truncate max-w-[360px] font-medium" title={campaign.campaign_name}>
                      {campaign.campaign_name}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center text-white/80">{formatCurrency(campaign.spend)}</td>
                  <td className="py-3 px-2 text-center text-white/80">{campaign.link_clicks}</td>
                  <td className="py-3 px-2 text-center">
                    {campaign.load_rate !== null ? (
                      <span className="text-cyan-300">{formatPercent(campaign.load_rate)}</span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center text-white/80">{formatCurrency(campaign.cpc)}</td>
                  <td className="py-3 px-2 text-center">
                    <span className={conversions > 0 ? 'text-green-400 font-semibold' : 'text-white/40'}>{conversions}</span>
                    {isSales && (
                      <div className="text-[11px] text-white/35 mt-0.5 text-center">Meta: {campaign.purchases || 0}</div>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {costPer > 0 ? (
                      <span className="text-yellow-300">{formatCurrency(costPer)}</span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center text-blue-400">{formatPercent(campaign.ctr)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
