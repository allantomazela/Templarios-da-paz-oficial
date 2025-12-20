import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { ShieldCheck } from 'lucide-react'
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
  const { logoUrl, contact } = useSiteSettingsStore()

  return (
    <div
      className={`flex flex-col border-b-2 border-primary/20 pb-6 mb-8 w-full ${className}`}
    >
      <div className="flex flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 relative flex-shrink-0 flex items-center justify-center p-1 border border-border/10 rounded-lg">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo da Loja"
                className="w-full h-full object-contain"
              />
            ) : (
              <ShieldCheck className="w-16 h-16 text-primary/30" />
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold uppercase tracking-wide text-primary">
              Templários da Paz
            </h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
              {subtitle || 'Administração da Loja'}
            </p>
            <div className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {contact.address && <p>{contact.address}</p>}
              {contact.city && (
                <p>
                  {contact.city} {contact.zip ? `- ${contact.zip}` : ''}
                </p>
              )}
              {contact.email && <p>{contact.email}</p>}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 max-w-[40%]">
          <h2 className="text-xl font-bold text-foreground leading-tight">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 leading-snug">
              {description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-4 font-medium">
            Emissão:{' '}
            {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>
    </div>
  )
}
