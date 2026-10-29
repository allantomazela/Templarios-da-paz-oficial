import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCalendarDate } from '@/lib/format-utils'
import { formatLodgeNameWithPrefix } from '@/lib/visitor-attendance'
import {
  VISITOR_CERTIFICATE_HEIGHT_CSS,
  VISITOR_CERTIFICATE_ON_A4_HEIGHT_MM,
  VISITOR_CERTIFICATE_ON_A4_WIDTH_MM,
  VISITOR_CERTIFICATE_WIDTH_CSS,
} from '@/lib/visitor-certificate-export'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { BrandLogoImg } from '@/components/brand/BrandLogoImg'
import { SquareAndCompassIcon } from '@/components/brand/SquareAndCompassIcon'
import type { Event, VisitorAttendance } from '@/lib/data'

/** Classe para forçar texto preto na pré-visualização (tema escuro global). */
export const VISITOR_CERTIFICATE_DOCUMENT_CLASS = 'visitor-certificate-document'

/** Cartão de presença 20 cm × 15 cm. */
export const VISITOR_CERTIFICATE_PRINT_CLASS = 'visitor-presence-card'

export const VISITOR_CERTIFICATE_PAGE_STYLE = `
  @page {
    size: A4 landscape;
    margin: 12mm;
  }
  @media print {
    html, body {
      height: auto !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .${VISITOR_CERTIFICATE_PRINT_CLASS} {
      width: ${VISITOR_CERTIFICATE_ON_A4_WIDTH_MM}mm !important;
      height: ${VISITOR_CERTIFICATE_ON_A4_HEIGHT_MM}mm !important;
      min-height: ${VISITOR_CERTIFICATE_ON_A4_HEIGHT_MM}mm !important;
      max-height: ${VISITOR_CERTIFICATE_ON_A4_HEIGHT_MM}mm !important;
      margin: 0 auto !important;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }
`

