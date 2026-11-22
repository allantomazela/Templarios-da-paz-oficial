import { formatDateBR } from '@/lib/format-utils'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'

export interface LodgePranchaDocumentProps {
  authorName: string
  subject: string
  body: string
  sessionDate?: string | null
  createdAtLabel?: string
  /** Ano exibido na linha de data (padrão: ano atual). */
  documentYear?: number
}

const DEFAULT_LODGE_NAME = 'Templários da Paz'
const DEFAULT_LODGE_NUMBER = '3969'
const DEFAULT_ORIENTE = 'Botucatu – SP'

/**
 * Prancha no layout ornamental do modelo A4 da Loja
 * (moldura, colunas, cabeçalho GOB e piso mosaico).
 */
export function LodgePranchaDocument({
  authorName,
  subject,
  body,
  sessionDate,
  createdAtLabel,
  documentYear = new Date().getFullYear(),
}: LodgePranchaDocumentProps) {
  const siteTitle = useSiteSettingsStore((s) => s.siteTitle)
  const contact = useSiteSettingsStore((s) => s.contact)

  const lodgeName = siteTitle?.trim() || DEFAULT_LODGE_NAME
  const orienteCity =
    contact.city?.trim() ||
    (lodgeName.toLowerCase().includes('templários')
      ? DEFAULT_ORIENTE
      : '—')
  const lodgeLabel = lodgeName.toLowerCase().includes('nº')
    ? lodgeName
    : `${lodgeName} nº ${DEFAULT_LODGE_NUMBER}`

  const brotherName = authorName.trim() || 'Irmão autor'
  const topic = subject.trim() || '—'
  const paragraphs = body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <div
      className="lodge-prancha-document relative mx-auto w-full max-w-[210mm] overflow-hidden bg-[#f7ecd8] text-black shadow-sm"
      style={{
        aspectRatio: '210 / 297',
        backgroundImage: "url('/prancha-template-a4.png')",
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      {/* Zona de texto alinhada à área em branco do modelo */}
      <div
        className="absolute inset-x-[15%] top-[44%] bottom-[13%] flex flex-col font-serif text-[12px] leading-[1.45] sm:text-[13px] print:text-[11.5pt] print:leading-[1.4]"
        style={{ color: '#1a1a1a' }}
      >
        <p className="mb-3 text-justify">
          Ao Venerável Mestre da ARLS {lodgeLabel},
        </p>

        <p className="mb-3 text-justify">
          Eu Ir∴ <span className="font-semibold text-[#7a1f1f]">{brotherName}</span>
          , respeitosamente, submeto à apreciação desta Oficina a presente
          prancha de solicitação
          {topic && topic !== '—' ? (
            <>
              {' '}
              acerca de <span className="font-semibold">{topic}</span>
            </>
          ) : null}
          .
        </p>

        {sessionDate ? (
          <p className="mb-3 text-justify">
            Sessão / data de referência: {formatDateBR(sessionDate)}.
          </p>
        ) : null}

        <div className="min-h-0 flex-1 space-y-2.5 overflow-hidden text-justify">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
            ))
          ) : (
            <p className="text-gray-500">[Descreva aqui o pedido ou proposta]</p>
          )}
          <p className="pt-1 text-justify italic text-[#7a1f1f]">
            Nestes termos, peço deferimento sob os auspícios do Grande Oriente
            do Brasil.
          </p>
        </div>

        <div className="mt-auto pt-3 text-center">
          <p className="mb-6 text-[11px] sm:text-[12px] print:text-[10.5pt]">
            Oriente de {orienteCity}, ______ de ____________________ de{' '}
            {documentYear}
            {createdAtLabel ? (
              <span className="sr-only"> (gerada em {createdAtLabel})</span>
            ) : null}
          </p>

          <div className="mx-auto w-[70%] max-w-xs">
            <div className="mb-1 border-b border-black pt-8" />
            <p className="text-[12px] font-semibold italic text-[#7a1f1f] sm:text-[13px] print:text-[11pt]">
              Ir∴ {brotherName}
            </p>
            <p className="text-[10px] text-black sm:text-[11px] print:text-[9.5pt]">
              Solicitante à Loja
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
