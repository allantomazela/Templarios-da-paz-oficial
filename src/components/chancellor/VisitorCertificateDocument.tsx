import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCalendarDate } from '@/lib/format-utils'
import { formatLodgeNameWithPrefix } from '@/lib/visitor-attendance'
import {
  VISITOR_CERTIFICATE_HEIGHT_CSS,
  VISITOR_CERTIFICATE_HEIGHT_MM,
  VISITOR_CERTIFICATE_WIDTH_CSS,
  VISITOR_CERTIFICATE_WIDTH_MM,
} from '@/lib/visitor-certificate-export'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import {
  BrandLogoImg,
  BRAND_LOGO_INTRINSIC_SIZE,
} from '@/components/brand/BrandLogoImg'
import type { Event, VisitorAttendance } from '@/lib/data'

/** Classe para forçar texto preto na pré-visualização (tema escuro global). */
export const VISITOR_CERTIFICATE_DOCUMENT_CLASS = 'visitor-certificate-document'

/** Cartão de presença 20 cm × 15 cm. */
export const VISITOR_CERTIFICATE_PRINT_CLASS = 'visitor-presence-card'

export const VISITOR_CERTIFICATE_PAGE_STYLE = `
  @page {
    size: ${VISITOR_CERTIFICATE_WIDTH_MM}mm ${VISITOR_CERTIFICATE_HEIGHT_MM}mm;
    margin: 0;
  }
  @media print {
    html, body {
      height: auto !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .${VISITOR_CERTIFICATE_PRINT_CLASS} {
      width: ${VISITOR_CERTIFICATE_WIDTH_MM}mm !important;
      height: ${VISITOR_CERTIFICATE_HEIGHT_MM}mm !important;
      min-height: ${VISITOR_CERTIFICATE_HEIGHT_MM}mm !important;
      max-height: ${VISITOR_CERTIFICATE_HEIGHT_MM}mm !important;
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
}: VisitorCertificateDocumentProps) {
  const { logoUrl, contact, siteTitle } = useSiteSettingsStore()
  const lodgeDisplay = formatLodgeNameWithPrefix(visitor.lodge)
  const lodgeName = siteTitle || 'Templários da Paz'

  return (
    <div
      className={`${VISITOR_CERTIFICATE_PRINT_CLASS} ${VISITOR_CERTIFICATE_DOCUMENT_CLASS} relative mx-auto box-border grid overflow-hidden bg-[#fdfbf7] font-serif text-black print:p-0`}
      style={{
        width: VISITOR_CERTIFICATE_WIDTH_CSS,
        height: VISITOR_CERTIFICATE_HEIGHT_CSS,
        minHeight: VISITOR_CERTIFICATE_HEIGHT_CSS,
        maxHeight: VISITOR_CERTIFICATE_HEIGHT_CSS,
        color: '#000000',
        gridTemplateRows: 'auto auto minmax(0, 1fr) auto auto',
        padding: '5mm 6mm 4mm',
      }}
    >
      {/* Moldura maçônica */}
      <div
        className="pointer-events-none absolute inset-[3mm] border-2 border-[#8b6914]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-[4.5mm] border border-[#c9a227]/60"
        aria-hidden
      />

      {/* Cantoneiras decorativas */}
      {(['top-[5mm] left-[5mm]', 'top-[5mm] right-[5mm]', 'bottom-[5mm] left-[5mm]', 'bottom-[5mm] right-[5mm]'] as const).map(
        (position) => (
          <span
            key={position}
            className={`pointer-events-none absolute ${position} text-[9px] text-[#8b6914]/80`}
            aria-hidden
          >
            ∴
          </span>
        ),
      )}

      {/* Cabeçalho */}
      <header className="relative z-10 px-[2mm] text-center">
        <div className="mb-1 flex justify-center">
          <BrandLogoImg
            logoUrl={logoUrl}
            alt="Brasão da Loja"
            className="h-11 w-11 object-contain print:h-10 print:w-10"
            fallbackClassName="h-9 w-9 text-[#8b6914]"
            width={BRAND_LOGO_INTRINSIC_SIZE}
            height={BRAND_LOGO_INTRINSIC_SIZE}
            sizes="44px"
            crossOrigin="anonymous"
          />
        </div>
        <p className="certificate-accent text-[8px] uppercase tracking-[0.32em] text-[#8b6914]">
          Grande Oriente · Luz · Fraternidade
        </p>
        <h1 className="mt-0.5 text-base font-bold leading-tight tracking-wide text-black print:text-[15px]">
          {lodgeName}
        </h1>
        {contact.address && (
          <p className="mt-0.5 text-[8px] leading-snug text-black">
            {contact.address}
            {contact.city ? ` · ${contact.city}` : ''}
          </p>
        )}
      </header>

      {/* Título */}
      <div className="relative z-10 my-1 px-[2mm] text-center">
        <div className="mx-auto flex max-w-[160mm] items-center gap-1.5">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a227]" />
          <span className="text-[7px] text-[#8b6914]">∴</span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9a227]" />
        </div>
        <h2 className="my-1 text-lg font-bold uppercase tracking-[0.18em] text-black print:text-[16px]">
          Certificado de Presença
        </h2>
        <div className="mx-auto flex max-w-[160mm] items-center gap-1.5">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a227]" />
          <span className="text-[7px] text-[#8b6914]">∴</span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9a227]" />
        </div>
      </div>

      {/* Corpo */}
      <div className="relative z-10 flex min-h-0 items-center justify-center px-[3mm] text-center text-[10px] leading-[1.45] text-black print:text-[9.5px]">
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
      </div>

      <p className="relative z-10 px-[2mm] text-center text-[9px] italic leading-snug text-black print:text-[8.5px]">
        {event.type} — {event.title}
      </p>

      {/* Assinaturas */}
      <footer className="relative z-10 mt-1 grid grid-cols-2 gap-4 px-[4mm] print:gap-3">
        <div className="text-center">
          <div className="mx-auto mb-0.5 h-7 w-[52mm] max-w-full border-t border-black print:h-6" />
          <p className="text-[9px] font-semibold leading-tight text-black print:text-[8.5px]">
            {venerableMaster}
          </p>
          <p className="certificate-accent text-[7px] uppercase tracking-wider text-[#8b6914]">
            Venerável Mestre
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-0.5 h-7 w-[52mm] max-w-full border-t border-black print:h-6" />
          <p className="text-[9px] font-semibold leading-tight text-black print:text-[8.5px]">
            {chancellor}
          </p>
          <p className="certificate-accent text-[7px] uppercase tracking-wider text-[#8b6914]">
            Chanceler
          </p>
        </div>
      </footer>

      <p className="relative z-10 px-[2mm] text-center text-[6.5px] leading-tight text-black print:text-[6px]">
        Emitido em{' '}
        {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} · Documento
        eletrônico
      </p>
    </div>
  )
}

interface VisitorCertificateDocumentProps {
  visitor: VisitorAttendance
  event: Event
  venerableMaster: string
  chancellor: string
}
