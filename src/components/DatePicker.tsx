import { useState, useEffect, useRef } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDateFull, getDateRange, cn } from '../lib/utils'

interface DatePickerProps {
  startDate: string
  endDate: string
  onChange: (range: { start: string; end: string }) => void
  productId?: string
}

const PRESETS = [
  { id: 'today', label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: 'last7days', label: 'Últimos 7 dias' },
  { id: 'last14days', label: 'Últimos 14 dias' },
  { id: 'last30days', label: 'Últimos 30 dias' },
  { id: 'thisMonth', label: 'Este mês' },
  { id: 'lastMonth', label: 'Mês passado' },
  { id: 'allTime', label: 'Todo período' },
]

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
]

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function parseDate(s: string): Date {
  return new Date(s + 'T12:00:00')
}

function isSameDay(a: string, b: string): boolean {
  return a === b
}

function isInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end
}

interface CalendarMonthProps {
  year: number
  month: number
  rangeStart: string | null
  rangeEnd: string | null
  hoverDate: string | null
  onDateClick: (dateStr: string) => void
  onDateHover: (dateStr: string | null) => void
}

function CalendarMonth({ year, month, rangeStart, rangeEnd, hoverDate, onDateClick, onDateHover }: CalendarMonthProps) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const today = toDateStr(new Date())

  // Determine effective range for highlighting
  let effectiveStart = rangeStart
  let effectiveEnd = rangeEnd

  // If we're in selection mode (start picked but no end), use hover as tentative end
  if (rangeStart && !rangeEnd && hoverDate) {
    if (hoverDate >= rangeStart) {
      effectiveEnd = hoverDate
    } else {
      effectiveStart = hoverDate
      effectiveEnd = rangeStart
    }
  }

  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = []

  // Fill empty slots before first day
  for (let i = 0; i < startDow; i++) {
    currentWeek.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Fill remaining slots
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  return (
    <div className="select-none">
      {/* Month title */}
      <div className="text-center text-sm font-semibold text-white mb-3">
        {MONTH_NAMES[month]} {year}
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] text-white/40 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0">
        {weeks.flat().map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-8" />
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = dateStr === today
          const isStart = effectiveStart ? isSameDay(dateStr, effectiveStart) : false
          const isEnd = effectiveEnd ? isSameDay(dateStr, effectiveEnd) : false
          const inRange = effectiveStart && effectiveEnd ? isInRange(dateStr, effectiveStart, effectiveEnd) : false
          const isEndpoint = isStart || isEnd

          return (
            <div
              key={dateStr}
              className={cn(
                'h-8 flex items-center justify-center text-xs cursor-pointer relative transition-colors',
                // Background for range
                inRange && !isEndpoint && 'bg-blue-500/20',
                // Left-side range connection
                inRange && isStart && 'rounded-l-full',
                inRange && isEnd && 'rounded-r-full',
                // Single day selected
                isEndpoint && !inRange && 'rounded-full',
              )}
              onClick={() => onDateClick(dateStr)}
              onMouseEnter={() => onDateHover(dateStr)}
            >
              <span
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-full transition-colors',
                  isEndpoint && 'bg-blue-500 text-white font-bold',
                  !isEndpoint && inRange && 'text-blue-300',
                  !isEndpoint && !inRange && 'text-white/70 hover:bg-white/10',
                  isToday && !isEndpoint && 'ring-1 ring-blue-400/50 text-blue-400',
                )}
              >
                {day}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function DatePicker({ startDate, endDate, onChange, productId }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectingStart, setSelectingStart] = useState<string | null>(null)
  const [selectingEnd, setSelectingEnd] = useState<string | null>(null)
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Calendar navigation - show 2 months, default to current month + previous
  const today = new Date()
  const [rightYear, setRightYear] = useState(today.getFullYear())
  const [rightMonth, setRightMonth] = useState(today.getMonth())

  // Left month is one before right
  const leftYear = rightMonth === 0 ? rightYear - 1 : rightYear
  const leftMonth = rightMonth === 0 ? 11 : rightMonth - 1

  // Reset selection state when opening
  useEffect(() => {
    if (isOpen) {
      setSelectingStart(null)
      setSelectingEnd(null)
      setHoverDate(null)
    }
  }, [isOpen])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handlePreset = (presetId: string) => {
    const range = getDateRange(presetId, productId)
    onChange(range)
    setIsOpen(false)
  }

  const handleDateClick = (dateStr: string) => {
    if (!selectingStart || selectingEnd) {
      // Start new selection
      setSelectingStart(dateStr)
      setSelectingEnd(null)
    } else {
      // Complete selection
      let start = selectingStart
      let end = dateStr
      if (end < start) {
        ;[start, end] = [end, start]
      }
      onChange({ start, end })
      setIsOpen(false)
    }
  }

  const handlePrevMonth = () => {
    if (rightMonth === 0) {
      setRightYear(rightYear - 1)
      setRightMonth(11)
    } else {
      setRightMonth(rightMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (rightMonth === 11) {
      setRightYear(rightYear + 1)
      setRightMonth(0)
    } else {
      setRightMonth(rightMonth + 1)
    }
  }

  const formatDisplay = () => {
    if (startDate === endDate) {
      return formatDateFull(startDate)
    }
    return `${formatDateFull(startDate)} — ${formatDateFull(endDate)}`
  }

  // Determine what range to show on calendar
  const displayStart = selectingStart || startDate
  const displayEnd = selectingEnd || (selectingStart ? null : endDate)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm hover:bg-white/15 transition-colors"
      >
        <Calendar className="w-4 h-4 text-white/60" />
        <span>{formatDisplay()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-[#0f1129] border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
          <div className="flex">
            {/* Left sidebar - Presets */}
            <div className="w-40 border-r border-white/10 py-2 flex flex-col">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePreset(preset.id)}
                  className="text-left px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Right side - Calendars */}
            <div className="p-4">
              {/* Navigation */}
              <div className="flex items-center justify-between mb-4 px-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-white/60" />
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Two month calendars */}
              <div className="flex gap-6">
                <div className="w-52">
                  <CalendarMonth
                    year={leftYear}
                    month={leftMonth}
                    rangeStart={displayStart}
                    rangeEnd={displayEnd}
                    hoverDate={hoverDate}
                    onDateClick={handleDateClick}
                    onDateHover={setHoverDate}
                  />
                </div>
                <div className="w-52">
                  <CalendarMonth
                    year={rightYear}
                    month={rightMonth}
                    rangeStart={displayStart}
                    rangeEnd={displayEnd}
                    hoverDate={hoverDate}
                    onDateClick={handleDateClick}
                    onDateHover={setHoverDate}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

