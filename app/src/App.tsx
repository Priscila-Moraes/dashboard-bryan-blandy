import { useState, useEffect } from 'react'
import { getAggregatedMetrics, getAdCreatives, getAdCreativesByCampaignPatterns, aggregateCreatives, aggregateCampaigns, aggregateAdSets, getLatestDailySummaryDate, getUnattributedMqlLeads } from './lib/supabase'
import type { AggregatedCreative, AggregatedCampaign, UnattributedMqlLead } from './lib/supabase'
import { calculateCostPer, calculateThruplayRate, formatCurrency, formatNumber, formatPercent, getDateRange } from './lib/utils'
import { DatePicker } from './components/DatePicker'
import { Funnel } from './components/Funnel'
import { MetricCard } from './components/MetricCard'
import { SheetPanel } from './components/SheetPanel'
import { CampaignsTable } from './components/CampaignsTable'
import { CreativesTable } from './components/CreativesTable'
import { DailyChart } from './components/DailyChart'
import { UnattributedLeadsPanel } from './components/UnattributedLeadsPanel'
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
  { id: 'workshop-lancamento-simultaneo', name: 'Workshop Lançamento Simultaneo', type: 'sales' },
  { id: 'upgrade-persona', name: 'Upgrade de Persona', type: 'leads' },
  { id: 'fib-live', name: 'FIB Live', type: 'sales' },
  { id: 'formulario-aplicacao', name: 'Formulário de Aplicação', type: 'leads' },
  { id: 'engajamento-video-view', name: 'Engajamento Video View', type: 'leads' },
]

