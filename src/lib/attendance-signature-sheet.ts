import type { Brother } from '@/lib/data'
import { isBrotherOnAttendanceRoster } from '@/lib/chancellor-attendance'
import {
  canAccessDegree,
  normalizeMasonicDegree,
  type MasonicDegree,
} from '@/lib/masonic-degree'

export interface SignatureSheetRow {
  order: number
  brotherId: string
  name: string
  degree: string
  cim: string
}

export const SIGNATURE_SHEET_DEGREE_LABELS: Record<MasonicDegree, string> = {
  Aprendiz: 'Aprendiz (todos os irmãos)',
  Companheiro: 'Companheiro (Companheiros e Mestres)',
  Mestre: 'Mestre (somente Mestres)',
}

/** Alfabética é o padrão. Por grau fica a critério do Chanceler, na hora de imprimir. */
export type SignatureSheetOrder = 'name' | 'degree'

export const SIGNATURE_SHEET_ORDER_LABELS: Record<SignatureSheetOrder, string> = {
  name: 'Alfabética',
  degree: 'Por grau (Mestres, Companheiros, Aprendizes)',
}

const DEGREE_PRINT_RANK: Record<MasonicDegree, number> = {
  Mestre: 0,
  Companheiro: 1,
  Aprendiz: 2,
}

function compareSignatureSheetBrothers(
  left: Brother,
  right: Brother,
  order: SignatureSheetOrder,
): number {
  if (order === 'degree') {
    const leftRank = DEGREE_PRINT_RANK[normalizeMasonicDegree(left.degree) ?? 'Aprendiz']
    const rightRank = DEGREE_PRINT_RANK[normalizeMasonicDegree(right.degree) ?? 'Aprendiz']
    if (leftRank !== rightRank) return leftRank - rightRank
  }
  return left.name.localeCompare(right.name, 'pt-BR')
}

/**
 * Linhas da folha de assinaturas: quadro ativo (regulares + afastados por saúde),
 * com grau compatível com a sessão. Desligados ficam de fora.
 */
export function buildSignatureSheetRows(
  brothers: Brother[],
  sessionDegree: MasonicDegree,
  order: SignatureSheetOrder = 'name',
): SignatureSheetRow[] {
  return brothers
    .filter(
      (brother) =>
        isBrotherOnAttendanceRoster(brother) &&
        canAccessDegree(normalizeMasonicDegree(brother.degree), sessionDegree),
    )
    .sort((left, right) => compareSignatureSheetBrothers(left, right, order))
    .map((brother, index) => ({
      order: index + 1,
      brotherId: brother.id,
      name: brother.name,
      degree: brother.degree,
      cim: brother.cim?.trim() ?? '',
    }))
}

export function signatureSheetDocumentTitle(eventDate: string, degree: MasonicDegree) {
  return `Folha_Presenca_${eventDate}_${degree}`
}

/**
 * Altura útil para as linhas de assinatura numa única página A4: 297mm menos as margens
 * da @page (2 × 10mm), o cabeçalho (~40mm), o título da tabela (~5mm), o rodapé (~23mm)
 * e uma folga para arredondamentos do navegador.
 */
export const SIGNATURE_SHEET_ROWS_AREA_MM = 208
export const SIGNATURE_SHEET_MIN_ROW_MM = 5.2
export const SIGNATURE_SHEET_MAX_ROW_MM = 9

/** Até 40 irmãos cabem numa página; com menos irmãos, as linhas crescem para facilitar a assinatura. */
export function signatureSheetRowHeightMm(rowCount: number): number {
  if (rowCount <= 0) return SIGNATURE_SHEET_MAX_ROW_MM
  const fitted = Math.floor((SIGNATURE_SHEET_ROWS_AREA_MM / rowCount) * 10) / 10
  return Math.min(SIGNATURE_SHEET_MAX_ROW_MM, Math.max(SIGNATURE_SHEET_MIN_ROW_MM, fitted))
}

/** A4 retrato com margens laterais que deixam folga para colar a folha no livro. */
export const SIGNATURE_SHEET_PRINT_STYLE = `
  @page { size: A4 portrait; margin: 10mm 14mm; }
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`
