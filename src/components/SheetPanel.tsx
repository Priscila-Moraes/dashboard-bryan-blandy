import { formatCurrency, formatPercent } from '../lib/utils'
import { ShoppingCart, Users, TrendingUp, Target, Percent, DollarSign } from 'lucide-react'

interface SheetPanelProps {
  isSales: boolean
  sales: number
  revenue: number
  leads: number
  mqls: number
  mqlRate: number
  cpa: number
  roas: number
}

export function SheetPanel({ isSales, sales, revenue, leads, mqls, mqlRate, cpa, roas }: SheetPanelProps) {
  if (isSales) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 sticky top-24 space-y-6">
        <div className="flex items-center gap-2 text-sm font-medium text-white/60">
          <ShoppingCart className="w-4 h-4" />
          <span>Dados da Planilha</span>
        </div>

        {/* Big Numbers */}
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="text-xs text-green-400/80 uppercase tracking-wide mb-1">Vendas</div>
            <div className="text-3xl font-bold text-green-400">{sales}</div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="text-xs text-blue-400/80 uppercase tracking-wide mb-1">Receita</div>
            <div className="text-2xl font-bold text-blue-400">{formatCurrency(revenue)}</div>
          </div>
        </div>

        {/* Calculated Metrics */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <DollarSign className="w-4 h-4" />
              <span>CPA</span>
            </div>
            <span className="font-semibold text-white">{formatCurrency(cpa)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <TrendingUp className="w-4 h-4" />
              <span>ROAS</span>
            </div>
            <span className="font-semibold text-purple-400">{roas.toFixed(2)}x</span>
          </div>
        </div>

        {/* Visual ROAS Indicator */}
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-purple-500/20">
          <div className="text-xs text-white/60 mb-2">Retorno sobre Investimento</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                style={{ width: `${Math.min(roas * 25, 100)}%` }}
              />
            </div>
            <span className="text-sm font-bold text-purple-400">{roas.toFixed(2)}x</span>
          </div>
        </div>
      </div>
    )
  }

  // Leads version
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 sticky top-24 space-y-6">
      <div className="flex items-center gap-2 text-sm font-medium text-white/60">
        <Users className="w-4 h-4" />
        <span>Dados da Planilha</span>
      </div>

      {/* Big Numbers */}
      <div className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="text-xs text-blue-400/80 uppercase tracking-wide mb-1">Leads (Meta)</div>
          <div className="text-3xl font-bold text-blue-400">{leads}</div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="text-xs text-green-400/80 uppercase tracking-wide mb-1">MQLs</div>
          <div className="text-3xl font-bold text-green-400">{mqls}</div>
        </div>
      </div>

      {/* MQL Rate */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Percent className="w-4 h-4" />
            <span>Taxa MQL</span>
          </div>
          <span className="font-semibold text-green-400">{formatPercent(mqlRate)}</span>
        </div>
        
        {/* Visual MQL Rate */}
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(mqlRate, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-white/40">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white/5 rounded-lg p-3 text-xs text-white/50">
        <strong className="text-white/70">MQL</strong> = Lead Qualificado para Marketing
        <br />
        Taxa calculada: MQLs ÷ Leads × 100
      </div>
    </div>
  )
}
