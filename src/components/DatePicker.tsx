import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { formatDateFull, getDateRange } from '../lib/utils'

interface DatePickerProps {
  startDate: string
  endDate: string
  onChange: (range: { start: string; end: string }) => void
}

const PRESETS = [
  { id: 'today', label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: 'last7days', label: 'Últimos 7 dias' },
  { id: 'thisMonth', label: 'Este mês' },
  { id: 'lastMonth', label: 'Mês anterior' },
]

export function DatePicker({ startDate, endDate, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customStart, setCustomStart] = useState(startDate)
  const [customEnd, setCustomEnd] = useState(endDate)

  const handlePreset = (presetId: string) => {
    const range = getDateRange(presetId)
    onChange(range)
    setIsOpen(false)
  }

  const handleCustomApply = () => {
    onChange({ start: customStart, end: customEnd })
    setIsOpen(false)
  }

  const formatDisplay = () => {
    if (startDate === endDate) {
      return formatDateFull(startDate)
    }
    return `${formatDateFull(startDate)} - ${formatDateFull(endDate)}`
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm hover:bg-white/15 transition-colors"
      >
        <Calendar className="w-4 h-4 text-white/60" />
        <span>{formatDisplay()}</span>
        <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
            {/* Presets */}
            <div className="p-2 border-b border-white/10">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePreset(preset.id)}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Range */}
            <div className="p-4 space-y-4">
              <div className="text-xs text-white/60 font-medium uppercase">Período personalizado</div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Início</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Fim</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleCustomApply}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
