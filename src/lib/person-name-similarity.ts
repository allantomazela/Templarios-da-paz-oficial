import { normalizeBrotherSearchText } from '@/lib/membership-control-only'

const NAME_CONNECTORS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

export function personNameTokens(name: string | null | undefined): string[] {
  return normalizeBrotherSearchText(name ?? '')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !NAME_CONNECTORS.has(token))
}

/**
 * Mesmo primeiro nome e todos os nomes do mais curto presentes no outro
 * (ignora acentos, caixa e conectivos). Ex.: "Ósses de Toledo e Silva" ≈
 * "Osses de Toledo é Silva".
 */
export function arePersonNamesSimilar(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const tokensA = personNameTokens(a)
  const tokensB = personNameTokens(b)
  if (tokensA.length === 0 || tokensB.length === 0) return false
  if (tokensA.join(' ') === tokensB.join(' ')) return true
  if (tokensA[0] !== tokensB[0]) return false

  const [shorter, longer] =
    tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA]
  if (shorter.length < 2) return false

  const longerSet = new Set(longer)
  return shorter.every((token) => longerSet.has(token))
}

export function findSimilarNameMatches<
  T extends { id: string; full_name?: string | null },
>(target: T, candidates: T[]): T[] {
  return candidates.filter(
    (candidate) =>
      candidate.id !== target.id &&
      arePersonNamesSimilar(target.full_name, candidate.full_name),
  )
}
