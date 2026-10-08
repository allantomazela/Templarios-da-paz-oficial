/** Letra do status na Lista de Presença GOB; sessão sem registro não vira "J". */
export function gobAttendanceStatusLetter(status: string): string {
  if (status === 'Presente') return 'P'
  if (status === 'Ausente') return 'A'
  if (status === 'Justificado') return 'J'
  return '—'
}
