import { useState, useEffect } from 'react'
import { getAggregatedMetrics, getAdCreatives, aggregateCreatives } from './lib/supabase'
import type { AggregatedCreative } from './lib/supabase'
import { formatCurrency, formatNumber, formatPercent, getDateRange } from './lib/utils'
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
  RefreshCw
} from 'lucide-react'

const PRODUCTS = [
  { id: 'webinarflix', name: 'WebinarFlix', type: 'sales' },
  { id: 'upgrade-persona', name: 'Upgrade de Persona', type: 'leads' },
]

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState('webinarflix')
  const [dateRange, setDateRange] = useState(() => getDateRange('allTime', 'webinarflix'))
  const [metrics, setMetrics] = useState<any>(null)
  const [dailyData, setDailyData] = useState<any[]>([])
  const [creatives, setCreatives] = useState<AggregatedCreative[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const currentProduct = PRODUCTS.find(p => p.id === selectedProduct)
  const isSalesProduct = currentProduct?.type === 'sales'

  async function loadData() {
    setLoading(true)
    
    try {
      // Buscar métricas agregadas do daily_summary
      const data = await getAggregatedMetrics(selectedProduct, dateRange.start, dateRange.end)
      setMetrics(data)
      
      // Dados diários para o gráfico
      if (data?.dailyData) {
        setDailyData(data.dailyData)
      } else {
        setDailyData([])
      }

      // Buscar criativos e agregar por ad_id
      const rawCreatives = await getAdCreatives(selectedProduct, dateRange.start, dateRange.end)
      const aggregated = aggregateCreatives(rawCreatives)
      setCreatives(aggregated)

      setLastUpdate(new Date())
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [selectedProduct, dateRange])

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      loadData()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedProduct, dateRange])

  // Verificar se hoje está no range (dados parciais)
  const today = new Date().toISOString().split('T')[0]
  const includesPartialDay = dateRange.end >= today

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/60">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Carregando dados...</span>
        </div>
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
              <img src="/logo.png" alt="WebinarPro" className="h-8 object-contain" />
              <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
              <img src="/meta.png" alt="Meta" className="h-5 object-contain hidden sm:block" />
              <div>
                {lastUpdate && (
                  <span className="text-xs text-white/40">
                    Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {includesPartialDay && (
                      <span className="ml-2 text-yellow-400/80">● hoje parcial</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-4">
              {/* Seletor de Produto */}
              <select
                value={selectedProduct}
                onChange={(e) => {
                  const newProduct = e.target.value
                  setSelectedProduct(newProduct)
                  setDateRange(getDateRange('allTime', newProduct))
                }}
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

              {/* Refresh */}
              <button
                onClick={loadData}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Atualizar dados"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {!metrics ? (
          <div className="flex items-center justify-center py-20 text-white/40">
            Sem dados para o período selecionado
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            
            {/* Left Column - Funnel + Metrics */}
            <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
              
              {/* Top Row - Funnel + Key Metrics */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Funnel */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-white/60 mb-4">Funil de Conversão</h3>
                  <Funnel 
                    impressions={metrics.impressions}
                    clicks={metrics.linkClicks}
                    pageViews={metrics.pageViews}
                    conversions={isSalesProduct ? metrics.sheetSales : metrics.leads}
                    conversionLabel={isSalesProduct ? 'Vendas' : 'Leads'}
                  />
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard
                    label="Investimento"
                    value={formatCurrency(metrics.spend)}
                    icon={<DollarSign className="w-5 h-5" />}
                    color="blue"
                  />
                  <MetricCard
                    label="CPM"
                    value={formatCurrency(metrics.cpm)}
                    icon={<Eye className="w-5 h-5" />}
                    color="gray"
                  />
                  <MetricCard
                    label="CTR"
                    value={formatPercent(metrics.ctr)}
                    icon={<MousePointer className="w-5 h-5" />}
                    color="blue"
                  />
                  <MetricCard
                    label="Taxa Carreg."
                    value={formatPercent(metrics.loadRate)}
                    icon={<FileText className="w-5 h-5" />}
                    color="yellow"
                  />
                  {isSalesProduct ? (
                    <>
                      <MetricCard
                        label="CPA"
                        value={formatCurrency(metrics.cpa)}
                        icon={<ShoppingCart className="w-5 h-5" />}
                        color="green"
                      />
                      <MetricCard
                        label="ROAS"
                        value={`${metrics.roas.toFixed(2)}x`}
                        icon={<TrendingUp className="w-5 h-5" />}
                        color="purple"
                      />
                    </>
                  ) : (
                    <>
                      <MetricCard
                        label="CPL"
                        value={formatCurrency(metrics.cpl)}
                        icon={<Users className="w-5 h-5" />}
                        color="green"
                      />
                      <MetricCard
                        label="Taxa Conv."
                        value={formatPercent(metrics.conversionRate)}
                        icon={<Percent className="w-5 h-5" />}
                        color="purple"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Daily Chart */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-medium text-white/60 mb-4">
                  Evolução Diária
                  <span className="text-xs text-white/30 ml-2">({metrics.days} dias)</span>
                </h3>
                <DailyChart 
                  data={dailyData} 
                  isSales={isSalesProduct}
                />
              </div>

              {/* Creatives Table */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-medium text-white/60 mb-4">
                  Top Criativos
                  <span className="text-xs text-white/30 ml-2">({creatives.length} criativos)</span>
                </h3>
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
                sales={metrics.sheetSales}
                revenue={metrics.sheetRevenue}
                leads={metrics.leads}
                mqls={metrics.sheetMqls}
                mqlRate={metrics.mqlRate}
                cpa={metrics.cpa}
                roas={metrics.roas}
                spend={metrics.spend}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
