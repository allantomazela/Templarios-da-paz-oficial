import {
  signatureSheetRowHeightMm,
  type SignatureSheetRow,
} from '@/lib/attendance-signature-sheet'
import type { MasonicDegree } from '@/lib/masonic-degree'
import { AttendanceSignatureSheetHeader } from './AttendanceSignatureSheetHeader'
import { AttendanceSignatureSheetFooter } from './AttendanceSignatureSheetFooter'

const CELL = 'border border-black px-[1.5mm] py-0 align-middle leading-none'
const HEAD_CELL = `${CELL} bg-gray-100 py-[1mm] text-[7pt] font-bold uppercase tracking-wider`

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
  const rowStyle = { height: `${signatureSheetRowHeightMm(rows.length)}mm` }

  return (
    <div className="bg-white text-[10pt] leading-snug text-black">
      <AttendanceSignatureSheetHeader
        eventTitle={eventTitle}
        eventDate={eventDate}
        eventTime={eventTime}
        locationName={locationName}
        sessionDegree={sessionDegree}
      />

      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-[8mm]" />
          <col />
          <col className="w-[21mm]" />
          <col className="w-[17mm]" />
          <col className="w-[60mm]" />
        </colgroup>
        <thead>
          <tr>
            <th className={`${HEAD_CELL} text-center`}>Nº</th>
            <th className={`${HEAD_CELL} text-left`}>Nome do Irmão</th>
            <th className={`${HEAD_CELL} text-center`}>Grau</th>
            <th className={`${HEAD_CELL} text-center`}>CIM</th>
            <th className={`${HEAD_CELL} text-center`}>Assinatura</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.brotherId} style={rowStyle} className="break-inside-avoid">
              <td className={`${CELL} text-center text-[8pt]`}>{row.order}</td>
              <td className={`${CELL} truncate text-[9pt] font-medium`}>{row.name}</td>
              <td className={`${CELL} text-center text-[8pt]`}>{row.degree}</td>
              <td className={`${CELL} text-center text-[8pt]`}>{row.cim}</td>
              <td className={CELL} />
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div className="py-[6mm] text-center text-[10pt]">
          Nenhum irmão ativo para o grau selecionado.
        </div>
      )}

      <AttendanceSignatureSheetFooter
        eventDate={eventDate}
        totalBrothers={rows.length}
        venerableMaster={venerableMaster}
        chancellor={chancellor}
      />
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
