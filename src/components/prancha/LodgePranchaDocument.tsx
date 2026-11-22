import { formatDateBR } from '@/lib/format-utils'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'

export interface LodgePranchaDocumentProps {
  /** Nome do irmão logado (nunca inventar nome fixo). */
  authorName: string
  subject: string
  body: string
  sessionDate?: string | null
  createdAtLabel?: string
  documentYear?: number
}

const DEFAULT_LODGE_NAME = 'Templários da Paz'
const DEFAULT_LODGE_NUMBER = '3969'
const DEFAULT_ORIENTE = 'Botucatu – SP'

/**
 * Prancha no layout ornamental do modelo A4 da Loja.
 * Tipografia isolada em `.lodge-prancha-document` (main.css) para não
 * herdar letter-spacing/line-height do tema e encavalar o texto.
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
  const orienteCity = contact.city?.trim() || DEFAULT_ORIENTE
  const lodgeLabel = /n[º°.]/i.test(lodgeName)
    ? lodgeName
    : `${lodgeName} nº ${DEFAULT_LODGE_NUMBER}`

  const brotherName = authorName.trim()
  const topic = subject.trim()
  const paragraphs = body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <div
      className="lodge-prancha-document relative mx-auto w-full max-w-[210mm] overflow-hidden bg-[#f6ebd7] shadow-sm"
      style={{
        aspectRatio: '210 / 297',
        backgroundImage: "url('/prancha-template-a4.png')",
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="prancha-content absolute inset-x-[16.5%] top-[41%] bottom-[12%] flex flex-col overflow-hidden">
        <p className="prancha-kicker italic">
          Solicitação ao Venerável Mestre para aprovação em Loja
        </p>

        <p>
          Ao Venerável Mestre da ARLS {lodgeLabel},
        </p>

        <p>
          Eu Ir∴ <strong>{brotherName || '________________'}</strong>,
          respeitosamente, submeto à apreciação desta Oficina a presente
          prancha de solicitação
          {topic ? (
            <>
              {' '}
              acerca de <strong>{topic}</strong>
            </>
          ) : null}
          .
        </p>

        {sessionDate ? (
          <p>Sessão / data de referência: {formatDateBR(sessionDate)}.</p>
        ) : null}

        <div className="prancha-body-block min-h-0 flex-1 overflow-hidden">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
            ))
          ) : (
            <p>[Descreva aqui o pedido ou proposta]</p>
          )}
          <p className="prancha-closing">
            Nestes termos, peço deferimento sob os auspícios do Grande Oriente
            do Brasil.
          </p>
        </div>

        <div className="prancha-footer mt-3 shrink-0">
          <p className="prancha-date">
            Oriente de {orienteCity}, ______ de ____________________ de{' '}
            {documentYear}
            {createdAtLabel ? (
              <span className="sr-only"> (gerada em {createdAtLabel})</span>
            ) : null}
          </p>

          <div className="mx-auto mt-6 w-[68%] max-w-[14rem] text-center">
            <div className="mb-1 border-b border-black pt-8" />
            <p className="prancha-sign-name">
              Ir∴ {brotherName || '________________'}
            </p>
            <p className="prancha-sign-role">Solicitante à Loja</p>
          </div>
        </div>
      </div>
    </div>
  )
}
