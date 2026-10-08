/** Função RPC ainda não existe no banco (migração não aplicada no ambiente). */
export function isMissingRpcError(error: { code?: string; message?: string }): boolean {
  const code = error.code || ''
  const message = (error.message || '').toLowerCase()
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    message.includes('404') ||
    message.includes('could not find the function') ||
    message.includes('does not exist')
  )
}
