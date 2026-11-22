export type LodgePranchaStatus =
  | 'draft'
  | 'submitted'
  | 'read'
  | 'archived'

export interface LodgePrancha {
  id: string
  author_id: string
  author_name: string
  subject: string
  body: string
  session_date: string | null
  status: LodgePranchaStatus
  submitted_at: string | null
  read_at: string | null
  created_at: string
  updated_at: string
}

export interface LodgePranchaFormValues {
  subject: string
  body: string
  session_date: string
  author_name: string
}

export const LODGE_PRANCHA_STATUS_LABEL: Record<LodgePranchaStatus, string> = {
  draft: 'Rascunho',
  submitted: 'Enviada',
  read: 'Lida',
  archived: 'Arquivada',
}

export function buildPranchaPrintTitle(subject: string): string {
  const trimmed = subject.trim()
  return trimmed ? `Prancha — ${trimmed}` : 'Prancha para o saco de propostas'
}
