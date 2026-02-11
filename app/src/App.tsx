import { useState, useEffect } from 'react'
import { getAggregatedMetrics, getAdCreatives, aggregateCreatives, getLatestDailySummaryDate } from './lib/supabase'
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
  Target,
  ShoppingCart,
  TrendingUp,
  Percent,
  RefreshCw
} from 'lucide-react'

const PRODUCTS = [
  { id: 'webinarflix', name: 'WebinarFlix', type: 'sales' },
  { id: 'upgrade-persona', name: 'Upgrade de Persona', type: 'leads' },
  { id: 'fib-live', name: 'FIB Live', type: 'sales' },
  { id: 'formulario-aplicacao', name: 'Formulário de Aplicação', type: 'leads' },
]

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState('webinarflix')
  const [dateRange, setDateRange] = useState(() => getDateRange('allTime', 'webinarflix'))
  const [metrics, setMetrics] = useState<any>(null)
  const [dailyData, setDailyData] = useState<any[]>([])
  const [creatives, setCreatives] = useState<AggregatedCreative[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [latestAvailableDate, setLatestAvailableDate] = useState<string | null>(null)
  const [usingCreativesFallback, setUsingCreativesFallback] = useState(false)

  const currentProduct = PRODUCTS.find(p => p.id === selectedProduct)
  const isSalesProduct = currentProduct?.type === 'sales'
  const isNativeForm = selectedProduct === 'formulario-aplicacao'
  const isMqlPrimaryProduct = ['upgrade-persona', 'formulario-aplicacao'].includes(selectedProduct)

  const todayBRT = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

  async function loadData() {
    setLoading(true)

    try {
      setUsingCreativesFallback(false)

      // Buscar criativos e agregar por ad_id (serve como fallback quando daily_summary ainda nao gravou hoje/ontem).
      const rawCreatives = await getAdCreatives(selectedProduct, dateRange.start, dateRange.end)
      const aggregated = aggregateCreatives(rawCreatives)
      setCreatives(aggregated)

      // Buscar metricas agregadas do daily_summary
      const data = await getAggregatedMetrics(selectedProduct, dateRange.start, dateRange.end)
      setLatestAvailableDate(null)

      if (data?.dailyData) {
        setMetrics(data)
        setDailyData(data.dailyData)
      } else if (rawCreatives.length > 0) {
        // Fallback: se o job do daily_summary nao rodou para hoje/ontem mas os criativos existem,
        // ainda da para exibir gasto/cliques/leads e a tabela normalmente.
        setUsingCreativesFallback(true)

        const byDate = new Map<
          string,
          {
            spend: number
            impressions: number
            linkClicks: number
            leads: number
            purchases: number
            sheetLeadsUtm: number
            sheetMqls: number
          }
        >()

        for (const c of rawCreatives) {
          const d = (c.date || '').slice(0, 10)
          if (!d) continue
          const cur =
            byDate.get(d) ||
            {
              spend: 0,
              impressions: 0,
              linkClicks: 0,
              leads: 0,
              purchases: 0,
              sheetLeadsUtm: 0,
              sheetMqls: 0,
            }
          cur.spend += c.spend || 0
          cur.impressions += c.impressions || 0
          cur.linkClicks += c.link_clicks || 0
          cur.leads += c.leads || 0
          cur.purchases += c.purchases || 0
          cur.sheetLeadsUtm += c.sheet_leads_utm || 0
          cur.sheetMqls += c.sheet_mqls || 0
          byDate.set(d, cur)
        }

        const dailyFallback = Array.from(byDate.entries())
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([date, d]) => {
            const ctr = d.impressions > 0 ? (d.linkClicks / d.impressions) * 100 : 0
            const cpm = d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0
            const cpl = d.leads > 0 ? d.spend / d.leads : 0
            const mqlLeads = d.sheetLeadsUtm > 0 ? d.sheetLeadsUtm : d.leads
            const mqlRate = mqlLeads > 0 ? (d.sheetMqls / mqlLeads) * 100 : 0

            return {
              // DailySummary shape used by charts
              date,
              product_name: selectedProduct,
              account_id: '',
              total_spend: d.spend,
              total_impressions: d.impressions,
              total_link_clicks: d.linkClicks,
              total_page_views: 0,
              total_leads: d.leads,
              total_purchases: d.purchases,
              total_revenue: 0,
              sheet_sales: 0,
              sheet_revenue: 0,
              sheet_leads: 0,
              sheet_mqls: d.sheetMqls,
              cpm,
              ctr,
              cpl,
              cpa: 0,
              roas: 0,
              load_rate: 0,
              conversion_rate: 0,
              mql_rate: mqlRate,
            }
          })

        const totals = dailyFallback.reduce(
          (acc, day) => ({
            spend: acc.spend + (day.total_spend || 0),
            impressions: acc.impressions + (day.total_impressions || 0),
            linkClicks: acc.linkClicks + (day.total_link_clicks || 0),
            pageViews: acc.pageViews + (day.total_page_views || 0),
            leads: acc.leads + (day.total_leads || 0),
            purchases: acc.purchases + (day.total_purchases || 0),
            revenue: acc.revenue + (day.total_revenue || 0),
            sheetSales: acc.sheetSales + (day.sheet_sales || 0),
            sheetRevenue: acc.sheetRevenue + (day.sheet_revenue || 0),
            sheetLeads: acc.sheetLeads + (day.sheet_leads || 0),
            sheetMqls: acc.sheetMqls + (day.sheet_mqls || 0),
          }),
          {
            spend: 0,
            impressions: 0,
            linkClicks: 0,
            pageViews: 0,
            leads: 0,
            purchases: 0,
            revenue: 0,
            sheetSales: 0,
            sheetRevenue: 0,
            sheetLeads: 0,
            sheetMqls: 0,
          }
        )

        const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0
        const ctr = totals.impressions > 0 ? (totals.linkClicks / totals.impressions) * 100 : 0
        const realLeads = totals.leads
        const cpl = realLeads > 0 ? totals.spend / realLeads : 0
        const cpc = totals.linkClicks > 0 ? totals.spend / totals.linkClicks : 0
        const mqlLeads = totals.leads
        const mqlRate = mqlLeads > 0 ? (totals.sheetMqls / mqlLeads) * 100 : 0

        setMetrics({
          ...totals,
          cpm,
          ctr,
          cpl,
          cpc,
          cpa: 0,
          roas: 0,
          loadRate: 0,
          conversionRate: 0,
          conversionRateClicks: 0,
          mqlRate,
          days: dailyFallback.length,
          dailyData: dailyFallback,
        })
        setDailyData(dailyFallback)
      } else {
        // Sem daily_summary e sem criativos no range: de fato nao ha o que renderizar.
        setMetrics(null)
        setDailyData([])

        // Ajuda a diagnosticar quando o range esta “vazio” porque o sync ainda nao gravou os dias recentes.
        const latest = await getLatestDailySummaryDate(selectedProduct)
        setLatestAvailableDate(latest)
      }

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

  // Verificar se hoje está no range (dados parciais) usando fuso de São Paulo
  const includesPartialDay = dateRange.end >= todayBRT

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
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-sm">
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
                  // Formulário de Aplicação: abre com dados desde janeiro
                  if (newProduct === 'formulario-aplicacao') {
                    setDateRange({ start: '2026-01-01', end: todayBRT })
                  } else {
                    setDateRange(getDateRange('allTime', newProduct))
                  }
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
                productId={selectedProduct}
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
          <div className="flex flex-col items-center justify-center py-20 text-white/40 text-center gap-2">
            <div>Sem dados para o período selecionado</div>
            {latestAvailableDate && (
              <div className="text-xs text-white/30">
                Último dia com dados gravados no Supabase para este funil: <span className="text-white/50">{latestAvailableDate}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {usingCreativesFallback && (
              <div className="col-span-12 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-200/90">
                Dados de hoje/ontem ainda não foram gravados no <span className="text-yellow-100 font-semibold">daily_summary</span>. Exibindo gasto/cliques/leads a partir de <span className="text-yellow-100 font-semibold">ad_creatives</span> (parcial).
              </div>
            )}

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
                    conversions={
                      isSalesProduct
                        ? metrics.sheetSales
                        : (isMqlPrimaryProduct
                          ? metrics.sheetMqls
                          : (metrics.sheetLeads > 0 ? metrics.sheetLeads : metrics.leads))
                    }
                    conversionLabel={isSalesProduct ? 'Vendas' : (isMqlPrimaryProduct ? 'MQLs' : 'Leads')}
                    secondaryConversions={
                      !isSalesProduct && isMqlPrimaryProduct
                        ? (metrics.sheetLeads > 0 ? metrics.sheetLeads : metrics.leads)
                        : undefined
                    }
                    secondaryConversionLabel={!isSalesProduct && isMqlPrimaryProduct ? 'Leads' : undefined}
                    hidePageViews={isNativeForm}
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
                  {isNativeForm ? (
                    <MetricCard
                      label="CPC"
                      value={formatCurrency(metrics.cpc)}
                      icon={<MousePointer className="w-5 h-5" />}
                      color="yellow"
                    />
                  ) : (
                    <MetricCard
                      label="Taxa Carreg."
                      value={formatPercent(metrics.loadRate)}
                      icon={<FileText className="w-5 h-5" />}
                      color="yellow"
                    />
                  )}
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
) : isMqlPrimaryProduct ? (
  <>
    <MetricCard
      label="MQLs"
      value={formatNumber(metrics.sheetMqls)}
      icon={<Target className="w-5 h-5" />}
      color="green"
    />
    <MetricCard
      label="Custo/MQL"
      value={metrics.sheetMqls > 0 ? formatCurrency(metrics.spend / metrics.sheetMqls) : '—'}
      icon={<Users className="w-5 h-5" />}
      color="green"
    />
    <MetricCard
      label="Taxa MQL"
      value={formatPercent(metrics.mqlRate)}
      icon={<Percent className="w-5 h-5" />}
      color="purple"
    />
  </>
) : (
  <>
    <MetricCard
      label="Custo/MQL"
      value={metrics.sheetMqls > 0 ? formatCurrency(metrics.spend / metrics.sheetMqls) : '—'}
      icon={<Users className="w-5 h-5" />}
      color="green"
    />
    <MetricCard
      label="Taxa MQL"
      value={formatPercent(metrics.mqlRate)}
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
                  isMqlPrimary={isMqlPrimaryProduct}
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
                  isMqlPrimary={isMqlPrimaryProduct}
                  showMqlInSales={selectedProduct === 'fib-live'}
                  totalSheetSales={metrics.sheetSales}
                  totalSheetLeads={metrics.sheetLeads}
                  totalSheetMqls={metrics.sheetMqls}
                />
              </div>
            </div>

            {/* Right Column - Sheet Data */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-3">
              <SheetPanel
                isSales={isSalesProduct}
                isMqlPrimary={isMqlPrimaryProduct}
                sales={metrics.sheetSales}
                revenue={metrics.sheetRevenue}
                leads={metrics.sheetLeads > 0 ? metrics.sheetLeads : metrics.leads}
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
