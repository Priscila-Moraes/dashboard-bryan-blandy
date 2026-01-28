# Dashboard Bryan Blandy

Dashboard de métricas de campanhas Meta Ads para os produtos:
- **WebinarFlix** (Vendas)
- **Upgrade de Persona** (Leads + MQL)

## 🚀 Deploy na Vercel

### Opção 1: Via GitHub

1. Suba este projeto para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Clique em "Add New" > "Project"
4. Importe o repositório
5. Clique em "Deploy"

### Opção 2: Via CLI

```bash
npm install -g vercel
vercel
```

## 💻 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📊 Estrutura

```
src/
├── components/
│   ├── DatePicker.tsx    # Seletor de período
│   ├── Funnel.tsx        # Funil de conversão
│   ├── MetricCard.tsx    # Cards de métricas
│   ├── SheetPanel.tsx    # Painel lateral (planilha)
│   ├── DailyChart.tsx    # Gráfico de evolução
│   └── CreativesTable.tsx # Tabela de criativos
├── lib/
│   ├── supabase.ts       # Conexão com Supabase
│   └── utils.ts          # Funções utilitárias
├── App.tsx               # Página principal
├── main.tsx              # Entry point
└── index.css             # Estilos globais
```

## 🔗 Supabase

O dashboard está configurado para usar o Supabase:
- **URL:** https://lwskyzalynytxtwebbue.supabase.co
- **Tabelas:** daily_summary, ad_creatives, sheet_data

## 📝 Notas

- Atualmente usando dados mockados para demonstração
- Quando os workflows n8n começarem a salvar dados no Supabase, descomentar o código em `App.tsx` para usar dados reais
