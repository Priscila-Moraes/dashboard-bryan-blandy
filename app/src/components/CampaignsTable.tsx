import { useState } from 'react'
import { ArrowUpDown, Trophy } from 'lucide-react'
import { formatCurrency, formatPercent } from '../lib/utils'
import type { AggregatedCampaign } from '../lib/supabase'

type SortKey = 'conversions' | 'spend' | 'clicks' | 'cpc' | 'cost_per' | 'ctr'

interface SortOption {
  key: SortKey
  label: string
}

interface CampaignsTableProps {
  data: AggregatedCampaign[]
  isSales: boolean
  isMqlPrimary?: boolean
}

export function CampaignsTable({ data, isSales, isMqlPrimary = false }: CampaignsTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>('spend')

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-white/40">Sem dados de campanhas para o período</div>
  }

  const conversionLabel = isSales ? 'Vendas' : isMqlPrimary ? 'MQLs' : 'Leads'
  const costLabel = isSales ? 'CPA' : isMqlPrimary ? 'Custo/MQL' : 'CPL'

  const sortOptions: SortOption[] = [
    { key: 'spend', label: 'Gasto' },
    { key: 'conversions', label: conversionLabel },
    { key: 'clicks', label: 'Cliques' },
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
              <th className="pb-3 pr-4">Campanha</th>
              <th className="pb-3 pr-4 text-right">Gasto</th>
              <th className="pb-3 pr-4 text-right">Cliques</th>
              <th className="pb-3 pr-4 text-right">CPC</th>
              <th className="pb-3 pr-4 text-right">{conversionLabel}</th>
              <th className="pb-3 pr-4 text-right">{costLabel}</th>
              <th className="pb-3 pr-4 text-right">CTR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {topRows.map((campaign, index) => {
              const conversions = getConversions(campaign)
              const costPer = getCostPer(campaign)

              return (
                <tr key={`${campaign.campaign_name}-${index}`} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 pr-4">
                    {index < 3 ? (
                      <Trophy className={`w-4 h-4 ${getMedalColor(index)}`} />
                    ) : (
                      <span className="text-white/40">{index + 1}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="truncate max-w-[360px] font-medium" title={campaign.campaign_name}>
                      {campaign.campaign_name}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right text-white/80">{formatCurrency(campaign.spend)}</td>
                  <td className="py-3 pr-4 text-right text-white/80">{campaign.link_clicks}</td>
                  <td className="py-3 pr-4 text-right text-white/80">{formatCurrency(campaign.cpc)}</td>
                  <td className="py-3 pr-4 text-right">
                    <span className={conversions > 0 ? 'text-green-400 font-semibold' : 'text-white/40'}>{conversions}</span>
                    {isSales && (
                      <div className="text-[11px] text-white/35 mt-0.5">Meta: {campaign.purchases || 0}</div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    {costPer > 0 ? (
                      <span className="text-yellow-300">{formatCurrency(costPer)}</span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right text-blue-400">{formatPercent(campaign.ctr)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
