import type { CSSProperties } from 'react'
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

const ink: CSSProperties = {
  color: '#0a0a0a',
  fontFamily: "Georgia, 'Times New Roman', Times, serif",
  fontSize: '12px',
  fontWeight: 400,
  lineHeight: 1.6,
  letterSpacing: 'normal',
  wordSpacing: 'normal',
  textTransform: 'none',
  whiteSpace: 'normal',
  margin: 0,
  padding: 0,
}

/**
 * Prancha no layout ornamental A4.
 * Usa painel opaco + `div` (não `p`) para não herdar tipografia global do site
 * e não misturar com texto residual do fundo.
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
      className="lodge-prancha-document relative mx-auto w-full max-w-[210mm] overflow-hidden bg-[#f8f0dc] shadow-sm"
      style={{
        aspectRatio: '210 / 297',
        backgroundImage: "url('/prancha-template-a4.png')",
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        ...ink,
      }}
    >
      {/* Painel opaco: cobre qualquer residual do PNG e contém só o texto dinâmico */}
      <div
        className="prancha-panel absolute box-border flex flex-col overflow-hidden"
        style={{
          left: '15%',
          right: '15%',
          top: '30%',
          bottom: '11%',
          backgroundColor: '#f8f0dc',
          padding: '10px 12px 8px',
          ...ink,
        }}
      >
        <div
          className="prancha-title shrink-0 text-center"
          style={{
            ...ink,
            marginBottom: '8px',
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: '#6b1212',
            lineHeight: 1.2,
          }}
        >
          PRANCHA
        </div>

        <div
          className="prancha-kicker shrink-0 text-center italic"
          style={{
            ...ink,
            marginBottom: '12px',
            fontSize: '11px',
            color: '#6b1212',
            lineHeight: 1.35,
          }}
        >
          Solicitação ao Venerável Mestre para aprovação em Loja
        </div>

        <div
          style={{
            ...ink,
            marginBottom: '10px',
            textAlign: 'justify',
          }}
        >
          Ao Venerável Mestre da ARLS {lodgeLabel},
        </div>

        <div
          style={{
            ...ink,
            marginBottom: '10px',
            textAlign: 'justify',
          }}
        >
          Eu Ir∴{' '}
          <span style={{ ...ink, fontWeight: 700 }}>
            {brotherName || '________________'}
          </span>
          , respeitosamente, submeto à apreciação desta Oficina a presente
          prancha de solicitação
          {topic ? (
            <>
              {' '}
              acerca de <span style={{ ...ink, fontWeight: 700 }}>{topic}</span>
            </>
          ) : null}
          .
        </div>

        {sessionDate ? (
          <div
            style={{
              ...ink,
              marginBottom: '10px',
              textAlign: 'justify',
            }}
          >
            Sessão / data de referência: {formatDateBR(sessionDate)}.
          </div>
        ) : null}

        <div
          className="prancha-body min-h-0 flex-1 overflow-auto"
          style={{ ...ink }}
        >
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <div
                key={`${index}-${paragraph.slice(0, 24)}`}
                style={{
                  ...ink,
                  marginBottom: '10px',
                  textAlign: 'justify',
                }}
              >
                {paragraph}
              </div>
            ))
          ) : (
            <div style={{ ...ink, marginBottom: '10px', color: '#444' }}>
              [Descreva aqui o pedido ou proposta]
            </div>
          )}
          <div
            style={{
              ...ink,
              marginBottom: '10px',
              textAlign: 'justify',
              fontStyle: 'italic',
            }}
          >
            Nestes termos, peço deferimento sob os auspícios do Grande Oriente
            do Brasil.
          </div>
        </div>

        <div className="prancha-footer shrink-0" style={{ ...ink, marginTop: '8px' }}>
          <div
            style={{
              ...ink,
              marginBottom: '18px',
              textAlign: 'center',
              fontSize: '11px',
            }}
          >
            Oriente de {orienteCity}, ______ de ____________________ de{' '}
            {documentYear}
            {createdAtLabel ? (
              <span className="sr-only"> (gerada em {createdAtLabel})</span>
            ) : null}
          </div>

          <div style={{ width: '70%', maxWidth: '220px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                borderBottom: '1px solid #0a0a0a',
                marginBottom: '6px',
                paddingTop: '28px',
              }}
            />
            <div
              style={{
                ...ink,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: '12px',
                marginBottom: '2px',
              }}
            >
              Ir∴ {brotherName || '________________'}
            </div>
            <div style={{ ...ink, fontSize: '10px' }}>Solicitante à Loja</div>
          </div>
        </div>
      </div>
    </div>
  )
}
