import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { formatDateBR } from '@/lib/format-utils'
import {
  normalizePranchaBodyHtml,
  sanitizePranchaHtml,
} from '@/lib/lodge-prancha-html'
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

const BASE_BODY_FONT_PX = 12
const MIN_BODY_FONT_PX = 8

const ink: CSSProperties = {
  color: '#0a0a0a',
  fontFamily: "Georgia, 'Times New Roman', Times, serif",
  fontSize: '12px',
  fontWeight: 400,
  lineHeight: 1.55,
  letterSpacing: 'normal',
  wordSpacing: 'normal',
  textTransform: 'none',
  whiteSpace: 'normal',
  margin: 0,
  padding: 0,
}

/**
 * Prancha no layout ornamental A4.
 * Corpo em HTML sanitizado (negrito/itálico/alinhamento/quebras)
 * com redução automática de fonte para caber no painel.
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
  const panelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [bodyFontPx, setBodyFontPx] = useState(BASE_BODY_FONT_PX)

  const lodgeName = siteTitle?.trim() || DEFAULT_LODGE_NAME
  const orienteCity = contact.city?.trim() || DEFAULT_ORIENTE
  const lodgeLabel = /n[º°.]/i.test(lodgeName)
    ? lodgeName
    : `${lodgeName} nº ${DEFAULT_LODGE_NUMBER}`

  const brotherName = authorName.trim()
  const topic = subject.trim()

  const safeBodyHtml = useMemo(() => {
    const normalized = normalizePranchaBodyHtml(body)
    if (!normalized) return ''
    return sanitizePranchaHtml(normalized)
  }, [body])

  useLayoutEffect(() => {
    const panel = panelRef.current
    const content = contentRef.current
    if (!panel || !content) return

    if (panel.clientHeight < 40 || content.clientHeight < 40) {
      setBodyFontPx(BASE_BODY_FONT_PX)
      return
    }

    let size = BASE_BODY_FONT_PX
    content.style.fontSize = `${size}px`

    // Reduz a fonte do bloco até caber no painel (sem scroll).
    let guard = 0
    while (
      guard < 32 &&
      size > MIN_BODY_FONT_PX &&
      content.scrollHeight > content.clientHeight + 1
    ) {
      size -= 0.25
      content.style.fontSize = `${size}px`
      guard += 1
    }

    setBodyFontPx(Number(size.toFixed(2)))
  }, [safeBodyHtml, brotherName, topic, sessionDate, orienteCity, lodgeLabel])

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
      <div
        ref={panelRef}
        className="prancha-panel absolute box-border overflow-hidden"
        style={{
          left: '15%',
          right: '15%',
          top: '30%',
          bottom: '11%',
          backgroundColor: '#f8f0dc',
          padding: '10px 12px 8px',
          minWidth: 0,
          maxWidth: '100%',
          ...ink,
        }}
      >
        <div
          ref={contentRef}
          className="prancha-fit-content flex h-full min-h-0 w-full min-w-0 flex-col"
          style={{
            ...ink,
            fontSize: `${bodyFontPx}px`,
            minWidth: 0,
            maxWidth: '100%',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }}
        >
          <div
            className="prancha-title shrink-0 text-center"
            style={{
              ...ink,
              marginBottom: '0.55em',
              fontSize: '1.7em',
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
              marginBottom: '0.85em',
              fontSize: '0.92em',
              color: '#6b1212',
              lineHeight: 1.35,
            }}
          >
            Solicitação ao Venerável Mestre para aprovação em Loja
          </div>

          <div
            style={{
              ...ink,
              marginBottom: '0.7em',
              textAlign: 'justify',
              fontSize: '1em',
            }}
          >
            Ao Venerável Mestre da ARLS {lodgeLabel},
          </div>

          <div
            style={{
              ...ink,
              marginBottom: '0.7em',
              textAlign: 'justify',
              fontSize: '1em',
            }}
          >
            Eu Ir∴{' '}
            <span style={{ ...ink, fontWeight: 700, fontSize: 'inherit' }}>
              {brotherName || '________________'}
            </span>
            , respeitosamente, submeto à apreciação desta Oficina a presente
            prancha de solicitação
            {topic ? (
              <>
                {' '}
                acerca de{' '}
                <span style={{ ...ink, fontWeight: 700, fontSize: 'inherit' }}>
                  {topic}
                </span>
              </>
            ) : null}
            .
          </div>

          {sessionDate ? (
            <div
              style={{
                ...ink,
                marginBottom: '0.7em',
                textAlign: 'justify',
                fontSize: '1em',
              }}
            >
              Sessão / data de referência: {formatDateBR(sessionDate)}.
            </div>
          ) : null}

          <div
            className="prancha-body min-h-0 min-w-0 w-full flex-1"
            style={{
              ...ink,
              fontSize: '1em',
              minWidth: 0,
              maxWidth: '100%',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            {safeBodyHtml ? (
              <div
                className="prancha-rich-body"
                style={{
                  ...ink,
                  fontSize: 'inherit',
                  color: '#0a0a0a',
                  minWidth: 0,
                  maxWidth: '100%',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                }}
                dangerouslySetInnerHTML={{ __html: safeBodyHtml }}
              />
            ) : (
              <div style={{ ...ink, marginBottom: '0.7em', color: '#444' }}>
                [Descreva aqui o pedido ou proposta]
              </div>
            )}
            <div
              style={{
                ...ink,
                marginTop: '0.7em',
                marginBottom: '0.7em',
                textAlign: 'justify',
                fontStyle: 'italic',
                fontSize: '1em',
              }}
            >
              Nestes termos, peço deferimento sob os auspícios do Grande Oriente
              do Brasil.
            </div>
          </div>

          <div
            className="prancha-footer shrink-0"
            style={{ ...ink, marginTop: '0.5em', fontSize: '1em' }}
          >
            <div
              style={{
                ...ink,
                marginBottom: '1.1em',
                textAlign: 'center',
                fontSize: '0.92em',
              }}
            >
              Oriente de {orienteCity}, ______ de ____________________ de{' '}
              {documentYear}
              {createdAtLabel ? (
                <span className="sr-only"> (gerada em {createdAtLabel})</span>
              ) : null}
            </div>

            <div
              style={{
                width: '70%',
                maxWidth: '220px',
                margin: '0 auto',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  borderBottom: '1px solid #0a0a0a',
                  marginBottom: '6px',
                  paddingTop: '1.6em',
                }}
              />
              <div
                style={{
                  ...ink,
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontSize: '1em',
                  marginBottom: '2px',
                }}
              >
                Ir∴ {brotherName || '________________'}
              </div>
              <div style={{ ...ink, fontSize: '0.85em' }}>Solicitante à Loja</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
