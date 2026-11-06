import {
  visitorSignatureBlankRowCount,
  visitorSignatureSheetRowHeightMm,
} from '@/lib/attendance-signature-sheet'
import type { MasonicDegree } from '@/lib/masonic-degree'
import { AttendanceSignatureSheetHeader } from './AttendanceSignatureSheetHeader'
import { AttendanceSignatureSheetFooter } from './AttendanceSignatureSheetFooter'

const CELL = 'border border-black px-[1mm] py-0 align-middle leading-none'
const HEAD_CELL = `${CELL} bg-gray-100 py-[0.8mm] text-[6.5pt] font-bold uppercase tracking-wider`
/** Células vazias precisam de conteúdo para o Chrome não colapsar bordas na impressão. */
const EMPTY = '\u00A0'

/** Folha A4 em branco para assinatura de irmãos visitantes no livro de presença. */
export function VisitorSignatureSheetDocument({
  eventTitle,
  eventDate,
  eventTime,
  locationName,
  sessionDegree,
  venerableMaster,
  chancellor,
  blankRowCount = visitorSignatureBlankRowCount(),
}: VisitorSignatureSheetDocumentProps) {
  const rowHeightMm = visitorSignatureSheetRowHeightMm()
  const cellStyle = { height: `${rowHeightMm}mm`, minHeight: `${rowHeightMm}mm` }
  const rows = Array.from({ length: blankRowCount }, (_, index) => index + 1)

  return (
    <div className="visitor-signature-sheet bg-white text-[10pt] leading-snug text-black">
      <AttendanceSignatureSheetHeader
        eventTitle={eventTitle}
        eventDate={eventDate}
        eventTime={eventTime}
        locationName={locationName}
        sessionDegree={sessionDegree}
        documentHeading="Livro de Presença — Visitantes"
        blankSessionFields
      />

      <table
        className="w-full table-fixed border-collapse border border-black"
        style={{ emptyCells: 'show' }}
      >
        <colgroup>
          {/* ~190 mm úteis. A largura da antiga coluna Obediência foi para Loja. */}
          <col style={{ width: '8mm' }} />
          <col style={{ width: '52mm' }} />
          <col style={{ width: '14mm' }} />
          <col style={{ width: '14mm' }} />
          <col style={{ width: '54mm' }} />
          <col style={{ width: '48mm' }} />
        </colgroup>
        <thead>
          <tr>
            <th className={`${HEAD_CELL} text-center`}>Nº</th>
            <th className={`${HEAD_CELL} text-left`}>Nome do Irmão</th>
            <th className={`${HEAD_CELL} text-center`}>Grau</th>
            <th className={`${HEAD_CELL} text-center`}>CIM</th>
            <th className={`${HEAD_CELL} text-left`}>Loja</th>
            <th className={`${HEAD_CELL} text-center`}>Assinatura</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => (
            <tr key={order}>
              <td className={`${CELL} text-center text-[8pt]`} style={cellStyle}>
                {order}
              </td>
              <td className={CELL} style={cellStyle}>
                {EMPTY}
              </td>
              <td className={CELL} style={cellStyle}>
                {EMPTY}
              </td>
              <td className={CELL} style={cellStyle}>
                {EMPTY}
              </td>
              <td className={CELL} style={cellStyle}>
                {EMPTY}
              </td>
              <td className={CELL} style={cellStyle}>
                {EMPTY}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AttendanceSignatureSheetFooter
        eventDate={eventDate}
        totalBrothers={blankRowCount}
        venerableMaster={venerableMaster}
        chancellor={chancellor}
        hideMeta
        visitorLayout
      />
    </div>
  )
}

interface VisitorSignatureSheetDocumentProps {
  eventTitle: string
  eventDate: string
  eventTime?: string
  locationName?: string
  sessionDegree: MasonicDegree
  venerableMaster: string
  chancellor: string
  blankRowCount?: number
}
