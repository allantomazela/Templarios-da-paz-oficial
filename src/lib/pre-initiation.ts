import { supabase } from '@/lib/supabase/client'
import {
  brotherStatusForSituation,
  regularStatusForSituation,
} from '@/lib/brother-membership-situation'

const PLACEHOLDER_PHONE = '0000000000'
const PLACEHOLDER_DOB = '1900-01-01'

export function isPreInitiationStatus(status: string | null | undefined): boolean {
  return status === 'pre_iniciacao'
}

/** Primeiro dia do mês da iniciação — a mensalidade começa nesse mês. */
export function duesStartFromInitiationDate(initiationDate: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(initiationDate.trim())
  if (!match) {
    throw new Error('Informe a data da iniciação.')
  }
  return `${match[1]}-${match[2]}-01`
}

/**
 * Libera a conta só para completar o perfil e constar como iniciando.
 * Não aprova o acesso ao restante do sistema.
 */
export async function preparePreInitiationAccount(input: {
  profileId: string
  fullName: string
  email: string
}): Promise<void> {
  const email = input.email.trim().toLowerCase()
  if (!email) {
    throw new Error('O cadastro precisa de e-mail para a pré-iniciação.')
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ status: 'pre_iniciacao' })
    .eq('id', input.profileId)

  if (profileError) {
    throw new Error(profileError.message || 'Não foi possível liberar a pré-iniciação.')
  }

  const byProfile = await supabase
    .from('brothers')
    .select('id')
    .eq('profile_id', input.profileId)
    .maybeSingle()

  if (byProfile.error) {
    throw new Error(byProfile.error.message || 'Não foi possível localizar o cadastro do irmão.')
  }

  const byEmail = byProfile.data
    ? null
    : await supabase.from('brothers').select('id').ilike('email', email).maybeSingle()

  if (byEmail?.error) {
    throw new Error(byEmail.error.message || 'Não foi possível localizar o cadastro do irmão.')
  }

  const existing = byProfile.data ?? byEmail?.data

  const situationFields = {
    membership_situation: 'pre_iniciacao',
    status: brotherStatusForSituation('pre_iniciacao'),
    regular_status: regularStatusForSituation('pre_iniciacao'),
    profile_id: input.profileId,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('brothers')
      .update(situationFields)
      .eq('id', existing.id)
    if (error) {
      throw new Error(error.message || 'Não foi possível marcar o cadastro como pré-iniciação.')
    }
    return
  }

  const { error: insertError } = await supabase.from('brothers').insert({
    ...situationFields,
    name: input.fullName.trim() || 'Iniciando',
    email,
    phone: PLACEHOLDER_PHONE,
    degree: 'Aprendiz',
    dob: PLACEHOLDER_DOB,
    initiation_date: new Date().toISOString().slice(0, 10),
    notes:
      'Pré-iniciação. Completar telefone e dados pessoais. A data de iniciação será confirmada na admissão ao quadro.',
  })

  if (insertError) {
    throw new Error(insertError.message || 'Não foi possível criar o cadastro de pré-iniciação.')
  }
}

/**
 * Após a cerimônia: passa ao quadro, grava a data real e inicia a mensalidade naquele mês.
 */
export async function admitPreInitiationAccount(input: {
  profileId: string
  initiationDate: string
}): Promise<void> {
  const initiationDate = input.initiationDate.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(initiationDate)) {
    throw new Error('Informe a data da iniciação.')
  }

  const { data: brother, error: findError } = await supabase
    .from('brothers')
    .select('id')
    .eq('profile_id', input.profileId)
    .maybeSingle()

  if (findError || !brother?.id) {
    throw new Error('Não há cadastro de pré-iniciação vinculado a esta conta.')
  }

  const { error: brotherError } = await supabase
    .from('brothers')
    .update({
      membership_situation: 'regular',
      status: brotherStatusForSituation('regular'),
      regular_status: regularStatusForSituation('regular'),
      degree: 'Aprendiz',
      initiation_date: initiationDate,
      membership_dues_start_date: duesStartFromInitiationDate(initiationDate),
      updated_at: new Date().toISOString(),
    })
    .eq('id', brother.id)

  if (brotherError) {
    throw new Error(brotherError.message || 'Não foi possível admitir no quadro.')
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ status: 'approved', masonic_degree: 'Aprendiz' })
    .eq('id', input.profileId)

  if (profileError) {
    throw new Error(
      profileError.message ||
        'O irmão foi admitido, mas a conta não foi aprovada. Tente aprovar o acesso de novo.',
    )
  }
}
