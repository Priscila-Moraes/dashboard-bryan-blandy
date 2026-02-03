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

  // Fixed progressive widths for clean funnel shape
  const widthPercents = [100, 70, 55, 40]

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const rate = index > 0 && steps[index - 1].value > 0 
          ? ((step.value / steps[index - 1].value) * 100).toFixed(1) + '%'
          : null

        return (
          <div key={step.label} className="flex items-center gap-3">
            {/* Rate label (left side) */}
            <div className="w-12 text-right shrink-0">
              {rate ? (
                <span className="text-xs text-white/40 font-medium">{rate}</span>
              ) : (
                <span className="text-xs text-white/20">—</span>
              )}
            </div>

            {/* Bar */}
            <div className="flex-1 min-w-0">
              <div
                className={`bg-gradient-to-r ${step.color} rounded-lg flex items-center justify-between px-4 h-12`}
                style={{ width: `${widthPercents[index]}%` }}
              >
                <span className="text-sm font-medium text-white/90 truncate mr-3">
                  {step.label}
                </span>
                <span className="text-lg font-bold text-white whitespace-nowrap">
                  {formatNumber(step.value)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
