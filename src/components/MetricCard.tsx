import { ReactNode } from 'react'
import { cn } from '../lib/utils'

interface MetricCardProps {
  label: string
  value: string
  icon: ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'gray'
  trend?: number
}

const colorStyles = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  green: 'bg-green-500/10 text-green-400 border-green-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  gray: 'bg-white/5 text-white/60 border-white/10',
}

const iconColorStyles = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
  red: 'text-red-400',
  gray: 'text-white/40',
}

export function MetricCard({ label, value, icon, color = 'gray', trend }: MetricCardProps) {
  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all hover:scale-[1.02]',
      colorStyles[color]
    )}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-white/60 uppercase tracking-wide">{label}</span>
        <div className={iconColorStyles[color]}>{icon}</div>
      </div>
      
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-white">{value}</span>
        
        {trend !== undefined && (
          <span className={cn(
            'text-xs font-medium',
            trend >= 0 ? 'text-green-400' : 'text-red-400'
          )}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}
