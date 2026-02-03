import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return 'R$ ' + value.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('pt-BR')
}

export function formatPercent(value: number): string {
  return value.toFixed(2).replace('.', ',') + '%'
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })
}

export function getDateRange(preset: string): { start: string; end: string } {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const formatISO = (d: Date) => d.toISOString().split('T')[0]

  switch (preset) {
    case 'today':
      return { start: formatISO(today), end: formatISO(today) }
    
    case 'yesterday':
      return { start: formatISO(yesterday), end: formatISO(yesterday) }
    
    case 'last7days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 6)
      return { start: formatISO(start), end: formatISO(today) }
    }

    case 'last14days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 13)
      return { start: formatISO(start), end: formatISO(today) }
    }

    case 'last30days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 29)
      return { start: formatISO(start), end: formatISO(today) }
    }
    
    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start: formatISO(start), end: formatISO(today) }
    }
    
    case 'lastMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
      return { start: formatISO(start), end: formatISO(end) }
    }

    case 'allTime': {
      return { start: '2026-01-20', end: formatISO(today) }
    }
    
    default:
      return { start: formatISO(yesterday), end: formatISO(yesterday) }
  }
}
