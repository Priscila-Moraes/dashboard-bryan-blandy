import { AlertTriangle, Phone, UserRound } from 'lucide-react'
import type { UnattributedMqlLead } from '../lib/supabase'

interface UnattributedLeadsPanelProps {
  leads: UnattributedMqlLead[]
}

function pickName(lead: UnattributedMqlLead): string {
  return String(lead.lead_name || lead.nome || lead.name || '').trim()
}

function pickPhone(lead: UnattributedMqlLead): string {
  const raw = lead.phone ?? lead.telefone ?? ''
  return String(raw).trim()
}

function pickForm(lead: UnattributedMqlLead): string {
  return String(lead.form_name || lead.form || '').trim()
}

function pickReason(lead: UnattributedMqlLead): string {
  return String(lead.reason || lead.motivo || '').trim()
}

export function UnattributedLeadsPanel({ leads }: UnattributedLeadsPanelProps) {
  if (!leads.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
        Nenhum MQL sem atribuicao encontrado no periodo.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-yellow-300/90 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
        <AlertTriangle className="w-4 h-4" />
        <span>Leads sem ad_id/match por telefone. Exibicao para auditoria do cliente.</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-white/50 uppercase border-b border-white/10">
              <th className="pb-2 pr-3">Data</th>
              <th className="pb-2 pr-3">Nome</th>
              <th className="pb-2 pr-3">Telefone</th>
              <th className="pb-2 pr-3">Form</th>
              <th className="pb-2 pr-0">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map((lead, idx) => (
              <tr key={`${lead.date}-${pickPhone(lead)}-${idx}`} className="hover:bg-white/5 transition-colors">
                <td className="py-2 pr-3 text-white/80">{lead.date || '-'}</td>
                <td className="py-2 pr-3 text-white/90">
                  <div className="flex items-center gap-2">
                    <UserRound className="w-3.5 h-3.5 text-white/40" />
                    <span>{pickName(lead) || '-'}</span>
                  </div>
                </td>
                <td className="py-2 pr-3 text-white/80">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-white/40" />
                    <span>{pickPhone(lead) || '-'}</span>
                  </div>
                </td>
                <td className="py-2 pr-3 text-white/60 max-w-[260px] truncate" title={pickForm(lead)}>
                  {pickForm(lead) || '-'}
                </td>
                <td className="py-2 pr-0 text-xs text-yellow-300/80">{pickReason(lead) || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
