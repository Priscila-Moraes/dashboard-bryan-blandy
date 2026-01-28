import { useState, useEffect } from 'react'
import { getAggregatedMetrics, getAdCreatives, getDailySummary } from './lib/supabase'
import type { DailySummary, AdCreative } from './lib/supabase'
import { formatCurrency, formatNumber, formatPercent, formatDate, getDateRange } from './lib/utils'
import { DatePicker } from './components/DatePicker'
import { Funnel } from './components/Funnel'
import { MetricCard } from './components/MetricCard'
import { SheetPanel } from './components/SheetPanel'
import { CreativesTable } from './components/CreativesTable'
import { DailyChart } from './components/DailyChart'
import { 
  DollarSign, 
  Eye, 
  MousePointer, 
  FileText, 
  Users, 
  ShoppingCart,
  TrendingUp,
  Percent,
  BarChart3
} from 'lucide-react'

// Dados mockados para demonstração (enquanto não tem dados reais)
const MOCK_DATA = {
  webinarflix: {
    spend: 2450.67,
    impressions: 45890,
    linkClicks: 1234,
    pageViews: 890,
    leads: 0,
    purchases: 45,
    revenue: 8550.00,
    sheetSales: 52,
    sheetRevenue: 9880.00,
    sheetMqls: 0,
    cpm: 53.40,
    ctr: 2.69,
    cpl: 0,
    cpa: 47.13,
    roas: 4.03,
    loadRate: 72.1,
    conversionRate: 0,
    mqlRate: 0,
  },
  'upgrade-persona': {
    spend: 784.67,
    impressions: 10295,
    linkClicks: 190,
    pageViews: 159,
    leads: 15,
    purchases: 0,
    revenue: 0,
    sheetSales: 0,
    sheetRevenue: 0,
    sheetMqls: 10,
    cpm: 76.22,
    ctr: 1.85,
    cpl: 52.31,
    cpa: 0,
    roas: 0,
    loadRate: 83.7,
    conversionRate: 9.43,
    mqlRate: 66.7,
  }
}

const MOCK_DAILY = [
  { date: '2026-01-23', spend: 180, leads: 3, purchases: 12, impressions: 2500 },
  { date: '2026-01-24', spend: 195, leads: 4, purchases: 10, impressions: 2800 },
  { date: '2026-01-25', spend: 210, leads: 3, purchases: 15, impressions: 3100 },
  { date: '2026-01-26', spend: 199, leads: 5, purchases: 8, impressions: 2600 },
]

const MOCK_CREATIVES = [
  { ad_name: 'ADS001_VENDA_IMAGEM', spend: 450, leads: 5, purchases: 12, cpl: 90, cpa: 37.5, ctr: 2.1, instagram_permalink: 'https://instagram.com/p/xxx' },
  { ad_name: 'ADS002_VENDA_VIDEO', spend: 380, leads: 4, purchases: 8, cpl: 95, cpa: 47.5, ctr: 1.8, instagram_permalink: 'https://instagram.com/p/yyy' },
  { ad_name: 'ADS003_DOR_IMAGEM', spend: 290, leads: 3, purchases: 6, cpl: 96.7, cpa: 48.3, ctr: 1.5, instagram_permalink: '' },
]

