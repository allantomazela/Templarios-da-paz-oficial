import { describe, expect, it } from 'vitest'
import {
  LODGE_FINANCIAL_SYSTEM_MODULES,
  buildLodgePresentationSlides,
  type LodgePresentationMetrics,
} from '@/lib/financial-lodge-presentation'

const baseMetrics: LodgePresentationMetrics = {
  lodgeName: 'Templários da Paz',
  generatedAt: new Date('2026-11-16T12:00:00'),
  accountCount: 3,
  globalBalance: 1500,
  periodLabel: 'Ano atual',
  periodIncome: 8000,
  periodExpense: 6500,
  periodResult: 1500,
}

describe('buildLodgePresentationSlides', () => {
  it('gera roteiro institucional sem slide de valores quando includeAmounts é false', () => {
    const slides = buildLodgePresentationSlides({
      metrics: baseMetrics,
      includeAmounts: false,
      amountsVisible: true,
    })

    expect(slides[0]?.kind).toBe('cover')
    expect(slides.some((slide) => slide.kind === 'metrics')).toBe(false)
    expect(slides.at(-1)?.kind).toBe('closing')
    expect(LODGE_FINANCIAL_SYSTEM_MODULES.length).toBeGreaterThan(5)
  })

  it('inclui métricas mascaradas quando valores estão ocultos', () => {
    const slides = buildLodgePresentationSlides({
      metrics: baseMetrics,
      includeAmounts: true,
      amountsVisible: false,
    })
    const metricsSlide = slides.find((slide) => slide.kind === 'metrics')
    expect(metricsSlide?.kind).toBe('metrics')
    if (metricsSlide?.kind !== 'metrics') return
    expect(metricsSlide.items.some((item) => item.value.includes('••••'))).toBe(
      true,
    )
  })
})
