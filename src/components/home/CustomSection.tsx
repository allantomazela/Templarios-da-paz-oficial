import { cn } from '@/lib/utils'
import { CustomSection as CustomSectionType } from '@/stores/useSiteSettingsStore'

interface CustomSectionProps {
  section: CustomSectionType
}

export function CustomSection({ section }: CustomSectionProps) {
  if (!section.visible) return null

  const sectionId = `custom-${section.id}`

  const containerStyle: React.CSSProperties = {
    backgroundColor: section.backgroundColor || undefined,
  }

  const textStyle: React.CSSProperties = {
    color: section.textColor || undefined,
  }

  const containerClasses = cn('py-16 px-4 md:px-6', !section.backgroundColor && 'bg-background')

  const renderContent = () => {
    switch (section.type) {
      case 'text':
        return (
          <div className="container mx-auto max-w-4xl" style={textStyle}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {section.title}
            </h2>
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </div>
        )

      case 'text-image':
        return (
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div style={textStyle}>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  {section.title}
                </h2>
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </div>
              {section.imageUrl && (
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <img
                    src={section.imageUrl}
                    alt={section.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        )

      case 'image-text':
        return (
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {section.imageUrl && (
                <div className="relative aspect-video rounded-lg overflow-hidden order-2 md:order-1">
                  <img
                    src={section.imageUrl}
                    alt={section.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="order-1 md:order-2" style={textStyle}>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  {section.title}
                </h2>
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </div>
            </div>
          </div>
        )

      case 'full-width':
        return (
          <div className="container mx-auto max-w-7xl">
            {section.imageUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-8">
                <img
                  src={section.imageUrl}
                  alt={section.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div style={textStyle}>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
                {section.title}
              </h2>
              <div
                className="prose prose-lg max-w-4xl mx-auto"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <section id={sectionId} className={containerClasses} style={containerStyle}>
      {renderContent()}
    </section>
  )
}

