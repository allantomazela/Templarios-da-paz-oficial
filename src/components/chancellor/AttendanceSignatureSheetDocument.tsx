import { ptBR } from 'date-fns/locale'
import { ReportHeader } from '@/components/reports/ReportHeader'
import { formatCalendarDate, formatDateBR } from '@/lib/format-utils'
import type { SignatureSheetRow } from '@/lib/attendance-signature-sheet'
import type { MasonicDegree } from '@/lib/masonic-degree'

export function AttendanceSignatureSheetDocument({
  eventTitle,
  eventDate,
  eventTime,
  locationName,
  sessionDegree,
  rows,
  venerableMaster,
  chancellor,
}: AttendanceSignatureSheetDocumentProps) {
  return (
    <div className="bg-white text-black">
      <ReportHeader
        title="FOLHA DE PRESENÇA"
        subtitle={`Sessão de ${formatDateBR(eventDate)}`}
      />

      <div className="mb-3 grid grid-cols-2 gap-x-6 gap-y-1 border-b border-black pb-2 text-xs sm:grid-cols-4">
        <SheetInfo label="Natureza da Sessão" value={eventTitle} />
        <SheetInfo label="Grau da Sessão" value={sessionDegree} />
        <SheetInfo
          label="Data e Hora"
          value={`${formatCalendarDate(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}${eventTime ? ` às ${eventTime}` : ''}`}
        />
        <SheetInfo label="Local" value={locationName || 'Templo Principal'} />
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="w-[9mm] py-1 text-center font-bold">Nº</th>
            <th className="py-1 text-left font-bold">Nome do Irmão</th>
            <th className="w-[24mm] py-1 text-center font-bold">Grau</th>
            <th className="w-[22mm] py-1 text-center font-bold">CIM</th>
            <th className="w-[62mm] py-1 text-center font-bold">Assinatura</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.brotherId} className="h-[10mm] break-inside-avoid border-b border-gray-400">
              <td className="text-center font-medium">{row.order}</td>
              <td className="pr-2 font-medium">{row.name}</td>
              <td className="text-center">{row.degree}</td>
              <td className="text-center">{row.cim || '—'}</td>
              <td className="align-bottom">
                <div className="mb-1 border-b border-dotted border-black" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm">Nenhum irmão ativo para o grau selecionado.</p>
      ) : (
        <p className="mt-2 text-[10px]">Total de irmãos do quadro para esta sessão: {rows.length}</p>
      )}

      <div className="mt-14 grid grid-cols-2 gap-12 break-inside-avoid">
        <SignatureLine name={venerableMaster} role="Venerável Mestre" />
        <SignatureLine name={chancellor} role="Chanceler" />
      </div>
    </div>
  )
}

function SheetInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[9px] font-bold uppercase">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function SignatureLine({ name, role }: { name: string; role: string }) {
  return (
    <div className="border-t-2 border-black pt-2 text-center">
      <p className="text-xs font-bold">{name}</p>
      <p className="text-[10px] font-semibold uppercase">{role}</p>
    </div>
  )
}

interface AttendanceSignatureSheetDocumentProps {
  eventTitle: string
  eventDate: string
  eventTime?: string
  locationName?: string
  sessionDegree: MasonicDegree
  rows: SignatureSheetRow[]
  venerableMaster: string
  chancellor: string
}
