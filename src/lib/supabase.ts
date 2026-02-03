import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lwskyzalynytxtwebbue.supabase.co'
const supabaseAnonKey = 'sb_publishable_5rTyenDQRSubpnnIle2C6g_Y2XGNbuA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
      sheetMqls: 0,
    }
  )

  const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0
  const ctr = totals.impressions > 0 ? (totals.linkClicks / totals.impressions) * 100 : 0
  const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0
  const cpa = totals.sheetSales > 0 ? totals.spend / totals.sheetSales : 0
  const roas = totals.spend > 0 ? totals.sheetRevenue / totals.spend : 0
  const loadRate = totals.linkClicks > 0 ? (totals.pageViews / totals.linkClicks) * 100 : 0
  const conversionRate = totals.pageViews > 0 ? (totals.leads / totals.pageViews) * 100 : 0
  const mqlRate = totals.leads > 0 ? (totals.sheetMqls / totals.leads) * 100 : 0

  return {
    ...totals,
    cpm,
    ctr,
    cpl,
    cpa,
    roas,
    loadRate,
    conversionRate,
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
        cpl: 0,
        cpa: 0,
        ctr: 0,
        instagram_permalink: c.instagram_permalink || '',
      })
    }
  }

  // Recalcular métricas derivadas após agregação
  const result = Array.from(map.values()).map(c => ({
    ...c,
    cpl: c.leads > 0 ? c.spend / c.leads : 0,
    cpa: c.purchases > 0 ? c.spend / c.purchases : 0,
    ctr: c.impressions > 0 ? (c.link_clicks / c.impressions) * 100 : 0,
  }))

  result.sort((a, b) => b.spend - a.spend)
  return result
}
