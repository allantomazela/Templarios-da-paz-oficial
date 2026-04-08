/**
 * Contador monotônico por módulo/momento de uso: a última requisição “vence”.
 * Evita aplicar dados antigos e limpar `loading` quando há fetches sobrepostos
 * (navegação rápida, duplo clique, etc.).
 */
export function createRequestSequence() {
  let seq = 0
  return {
    next: (): number => ++seq,
    isCurrent: (id: number): boolean => id === seq,
  }
}