export function VisitorCertificateDocument({
  visitor,
  event,
  venerableMaster,
  chancellor,
  blank = false,
}: VisitorCertificateDocumentProps) {
  const { logoUrl, contact, siteTitle } = useSiteSettingsStore()
  const lodgeDisplay = visitor ? formatLodgeNameWithPrefix(visitor.lodge) : ''
  const lodgeName = siteTitle || 'Templários da Paz'

  return (
    <div
      className={`${VISITOR_CERTIFICATE_PRINT_CLASS} ${VISITOR_CERTIFICATE_DOCUMENT_CLASS} relative mx-auto box-border grid overflow-hidden bg-[#f6f0e4] font-serif text-[#1a140c] print:p-0`}
      style={{
        width: VISITOR_CERTIFICATE_WIDTH_CSS,
        height: VISITOR_CERTIFICATE_HEIGHT_CSS,
        minHeight: VISITOR_CERTIFICATE_HEIGHT_CSS,
        maxHeight: VISITOR_CERTIFICATE_HEIGHT_CSS,
        color: '#1a140c',
        gridTemplateRows: 'auto auto minmax(0, 1fr) auto auto',
        padding: '6mm 7mm 3.5mm',
      }}
    >
      <div className="pointer-events-none absolute inset-[2.2mm] border-2 border-[#5b0303]" aria-hidden />
      <div className="pointer-events-none absolute inset-[3.6mm] border border-[#a6843d]" aria-hidden />
      <div className="pointer-events-none absolute inset-[4.8mm] border border-[#5b0303]/40" aria-hidden />

      {(['top-[6mm] left-[6mm]', 'top-[6mm] right-[6mm]', 'bottom-[6mm] left-[6mm]', 'bottom-[6mm] right-[6mm]'] as const).map(
        (position) => (
          <span
            key={position}
            className={`pointer-events-none absolute ${position} text-[10px] leading-none text-[#a6843d]`}
            aria-hidden
          >
            ∴
          </span>
        ),
      )}

      <header className="relative z-10 grid grid-cols-[18mm_minmax(0,1fr)_18mm] items-center gap-2 px-[2mm]">
        <BrandLogoImg
          logoUrl={logoUrl}
          alt="Brasão da Loja"
          className="h-[16mm] w-[16mm] object-contain"
          fallbackClassName="h-[14mm] w-[14mm] text-[#a6843d]"
          sizes="18mm"
          loading="eager"
          decoding="sync"
          crossOrigin="anonymous"
        />
        <div className="text-center">
          <p className="certificate-motto uppercase text-[#a6843d]">
            Sabedoria · Força · Beleza
          </p>
          <h1 className="certificate-lodge-name mt-0.5 font-bold">
            {lodgeName}
          </h1>
          {contact.address ? (
            <p className="mt-0.5 text-[8px] leading-snug text-[#1a140c]">
              {contact.address}
              {contact.city ? ` · ${contact.city}` : ''}
            </p>
          ) : null}
        </div>
        <SquareAndCompassIcon className="mx-auto h-[16mm] w-[16mm]" />
      </header>

      <div className="certificate-title-band relative z-10 mx-[2mm] my-1">
        <h2 className="certificate-title">Certificado de Presença</h2>
      </div>

      {/* Corpo */}
      <div className="certificate-body relative z-10 flex min-h-0 items-center justify-center px-[4mm] text-center text-[#1a140c]">
        {blank || !visitor || !event ? (
          <BlankCertificateStatement />
        ) : (
          <p>
            Certificamos que o Ir∴{' '}
            <strong className="font-semibold text-black">{visitor.name}</strong>, no
            Grau de{' '}
            <strong className="font-semibold text-black">{visitor.degree}</strong>, da{' '}
            <strong className="font-semibold text-black">
              {lodgeDisplay} Nº {visitor.lodgeNumber}
            </strong>
            , filiada à{' '}
            <strong className="font-semibold text-black">{visitor.obedience}</strong>
            {visitor.masonicNumber ? (
              <>
                , portador do Registro Maçônico Nº{' '}
                <strong className="font-semibold text-black">
                  {visitor.masonicNumber}
                </strong>
              </>
            ) : null}
            , esteve presente na sessão realizada em{' '}
            <strong className="font-semibold text-black">
              {formatCalendarDate(event.date, "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </strong>
            , na qualidade de{' '}
            <strong className="font-semibold text-black">Visitante</strong>.
          </p>
        )}
      </div>

      <p className="certificate-session relative z-10 px-[2mm] text-center italic text-[#5b0303]">
        {blank || !event ? (
          <>
            Sessão: <HandLine width="88mm" />
          </>
        ) : (
          `${event.type} — ${event.title}`
        )}
      </p>

      {/* Assinaturas */}
      <footer className="relative z-10 mt-1 grid grid-cols-2 gap-6 px-[8mm]">
        <div className="text-center">
          <p className="certificate-gold mb-0.5 text-[8px]" aria-hidden>∴</p>
          <div className="mx-auto mb-0.5 h-6 w-[48mm] max-w-full border-t border-[#5b0303]" />
          <p className="text-[9px] font-semibold leading-tight text-[#1a140c]">
            {venerableMaster}
          </p>
          <p className="certificate-gold text-[7px] uppercase tracking-[0.14em]">
            Venerável Mestre
          </p>
        </div>
        <div className="text-center">
          <p className="certificate-gold mb-0.5 text-[8px]" aria-hidden>∴</p>
          <div className="mx-auto mb-0.5 h-6 w-[48mm] max-w-full border-t border-[#5b0303]" />
          <p className="text-[9px] font-semibold leading-tight text-[#1a140c]">
            {chancellor}
          </p>
          <p className="certificate-gold text-[7px] uppercase tracking-[0.14em]">
            Chanceler
          </p>
        </div>
      </footer>

      <p className="certificate-footer relative z-10 px-[2mm] text-center text-[#5b0303]">
        {blank
          ? 'Formulário para preenchimento à mão'
          : `Emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} · Documento eletrônico`}
      </p>
    </div>
  )
}

interface VisitorCertificateDocumentProps {
  visitor?: VisitorAttendance
  event?: Event
  venerableMaster: string
  chancellor: string
  /** Cartão sem os dados do visitante, para escrever à mão. */
  blank?: boolean
}

function HandLine({ width }: { width: string }) {
  return (
    <span
      className="mx-0.5 inline-block border-b border-black align-baseline"
      style={{ width, minHeight: '1em' }}
    >
      {'\u00a0'}
    </span>
  )
}

function BlankCertificateStatement() {
  return (
    <p>
      Certificamos que o Ir∴ <HandLine width="42mm" />, no Grau de{' '}
      <HandLine width="24mm" />, da A∴ R∴ L∴ S∴ <HandLine width="36mm" /> Nº{' '}
      <HandLine width="14mm" />, filiada à <HandLine width="28mm" />, portador do
      Registro Maçônico Nº <HandLine width="22mm" />, esteve presente na sessão
      realizada em <HandLine width="32mm" />, na qualidade de{' '}
      <strong className="font-semibold text-black">Visitante</strong>.
    </p>
  )
}
