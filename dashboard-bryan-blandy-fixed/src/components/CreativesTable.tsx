import { formatCurrency, formatPercent } from '../lib/utils'
import { ExternalLink, Trophy } from 'lucide-react'
import type { AggregatedCreative } from '../lib/supabase'

interface CreativesTableProps {
  data: AggregatedCreative[]
  isSales: boolean
}

export function CreativesTable({ data, isSales }: CreativesTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        Sem dados de criativos para o período
      </div>
    )
  }

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-400'
      case 1: return 'text-gray-300'
      case 2: return 'text-amber-600'
      default: return 'text-white/40'
    }
  }

  return (
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
                <th className="pb-3 pr-4 text-right">CPA</th>
              </>
            ) : (
              <>
                <th className="pb-3 pr-4 text-right">Leads</th>
                <th className="pb-3 pr-4 text-right">CPL</th>
              </>
            )}
            <th className="pb-3 pr-4 text-right">CTR</th>
            <th className="pb-3 text-center">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.slice(0, 10).map((creative, index) => {
            const cpc = creative.link_clicks > 0 ? creative.spend / creative.link_clicks : 0
            const conversions = isSales ? creative.purchases : creative.leads
            const costPerConversion = isSales ? creative.cpa : creative.cpl

            return (
              <tr 
                key={creative.ad_id + index} 
                className="hover:bg-white/5 transition-colors"
              >
                <td className="py-3 pr-4">
                  {index < 3 ? (
                    <Trophy className={`w-4 h-4 ${getMedalColor(index)}`} />
                  ) : (
                    <span className="text-white/40">{index + 1}</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <div className="max-w-[200px] truncate font-medium" title={creative.ad_name}>
                    {creative.ad_name}
                  </div>
                  <div className="text-xs text-white/30 truncate max-w-[200px]" title={creative.campaign_name}>
                    {creative.campaign_name}
                  </div>
                </td>
                <td className="py-3 pr-4 text-right text-white/80">
                  {formatCurrency(creative.spend)}
                </td>
                <td className="py-3 pr-4 text-right text-white/80">
                  {creative.link_clicks}
                </td>
                <td className="py-3 pr-4 text-right text-white/80">
                  {formatCurrency(cpc)}
                </td>
                <td className="py-3 pr-4 text-right">
                  <span className={conversions > 0 ? 'text-green-400 font-semibold' : 'text-white/40'}>
                    {conversions}
                  </span>
                </td>
                <td className="py-3 pr-4 text-right">
                  {costPerConversion > 0 ? (
                    <span className={
                      costPerConversion < 500 
                        ? 'text-green-400' 
                        : costPerConversion > 1000 
                          ? 'text-red-400' 
                          : 'text-yellow-400'
                    }>
                      {formatCurrency(costPerConversion)}
                    </span>
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-right text-blue-400">
                  {formatPercent(creative.ctr)}
                </td>
                <td className="py-3 text-center">
                  {creative.instagram_permalink ? (
                    <a
                      href={creative.instagram_permalink}
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
        </tbody>
      </table>
    </div>
  )
}
