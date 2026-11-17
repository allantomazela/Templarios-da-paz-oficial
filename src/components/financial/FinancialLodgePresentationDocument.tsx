import { ReportHeader } from '@/components/reports/ReportHeader'
import type { LodgePresentationSlide } from '@/lib/financial-lodge-presentation'

interface FinancialLodgePresentationDocumentProps {
  slides: LodgePresentationSlide[]
  lodgeName: string
}

/** Documento usado em Imprimir / Salvar PDF — mesmo roteiro da apresentação em tela. */
export function FinancialLodgePresentationDocument({
  slides,
  lodgeName,
}: FinancialLodgePresentationDocumentProps) {
  return (
    <div className="w-full min-w-0 bg-white text-black">
      <div className="mb-4 border-b border-gray-300 pb-3 print:mb-2 print:pb-2">
        <ReportHeader
          title="Apresentação da Tesouraria"
          subtitle={`${lodgeName} — roteiro para sessão e prestação de contas`}
        />
      </div>

      <div className="space-y-8 print:space-y-0">
        {slides.map((slide, index) => (
          <section
            key={slide.id}
            className="lodge-presentation-slide rounded-md border border-gray-200 p-6 print:rounded-none print:border-0 print:p-2"
            aria-label={`Slide ${index + 1}: ${slideTitle(slide)}`}
          >
            <p className="mb-3 text-xs uppercase tracking-wide text-gray-500 print:text-black">
              Slide {index + 1} de {slides.length}
            </p>
            <SlideContent slide={slide} />
          </section>
        ))}
      </div>
    </div>
  )
}

function slideTitle(slide: LodgePresentationSlide): string {
  return slide.title
}

function SlideContent({ slide }: { slide: LodgePresentationSlide }) {
  switch (slide.kind) {
    case 'cover':
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center print:min-h-[60vh]">
          <h2 className="text-3xl font-bold tracking-tight print:text-4xl">
            {slide.title}
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-gray-700 print:text-black">
            {slide.subtitle}
          </p>
          <p className="mt-8 text-sm text-gray-500 print:text-black">
            {slide.footer}
          </p>
        </div>
      )
    case 'bullets':
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight print:text-3xl">
            {slide.title}
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-base text-gray-800 print:text-lg print:text-black">
            {slide.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {slide.note ? (
            <p className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 print:border-black print:bg-transparent print:text-black">
              {slide.note}
            </p>
          ) : null}
        </div>
      )
    case 'two_column':
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight print:text-3xl">
            {slide.title}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
            <PrintColumn title={slide.leftTitle} items={slide.left} />
            <PrintColumn title={slide.rightTitle} items={slide.right} />
          </div>
        </div>
      )
    case 'metrics':
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight print:text-3xl">
            {slide.title}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
            {slide.items.map((item) => (
              <div
                key={item.label}
                className="rounded border border-gray-200 p-4 print:border-black"
              >
                <p className="text-sm text-gray-500 print:text-black">
                  {item.label}
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          {slide.note ? (
            <p className="text-sm text-gray-600 print:text-black">{slide.note}</p>
          ) : null}
        </div>
      )
    case 'closing':
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight print:text-3xl">
            {slide.title}
          </h2>
          <blockquote className="border-l-4 border-gray-800 pl-4 text-xl italic text-gray-900 print:text-2xl">
            {slide.quote}
          </blockquote>
          <ul className="list-disc space-y-2 pl-5 text-base print:text-lg">
            {slide.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )
    default:
      return null
  }
}

function PrintColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded border border-gray-200 p-4 print:border-black">
      <h3 className="mb-3 text-lg font-medium">{title}</h3>
      <ul className="list-disc space-y-2 pl-5 text-sm text-gray-800 print:text-base print:text-black">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
