/**
 * Contador de operações assíncronas paralelas.
 * Garante que `loading` só desliga quando todas as requisições terminarem,
 * mesmo quando uma requisição obsoleta não aplica dados (request-sequence).
 */
export function createAsyncLoadingGate() {
  let inFlight = 0

  return {
    trackStart(): boolean {
      inFlight += 1
      return inFlight === 1
    },
    trackEnd(): boolean {
      inFlight = Math.max(0, inFlight - 1)
      return inFlight === 0
    },
    forceReset(): void {
      inFlight = 0
    },
    get active(): boolean {
      return inFlight > 0
    },
  }
}
