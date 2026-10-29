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
import { CertificateOrnament } from './CertificateOrnament'
import type { Event, VisitorAttendance } from '@/lib/data'

/** Classe para forçar texto escuro na pré-visualização (tema escuro global). */
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
  const isBlank = blank || !visitor || !event
  const lodgeName = siteTitle || 'Templários da Paz'
  const sessionLabel = event ? `${event.type} — ${event.title}` : ''
  const sessionDate = event
    ? formatCalendarDate(event.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : ''

  return (
    <div
      className={`${VISITOR_CERTIFICATE_PRINT_CLASS} ${VISITOR_CERTIFICATE_DOCUMENT_CLASS} relative mx-auto box-border flex flex-col overflow-hidden bg-[#f7f3ea] print:p-0`}
      style={{
        width: VISITOR_CERTIFICATE_WIDTH_CSS,
        height: VISITOR_CERTIFICATE_HEIGHT_CSS,
        minHeight: VISITOR_CERTIFICATE_HEIGHT_CSS,
        maxHeight: VISITOR_CERTIFICATE_HEIGHT_CSS,
        color: '#1a140c',
        padding: '10mm 14mm 7mm',
      }}
    >
      <CertificateOrnament />

      <header className="relative z-10 text-center">
        <div className="flex items-center justify-center gap-3">
          <BrandLogoImg
            logoUrl={logoUrl}
            alt="Brasão da Loja"
            className="h-[13mm] w-[13mm] object-contain"
            fallbackClassName="h-[12mm] w-[12mm] text-[#a6843d]"
            sizes="14mm"
            loading="eager"
            decoding="sync"
            crossOrigin="anonymous"
          />
          <SquareAndCompassIcon className="h-[13mm] w-[13mm]" />
        </div>
        <p className="certificate-motto uppercase">Sabedoria · Força · Beleza</p>
        <p className="certificate-lodge-name">{lodgeName}</p>
        {contact.address ? (
          <p className="certificate-address">
            {contact.address}
            {contact.city ? ` · ${contact.city}` : ''}
          </p>
        ) : null}
      </header>

      <h2 className="certificate-title relative z-10">Certificado de Presença</h2>
      <p className="certificate-lead relative z-10">Este certificado é apresentado ao Ir∴</p>
      <p className="certificate-name-line relative z-10">{isBlank ? '\u00a0' : visitor?.name}</p>

      <div className="certificate-body relative z-10">
        {isBlank ? <BlankStatement /> : <FilledStatement visitor={visitor!} sessionDate={sessionDate} />}
      </div>

      <p className="certificate-session relative z-10">
        {isBlank ? (
          <>
            Sessão <Write blank size="wide" />
          </>
        ) : (
          `“${sessionLabel}”`
        )}
      </p>

      <footer className="relative z-10 mt-1 grid grid-cols-2 gap-8 px-[6mm]">
        <Signature name={venerableMaster} role="Venerável Mestre" />
        <Signature name={chancellor} role="Chanceler" />
      </footer>

      <p className="certificate-footer relative z-10">
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

function FilledStatement({
  visitor,
  sessionDate,
}: {
  visitor: VisitorAttendance
  sessionDate: string
}) {
  const lodgeDisplay = formatLodgeNameWithPrefix(visitor.lodge)
  return (
    <p className="certificate-prose">
      Certificamos que o Ir∴ acima nominado, no Grau de <Write>{visitor.degree}</Write>, da{' '}
      <Write size="wide">{`${lodgeDisplay} Nº ${visitor.lodgeNumber}`}</Write>
      , filiada à <Write>{visitor.obedience}</Write>
      {visitor.masonicNumber ? (
        <>
          , portador do Registro Maçônico Nº <Write>{visitor.masonicNumber}</Write>
        </>
      ) : null}
      , esteve presente na sessão realizada em <Write size="wide">{sessionDate}</Write>, na
      qualidade de <Write>Visitante</Write>.
    </p>
  )
}

function BlankStatement() {
  return (
    <p className="certificate-prose">
      Certificamos que o Ir∴ acima nominado, no Grau de <Write blank />, da{' '}
      <Write blank size="wide" /> Nº <Write blank size="short" />, filiada à <Write blank />,
      portador do Registro Maçônico Nº <Write blank />, esteve presente na sessão realizada em{' '}
      <Write blank size="wide" />, na qualidade de <Write>Visitante</Write>.
    </p>
  )
}

function Write({
  children,
  blank = false,
  size = 'medium',
}: {
  children?: string
  blank?: boolean
  size?: 'short' | 'medium' | 'wide'
}) {
  return (
    <span className={`certificate-write certificate-write-${size}${blank ? ' is-blank' : ''}`}>
      {blank ? '\u00a0' : children}
    </span>
  )
}

function Signature({ name, role }: { name: string; role: string }) {
  return (
    <div className="certificate-sign">
      <p className="certificate-sign-name">{name}</p>
      <span className="certificate-sign-line" />
      <p className="certificate-gold certificate-sign-role">{role}</p>
    </div>
  )
}
