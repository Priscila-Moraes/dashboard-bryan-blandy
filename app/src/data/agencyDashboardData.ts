export type CampaignObjective = 'sales' | 'leads' | 'video'

export interface CampaignCreativeLinkOverrides {
  [creativeName: string]: string
}

export interface AudienceMatcher {
  name: string
  patterns: string[]
}

export interface AgencyCampaignConfig {
  id: string
  title: string
  objective: CampaignObjective
  matchers: string[]
  sourceNote?: string
  highlights: string[]
  audiences?: AudienceMatcher[]
  creativeLinkOverrides?: CampaignCreativeLinkOverrides
}

export interface AgencyClient {
  id: string
  name: string
  brand: string
  summary: string
  campaigns: AgencyCampaignConfig[]
}

export const agencyClients: AgencyClient[] = [
  {
    id: 'engajamento-video-view',
    name: 'Engajamento Video View',
    brand: 'Video View',
    summary:
      'Aba dedicada para acompanhar exclusivamente a campanha de engajamento com KPI principal em ThruPlay e leitura de retencao por quartis.',
    campaigns: [
      {
        id: 'engajamento-video-view-campaign',
        title: 'Engajamento Video View',
        objective: 'video',
        matchers: ['vv_engajamento_mar26_abo'],
        sourceNote:
          'Campanha isolada pelo matcher vv_engajamento_mar26_abo para leitura dedicada de ThruPlay e retencao.',
        highlights: [
          'Usar ThruPlay como principal referencia de eficiencia.',
          'Avaliar 50% e 95% para separar alcance de retencao real.',
        ],
      },
    ],
  },
  {
    id: 'diego-leal',
    name: 'Diego Leal',
    brand: 'Amazon / Webinar',
    summary:
      'Cliente com uma frente de vendas e uma frente de captacao. O dashboard consome dados vivos do Supabase quando esses registros existirem na base.',
    campaigns: [
      {
        id: 'diego-amazon-sales',
        title: 'Do Zero aos Primeiros U$ 1.000 na Amazon',
        objective: 'sales',
        matchers: ['ZERO_AOS_1000_AMAZON', 'AMAZON_VENDA_PF_AUTO_CBO_ISCA'],
        sourceNote:
          'Vendas priorizam sheet_purchases quando o workflow estiver gravando planilha no Supabase.',
        creativeLinkOverrides: {
          ADS_04_DOR: 'https://www.instagram.com/p/DVbPFjbjF5g/#advertiser',
          ADS_09_VIDEO_DESEJO_RENDA_DOLAR: 'https://www.instagram.com/p/DU_vm8xDPm6/#advertiser',
          ADS07_VIDEO_DOR_MEDO_INVESTIMENTO: 'https://www.instagram.com/p/DVRv888DA_W/#advertiser',
        },
        highlights: [
          'Escalar os criativos vencedores com mais controle de verba.',
          'Comparar Meta x planilha sempre que houver divergencia de compra.',
        ],
      },
      {
        id: 'diego-webinar-leads',
        title: 'Captacao Webinar Renda Dolar',
        objective: 'leads',
        matchers: ['WEBINAR_RENDA_DOLAR_CAPTACAO', 'OBRIGADO WEBINAR'],
        sourceNote:
          'Leads usam sheet_leads_utm quando houver planilha atribuida; caso contrario, o dashboard usa leads da Meta.',
        highlights: [
          'Monitorar desgaste do criativo dominante.',
          'Subir novas variacoes para sustentar CPL e volume.',
        ],
      },
    ],
  },
  {
    id: 'the-house',
    name: 'The House',
    brand: 'Imobiliario',
    summary:
      'Cliente com uma frente de vendas e uma frente de captacao dividida em tres publicos: Corretor, Imobiliaria e Assessoria.',
    campaigns: [
      {
        id: 'the-house-sales',
        title: 'Venda SimulaHouse Imobiliaria',
        objective: 'sales',
        matchers: ['SIMULAHOUSE_IMOBILIARIA_VENDA'],
        sourceNote:
          'Se nao houver sheet_purchases no Supabase, a venda exibida cai para o numero de purchases da Meta.',
        highlights: [
          'Acompanhar especialmente a taxa de carregamento da pagina.',
          'Isolar o criativo que valida compra antes de ampliar escala.',
        ],
      },
      {
        id: 'the-house-webinar-leads',
        title: 'Captacao Webinar The House',
        objective: 'leads',
        matchers: ['THE_HOUSE_WEBINAR', 'THE-HOUSE', 'WEBINARIO-SEMANAL'],
        audiences: [
          { name: 'Corretor', patterns: ['CORRETOR'] },
          { name: 'Imobiliaria', patterns: ['IMOBILIARIA', 'IMOBILIÁRIA'] },
          { name: 'Assessoria', patterns: ['ASSESSORIA'] },
        ],
        sourceNote:
          'A leitura por publico depende do nome da campanha conter o marcador do segmento.',
        highlights: [
          'Corretor tende a ser o publico prioritario quando o custo seguir abaixo dos demais.',
          'Assessoria precisa de revisao antes de ganhar mais verba.',
        ],
      },
    ],
  },
]
