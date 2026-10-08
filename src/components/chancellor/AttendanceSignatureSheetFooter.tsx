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
    <footer className="mt-[4mm] break-inside-avoid leading-tight">
      <div className="text-[9pt]">Irmãos do quadro convocados para esta sessão: {totalBrothers}</div>

      <div className="mt-[6mm] text-right text-[10pt]">
        {contact.city ? `Oriente de ${contact.city}, ` : ''}
        {longDate}.
      </div>

      <div className="mt-[18mm] grid grid-cols-2 gap-[14mm]">
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
      <div className="mt-[1.5mm] text-[10pt] font-bold">{name}</div>
      <div className="mt-[0.5mm] text-[8.5pt] uppercase tracking-wider">{role}</div>
    </div>
  )
}

interface AttendanceSignatureSheetFooterProps {
  eventDate: string
  totalBrothers: number
  venerableMaster: string
  chancellor: string
}
