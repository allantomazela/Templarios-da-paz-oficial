export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  try {
    // Promise.resolve garante que thenables (ex.: query builder do supabase-js)
    // disparem a requisição imediatamente no Promise.race.
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(message))
      }, ms)
    })
    return await Promise.race([Promise.resolve(promise), timeoutPromise])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/** Executa operação Supabase `{ data, error }` com timeout e erro tipado. */
export async function withTimeoutQuery<T>(
  operation: () => PromiseLike<{ data: T; error: unknown }>,
  ms: number,
  timeoutMessage: string,
  errorFallback: string,
): Promise<T> {
  const { data, error } = await withTimeout(operation(), ms, timeoutMessage)
  if (error) throw toError(error, errorFallback)
  return data
}

export function isDuplicateKeyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { code?: string; status?: number; message?: string }
  return (
    e.code === '23505' ||
    e.status === 409 ||
    Boolean(e.message?.includes('duplicate')) ||
    Boolean(e.message?.includes('unique'))
  )
}

export function toErrorMessage(error: unknown, fallback: string): string {
  return toError(error, fallback).message
}

export function toError(error: unknown, fallback = 'Erro ao realizar operação.'): Error {
  if (error instanceof Error) return error
  if (typeof error === 'object' && error && 'message' in error) {
    const e = error as { message?: string; details?: string; code?: string }
    if (isDuplicateKeyError(error)) {
      return new Error(
        'Já existe um registro para esta combinação. Edite o lançamento existente ou altere os dados informados.',
      )
    }
    const message = e.message?.trim()
    if (message) {
      const details = e.details ? ` (${e.details})` : ''
      return new Error(`${message}${details}`)
    }
  }
  if (typeof error === 'string' && error.trim()) {
    return new Error(error)
  }
  return new Error(fallback)
}
