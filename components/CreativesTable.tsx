import { useState } from 'react'
import { formatCurrency, formatPercent } from '../lib/utils'
import { ExternalLink, Trophy, ArrowUpDown } from 'lucide-react'
import type { AggregatedCreative } from '../lib/supabase'

type SortKey = 'conversions' | 'spend' | 'clicks' | 'cpc' | 'cost_per' | 'ctr'

interface SortOption {
  key: SortKey
  label: string
}

interface CreativesTableProps {
  data: AggregatedCreative[]
  isSales: boolean
  totalSheetSales?: number
}

export function CreativesTable({ data, isSales, totalSheetSales }: CreativesTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>('conversions')

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        Sem dados de criativos para o período
      </div>
    )
  }

  const sortOptions: SortOption[] = [
    { key: 'conversions', label: isSales ? 'Vendas' : 'Leads' },
    { key: 'spend', label: 'Gasto' },
    { key: 'clicks', label: 'Cliques' },
    { key: 'cpc', label: 'CPC' },
    { key: 'cost_per', label: isSales ? 'CPA' : 'CPL' },
    { key: 'ctr', label: 'CTR' },
  ]

  const getSortValue = (c: AggregatedCreative, key: SortKey): number => {
    const cpc = c.link_clicks > 0 ? c.spend / c.link_clicks : 0
    const realPurchases = c.sheetPurchases > 0 ? c.sheetPurchases : (c.purchases || 0)
    switch (key) {
      case 'conversions': return isSales ? realPurchases : (c.leads || 0)
      case 'spend': return c.spend || 0
      case 'clicks': return c.link_clicks || 0
      case 'cpc': return cpc
      case 'cost_per': return isSales ? (c.cpa || 0) : (c.cpl || 0)
      case 'ctr': return c.ctr || 0
      default: return 0
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
      case 0: return 'text-yellow-400'
      case 1: return 'text-gray-300'
      case 2: return 'text-amber-600'
      default: return 'text-white/40'
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
            {sorted.slice(0, 10).map((creative, index) => {
              const cpc = creative.link_clicks > 0 ? creative.spend / creative.link_clicks : 0
              const realPurchases = creative.sheetPurchases > 0 ? creative.sheetPurchases : creative.purchases
              const conversions = isSales ? realPurchases : creative.leads
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

      {(() => {
        if (!isSales || !totalSheetSales || totalSheetSales <= 0) return null
        const attributedSales = sorted.reduce((sum, c) => sum + (c.sheetPurchases || 0), 0)
        const unattributed = totalSheetSales - attributedSales
        if (unattributed <= 0) return null
        return (
          <div className="mt-4 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-between text-sm">
            <span className="text-yellow-400/80">⚠️ Vendas sem atribuição de criativo (UTM ausente)</span>
            <span className="text-yellow-400 font-bold text-base">{unattributed}</span>
          </div>
        )
      })()}
    </div>
  )
}
