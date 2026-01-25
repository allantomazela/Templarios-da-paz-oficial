import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { ShieldCheck, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ReportHeaderProps {
  title: string
  subtitle?: string
  description?: string
  className?: string
}

export function ReportHeader({
  title,
  subtitle,
  description,
  className = '',
}: ReportHeaderProps) {
  const { logoUrl, contact, siteTitle } = useSiteSettingsStore()

  return (
    <div
      className={`flex flex-col w-full mb-2 print:mb-1.5 ${className}`}
    >
      {/* Cabeçalho Compacto */}
      <div className="flex items-center gap-3 print:gap-2 pb-2 print:pb-1 border-b border-gray-300 print:border-black">
        {/* Logo - menor */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 print:w-10 print:h-10 flex items-center justify-center border border-gray-300 print:border-black rounded">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo da Loja"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <ShieldCheck className="w-8 h-8 print:w-7 print:h-7 text-gray-400 print:text-black" />
            )}
          </div>
        </div>

        {/* Informações da Loja - compacto */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base print:text-sm font-bold text-gray-900 print:text-black leading-tight mb-0.5 print:mb-0">
            {siteTitle || 'Templários da Paz'}
          </h1>
          
          {/* Endereço - compacto */}
          {contact.address && (
            <div className="flex items-center gap-1 print:gap-0.5 text-xs print:text-[10px] text-gray-700 print:text-black">
              <MapPin className="h-3 w-3 print:h-2.5 print:w-2.5 flex-shrink-0" />
              <span className="truncate">
                {contact.address}
                {contact.city && `, ${contact.city}`}
                {contact.zip && ` - CEP: ${contact.zip}`}
              </span>
            </div>
          )}
        </div>

        {/* Título do Relatório - compacto */}
        <div className="text-right flex-shrink-0 max-w-[45%] print:max-w-[40%]">
          <h2 className="text-base print:text-sm font-bold text-gray-900 print:text-black leading-tight mb-0.5 print:mb-0">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs print:text-[10px] text-gray-600 print:text-black mb-0.5 print:mb-0">
              {subtitle}
            </p>
          )}
          <p className="text-[10px] print:text-[9px] text-gray-500 print:text-black mt-1 print:mt-0.5">
            {format(new Date(), "dd/MM/yyyy HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
