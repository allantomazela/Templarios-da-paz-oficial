import { supabase } from '@/lib/supabase/client'

export async function sendAgendaBroadcast(input: {
  title: string
  message: string
  link?: string
}): Promise<number> {
  const { data, error } = await supabase.rpc('notify_active_brothers', {
    p_title: input.title,
    p_message: input.message,
    p_link: input.link ?? '/dashboard/agenda',
  })

  if (error) {
    throw new Error(error.message || 'Não foi possível enviar o aviso.')
  }

  const sent = typeof data === 'number' ? data : Number(data ?? 0)

  // O sino já foi gravado. O push é complemento: falha aqui não desfaz o aviso.
  const { error: pushError } = await supabase.functions.invoke('send-lodge-push', {
    body: {
      title: input.title,
      message: input.message,
      link: input.link ?? '/dashboard/agenda',
    },
  })
  if (pushError) {
    console.warn('Aviso gravado no aplicativo; o push do celular não saiu.', pushError)
  }

  return sent
}
