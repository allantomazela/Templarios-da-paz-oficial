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
const TEXT_COLOR = '#0a0a0a'

/**
 * Prancha no layout ornamental do modelo A4 da Loja.
 * Texto escuro para contraste; nome vem sempre de quem está logado.
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
        color: TEXT_COLOR,
      }}
    >
      {/*
        Zona de conteúdo: entre as colunas e abaixo do banner PRANCHA.
        Percentuais calibrados para o template A4 ornamental.
      */}
      <div
        className="absolute font-serif"
        style={{
          left: '16.5%',
          right: '16.5%',
          top: '41%',
          bottom: '12%',
          color: TEXT_COLOR,
          fontSize: '11.5pt',
          lineHeight: 1.48,
        }}
      >
        <div className="flex h-full flex-col">
          <p
            className="mb-2 text-center italic"
            style={{ color: TEXT_COLOR, fontSize: '10.5pt' }}
          >
            Solicitação ao Venerável Mestre para aprovação em Loja
          </p>

          <p className="mb-3 text-justify" style={{ color: TEXT_COLOR }}>
            Ao Venerável Mestre da ARLS {lodgeLabel},
          </p>

          <p className="mb-3 text-justify" style={{ color: TEXT_COLOR }}>
            Eu Ir∴{' '}
            <span className="font-semibold" style={{ color: TEXT_COLOR }}>
              {brotherName || '________________'}
            </span>
            , respeitosamente, submeto à apreciação desta Oficina a presente
            prancha de solicitação
            {topic ? (
              <>
                {' '}
                acerca de{' '}
                <span className="font-semibold" style={{ color: TEXT_COLOR }}>
                  {topic}
                </span>
              </>
            ) : null}
            .
          </p>

          {sessionDate ? (
            <p className="mb-3 text-justify" style={{ color: TEXT_COLOR }}>
              Sessão / data de referência: {formatDateBR(sessionDate)}.
            </p>
          ) : null}

          <div
            className="min-h-0 flex-1 space-y-2.5 overflow-hidden text-justify"
            style={{ color: TEXT_COLOR }}
          >
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`} style={{ color: TEXT_COLOR }}>
                  {paragraph}
                </p>
              ))
            ) : (
              <p style={{ color: '#444444' }}>
                [Descreva aqui o pedido ou proposta]
              </p>
            )}
            <p className="pt-1 text-justify italic" style={{ color: TEXT_COLOR }}>
              Nestes termos, peço deferimento sob os auspícios do Grande Oriente
              do Brasil.
            </p>
          </div>

          <div className="mt-4 shrink-0 text-center" style={{ color: TEXT_COLOR }}>
            <p className="mb-5" style={{ color: TEXT_COLOR, fontSize: '10.5pt' }}>
              Oriente de {orienteCity}, ______ de ____________________ de{' '}
              {documentYear}
              {createdAtLabel ? (
                <span className="sr-only"> (gerada em {createdAtLabel})</span>
              ) : null}
            </p>

            <div className="mx-auto w-[68%] max-w-[14rem]">
              <div
                className="mb-1 border-b pt-7"
                style={{ borderColor: TEXT_COLOR }}
              />
              <p
                className="font-semibold italic"
                style={{ color: TEXT_COLOR, fontSize: '11pt' }}
              >
                Ir∴ {brotherName || '________________'}
              </p>
              <p style={{ color: TEXT_COLOR, fontSize: '9.5pt' }}>
                Solicitante à Loja
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
