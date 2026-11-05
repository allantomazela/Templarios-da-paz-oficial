import { ptBR } from 'date-fns/locale'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { formatCalendarDate } from '@/lib/format-utils'
import {
  VISITOR_SIGNATURE_SHEET_NAME_GAP_MM,
  VISITOR_SIGNATURE_SHEET_SIGNATURE_GAP_MM,
} from '@/lib/attendance-signature-sheet'

export function AttendanceSignatureSheetFooter({
  eventDate,
  totalBrothers,
  venerableMaster,
  chancellor,
  totalLabel = 'Irmãos do quadro convocados para esta sessão',
  compact = false,
  hideMeta = false,
  visitorLayout = false,
}: AttendanceSignatureSheetFooterProps) {
  const { contact } = useSiteSettingsStore()
  const longDate = formatCalendarDate(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const signaturesTopMm = visitorLayout
    ? VISITOR_SIGNATURE_SHEET_SIGNATURE_GAP_MM
    : compact
      ? 4
      : 8
  const nameGapMm = visitorLayout ? VISITOR_SIGNATURE_SHEET_NAME_GAP_MM : 1

  return (
    <footer className="mt-[2mm] break-inside-avoid leading-tight">
      {!hideMeta && (
        <div className="flex items-baseline justify-between gap-[4mm]">
          <div className="text-[8.5pt]">
            {totalLabel}: {totalBrothers}
          </div>
          <div className="text-[9pt]">
            {contact.city ? `Oriente de ${contact.city}, ` : ''}
            {longDate}.
          </div>
        </div>
      )}

      <div
        className="grid grid-cols-2 gap-[14mm]"
        style={{ marginTop: `${signaturesTopMm}mm` }}
      >
        <SignatureBlock
          name={venerableMaster}
          role="Venerável Mestre em Exercício"
          nameGapMm={nameGapMm}
          lineMaxWidthMm={visitorLayout ? 75 : undefined}
        />
        <SignatureBlock
          name={chancellor}
          role="Chanceler"
          nameGapMm={nameGapMm}
          lineMaxWidthMm={visitorLayout ? 75 : undefined}
        />
      </div>
    </footer>
  )
}

function SignatureBlock({
  name,
  role,
  nameGapMm,
  lineMaxWidthMm,
}: {
  name: string
  role: string
  nameGapMm: number
  lineMaxWidthMm?: number
}) {
  return (
    <div className="text-center">
      <div
        className="mx-auto border-t border-black"
        style={lineMaxWidthMm ? { maxWidth: `${lineMaxWidthMm}mm` } : undefined}
      />
      <div
        className="text-[9.5pt] font-bold"
        style={{ marginTop: `${nameGapMm}mm` }}
      >
        {name}
      </div>
      <div className="mt-[0.8mm] text-[7.5pt] uppercase tracking-wider">{role}</div>
    </div>
  )
}

interface AttendanceSignatureSheetFooterProps {
  eventDate: string
  totalBrothers: number
  venerableMaster: string
  chancellor: string
  totalLabel?: string
  /** Menor espaço antes das assinaturas — ajuda a folha de visitantes a caber numa A4. */
  compact?: boolean
  /** Omite contagem e data — útil na folha de visitantes preenchida à mão. */
  hideMeta?: boolean
  /** Espaçamento institucional da folha de visitantes (15 mm / 5 mm). */
  visitorLayout?: boolean
}
