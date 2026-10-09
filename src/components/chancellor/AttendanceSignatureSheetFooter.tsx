import { ptBR } from 'date-fns/locale'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { formatCalendarDate } from '@/lib/format-utils'

export function AttendanceSignatureSheetFooter({
  eventDate,
  totalBrothers,
  venerableMaster,
  chancellor,
}: AttendanceSignatureSheetFooterProps) {
  const { contact } = useSiteSettingsStore()
  const longDate = formatCalendarDate(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <footer className="mt-[2mm] break-inside-avoid leading-tight">
      <div className="flex items-baseline justify-between gap-[4mm]">
        <div className="text-[8.5pt]">
          Irmãos do quadro convocados para esta sessão: {totalBrothers}
        </div>
        <div className="text-[9pt]">
          {contact.city ? `Oriente de ${contact.city}, ` : ''}
          {longDate}.
        </div>
      </div>

      <div className="mt-[8mm] grid grid-cols-2 gap-[14mm]">
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
}
