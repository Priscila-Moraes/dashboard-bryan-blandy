import { formatNumber } from '../lib/utils'

interface FunnelProps {
  impressions: number
  clicks: number
  pageViews: number
  conversions: number
  conversionLabel: string
  secondaryConversions?: number
  secondaryConversionLabel?: string
  hidePageViews?: boolean
}

export function Funnel({
  impressions,
  clicks,
  pageViews,
  conversions,
  conversionLabel,
  secondaryConversions,
  secondaryConversionLabel,
  hidePageViews,
}: FunnelProps) {
  const showSecondary =
    typeof secondaryConversions === 'number' &&
    !!secondaryConversionLabel &&
    secondaryConversions >= 0

  const allSteps = [
    { label: 'Impressões', value: impressions, color: 'from-blue-500 to-blue-600', hidden: false },
    { label: 'Cliques', value: clicks, color: 'from-cyan-500 to-cyan-600', hidden: false },
    { label: 'Page Views', value: pageViews, color: 'from-teal-500 to-teal-600', hidden: hidePageViews },
    {
      label: secondaryConversionLabel || 'Leads',
      value: secondaryConversions || 0,
      color: 'from-blue-500 to-blue-600',
      hidden: !showSecondary,
    },
    { label: conversionLabel, value: conversions, color: 'from-green-500 to-green-600', hidden: false },
  ]

  const steps = allSteps.filter((s) => !s.hidden)

  // Progressive widths based on number of steps
  const widthMap: Record<number, number[]> = {
    3: [100, 65, 35],
    4: [100, 72, 54, 40],
    5: [100, 80, 66, 52, 40],
  }
  const widthPercents = widthMap[steps.length] || widthMap[4]

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const rate =
          index > 0 && steps[index - 1].value > 0
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
                <span className="text-sm font-medium text-white/90 truncate mr-3">{step.label}</span>
                <span className="text-lg font-bold text-white whitespace-nowrap">{formatNumber(step.value)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
