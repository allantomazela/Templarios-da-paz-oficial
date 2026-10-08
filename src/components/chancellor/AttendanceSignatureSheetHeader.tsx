import { ptBR } from 'date-fns/locale'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { BrandLogoImg, BRAND_LOGO_INTRINSIC_SIZE } from '@/components/brand/BrandLogoImg'
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
    <header className="mb-[5mm]">
      <div className="flex items-center gap-[4mm] border-b-[3px] border-double border-black pb-[3mm]">
        <BrandLogoImg
          logoUrl={logoUrl}
          alt="Logo da Loja"
          className="h-[20mm] w-[20mm] flex-shrink-0 object-contain"
          fallbackClassName="h-[16mm] w-[16mm] flex-shrink-0 text-black"
          loading="eager"
          width={BRAND_LOGO_INTRINSIC_SIZE}
          height={BRAND_LOGO_INTRINSIC_SIZE}
        />
        <div className="min-w-0 flex-1 text-center leading-tight">
          <div className="text-[13pt] font-bold uppercase tracking-wide">{lodgeName}</div>
          {contact.city && (
            <div className="mt-[1mm] text-[10pt] font-semibold">Oriente de {contact.city}</div>
          )}
          {addressLine && <div className="mt-[0.5mm] text-[8.5pt]">{addressLine}</div>}
        </div>
        <div aria-hidden className="h-[20mm] w-[20mm] flex-shrink-0" />
      </div>

      <div className="mt-[4mm] text-center leading-tight">
        <div role="heading" aria-level={1} className="text-[15pt] font-bold uppercase tracking-[0.25em]">
          Livro de Presença
        </div>
        <div className="mt-[1.5mm] text-[10.5pt] font-semibold">{eventTitle}</div>
      </div>

      <dl className="mt-[3mm] grid grid-cols-4 border border-black text-center leading-tight">
        <SessionField label="Data">
          {formatCalendarDate(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </SessionField>
        <SessionField label="Horário">{eventTime || '—'}</SessionField>
        <SessionField label="Grau da Sessão">{sessionDegree}</SessionField>
        <SessionField label="Local" last>
          {locationName || 'Templo Principal'}
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
    <div className={`px-[2mm] py-[1.5mm] ${last ? '' : 'border-r border-black'}`}>
      <dt className="text-[7.5pt] font-bold uppercase tracking-wider">{label}</dt>
      <dd className="mt-[0.8mm] text-[10pt] font-semibold">{children}</dd>
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
