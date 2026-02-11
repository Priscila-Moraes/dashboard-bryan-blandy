# Pacote de Continuidade: Dashboard & n8n Bryan Blandy

## 1. Objetivo
Otimizar funis de marketing (WebinarFlix, Formulário de Aplicação e FIB Live) corrigindo atribuição de vendas/leads, implementando métricas de MQL e garantindo estabilidade no Dashboard e Workflows n8n.

## 2. Status Atual
- **Dashboard:**
  - Header fixo corrigido (sticky).
  - Cards de MQL (Custo/MQL, Taxa MQL) implementados no Topo e Painel Lateral.
  - Tabela de Criativos com toggle "Leads | MQL" implementado.
- **Workflow FIB Live (MQL):**
  - Lógica de atribuição por telefone implementada (`Sync Completo - FIB Live v11 (MQL).json`).
  - *Obs:* Requer conexão manual dos nós após importação.
- **Workflow WebinarFlix v2:**
  - Padronizado com Service Role, `toISODate` robusto e Backfill 60 dias (`Sync Completo - WebinarFlix v2 (SECURE).json`).
- **Workflow Formulário de Aplicação v2:**
  - Lógica de atribuição por "Nome" (Data+Campanha+Conjunto+Anúncio) implementada para contornar falta de UTM (`Sync Formulário de Aplicação v2 (SECURE).json`).
  - Métricas MQL (`sheet_mqls`) salvas em `ad_creatives`.
  - Corrigido erro 400 (coluna `adset_name` removida) e erro "invalid input syntax for type date" (tratamento de retorno vazio da API).

## 3. Decisões Tomadas
- **Service Role:** Usada para bypass de RLS no Supabase em todos os novos workflows v2 (configurada via header manual).
- **Atribuição por Nome:** Adotada no formulário nativo pois o CSV do Meta não possui UTMs nem ID do anúncio consistente.
- **MQL por Telefone:** Usado no FIB Live para cruzar Leads com Vendas/MQL na planilha.
- **Backfill 60 dias:** Configurado hardcoded no JSON para corrigir dados de Jan/Fev automaticamente na primeira execução.
- **Nativo vs JS:** Preferência por nós HTTP Request nativos com `Upsert` para facilitar manutenção e evitar erros de `pg` library.

## 4. Estrutura do Funil
- **WebinarFlix:** Venda direta (Hotmart/Eduzz). Atribuição via UTM.
- **Formulário de Aplicação:** Lead Nativo (Meta). Sem UTM. Atribuição via Nome da Campanha/Ad. Conversão para MQL (Campo "MQL" = "SIM" na planilha).
- **FIB Live:** Lançamento/Evento. Atribuição híbrida.

## 5. Principais Insights
- **Dados Sujos:** Planilhas possuem formatações de data variadas (DD/MM/YYYY vs YYYY-MM-DD) e nomes de colunas inconsistentes (Data vs DATA).
- **Meta API:** A API de Insights retorna `date_start`, mas transformações internas no n8n podem mudar para `date`.
- **Schema Supabase:** Tabela `ad_creatives` não possui coluna `adset_name`. Datas vazias geram erro 400 (corrigido nos workflows v2).

## 6. Gargalos
- **Importação Manual:** Usuário precisa copiar/colar a chave Service Role nos nós `Config` de cada workflow.
- **Conexão Manual:** Workflow MQL do FIB Live perde conexões ao importar JSONs complexos; exige ligar pontas manualmente.
- **Dependência de Planilha:** Se a planilha mudar o nome da coluna "MQL" para "Qualificado", a lógica de contagem quebra (mitigado com normalização, mas requer atenção).

## 7. Recomendações Priorizadas
- **[P0]** Importar os 3 novos workflows (MQL, WebinarFlix v2, Formulário v2).
- **[P0]** Configurar credencial Service Role no nó `Config` dos workflows v2 e `Supabase Bryan` nos nós HTTP.
- **[P1]** Executar manualmente uma vez para rodar o Backfill de 60 dias.
- **[P2]** Monitorar o Dashboard para ver se a coluna "MQL" e "Custo/MQL" estão populando.

## 8. Pendências
- Validar se os dados de MQL estão aparecendo corretamente no Dashboard após a carga.
- Verificar se o script de MQL do FIB Live está atribuindo corretamente (match de telefone).
- Limpeza de workflows antigos (v1) no n8n para evitar duplicidade de execução.

## 9. Entradas Necessárias (se pedir ajuda)
- **Erro de execução:** Print do erro no n8n (o JSON de erro).
- **Dados incorretos:** CSV exportado da planilha de Leads e print da tabela `ad_creatives` no Supabase para o mesmo dia/ad_id.

## 10. Próximos Passos (7 dias)
- [ ] Importar `Sync Completo - FIB Live v11 (MQL).json`.
- [ ] Importar `Sync Completo - WebinarFlix v2 (SECURE).json`.
- [x] Importar `Sync Formulário de Aplicação v2 (SECURE).json` (versão pós-fix erro 400).
- [ ] Colocar Chave Service Role nos nós `Config`.
- [ ] Executar Backfill (Manual -> Executar).
- [ ] Acessar Dashboard e validar números de MQL por criativo.

---
**PROMPT PARA CONTINUAR:**
```
Estou continuando o projeto de Otimização dos Funis Bryan Blandy.
Status: Workflows v2 (WebinarFlix e Formulário) e MQL (FIB Live) criados e prontos para importação.
Onde parei: Importei os JSONs no n8n e preciso validar se os dados de MQL e atribuição por nome (Formulário) estão aparecendo corretos no Dashboard.
Arquivos críticos: App.tsx, Sync Formulário de Aplicação v2 (SECURE).json, Sync Completo - WebinarFlix v2 (SECURE).json.
Próxima ação: Ajudar a diagnosticar qualquer discrepância de dados no Dashboard ou erro de execução no n8n.
```
