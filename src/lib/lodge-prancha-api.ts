import { supabase } from '@/lib/supabase/client'
import { toErrorMessage } from '@/lib/async-utils'
import type { LodgePrancha, LodgePranchaStatus } from '@/lib/lodge-prancha'

type PranchaRow = {
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

function mapRow(row: PranchaRow): LodgePrancha {
  return {
    id: row.id,
    author_id: row.author_id,
    author_name: row.author_name,
    subject: row.subject,
    body: row.body,
    session_date: row.session_date,
    status: row.status,
    submitted_at: row.submitted_at,
    read_at: row.read_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function createLodgePranchaDraft(input: {
  authorId: string
  authorName: string
  subject: string
  body: string
  sessionDate: string | null
}): Promise<LodgePrancha> {
  const { data, error } = await supabase
    .from('lodge_pranchas')
    .insert({
      author_id: input.authorId,
      author_name: input.authorName.trim(),
      subject: input.subject.trim(),
      body: input.body.trim(),
      session_date: input.sessionDate || null,
      status: 'draft',
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(toErrorMessage(error, 'Não foi possível salvar a prancha.'))
  }
  return mapRow(data as PranchaRow)
}

export async function updateLodgePranchaDraft(
  id: string,
  input: {
    authorName: string
    subject: string
    body: string
    sessionDate: string | null
  },
): Promise<LodgePrancha> {
  const { data, error } = await supabase
    .from('lodge_pranchas')
    .update({
      author_name: input.authorName.trim(),
      subject: input.subject.trim(),
      body: input.body.trim(),
      session_date: input.sessionDate || null,
    })
    .eq('id', id)
    .eq('status', 'draft')
    .select('*')
    .single()

  if (error) {
    throw new Error(toErrorMessage(error, 'Não foi possível atualizar o rascunho.'))
  }
  return mapRow(data as PranchaRow)
}

export async function submitLodgePrancha(id: string): Promise<LodgePrancha> {
  const { data, error } = await supabase.rpc('submit_lodge_prancha', {
    p_prancha_id: id,
  })

  if (error) {
    throw new Error(toErrorMessage(error, 'Não foi possível enviar a prancha ao Venerável.'))
  }

  // RPC pode retornar objeto único
  const row = (Array.isArray(data) ? data[0] : data) as PranchaRow
  return mapRow(row)
}

export async function listMyLodgePranchas(): Promise<LodgePrancha[]> {
  const { data, error } = await supabase
    .from('lodge_pranchas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(toErrorMessage(error, 'Não foi possível carregar as pranchas.'))
  }
  return ((data || []) as PranchaRow[]).map(mapRow)
}

export async function markLodgePranchaRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('lodge_pranchas')
    .update({
      status: 'read',
      read_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(toErrorMessage(error, 'Não foi possível marcar a prancha como lida.'))
  }
}

export async function archiveLodgePrancha(id: string): Promise<void> {
  const { error } = await supabase
    .from('lodge_pranchas')
    .update({ status: 'archived' })
    .eq('id', id)

  if (error) {
    throw new Error(toErrorMessage(error, 'Não foi possível arquivar a prancha.'))
  }
}

export async function getLodgePrancha(id: string): Promise<LodgePrancha | null> {
  const { data, error } = await supabase
    .from('lodge_pranchas')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(toErrorMessage(error, 'Não foi possível abrir a prancha.'))
  }
  return data ? mapRow(data as PranchaRow) : null
}
