import { formatCurrencyBRLMaybeHidden } from '@/lib/financial-amount-visibility'

export interface LodgePresentationMetrics {
  lodgeName: string
  generatedAt: Date
  accountCount: number
  globalBalance: number
  periodLabel: string
  periodIncome: number
  periodExpense: number
  periodResult: number
}

export interface BuildLodgePresentationOptions {
  metrics: LodgePresentationMetrics
  /** Inclui slide com números da tesouraria. */
  includeAmounts: boolean
  /** Quando false, mascara valores monetários. */
  amountsVisible: boolean
}

export type LodgePresentationSlide =
  | {
      id: string
      kind: 'cover'
      title: string
      subtitle: string
      footer: string
    }
  | {
      id: string
      kind: 'bullets'
      title: string
      bullets: string[]
      note?: string
    }
  | {
      id: string
      kind: 'two_column'
      title: string
      leftTitle: string
      left: string[]
      rightTitle: string
      right: string[]
    }
  | {
      id: string
      kind: 'metrics'
      title: string
      items: { label: string; value: string }[]
      note?: string
    }
  | {
      id: string
      kind: 'closing'
      title: string
      quote: string
      bullets: string[]
    }

/** Módulos já disponíveis no Financeiro do sistema (lista estática de produto). */
export const LODGE_FINANCIAL_SYSTEM_MODULES = [
  'Dashboard e visão de saldo',
  'Contas bancárias e conferência com extrato',
  'Fluxo de caixa, receitas e despesas',
  'Contas a pagar',
  'Mensalidades e cronograma',
  'Tronco de Beneficência',
  'Fechamento do Ágape',
  'Vendas do Templo',
  'Metas, orçamentos e planejamento',
  'Relatórios para prestação de contas',
] as const

function formatPresentationDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Monta o roteiro pronto para projetar em loja.
 * Conteúdo institucional + (opcional) métricas do sistema.
 */
export function buildLodgePresentationSlides(
  options: BuildLodgePresentationOptions,
): LodgePresentationSlide[] {
  const { metrics, includeAmounts, amountsVisible } = options
  const money = (value: number) =>
    formatCurrencyBRLMaybeHidden(value, amountsVisible)

  const slides: LodgePresentationSlide[] = [
    {
      id: 'cover',
      kind: 'cover',
      title: 'Tesouraria da Loja',
      subtitle: `${metrics.lodgeName} — deveres, funcionamento e o que já temos`,
      footer: formatPresentationDate(metrics.generatedAt),
    },
    {
      id: 'objectives',
      kind: 'bullets',
      title: 'Objetivo desta apresentação',
      bullets: [
        'Explicar o que é a Tesouraria',
        'Clarificar os deveres do Tesoureiro',
        'Mostrar o que o sistema já oferece hoje',
        'Alinhar práticas de transparência e controle',
      ],
    },
    {
      id: 'what-is',
      kind: 'bullets',
      title: 'O que é a Tesouraria',
      bullets: [
        'Órgão responsável por administrar os recursos da Loja',
        'Registra entradas e saídas com clareza',
        'Presta contas à Diretoria e à Assembleia',
        'Apoia decisões com posição de caixa e compromissos reais',
      ],
      note: 'Não substitui autorizações da Loja nem confunde Tronco de Beneficência com o caixa ordinário.',
    },
    {
      id: 'duties',
      kind: 'two_column',
      title: 'Deveres do Tesoureiro',
      leftTitle: 'Receber e pagar',
      left: [
        'Receber mensalidades, taxas e valores autorizados',
        'Pagar despesas devidamente autorizadas',
        'Zelar por comprovantes e extratos',
        'Informar inadimplência com discrição e respeito',
      ],
      rightTitle: 'Registrar e prestar contas',
      right: [
        'Manter registros atualizados',
        'Apresentar posição de caixa periodicamente',
        'Separar caixa operacional e beneficência',
        'Trabalhar em harmonia com Venerável e Secretário',
      ],
    },
    {
      id: 'flow',
      kind: 'bullets',
      title: 'Como funciona o fluxo',
      bullets: [
        'Entradas → Contas (caixa/banco) → Autorização → Saídas',
        'Tudo passa por registro e conferência',
        'Relatórios sustentam a prestação de contas em loja',
        'Histórico pode ser “só controle”; pagamento atual alimenta o caixa',
      ],
    },
    {
      id: 'system',
      kind: 'bullets',
      title: 'O que já temos no sistema',
      bullets: [...LODGE_FINANCIAL_SYSTEM_MODULES],
    },
  ]

  if (includeAmounts) {
    slides.push({
      id: 'metrics',
      kind: 'metrics',
      title: 'Posição atual da Tesouraria',
      items: [
        { label: 'Contas cadastradas', value: String(metrics.accountCount) },
        { label: 'Saldo global', value: money(metrics.globalBalance) },
        {
          label: `Receitas (${metrics.periodLabel})`,
          value: money(metrics.periodIncome),
        },
        {
          label: `Despesas (${metrics.periodLabel})`,
          value: money(metrics.periodExpense),
        },
        {
          label: `Resultado (${metrics.periodLabel})`,
          value: money(metrics.periodResult),
        },
      ],
      note: amountsVisible
        ? 'Valores gerados automaticamente a partir do módulo Financeiro.'
        : 'Valores ocultos para apresentação em local público. Use o olhinho se precisar revelar.',
    })
  }

  slides.push(
    {
      id: 'routine',
      kind: 'bullets',
      title: 'Rotina sugerida com o sistema',
      bullets: [
        'Extrato do banco → conferência nas Contas',
        'PIX de mensalidade → Mensalidades (cronograma ou lote)',
        'Contas do mês → Contas a pagar / Despesas',
        'Sessão → Tronco, Ágape ou Vendas, conforme o caso',
        'Fechamento → Dashboard e Relatórios',
      ],
    },
    {
      id: 'principles',
      kind: 'bullets',
      title: 'Princípios de boa governança',
      bullets: [
        'Registrar no mesmo dia (ou em até 48h)',
        'Anexar comprovante sempre que possível',
        'Separar controle histórico de caixa real',
        'Prestar contas com periodicidade definida',
        'Tratar dados dos irmãos com discrição',
      ],
    },
    {
      id: 'closing',
      kind: 'closing',
      title: 'Encerramento',
      quote: 'Tesouraria ordenada é cuidado com a Casa e com os Irmãos.',
      bullets: [
        'Perguntas e contribuições da Assembleia',
        'Padronizar data de fechamento mensal',
        'Treinar suplente no sistema para sucessão do cargo',
      ],
    },
  )

  return slides
}
