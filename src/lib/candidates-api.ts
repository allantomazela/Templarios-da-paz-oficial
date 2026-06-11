import { supabase } from '@/lib/supabase/client'
import { withTimeout, toError } from '@/lib/async-utils'
import { SECRETARIAT_OP_TIMEOUT_MS } from '@/lib/secretariat/constants'
import type {
  InitiationCandidate,
  InitiationCandidateStatus,
  SindicanciaPhaseDefinition,
  CandidatePhaseProgress,
  CandidatePhaseStatus,
} from '@/lib/data'

const TIMEOUT_MSG =
  'Operação demorou demais. Verifique sua conexão e tente novamente.'

export type CandidateSaveInput = {
  name: string
  email?: string
  phone?: string
  indicatedBy: string
  indicationDate: string
  status: InitiationCandidateStatus
  notes?: string
}

type CandidateRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  indicated_by: string
  indication_date: string
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

type PhaseDefinitionRow = {
  id: string
  name: string
  order: number
  description: string | null
  created_at?: string
}

export function mapRowToCandidate(row: CandidateRow): InitiationCandidate {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    indicatedBy: row.indicated_by,
    indicationDate: row.indication_date,
    status: row.status as InitiationCandidateStatus,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapRowToPhaseDefinition(row: PhaseDefinitionRow): SindicanciaPhaseDefinition {
  return {
    id: row.id,
    name: row.name,
    order: row.order,
    description: row.description,
    createdAt: row.created_at,
  }
}

function mapRowToPhaseProgress(row: Record<string, unknown>): CandidatePhaseProgress {
  return {
    id: row.id as string,
    candidateId: row.candidate_id as string,
    phaseDefinitionId: row.phase_definition_id as string,
    status: row.status as CandidatePhaseProgress['status'],
    startedAt: (row.started_at as string) ?? null,
    completedAt: (row.completed_at as string) ?? null,
    scheduledCheckDate: (row.scheduled_check_date as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function isMissingTableError(error: { code?: string }): boolean {
  return error.code === '42P01' || error.code === 'PGRST116'
}

export async function fetchCandidates(): Promise<InitiationCandidate[]> {
  const supabaseAny = supabase as any
  const { data: rows, error } = await withTimeout(
    supabaseAny
      .from('initiation_candidates')
      .select('*')
      .order('indication_date', { ascending: false }),
    SECRETARIAT_OP_TIMEOUT_MS,
    TIMEOUT_MSG,
  )

  if (error) {
    if (isMissingTableError(error)) return []
    throw toError(error, 'Não foi possível carregar os candidatos.')
  }

  return (rows || []).map(mapRowToCandidate)
}

export async function fetchPhaseDefinitions(): Promise<SindicanciaPhaseDefinition[]> {
  const supabaseAny = supabase as any
  const { data: rows, error } = await withTimeout(
    supabaseAny
      .from('sindicancia_phase_definitions')
      .select('*')
      .order('order', { ascending: true }),
    SECRETARIAT_OP_TIMEOUT_MS,
    TIMEOUT_MSG,
  )

  if (error) {
    if (isMissingTableError(error)) return []
    throw toError(error, 'Não foi possível carregar as fases.')
  }

  return (rows || []).map(mapRowToPhaseDefinition)
}

export async function fetchPhaseProgress(
  candidateId: string,
): Promise<CandidatePhaseProgress[]> {
  const supabaseAny = supabase as any
  const { data: rows, error } = await withTimeout(
    supabaseAny
      .from('candidate_phase_progress')
      .select('*')
      .eq('candidate_id', candidateId),
    SECRETARIAT_OP_TIMEOUT_MS,
    TIMEOUT_MSG,
  )

  if (error) {
    throw toError(error, 'Não foi possível carregar o andamento das fases.')
  }

  return (rows || []).map(mapRowToPhaseProgress)
}

export async function ensurePhaseProgressForCandidate(
  candidateId: string,
  phaseDefinitions: SindicanciaPhaseDefinition[],
): Promise<void> {
  if (phaseDefinitions.length === 0) return

  const supabaseAny = supabase as any
  const { data: existing, error: fetchError } = await withTimeout(
    supabaseAny
      .from('candidate_phase_progress')
      .select('phase_definition_id')
      .eq('candidate_id', candidateId),
    SECRETARIAT_OP_TIMEOUT_MS,
    TIMEOUT_MSG,
  )

  if (fetchError) {
    throw toError(fetchError, 'Não foi possível verificar fases do candidato.')
  }

  const existingIds = new Set(
    (existing || []).map((r: { phase_definition_id: string }) => r.phase_definition_id),
  )
  const toInsert = phaseDefinitions
    .filter((p) => !existingIds.has(p.id))
    .map((phase) => ({
      candidate_id: candidateId,
      phase_definition_id: phase.id,
      status: 'pending' as const,
    }))

  if (toInsert.length === 0) return

  const { error } = await withTimeout(
    supabaseAny.from('candidate_phase_progress').insert(toInsert),
    SECRETARIAT_OP_TIMEOUT_MS,
    TIMEOUT_MSG,
  )

  if (error) {
    throw toError(error, 'Não foi possível criar fases para o candidato.')
  }
}

export async function createCandidate(
  data: CandidateSaveInput,
  phaseDefinitions: SindicanciaPhaseDefinition[],
): Promise<InitiationCandidate> {
  const supabaseAny = supabase as any
  const { data: created, error } = await withTimeout(
    supabaseAny
      .from('initiation_candidates')
      .insert({
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        indicated_by: data.indicatedBy,
        indication_date: data.indicationDate,
        status: data.status,
        notes: data.notes ?? null,
      })
      .select('*')
      .single(),
    SECRETARIAT_OP_TIMEOUT_MS,
    'Salvamento demorou demais. Verifique sua conexão e tente novamente.',
  )

  if (error) {
    throw toError(error, 'Falha ao cadastrar o candidato.')
  }

  const newCandidate = mapRowToCandidate(created)

  if (phaseDefinitions.length > 0) {
    const { error: phasesError } = await withTimeout(
      supabaseAny.from('candidate_phase_progress').insert(
        phaseDefinitions.map((phase) => ({
          candidate_id: newCandidate.id,
          phase_definition_id: phase.id,
          status: 'pending',
        })),
      ),
      SECRETARIAT_OP_TIMEOUT_MS,
      TIMEOUT_MSG,
    )

    if (phasesError) {
      throw toError(phasesError, 'Candidato salvo, mas falha ao criar fases da sindicância.')
    }
  }

  return newCandidate
}

export async function updateCandidate(
  id: string,
  data: CandidateSaveInput,
): Promise<InitiationCandidate> {
  const supabaseAny = supabase as any
  const { data: updated, error } = await withTimeout(
    supabaseAny
      .from('initiation_candidates')
      .update({
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        indicated_by: data.indicatedBy,
        indication_date: data.indicationDate,
        status: data.status,
        notes: data.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single(),
    SECRETARIAT_OP_TIMEOUT_MS,
    'Salvamento demorou demais. Verifique sua conexão e tente novamente.',
  )

  if (error) {
    throw toError(error, 'Falha ao atualizar o candidato.')
  }

  return mapRowToCandidate(updated)
}

export async function updateCandidateStatus(
  candidateId: string,
  status: InitiationCandidateStatus,
): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await withTimeout(
    supabaseAny
      .from('initiation_candidates')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', candidateId),
    SECRETARIAT_OP_TIMEOUT_MS,
    TIMEOUT_MSG,
  )

  if (error) {
    throw toError(error, 'Falha ao atualizar o status.')
  }
}

export async function deleteCandidate(candidateId: string): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await withTimeout(
    supabaseAny.from('initiation_candidates').delete().eq('id', candidateId),
    SECRETARIAT_OP_TIMEOUT_MS,
    TIMEOUT_MSG,
  )

  if (error) {
    throw toError(error, 'Falha ao excluir o candidato.')
  }
}

export type PhaseProgressUpdate = {
  status?: CandidatePhaseStatus
  notes?: string
  scheduledCheckDate?: string | null
}

export async function updatePhaseProgress(
  progressId: string,
  updates: PhaseProgressUpdate,
): Promise<void> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    ...(updates.notes !== undefined && { notes: updates.notes || null }),
    ...(updates.scheduledCheckDate !== undefined && {
      scheduled_check_date: updates.scheduledCheckDate || null,
    }),
  }

  if (updates.status) {
    payload.status = updates.status
    if (updates.status === 'in_progress') {
      payload.started_at = new Date().toISOString()
    }
    if (updates.status === 'completed' || updates.status === 'rejected') {
      payload.completed_at = new Date().toISOString()
    }
    if (updates.status === 'pending') {
      payload.started_at = null
      payload.completed_at = null
    }
  }

  const supabaseAny = supabase as any
  const { error } = await withTimeout(
    supabaseAny.from('candidate_phase_progress').update(payload).eq('id', progressId),
    SECRETARIAT_OP_TIMEOUT_MS,
    TIMEOUT_MSG,
  )

  if (error) {
    throw toError(error, 'Falha ao atualizar a fase.')
  }
}
