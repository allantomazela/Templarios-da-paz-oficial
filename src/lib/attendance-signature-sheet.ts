import type { Brother } from '@/lib/data'
import { isBrotherActiveInLodge } from '@/lib/chancellor-attendance'
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

/**
 * Linhas da folha de assinaturas: só o quadro ativo, que tenha grau para a sessão
 * (Aprendiz = todos; Companheiro = Companheiros e Mestres; Mestre = só Mestres).
 */
export function buildSignatureSheetRows(
  brothers: Brother[],
  sessionDegree: MasonicDegree,
): SignatureSheetRow[] {
  return brothers
    .filter(
      (brother) =>
        isBrotherActiveInLodge(brother) &&
        canAccessDegree(normalizeMasonicDegree(brother.degree), sessionDegree),
    )
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
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

/** A4 retrato com margens que deixam folga para colar a folha no livro. */
export const SIGNATURE_SHEET_PRINT_STYLE = `
  @page { size: A4 portrait; margin: 12mm 14mm; }
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`
