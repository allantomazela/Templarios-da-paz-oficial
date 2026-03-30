import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { BrandLogoImg } from '@/components/brand/BrandLogoImg'

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
  const { logoUrl } = useSiteSettingsStore()

  return (
    <div
      className={`flex flex-col w-full mb-5 border-b-2 border-primary/20 pb-4 ${className}`}
    >
      {/* Top Section with Logo and Title */}
      <div className="flex items-start gap-4">
        {/* Logo Container - compacto */}
        <div className="relative h-16 w-16 flex-shrink-0">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-1 shadow-sm">
            <BrandLogoImg
              logoUrl={logoUrl}
              alt="Logo da Loja"
              className="h-full w-full origin-center object-contain scale-[1.08]"
              fallbackClassName="h-9 w-9 scale-100 text-primary/50"
            />
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
