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
  total_video_3s_views?: number
  total_thruplays?: number
  total_video_25_pct?: number
  total_video_50_pct?: number
  total_video_75_pct?: number
  total_video_95_pct?: number
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
  adset_name?: string
  spend: number
  impressions: number
  link_clicks: number
  page_views?: number
  video_3s_views?: number
  thruplays?: number
  video_25_pct?: number
  video_50_pct?: number
  video_75_pct?: number
  video_95_pct?: number
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
  grouped_ad_ids: string[]
  grouped_ids_count: number
  grouped_names: string[]
  grouped_names_count: number
  campaign_name: string
  adset_name: string
  spend: number
  impressions: number
  link_clicks: number
  page_views: number
  has_page_views: boolean
  video_3s_views: number
  thruplays: number
  video_25_pct: number
  video_50_pct: number
  video_75_pct: number
  video_95_pct: number
  leads: number
  purchases: number
  sheetPurchases: number
  sheetLeadsUtm: number
  sheetMqls: number
  load_rate: number | null
  cpl: number
  cpa: number
  ctr: number
  instagram_permalink: string
  ctr_weighted_sum?: number
}

export interface AggregatedCampaign {
  campaign_name: string
  adset_name: string
  spend: number
  impressions: number
  link_clicks: number
  page_views: number
  has_page_views: boolean
  video_3s_views: number
  thruplays: number
  video_25_pct: number
  video_50_pct: number
  video_75_pct: number
  video_95_pct: number
  leads: number
  purchases: number
  sheetPurchases: number
  sheetLeadsUtm: number
  sheetMqls: number
  cpc: number
  load_rate: number | null
  cpl: number
  cpa: number
  ctr: number
  ctr_weighted_sum?: number
}

