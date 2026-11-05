import { ptBR } from 'date-fns/locale'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { formatCalendarDate } from '@/lib/format-utils'

export function AttendanceSignatureSheetFooter({
  eventDate,
  totalBrothers,
  venerableMaster,
  chancellor,
  totalLabel = 'Irmãos do quadro convocados para esta sessão',
  compact = false,
  hideMeta = false,
}: AttendanceSignatureSheetFooterProps) {
  const { contact } = useSiteSettingsStore()
  const longDate = formatCalendarDate(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

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

      <div className={`grid grid-cols-2 gap-[14mm] ${compact ? 'mt-[4mm]' : 'mt-[8mm]'}`}>
        <SignatureBlock name={venerableMaster} role="Venerável Mestre em Exercício" />
        <SignatureBlock name={chancellor} role="Chanceler" />
      </div>
    </footer>
  )
}

function SignatureBlock({ name, role }: { name: string; role: string }) {
  return (
    <div className="text-center">
      <div className="border-t border-black" />
      <div className="mt-[1mm] text-[9.5pt] font-bold">{name}</div>
      <div className="mt-[0.3mm] text-[7.5pt] uppercase tracking-wider">{role}</div>
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
}