const CAMPAIGN_PATTERN_BY_PRODUCT: Record<string, string[]> = {
  'engajamento-video-view': ['vv_engajamento_mar26_abo'],
}

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState('webinarflix')
  const [dateRange, setDateRange] = useState(() => getDateRange('allTime', 'webinarflix'))
  const [metrics, setMetrics] = useState<any>(null)
  const [dailyData, setDailyData] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<AggregatedCampaign[]>([])
  const [adSets, setAdSets] = useState<AggregatedCampaign[]>([])
  const [creatives, setCreatives] = useState<AggregatedCreative[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [latestAvailableDate, setLatestAvailableDate] = useState<string | null>(null)
  const [usingCreativesFallback, setUsingCreativesFallback] = useState(false)
  const [unattributedMqlLeads, setUnattributedMqlLeads] = useState<UnattributedMqlLead[]>([])

  const currentProduct = PRODUCTS.find(p => p.id === selectedProduct)
  const isSalesProduct = currentProduct?.type === 'sales'
  const isNativeForm = selectedProduct === 'formulario-aplicacao'
  const isMqlPrimaryProduct = ['upgrade-persona', 'formulario-aplicacao'].includes(selectedProduct)
  const isVideoViewProduct = selectedProduct === 'engajamento-video-view'
  const campaignPatterns = CAMPAIGN_PATTERN_BY_PRODUCT[selectedProduct] || []
  const usesCampaignPattern = campaignPatterns.length > 0

  const todayBRT = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

  async function loadData() {
    setLoading(true)

    try {
      setUsingCreativesFallback(false)

      // Buscar criativos e agregar por ad_name (fallback ad_id) para evitar duplicidade visual.
      const rawCreatives = usesCampaignPattern
        ? await getAdCreativesByCampaignPatterns(dateRange.start, dateRange.end, campaignPatterns)
        : await getAdCreatives(selectedProduct, dateRange.start, dateRange.end)
      const aggregated = aggregateCreatives(rawCreatives)
      setCreatives(aggregated)

      if (selectedProduct === 'fib-live') {
        const unattributedLeads = await getUnattributedMqlLeads(
          selectedProduct,
          dateRange.start,
          dateRange.end,
          100
        )
        setUnattributedMqlLeads(unattributedLeads)
      } else {
        setUnattributedMqlLeads([])
      }

      // Buscar metricas agregadas do daily_summary
      const data = usesCampaignPattern && !isVideoViewProduct
        ? null
        : await getAggregatedMetrics(selectedProduct, dateRange.start, dateRange.end)
      setLatestAvailableDate(null)

      if (data?.dailyData) {
        setCampaigns(aggregateCampaigns(rawCreatives))
        setAdSets(isVideoViewProduct ? aggregateAdSets(rawCreatives) : [])
        setMetrics(data)
        setDailyData(data.dailyData)
      } else if (rawCreatives.length > 0) {
        setCampaigns(aggregateCampaigns(rawCreatives))
        setAdSets(isVideoViewProduct ? aggregateAdSets(rawCreatives) : [])
        // Fallback: se o job do daily_summary nao rodou para hoje/ontem mas os criativos existem,
        // ainda da para exibir gasto/cliques/leads e a tabela normalmente.
        setUsingCreativesFallback(true)

        const byDate = new Map<
          string,
          {
            spend: number
            impressions: number
            linkClicks: number
            frequencyWeightedSum: number
            video3sViews: number
            thruplays: number
            video25Pct: number
            video50Pct: number
            video75Pct: number
            video95Pct: number
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
              frequencyWeightedSum: 0,
              video3sViews: 0,
              thruplays: 0,
              video25Pct: 0,
              video50Pct: 0,
              video75Pct: 0,
              video95Pct: 0,
              leads: 0,
              purchases: 0,
              sheetLeadsUtm: 0,
              sheetMqls: 0,
            }
          cur.spend += c.spend || 0
          cur.impressions += c.impressions || 0
          cur.linkClicks += c.link_clicks || 0
          cur.frequencyWeightedSum += (c.impressions || 0) * (c.frequency || 0)
          cur.video3sViews += c.video_3s_views || 0
          cur.thruplays += c.thruplays || 0
          cur.video25Pct += c.video_25_pct || 0
          cur.video50Pct += c.video_50_pct || 0
          cur.video75Pct += c.video_75_pct || 0
          cur.video95Pct += c.video_95_pct || 0
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
            const frequency = d.impressions > 0 ? d.frequencyWeightedSum / d.impressions : 0
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
              frequency,
              total_video_3s_views: d.video3sViews,
              total_thruplays: d.thruplays,
              total_video_25_pct: d.video25Pct,
              total_video_50_pct: d.video50Pct,
              total_video_75_pct: d.video75Pct,
              total_video_95_pct: d.video95Pct,
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
            frequencyWeightedSum: acc.frequencyWeightedSum + ((day.total_impressions || 0) * (day.frequency || 0)),
            video3sViews: acc.video3sViews + (day.total_video_3s_views || 0),
            thruplays: acc.thruplays + (day.total_thruplays || 0),
            video25Pct: acc.video25Pct + (day.total_video_25_pct || 0),
            video50Pct: acc.video50Pct + (day.total_video_50_pct || 0),
            video75Pct: acc.video75Pct + (day.total_video_75_pct || 0),
            video95Pct: acc.video95Pct + (day.total_video_95_pct || 0),
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
            frequencyWeightedSum: 0,
            video3sViews: 0,
            thruplays: 0,
            video25Pct: 0,
            video50Pct: 0,
            video75Pct: 0,
            video95Pct: 0,
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
        const frequency = totals.impressions > 0 ? totals.frequencyWeightedSum / totals.impressions : 0
        const ctr = totals.impressions > 0 ? (totals.linkClicks / totals.impressions) * 100 : 0
        const realLeads = totals.leads
        const cpl = realLeads > 0 ? totals.spend / realLeads : 0
        const cpc = totals.linkClicks > 0 ? totals.spend / totals.linkClicks : 0
        const mqlLeads = totals.leads
        const mqlRate = mqlLeads > 0 ? (totals.sheetMqls / mqlLeads) * 100 : 0

        setMetrics({
          ...totals,
          cpm,
          frequency,
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
        setCampaigns([])
        setAdSets([])
        // Sem daily_summary e sem criativos no range: de fato nao ha o que renderizar.
        setMetrics(null)
        setDailyData([])

        // Ajuda a diagnosticar quando o range esta “vazio” porque o sync ainda nao gravou os dias recentes.
        const latest = usesCampaignPattern && !isVideoViewProduct ? null : await getLatestDailySummaryDate(selectedProduct)
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
                Dados de hoje/ontem ainda não foram gravados no <span className="text-yellow-100 font-semibold">daily_summary</span>. Exibindo{' '}
                {isVideoViewProduct ? 'gasto/thruplays/retenção' : 'gasto/cliques/leads'} a partir de <span className="text-yellow-100 font-semibold">ad_creatives</span> (parcial).
              </div>
            )}

            {/* Left Column - Funnel + Metrics */}
            <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">

              {/* Top Row - Funnel + Key Metrics */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Funnel */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-white/60 mb-4">
                    {isVideoViewProduct ? 'Consumo de Vídeo' : 'Funil de Conversão'}
                  </h3>
                  <Funnel
                    impressions={metrics.impressions}
                    clicks={isVideoViewProduct ? metrics.video3sViews : metrics.linkClicks}
                    pageViews={isVideoViewProduct ? metrics.thruplays : metrics.pageViews}
                    conversions={
                      isVideoViewProduct
                        ? metrics.video75Pct
                        : isSalesProduct
                        ? metrics.sheetSales
                        : (isMqlPrimaryProduct
                          ? metrics.sheetMqls
                          : (metrics.sheetLeads > 0 ? metrics.sheetLeads : metrics.leads))
                    }
                    conversionLabel={
                      isVideoViewProduct ? '75% do vídeo' : isSalesProduct ? 'Vendas' : (isMqlPrimaryProduct ? 'MQLs' : 'Leads')
                    }
                    clicksLabel={isVideoViewProduct ? '3s Views' : undefined}
                    pageViewsLabel={isVideoViewProduct ? 'ThruPlays' : undefined}
                    secondaryConversions={
                      isVideoViewProduct
                        ? metrics.video50Pct
                        : !isSalesProduct && isMqlPrimaryProduct
                        ? (metrics.sheetLeads > 0 ? metrics.sheetLeads : metrics.leads)
                        : undefined
                    }
                    secondaryConversionLabel={
                      isVideoViewProduct ? '50% do vídeo' : !isSalesProduct && isMqlPrimaryProduct ? 'Leads' : undefined
                    }
                    extraSteps={
                      isVideoViewProduct
                        ? [{ label: '95% do vídeo', value: metrics.video95Pct }]
                        : undefined
                    }
                    hidePageViews={isNativeForm}
                  />
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {isVideoViewProduct ? (
                    <>
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
                        label="ThruPlays"
                        value={formatNumber(metrics.thruplays)}
                        icon={<Target className="w-5 h-5" />}
                        color="green"
                      />
                      <MetricCard
                        label="ThruPlay Rate"
                        value={formatPercent(calculateThruplayRate(metrics.thruplays, metrics.impressions))}
                        icon={<Percent className="w-5 h-5" />}
                        color="blue"
                      />
                      <MetricCard
                        label="Custo/TP"
                        value={metrics.thruplays > 0 ? formatCurrency(calculateCostPer(metrics.spend, metrics.thruplays)) : '—'}
                        icon={<Users className="w-5 h-5" />}
                        color="yellow"
                      />
                      <MetricCard
                        label="75% do vídeo"
                        value={formatNumber(metrics.video75Pct)}
                        helperText={`${formatPercent(metrics.impressions > 0 ? (metrics.video75Pct / metrics.impressions) * 100 : 0)} das impressões`}
                        icon={<TrendingUp className="w-5 h-5" />}
                        color="purple"
                      />
                      <MetricCard
                        label="Frequência"
                        value={metrics.frequency > 0 ? metrics.frequency.toFixed(2).replace('.', ',') + 'x' : '—'}
                        helperText="média de exibições por pessoa"
                        icon={<RefreshCw className="w-5 h-5" />}
                        color="gray"
                        className="col-span-2"
                      />
                    </>
                  ) : (
                    <>
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
                  isVideoView={isVideoViewProduct}
                  isMqlPrimary={isMqlPrimaryProduct}
                />
              </div>

              {/* Creatives Table */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-medium text-white/60 mb-4">
                  Campanhas
                  <span className="text-xs text-white/30 ml-2">({campaigns.length} campanhas)</span>
                </h3>
                <CampaignsTable
                  data={campaigns}
                  isSales={isSalesProduct}
                  isVideoView={isVideoViewProduct}
                  isMqlPrimary={isMqlPrimaryProduct}
                  nameLabel="Campanha"
                  showVideoSubtitle={false}
                />
              </div>

              {isVideoViewProduct && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-white/60 mb-4">
                    Conjuntos
                    <span className="text-xs text-white/30 ml-2">({adSets.length} conjuntos)</span>
                  </h3>
                  <CampaignsTable
                    data={adSets}
                    isSales={isSalesProduct}
                    isVideoView
                    isMqlPrimary={isMqlPrimaryProduct}
                    nameLabel="Conjunto"
                    showVideoSubtitle
                  />
                </div>
              )}

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-medium text-white/60 mb-4">
                  Top Criativos
                  <span className="text-xs text-white/30 ml-2">({creatives.length} criativos)</span>
                </h3>
                <CreativesTable
                  data={creatives}
                  isSales={isSalesProduct}
                  isVideoView={isVideoViewProduct}
                  isMqlPrimary={isMqlPrimaryProduct}
                  showMqlInSales={selectedProduct === 'fib-live'}
                  showDeliveryMetrics={selectedProduct === 'workshop-lancamento-simultaneo'}
                  totalSheetSales={metrics.sheetSales}
                  totalSheetLeads={metrics.sheetLeads}
                  totalSheetMqls={metrics.sheetMqls}
                />
              </div>

              {selectedProduct === 'fib-live' && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-white/60 mb-4">
                    MQLs Sem Atribuicao (Auditoria)
                    <span className="text-xs text-white/30 ml-2">({unattributedMqlLeads.length} leads)</span>
                  </h3>
                  <UnattributedLeadsPanel leads={unattributedMqlLeads} />
                </div>
              )}
            </div>

            {/* Right Column - Sheet Data */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-3">
              <SheetPanel
                isSales={isSalesProduct}
                isVideoView={isVideoViewProduct}
                isMqlPrimary={isMqlPrimaryProduct}
                sales={metrics.sheetSales}
                revenue={metrics.sheetRevenue}
                leads={metrics.sheetLeads > 0 ? metrics.sheetLeads : metrics.leads}
                mqls={metrics.sheetMqls}
                mqlRate={metrics.mqlRate}
                cpa={metrics.cpa}
                roas={metrics.roas}
                spend={metrics.spend}
                impressions={metrics.impressions}
                video3sViews={metrics.video3sViews}
                thruplays={metrics.thruplays}
                video25Pct={metrics.video25Pct}
                video50Pct={metrics.video50Pct}
                video75Pct={metrics.video75Pct}
                video95Pct={metrics.video95Pct}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
