import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatDate, formatCurrency } from '../lib/utils'
import type { DailySummary } from '../lib/supabase'

interface DailyChartProps {
  data: DailySummary[]
  isSales: boolean
}

export function DailyChart({ data, isSales }: DailyChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-white/40">
        Sem dados para o período selecionado
      </div>
    )
  }

  const chartData = data.map(d => ({
    dateFormatted: formatDate(d.date),
    date: d.date,
    spend: d.total_spend || 0,
    conversions: isSales ? (d.sheet_sales || 0) : (d.total_leads || 0),
    impressions: d.total_impressions || 0,
    clicks: d.total_link_clicks || 0,
    pageViews: d.total_page_views || 0,
    revenue: d.sheet_revenue || 0,
  }))

  const conversionLabel = isSales ? 'Vendas' : 'Leads'

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const row = payload[0]?.payload
      return (
        <div className="bg-gray-900 border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-white/60">{entry.name}:</span>
              <span className="text-white font-medium">
                {entry.dataKey === 'spend' 
                  ? formatCurrency(entry.value)
                  : entry.value
                }
              </span>
            </div>
          ))}
          {isSales && row?.revenue > 0 && (
            <div className="flex items-center gap-2 text-sm mt-1 pt-1 border-t border-white/10">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-white/60">Receita:</span>
              <span className="text-purple-400 font-medium">{formatCurrency(row.revenue)}</span>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
        
        <XAxis 
          dataKey="dateFormatted" 
          stroke="rgba(255,255,255,0.4)" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        
        <YAxis 
          yAxisId="left"
          stroke="rgba(255,255,255,0.4)" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$ ${value}`}
        />
        
        <YAxis 
          yAxisId="right"
          orientation="right"
          stroke="rgba(255,255,255,0.4)" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value: string) => <span className="text-white/60 text-sm">{value}</span>}
        />
        
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="spend"
          name="Investimento"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorSpend)"
        />
        
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="conversions"
          name={conversionLabel}
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorConversions)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