export interface UnattributedMqlLead {
  date: string
  product_name?: string
  client_name?: string
  lead_name?: string | null
  name?: string | null
  nome?: string | null
  phone?: string | number | null
  telefone?: string | number | null
  form_name?: string | null
  form?: string | null
  reason?: string | null
  motivo?: string | null
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

export async function getAdCreativesByCampaignPatterns(
  startDate: string,
  endDate: string,
  patterns: string[]
): Promise<AdCreative[]> {
  const normalizedPatterns = Array.from(new Set(patterns.map((pattern) => pattern.trim()).filter(Boolean)))

  if (normalizedPatterns.length === 0) {
    return []
  }

  const orFilter = normalizedPatterns
    .map((pattern) => `campaign_name.ilike.*${pattern.replace(/,/g, '')}*`)
    .join(',')

  const { data, error } = await supabase
    .from('ad_creatives')
    .select('*')
    .or(orFilter)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('spend', { ascending: false })

  if (error) {
    console.error('Error fetching ad creatives by campaign patterns:', error)
    return []
  }

  return data || []
}

function normalizeCreativeGroupKey(adName: string | null | undefined): string {
  return String(adName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*[_-]\s*/g, '_')
    .replace(/_+/g, '_')
}

// Agregar criativos por ad_name normalizado (fallback ad_id) para evitar duplicidade visual.
export function aggregateCreatives(creatives: AdCreative[]): AggregatedCreative[] {
  const map = new Map<string, AggregatedCreative>()
  const isVideoViewProduct = creatives.some((item) => item.product_name === 'engajamento-video-view')

  for (const c of creatives) {
    const currentAdName = String(c.ad_name || '').trim()
    const currentAdId = (c.ad_id || '').trim()
    const currentAdSetName = String(c.adset_name || '').trim()
    const key = normalizeCreativeGroupKey(currentAdName) || currentAdId
    const existing = map.get(key)

    if (existing) {
      existing.spend += c.spend || 0
      existing.impressions += c.impressions || 0
      existing.link_clicks += c.link_clicks || 0
      if (typeof c.page_views === 'number') {
        existing.page_views += c.page_views || 0
        existing.has_page_views = true
      }
      existing.video_3s_views += c.video_3s_views || 0
      existing.thruplays += c.thruplays || 0
      existing.video_25_pct += c.video_25_pct || 0
      existing.video_50_pct += c.video_50_pct || 0
      existing.video_75_pct += c.video_75_pct || 0
      existing.video_95_pct += c.video_95_pct || 0
      existing.leads += c.leads || 0
      existing.purchases += c.purchases || 0
      existing.sheetPurchases += c.sheet_purchases || 0
      existing.sheetLeadsUtm += c.sheet_leads_utm || 0
      existing.sheetMqls += c.sheet_mqls || 0
      existing.ctr_weighted_sum = (existing.ctr_weighted_sum || 0) + (c.impressions || 0) * (c.ctr || 0)
      if (currentAdId && !existing.grouped_ad_ids.includes(currentAdId)) {
        existing.grouped_ad_ids.push(currentAdId)
        existing.grouped_ids_count = existing.grouped_ad_ids.length
      }
      if (currentAdName && !existing.grouped_names.includes(currentAdName)) {
        existing.grouped_names.push(currentAdName)
        existing.grouped_names_count = existing.grouped_names.length
      }
      if (!existing.ad_id && currentAdId) {
        existing.ad_id = currentAdId
      }
      if (!existing.ad_name && currentAdName) {
        existing.ad_name = currentAdName
      }
      if (currentAdSetName) {
        const currentSets = existing.adset_name
          ? existing.adset_name.split(' | ').map((name) => name.trim()).filter(Boolean)
          : []
        if (!currentSets.includes(currentAdSetName)) {
          existing.adset_name = [...currentSets, currentAdSetName].join(' | ')
        }
      }
      if (c.instagram_permalink) {
        existing.instagram_permalink = c.instagram_permalink
      }
    } else {
      const groupedAdIds = currentAdId ? [currentAdId] : []
      const groupedNames = currentAdName ? [currentAdName] : []
      map.set(key, {
        ad_name: currentAdName,
        ad_id: currentAdId,
        grouped_ad_ids: groupedAdIds,
        grouped_ids_count: groupedAdIds.length,
        grouped_names: groupedNames,
        grouped_names_count: groupedNames.length,
        campaign_name: c.campaign_name,
        adset_name: currentAdSetName,
        spend: c.spend || 0,
        impressions: c.impressions || 0,
        link_clicks: c.link_clicks || 0,
        page_views: typeof c.page_views === 'number' ? c.page_views || 0 : 0,
        has_page_views: typeof c.page_views === 'number',
        video_3s_views: c.video_3s_views || 0,
        thruplays: c.thruplays || 0,
        video_25_pct: c.video_25_pct || 0,
        video_50_pct: c.video_50_pct || 0,
        video_75_pct: c.video_75_pct || 0,
        video_95_pct: c.video_95_pct || 0,
        leads: c.leads || 0,
        purchases: c.purchases || 0,
        sheetPurchases: c.sheet_purchases || 0,
        sheetLeadsUtm: c.sheet_leads_utm || 0,
        sheetMqls: c.sheet_mqls || 0,
        load_rate: null,
        cpl: 0,
        cpa: 0,
        ctr: 0,
        ctr_weighted_sum: (c.impressions || 0) * (c.ctr || 0),
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
      load_rate: c.has_page_views && c.link_clicks > 0 ? (c.page_views / c.link_clicks) * 100 : null,
      cpl: realLeads > 0 ? c.spend / realLeads : 0,
      cpa: realPurchases > 0 ? c.spend / realPurchases : 0,
      ctr: isVideoViewProduct
        ? c.impressions > 0
          ? (c.ctr_weighted_sum || 0) / c.impressions
          : 0
        : c.impressions > 0
          ? (c.link_clicks / c.impressions) * 100
          : 0,
    }
  })

  result.sort((a, b) => b.spend - a.spend)
  return result
}

export function aggregateCampaigns(
  creatives: AdCreative[]
): AggregatedCampaign[] {
  const map = new Map<string, AggregatedCampaign>()
  const isVideoViewProduct = creatives.some((item) => item.product_name === 'engajamento-video-view')

  for (const c of creatives) {
    const key = (c.campaign_name || '').trim() || '(sem campanha)'
    const currentAdSetName = String(c.adset_name || '').trim()
    const existing = map.get(key)

    if (existing) {
      existing.spend += c.spend || 0
      existing.impressions += c.impressions || 0
      existing.link_clicks += c.link_clicks || 0
      if (typeof c.page_views === 'number') {
        existing.page_views += c.page_views || 0
        existing.has_page_views = true
      }
      existing.video_3s_views += c.video_3s_views || 0
      existing.thruplays += c.thruplays || 0
      existing.video_25_pct += c.video_25_pct || 0
      existing.video_50_pct += c.video_50_pct || 0
      existing.video_75_pct += c.video_75_pct || 0
      existing.video_95_pct += c.video_95_pct || 0
      existing.leads += c.leads || 0
      existing.purchases += c.purchases || 0
      existing.sheetPurchases += c.sheet_purchases || 0
      existing.sheetLeadsUtm += c.sheet_leads_utm || 0
      existing.sheetMqls += c.sheet_mqls || 0
      existing.ctr_weighted_sum = (existing.ctr_weighted_sum || 0) + (c.impressions || 0) * (c.ctr || 0)
      if (currentAdSetName) {
        const currentSets = existing.adset_name
          ? existing.adset_name.split(' | ').map((name) => name.trim()).filter(Boolean)
          : []
        if (!currentSets.includes(currentAdSetName)) {
          existing.adset_name = [...currentSets, currentAdSetName].join(' | ')
        }
      }
      continue
    }

    map.set(key, {
      campaign_name: key,
      adset_name: currentAdSetName,
      spend: c.spend || 0,
      impressions: c.impressions || 0,
      link_clicks: c.link_clicks || 0,
      page_views: typeof c.page_views === 'number' ? c.page_views || 0 : 0,
      has_page_views: typeof c.page_views === 'number',
      video_3s_views: c.video_3s_views || 0,
      thruplays: c.thruplays || 0,
      video_25_pct: c.video_25_pct || 0,
      video_50_pct: c.video_50_pct || 0,
      video_75_pct: c.video_75_pct || 0,
      video_95_pct: c.video_95_pct || 0,
      leads: c.leads || 0,
      purchases: c.purchases || 0,
      sheetPurchases: c.sheet_purchases || 0,
      sheetLeadsUtm: c.sheet_leads_utm || 0,
      sheetMqls: c.sheet_mqls || 0,
      cpc: 0,
      load_rate: null,
      cpl: 0,
      cpa: 0,
      ctr: 0,
      ctr_weighted_sum: (c.impressions || 0) * (c.ctr || 0),
    })
  }

  const result = Array.from(map.values()).map((c) => {
    const realPurchases = c.sheetPurchases > 0 ? c.sheetPurchases : c.purchases
    const realLeads = c.sheetLeadsUtm > 0 ? c.sheetLeadsUtm : c.leads

    return {
      ...c,
      cpc: c.link_clicks > 0 ? c.spend / c.link_clicks : 0,
      load_rate: c.has_page_views && c.link_clicks > 0 ? (c.page_views / c.link_clicks) * 100 : null,
      cpl: realLeads > 0 ? c.spend / realLeads : 0,
      cpa: realPurchases > 0 ? c.spend / realPurchases : 0,
      ctr: isVideoViewProduct
        ? c.impressions > 0
          ? (c.ctr_weighted_sum || 0) / c.impressions
          : 0
        : c.impressions > 0
          ? (c.link_clicks / c.impressions) * 100
          : 0,
    }
  })

  result.sort((a, b) => b.spend - a.spend)
  return result
}

export function aggregateAdSets(
  creatives: AdCreative[]
): AggregatedCampaign[] {
  const map = new Map<string, AggregatedCampaign>()
  const isVideoViewProduct = creatives.some((item) => item.product_name === 'engajamento-video-view')

  for (const c of creatives) {
    const adSetKey = (c.adset_name || '').trim() || '(sem conjunto)'
    const parentCampaignName = (c.campaign_name || '').trim() || '(sem campanha)'
    const existing = map.get(adSetKey)

    if (existing) {
      existing.spend += c.spend || 0
      existing.impressions += c.impressions || 0
      existing.link_clicks += c.link_clicks || 0
      if (typeof c.page_views === 'number') {
        existing.page_views += c.page_views || 0
        existing.has_page_views = true
      }
      existing.video_3s_views += c.video_3s_views || 0
      existing.thruplays += c.thruplays || 0
      existing.video_25_pct += c.video_25_pct || 0
      existing.video_50_pct += c.video_50_pct || 0
      existing.video_75_pct += c.video_75_pct || 0
      existing.video_95_pct += c.video_95_pct || 0
      existing.leads += c.leads || 0
      existing.purchases += c.purchases || 0
      existing.sheetPurchases += c.sheet_purchases || 0
      existing.sheetLeadsUtm += c.sheet_leads_utm || 0
      existing.sheetMqls += c.sheet_mqls || 0
      existing.ctr_weighted_sum = (existing.ctr_weighted_sum || 0) + (c.impressions || 0) * (c.ctr || 0)
      continue
    }

    map.set(adSetKey, {
      campaign_name: adSetKey,
      adset_name: parentCampaignName,
      spend: c.spend || 0,
      impressions: c.impressions || 0,
      link_clicks: c.link_clicks || 0,
      page_views: typeof c.page_views === 'number' ? c.page_views || 0 : 0,
      has_page_views: typeof c.page_views === 'number',
      video_3s_views: c.video_3s_views || 0,
      thruplays: c.thruplays || 0,
      video_25_pct: c.video_25_pct || 0,
      video_50_pct: c.video_50_pct || 0,
      video_75_pct: c.video_75_pct || 0,
      video_95_pct: c.video_95_pct || 0,
      leads: c.leads || 0,
      purchases: c.purchases || 0,
      sheetPurchases: c.sheet_purchases || 0,
      sheetLeadsUtm: c.sheet_leads_utm || 0,
      sheetMqls: c.sheet_mqls || 0,
      cpc: 0,
      load_rate: null,
      cpl: 0,
      cpa: 0,
      ctr: 0,
      ctr_weighted_sum: (c.impressions || 0) * (c.ctr || 0),
    })
  }

  const result = Array.from(map.values()).map((c) => {
    const realPurchases = c.sheetPurchases > 0 ? c.sheetPurchases : c.purchases
    const realLeads = c.sheetLeadsUtm > 0 ? c.sheetLeadsUtm : c.leads

    return {
      ...c,
      cpc: c.link_clicks > 0 ? c.spend / c.link_clicks : 0,
      load_rate: c.has_page_views && c.link_clicks > 0 ? (c.page_views / c.link_clicks) * 100 : null,
      cpl: realLeads > 0 ? c.spend / realLeads : 0,
      cpa: realPurchases > 0 ? c.spend / realPurchases : 0,
      ctr: isVideoViewProduct
        ? c.impressions > 0
          ? (c.ctr_weighted_sum || 0) / c.impressions
          : 0
        : c.impressions > 0
          ? (c.link_clicks / c.impressions) * 100
          : 0,
    }
  })

  result.sort((a, b) => b.spend - a.spend)
  return result
}

export async function getUnattributedMqlLeads(
  productName: string,
  startDate: string,
  endDate: string,
  limit = 100
): Promise<UnattributedMqlLead[]> {
  const { data, error } = await supabase
    .from('unattributed_mql_leads')
    .select('*')
    .eq('product_name', productName)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) {
    // Tabela ainda nao criada ou sem permissao: nao quebra o dashboard.
    if ((error as { code?: string }).code === '42P01' || (error as { code?: string }).code === '42501') {
      return []
    }

    console.error('Error fetching unattributed mql leads:', error)
    return []
  }

  return (data || []) as UnattributedMqlLead[]
}
