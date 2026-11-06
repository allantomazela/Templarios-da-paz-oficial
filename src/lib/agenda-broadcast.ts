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

  return typeof data === 'number' ? data : Number(data ?? 0)
}
