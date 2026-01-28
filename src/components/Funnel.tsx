import { formatNumber } from '../lib/utils'

interface FunnelProps {
  impressions: number
  clicks: number
  pageViews: number
  conversions: number
  conversionLabel: string
}

export function Funnel({ impressions, clicks, pageViews, conversions, conversionLabel }: FunnelProps) {
  const steps = [
    { label: 'Impressões', value: impressions, color: 'from-blue-500 to-blue-600' },
    { label: 'Cliques', value: clicks, color: 'from-cyan-500 to-cyan-600' },
    { label: 'Page Views', value: pageViews, color: 'from-teal-500 to-teal-600' },
    { label: conversionLabel, value: conversions, color: 'from-green-500 to-green-600' },
  ]

  const maxValue = Math.max(...steps.map(s => s.value), 1)

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const widthPercent = Math.max((step.value / maxValue) * 100, 20)
        const rate = index > 0 && steps[index - 1].value > 0 
          ? ((step.value / steps[index - 1].value) * 100).toFixed(1)
          : null

        return (
          <div key={step.label} className="relative">
            {/* Rate indicator */}
            {rate && (
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full text-xs text-white/40 hidden xl:block">
                {rate}%
              </div>
            )}
            
            {/* Funnel step */}
            <div
              className={`relative h-14 bg-gradient-to-r ${step.color} rounded-lg flex items-center justify-between px-4 transition-all duration-500`}
              style={{ 
                width: `${widthPercent}%`,
                clipPath: index < steps.length - 1 
                  ? 'polygon(0 0, 100% 0, 97% 100%, 3% 100%)' 
                  : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
              }}
            >
              <span className="text-sm font-medium text-white/90">{step.label}</span>
              <span className="text-lg font-bold text-white">{formatNumber(step.value)}</span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="absolute left-1/2 -translate-x-1/2 w-px h-3 bg-white/20" />
            )}
          </div>
        )
      })}
    </div>
  )
}
