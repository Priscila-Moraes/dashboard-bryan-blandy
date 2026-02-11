import { createClient } from '@supabase/supabase-js'

const FALLBACK_SUPABASE_URL = 'https://lwskyzalynytxtwebbue.supabase.co'
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_5rTyenDQRSubpnnIle2C6g_Y2XGNbuA'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(supabaseUrl, supabasePublishableKey)

// Tipos
export interface DailySummary {
  id: number
  date: string
  account_id: string
  product_name: string
  total_spend: number
  total_impressions: number
  total_link_clicks: number
  total_page_views: number
  total_leads: number
  total_purchases: number
  total_revenue: number
  sheet_sales: number
  sheet_revenue: number
  sheet_leads: number
  sheet_mqls: number
  cpm: number
  ctr: number
  cpl: number
  cpa: number
  roas: number
  load_rate: number
  conversion_rate: number
  mql_rate: number
}

export interface AdCreative {
  id: number
  date: string
  account_id: string
  campaign_name: string
  product_name: string
  ad_name: string
  ad_id: string
  spend: number
  impressions: number
  link_clicks: number
  leads: number
  purchases: number
  sheet_purchases: number
  sheet_leads_utm: number
  sheet_mqls?: number
  cpl: number
  cpa: number
  ctr: number
  instagram_permalink: string
}

export interface AggregatedCreative {
  ad_name: string
  ad_id: string
  campaign_name: string
  spend: number
  impressions: number
  link_clicks: number
  leads: number
  purchases: number
  sheetPurchases: number
  sheetLeadsUtm: number
  sheetMqls: number
  cpl: number
  cpa: number
  ctr: number
  instagram_permalink: string
}

// Funções de busca
export async function getDailySummary(
  productName: string,
  startDate: string,
  endDate: string
): Promise<DailySummary[]> {
  const { data, error } = await supabase
    .from('daily_summary')
    .select('*')
    .eq('product_name', productName)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching daily summary:', error)
    return []
  }

  return data || []
}

export async function getLatestDailySummaryDate(productName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('daily_summary')
    .select('date')
    .eq('product_name', productName)
    .order('date', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching latest daily summary date:', error)
    return null
  }

  return data?.[0]?.date || null
}

export async function getAggregatedMetrics(
  productName: string,
  startDate: string,
  endDate: string
) {
  const data = await getDailySummary(productName, startDate, endDate)
  
  if (data.length === 0) {
    return null
  }

  const totals = data.reduce(
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
  const realLeads = totals.sheetLeads > 0 ? totals.sheetLeads : totals.leads
  const cpl = realLeads > 0 ? totals.spend / realLeads : 0
  const cpc = totals.linkClicks > 0 ? totals.spend / totals.linkClicks : 0
  const cpa = totals.sheetSales > 0 ? totals.spend / totals.sheetSales : 0
  const roas = totals.spend > 0 ? totals.sheetRevenue / totals.spend : 0
  const loadRate = totals.linkClicks > 0 ? (totals.pageViews / totals.linkClicks) * 100 : 0
  const conversionRate = totals.pageViews > 0 ? (realLeads / totals.pageViews) * 100 : 0
  const conversionRateClicks = totals.linkClicks > 0 ? (realLeads / totals.linkClicks) * 100 : 0
  const mqlLeads = totals.sheetLeads > 0 ? totals.sheetLeads : totals.leads
  const mqlRate = mqlLeads > 0 ? (totals.sheetMqls / mqlLeads) * 100 : 0

  return {
    ...totals,
    cpm,
    ctr,
    cpl,
    cpc,
    cpa,
    roas,
    loadRate,
    conversionRate,
    conversionRateClicks,
    mqlRate,
    days: data.length,
    dailyData: data,
  }
}

export async function getAdCreatives(
  productName: string,
  startDate: string,
  endDate: string
): Promise<AdCreative[]> {
  const { data, error } = await supabase
    .from('ad_creatives')
    .select('*')
    .eq('product_name', productName)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('spend', { ascending: false })

  if (error) {
    console.error('Error fetching ad creatives:', error)
    return []
  }

  return data || []
}

// Agregar criativos por ad_id (soma spend/impressions/clicks de múltiplos dias)
export function aggregateCreatives(creatives: AdCreative[]): AggregatedCreative[] {
  const map = new Map<string, AggregatedCreative>()

  for (const c of creatives) {
    const key = c.ad_id || c.ad_name
    const existing = map.get(key)

    if (existing) {
      existing.spend += c.spend || 0
      existing.impressions += c.impressions || 0
      existing.link_clicks += c.link_clicks || 0
      existing.leads += c.leads || 0
      existing.purchases += c.purchases || 0
      existing.sheetPurchases += c.sheet_purchases || 0
      existing.sheetLeadsUtm += c.sheet_leads_utm || 0
      existing.sheetMqls += c.sheet_mqls || 0
      if (c.instagram_permalink) {
        existing.instagram_permalink = c.instagram_permalink
      }
    } else {
      map.set(key, {
        ad_name: c.ad_name,
        ad_id: c.ad_id,
        campaign_name: c.campaign_name,
        spend: c.spend || 0,
        impressions: c.impressions || 0,
        link_clicks: c.link_clicks || 0,
        leads: c.leads || 0,
        purchases: c.purchases || 0,
        sheetPurchases: c.sheet_purchases || 0,
        sheetLeadsUtm: c.sheet_leads_utm || 0,
        sheetMqls: c.sheet_mqls || 0,
        cpl: 0,
        cpa: 0,
        ctr: 0,
        instagram_permalink: c.instagram_permalink || '',
      })
    }
  }

  // Recalcular métricas derivadas após agregação
  // Prioriza sheet_purchases (planilha) sobre purchases (Meta)
  const result = Array.from(map.values()).map(c => {
    const realPurchases = c.sheetPurchases > 0 ? c.sheetPurchases : c.purchases
    const realLeads = c.sheetLeadsUtm > 0 ? c.sheetLeadsUtm : c.leads
    return {
      ...c,
      cpl: realLeads > 0 ? c.spend / realLeads : 0,
      cpa: realPurchases > 0 ? c.spend / realPurchases : 0,
      ctr: c.impressions > 0 ? (c.link_clicks / c.impressions) * 100 : 0,
    }
  })

  result.sort((a, b) => b.spend - a.spend)
  return result
}
