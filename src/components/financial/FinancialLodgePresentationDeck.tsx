import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { LodgePresentationSlide } from '@/lib/financial-lodge-presentation'
import { cn } from '@/lib/utils'

interface FinancialLodgePresentationDeckProps {
  open: boolean
  slides: LodgePresentationSlide[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

/** Apresentação em tela cheia (projetar na loja). Isolada do restante do Financeiro. */
export function FinancialLodgePresentationDeck({
  open,
  slides,
  index,
  onIndexChange,
  onClose,
}: FinancialLodgePresentationDeckProps) {
  const total = slides.length
  const safeIndex = total === 0 ? 0 : Math.min(Math.max(index, 0), total - 1)
  const slide = slides[safeIndex]

  const goPrev = useCallback(() => {
    onIndexChange(Math.max(0, safeIndex - 1))
  }, [onIndexChange, safeIndex])

  const goNext = useCallback(() => {
    onIndexChange(Math.min(total - 1, safeIndex + 1))
  }, [onIndexChange, safeIndex, total])

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
        event.preventDefault()
        goNext()
        return
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        goPrev()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, goNext, goPrev, onClose])

  if (!open || !slide || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-slate-950 text-slate-50"
      role="dialog"
      aria-modal="true"
      aria-label="Apresentação da Tesouraria"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <p className="text-sm text-slate-300">
          Slide {safeIndex + 1} de {total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={goPrev}
            disabled={safeIndex === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={goNext}
            disabled={safeIndex >= total - 1}
          >
            Próximo
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            <X className="mr-1 h-4 w-4" />
            Fechar
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto p-6 md:p-10">
        <article
          className={cn(
            'w-full max-w-5xl rounded-2xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl md:p-12',
            'min-h-[60vh]',
          )}
        >
          <SlideBody slide={slide} />
        </article>
      </div>

      <p className="px-4 pb-4 text-center text-xs text-slate-400">
        Use ← → ou Espaço para navegar. Esc fecha a apresentação.
      </p>
    </div>,
    document.body,
  )
}

function SlideBody({ slide }: { slide: LodgePresentationSlide }) {
  switch (slide.kind) {
    case 'cover':
      return (
        <div className="flex h-full min-h-[50vh] flex-col items-center justify-center text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-amber-200/80">
            Módulo Financeiro
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            {slide.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-slate-300 md:text-xl">
            {slide.subtitle}
          </p>
          <p className="mt-10 text-sm text-slate-400">{slide.footer}</p>
        </div>
      )
    case 'bullets':
      return (
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {slide.title}
          </h2>
          <ul className="space-y-3 text-lg text-slate-200 md:text-xl">
            {slide.bullets.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {slide.note ? (
            <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              {slide.note}
            </p>
          ) : null}
        </div>
      )
    case 'two_column':
      return (
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {slide.title}
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Column title={slide.leftTitle} items={slide.left} />
            <Column title={slide.rightTitle} items={slide.right} />
          </div>
        </div>
      )
    case 'metrics':
      return (
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {slide.title}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {slide.items.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-100">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          {slide.note ? (
            <p className="text-sm text-slate-400">{slide.note}</p>
          ) : null}
        </div>
      )
    case 'closing':
      return (
        <div className="flex h-full min-h-[50vh] flex-col justify-center space-y-8">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {slide.title}
          </h2>
          <blockquote className="border-l-4 border-amber-300 pl-5 text-2xl italic text-slate-100 md:text-3xl">
            {slide.quote}
          </blockquote>
          <ul className="space-y-2 text-lg text-slate-300">
            {slide.bullets.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      )
    default:
      return null
  }
}

function Column({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="mb-4 text-lg font-medium text-amber-100">{title}</h3>
      <ul className="space-y-3 text-base text-slate-200">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
