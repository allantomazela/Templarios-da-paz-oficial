import { ptBR } from 'date-fns/locale'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { BrandLogoImg, BRAND_LOGO_INTRINSIC_SIZE } from '@/components/brand/BrandLogoImg'
import { SquareAndCompassIcon } from '@/components/brand/SquareAndCompassIcon'
import { LODGE_TEMPLE_NAME } from '@/lib/event-locations'
import { formatCalendarDate } from '@/lib/format-utils'
import { formatLodgeNameWithPrefix } from '@/lib/visitor-attendance'
import type { MasonicDegree } from '@/lib/masonic-degree'

/** Usa div em vez de p/h1: as regras globais de p/h* (cor, tamanho, espaçamento) vencem as utilitárias. */
export function AttendanceSignatureSheetHeader({
  eventTitle,
  eventDate,
  eventTime,
  locationName,
  sessionDegree,
}: AttendanceSignatureSheetHeaderProps) {
  const { logoUrl, siteTitle, contact } = useSiteSettingsStore()
  const lodgeName = formatLodgeNameWithPrefix(siteTitle || 'Templários da Paz')
  const addressLine = [contact.address, contact.zip && `CEP ${contact.zip}`]
    .filter(Boolean)
    .join(' — ')

  return (
    <header className="mb-[2mm]">
      <div className="flex items-center gap-[3mm] border-b-[3px] border-double border-black pb-[2mm]">
        <BrandLogoImg
          logoUrl={logoUrl}
          alt="Logo da Loja"
          className="h-[14mm] w-[14mm] flex-shrink-0 rounded-full object-contain"
          fallbackClassName="h-[12mm] w-[12mm] flex-shrink-0 text-black"
          loading="eager"
          width={BRAND_LOGO_INTRINSIC_SIZE}
          height={BRAND_LOGO_INTRINSIC_SIZE}
        />
        <div className="min-w-0 flex-1 text-center leading-tight">
          <div className="text-[12.5pt] font-bold uppercase tracking-wide">{lodgeName}</div>
          <div className="mt-[1mm] text-[8.5pt]">
            {contact.city && <span className="font-semibold">Oriente de {contact.city}</span>}
            {contact.city && addressLine && ' · '}
            {addressLine}
          </div>
        </div>
        <SquareAndCompassIcon className="h-[14mm] w-[14mm] flex-shrink-0" />
      </div>

      <div
        role="heading"
        aria-level={1}
        className="mt-[1.5mm] text-center text-[13pt] font-bold uppercase leading-tight tracking-[0.25em]"
      >
        Livro de Presença
      </div>

      <dl className="mt-[1mm] grid grid-cols-[1.5fr_1.4fr_0.7fr_0.9fr_1.3fr] border border-black text-center leading-tight">
        <SessionField label="Sessão">{eventTitle}</SessionField>
        <SessionField label="Data">
          {formatCalendarDate(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </SessionField>
        <SessionField label="Horário">{eventTime || '—'}</SessionField>
        <SessionField label="Grau">{sessionDegree}</SessionField>
        <SessionField label="Local" last>
          {locationName || LODGE_TEMPLE_NAME}
        </SessionField>
      </dl>
    </header>
  )
}

function SessionField({
  label,
  children,
  last = false,
}: {
  label: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div className={`min-w-0 px-[1.5mm] py-[1mm] ${last ? '' : 'border-r border-black'}`}>
      <dt className="text-[6.5pt] font-bold uppercase tracking-wider">{label}</dt>
      <dd className="mt-[0.5mm] truncate text-[9pt] font-semibold">{children}</dd>
    </div>
  )
}

interface AttendanceSignatureSheetHeaderProps {
  eventTitle: string
  eventDate: string
  eventTime?: string
  locationName?: string
  sessionDegree: MasonicDegree
}
