import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCalendarDate } from '@/lib/format-utils'
import { formatLodgeNameWithPrefix } from '@/lib/visitor-attendance'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import {
  BrandLogoImg,
  BRAND_LOGO_INTRINSIC_SIZE,
} from '@/components/brand/BrandLogoImg'
import type { Event, VisitorAttendance } from '@/lib/data'

/** Meia folha A4 (210 × 148,5 mm) — permite 2 certificados por página na impressão. */
export const VISITOR_CERTIFICATE_PRINT_CLASS = 'visitor-certificate-half-a4'

export const VISITOR_CERTIFICATE_PAGE_STYLE = `
  @page {
    size: A4 portrait;
    margin: 6mm;
  }
  @media print {
    html, body {
      height: auto !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .${VISITOR_CERTIFICATE_PRINT_CLASS} {
      width: 210mm !important;
      height: 148.5mm !important;
      min-height: 148.5mm !important;
      max-height: 148.5mm !important;
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
      className={`${VISITOR_CERTIFICATE_PRINT_CLASS} relative mx-auto box-border flex w-[210mm] flex-col justify-between overflow-hidden bg-[#fdfbf7] p-6 font-serif text-[#1a1510] print:p-5`}
      style={{ minHeight: '148.5mm', height: '148.5mm' }}
    >
      {/* Moldura maçônica */}
      <div
        className="pointer-events-none absolute inset-2 border-2 border-[#8b6914] print:inset-1.5"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-3 border border-[#c9a227]/60 print:inset-2.5"
        aria-hidden
      />

      {/* Cantoneiras decorativas */}
      {(['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'] as const).map(
        (position) => (
          <span
            key={position}
            className={`pointer-events-none absolute ${position} text-[10px] text-[#8b6914]/80 print:text-[9px]`}
            aria-hidden
          >
            ∴
          </span>
        ),
      )}

      {/* Cabeçalho */}
      <header className="relative z-10 text-center">
        <div className="mb-2 flex justify-center">
          <BrandLogoImg
            logoUrl={logoUrl}
            alt="Brasão da Loja"
            className="h-14 w-14 object-contain print:h-12 print:w-12"
            fallbackClassName="h-10 w-10 text-[#8b6914]"
            width={BRAND_LOGO_INTRINSIC_SIZE}
            height={BRAND_LOGO_INTRINSIC_SIZE}
            sizes="56px"
          />
        </div>
        <p className="text-[9px] uppercase tracking-[0.35em] text-[#8b6914] print:text-[8px]">
          Grande Oriente · Luz · Fraternidade
        </p>
        <h1 className="mt-1 text-lg font-bold tracking-wide text-[#1a1510] print:text-base">
          {lodgeName}
        </h1>
        {contact.address && (
          <p className="mt-0.5 text-[9px] leading-snug text-[#5c5348] print:text-[8px]">
            {contact.address}
            {contact.city ? ` · ${contact.city}` : ''}
          </p>
        )}
      </header>

      {/* Título */}
      <div className="relative z-10 my-2 text-center">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a227]" />
          <span className="text-[8px] text-[#8b6914]">∴</span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9a227]" />
        </div>
        <h2 className="my-1.5 text-xl font-bold uppercase tracking-[0.2em] text-[#1a1510] print:text-lg">
          Certificado de Presença
        </h2>
        <div className="mx-auto flex max-w-md items-center gap-2">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a227]" />
          <span className="text-[8px] text-[#8b6914]">∴</span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9a227]" />
        </div>
      </div>

      {/* Corpo */}
      <div className="relative z-10 flex-1 px-2 text-center text-[11px] leading-relaxed text-[#2a2420] print:text-[10px]">
        <p>
          Certificamos que o Ir∴{' '}
          <strong className="font-semibold text-[#1a1510]">{visitor.name}</strong>, no
          Grau de{' '}
          <strong className="font-semibold text-[#1a1510]">{visitor.degree}</strong>, da{' '}
          <strong className="font-semibold text-[#1a1510]">
            {lodgeDisplay} Nº {visitor.lodgeNumber}
          </strong>
          , filiada à{' '}
          <strong className="font-semibold text-[#1a1510]">{visitor.obedience}</strong>
          {visitor.masonicNumber ? (
            <>
              , portador do Registro Maçônico Nº{' '}
              <strong className="font-semibold text-[#1a1510]">
                {visitor.masonicNumber}
              </strong>
            </>
          ) : null}
          , esteve presente na sessão realizada em{' '}
          <strong className="font-semibold text-[#1a1510]">
            {formatCalendarDate(event.date, "dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}
          </strong>
          , na qualidade de{' '}
          <strong className="font-semibold text-[#1a1510]">Visitante</strong>.
        </p>

        <p className="mt-2 text-[10px] italic text-[#5c5348] print:text-[9px]">
          {event.type} — {event.title}
        </p>
      </div>

      {/* Assinaturas */}
      <footer className="relative z-10 mt-2 grid grid-cols-2 gap-6 print:gap-4">
        <div className="text-center">
          <div className="mx-auto mb-1 h-8 w-28 border-t border-[#1a1510] print:h-6 print:w-24" />
          <p className="text-[10px] font-semibold text-[#1a1510] print:text-[9px]">
            {venerableMaster}
          </p>
          <p className="text-[8px] uppercase tracking-wider text-[#8b6914] print:text-[7px]">
            Venerável Mestre
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-1 h-8 w-28 border-t border-[#1a1510] print:h-6 print:w-24" />
          <p className="text-[10px] font-semibold text-[#1a1510] print:text-[9px]">
            {chancellor}
          </p>
          <p className="text-[8px] uppercase tracking-wider text-[#8b6914] print:text-[7px]">
            Chanceler
          </p>
        </div>
      </footer>

      <p className="relative z-10 mt-1 text-center text-[7px] text-[#8a8075] print:text-[6px]">
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
