/**
 * Conectivos mantidos em minúsculo no meio do nome.
 * Deve ser igual à lista de public.format_person_name (migração normalize_person_names).
 */
export const PERSON_NAME_CONNECTORS: ReadonlySet<string> = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'e',
])

const LOCALE = 'pt-BR'

function capitalizeWord(word: string): string {
  return word.replace(/(^|[-'])(\p{L})/gu, (_, separator: string, letter: string) =>
    separator + letter.toLocaleUpperCase(LOCALE),
  )
}

function formatWord(word: string, index: number): string {
  if (index === 0) return capitalizeWord(word)
  if (PERSON_NAME_CONNECTORS.has(word)) return word
  // "é" isolado no meio do nome é erro de digitação do conectivo "e"
  if (word === 'é') return 'e'
  return capitalizeWord(word)
}

/**
 * Formata nome de pessoa em Nome Próprio ("ALLAN TOMAZELA DE CAMARGO" → "Allan Tomazela de Camargo").
 * Mesma regra do gatilho do banco; aqui serve para o usuário ver o resultado antes de salvar.
 */
export function formatPersonName(name: string | null | undefined): string {
  if (!name) return ''
  const words = name
    .replace(/[\s\u00A0]+/g, ' ')
    .trim()
    .toLocaleLowerCase(LOCALE)
    .split(' ')
    .filter(Boolean)
  return words.map(formatWord).join(' ')
}