const PRODUCTS = [
  { id: 'webinarflix', name: 'WebinarFlix', type: 'sales' },
  { id: 'upgrade-persona', name: 'Upgrade de Persona', type: 'leads' },
]

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState('webinarflix')
  const [dateRange, setDateRange] = useState(() => getDateRange('last7days'))
  const [metrics, setMetrics] = useState<any>(null)
  const [dailyData, setDailyData] = useState<any[]>([])
  const [creatives, setCreatives] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const currentProduct = PRODUCTS.find(p => p.id === selectedProduct)
  const isSalesProduct = currentProduct?.type === 'sales'

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      
      // Por enquanto usa dados mockados
      // Quando tiver dados reais, descomentar:
      // const data = await getAggregatedMetrics(selectedProduct, dateRange.start, dateRange.end)
      // const creativesData = await getAdCreatives(selectedProduct, dateRange.start, dateRange.end)
      
      // Usando mock
      const mockMetrics = MOCK_DATA[selectedProduct as keyof typeof MOCK_DATA] || MOCK_DATA.webinarflix
      setMetrics(mockMetrics)
      setDailyData(MOCK_DAILY)
      setCreatives(MOCK_CREATIVES)
      
      setLoading(false)
    }
    
    loadData()
  }, [selectedProduct, dateRange])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/60">Carregando dados...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
                BB
              </div>
              <span className="font-semibold text-lg">Bryan Blandy</span>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-4">
              {/* Seletor de Produto */}
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRODUCTS.map((product) => (
                  <option key={product.id} value={product.id} className="bg-gray-900">
                    {product.name}
                  </option>
                ))}
              </select>

              {/* Date Picker */}
              <DatePicker
                startDate={dateRange.start}
                endDate={dateRange.end}
                onChange={setDateRange}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column - Funnel + Metrics */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
            
            {/* Top Row - Funnel + Key Metrics */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Funnel */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-medium text-white/60 mb-4">Funil de Conversão</h3>
                <Funnel 
                  impressions={metrics?.impressions || 0}
                  clicks={metrics?.linkClicks || 0}
                  pageViews={metrics?.pageViews || 0}
                  conversions={isSalesProduct ? (metrics?.sheetSales || 0) : (metrics?.leads || 0)}
                  conversionLabel={isSalesProduct ? 'Vendas' : 'Leads'}
                />
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  label="Investimento"
                  value={formatCurrency(metrics?.spend || 0)}
                  icon={<DollarSign className="w-5 h-5" />}
                  color="blue"
                />
                <MetricCard
                  label="CPM"
                  value={formatCurrency(metrics?.cpm || 0)}
                  icon={<Eye className="w-5 h-5" />}
                  color="gray"
                />
                <MetricCard
                  label="CTR"
                  value={formatPercent(metrics?.ctr || 0)}
                  icon={<MousePointer className="w-5 h-5" />}
                  color="blue"
                />
                <MetricCard
                  label="Taxa Carreg."
                  value={formatPercent(metrics?.loadRate || 0)}
                  icon={<FileText className="w-5 h-5" />}
                  color="yellow"
                />
                {isSalesProduct ? (
                  <>
                    <MetricCard
                      label="CPA"
                      value={formatCurrency(metrics?.cpa || 0)}
                      icon={<ShoppingCart className="w-5 h-5" />}
                      color="green"
                    />
                    <MetricCard
                      label="ROAS"
                      value={`${(metrics?.roas || 0).toFixed(2)}x`}
                      icon={<TrendingUp className="w-5 h-5" />}
                      color="purple"
                    />
                  </>
                ) : (
                  <>
                    <MetricCard
                      label="CPL"
                      value={formatCurrency(metrics?.cpl || 0)}
                      icon={<Users className="w-5 h-5" />}
                      color="green"
                    />
                    <MetricCard
                      label="Taxa Conv."
                      value={formatPercent(metrics?.conversionRate || 0)}
                      icon={<Percent className="w-5 h-5" />}
                      color="purple"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Daily Chart */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-medium text-white/60 mb-4">Evolução Diária</h3>
              <DailyChart 
                data={dailyData} 
                isSales={isSalesProduct}
              />
            </div>

            {/* Creatives Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-medium text-white/60 mb-4">Top Criativos</h3>
              <CreativesTable 
                data={creatives}
                isSales={isSalesProduct}
              />
            </div>
          </div>

          {/* Right Column - Sheet Data */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <SheetPanel
              isSales={isSalesProduct}
              sales={metrics?.sheetSales || 0}
              revenue={metrics?.sheetRevenue || 0}
              leads={metrics?.leads || 0}
              mqls={metrics?.sheetMqls || 0}
              mqlRate={metrics?.mqlRate || 0}
              cpa={metrics?.cpa || 0}
              roas={metrics?.roas || 0}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
