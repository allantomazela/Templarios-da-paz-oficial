import { createClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { formatPersonName } from './person-name'
import { PERSON_NAME_CASES } from './person-name.cases'

/**
 * Garante que o gatilho do banco (public.format_person_name) e a formatação dos formulários
 * (formatPersonName) produzem o mesmo resultado. Acessa o Supabase pela rede, por isso só roda
 * com `npm run test:db` e as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY definidas.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const shouldRun = import.meta.env.MODE === 'db' && Boolean(supabaseUrl && supabaseKey)

describe.runIf(shouldRun)('format_person_name (banco) ≡ formatPersonName (formulários)', () => {
  it('produz o mesmo resultado para todos os casos de referência', async () => {
    const client = createClient(supabaseUrl as string, supabaseKey as string, {
      auth: { persistSession: false },
    })

    const results = await Promise.all(
      PERSON_NAME_CASES.map(async ({ input }) => {
        const { data, error } = await client.rpc('format_person_name', { p_name: input })
        if (error) throw new Error(`format_person_name("${input}"): ${error.message}`)
        return { input, database: data as string, frontend: formatPersonName(input) }
      }),
    )

    expect(results.filter((result) => result.database !== result.frontend)).toEqual([])
    PERSON_NAME_CASES.forEach(({ expected }, index) => {
      expect(results[index].database).toBe(expected)
    })
  }, 30_000)
})
