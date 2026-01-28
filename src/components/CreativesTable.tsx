import { formatCurrency, formatPercent } from '../lib/utils'
import { ExternalLink, Trophy } from 'lucide-react'

interface CreativesTableProps {
  data: any[]
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
            <th className="pb-3 pr-4 text-right">{isSales ? 'Vendas' : 'Leads'}</th>
            <th className="pb-3 pr-4 text-right">{isSales ? 'CPA' : 'CPL'}</th>
            <th className="pb-3 pr-4 text-right">CTR</th>
            <th className="pb-3 text-center">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.slice(0, 10).map((creative, index) => (
            <tr 
              key={creative.ad_name + index} 
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
              </td>
              <td className="py-3 pr-4 text-right text-white/80">
                {formatCurrency(creative.spend)}
              </td>
              <td className="py-3 pr-4 text-right">
                <span className={index < 3 ? 'text-green-400 font-semibold' : 'text-white/80'}>
                  {isSales ? creative.purchases : creative.leads}
                </span>
              </td>
              <td className="py-3 pr-4 text-right">
                <span className={
                  (isSales ? creative.cpa : creative.cpl) < 50 
                    ? 'text-green-400' 
                    : (isSales ? creative.cpa : creative.cpl) > 100 
                      ? 'text-red-400' 
                      : 'text-yellow-400'
                }>
                  {formatCurrency(isSales ? creative.cpa : creative.cpl)}
                </span>
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
          ))}
        </tbody>
      </table>
    </div>
  )
}
