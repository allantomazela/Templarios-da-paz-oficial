import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { ShieldCheck } from 'lucide-react'

interface FormHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  className?: string
}

// Linha decorativa maçônica simplificada
const MasonicDivider = () => (
  <div className="flex items-center justify-center gap-1 my-1.5">
    <div className="h-px w-4 bg-primary/60"></div>
    <div className="w-1.5 h-1.5 border border-primary/60 rounded-full"></div>
    <div className="h-px flex-1 bg-primary/60"></div>
    <div className="w-1.5 h-1.5 border border-primary/60 rounded-full"></div>
    <div className="h-px w-4 bg-primary/60"></div>
  </div>
)

export function FormHeader({
  title,
  description,
  icon,
  className = '',
}: FormHeaderProps) {
  const { logoUrl, siteTitle } = useSiteSettingsStore()

  return (
    <div
      className={`flex flex-col w-full mb-5 border-b-2 border-primary/20 pb-4 ${className}`}
    >
      {/* Top Section with Logo and Title */}
      <div className="flex items-start gap-4">
        {/* Logo Container - compacto */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <div className="relative w-full h-full flex items-center justify-center p-2 border-2 border-primary/30 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo da Loja"
                className="w-full h-full object-contain"
              />
            ) : (
              <ShieldCheck className="w-9 h-9 text-primary/50" />
            )}
          </div>
        </div>

        {/* Title Section */}
        <div className="flex-1 pt-0.5">
          <div className="flex items-center gap-2.5 mb-1">
            {icon && <div className="text-primary flex-shrink-0">{icon}</div>}
            <h2 className="text-xl font-bold text-primary uppercase tracking-wide leading-tight">
              {title}
            </h2>
          </div>
          {description && (
            <>
              <MasonicDivider />
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {description}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
