import { ReportHeader } from '@/components/reports/ReportHeader'
import { formatDateBR } from '@/lib/format-utils'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'

export interface LodgePranchaDocumentProps {
  authorName: string
  subject: string
  body: string
  sessionDate?: string | null
  createdAtLabel?: string
  lodgeGreeting?: string
}

/** Documento A4 pronto para imprimir, assinar e colocar no saco de propostas. */
export function LodgePranchaDocument({
  authorName,
  subject,
  body,
  sessionDate,
  createdAtLabel,
  lodgeGreeting,
}: LodgePranchaDocumentProps) {
  const siteTitle = useSiteSettingsStore((s) => s.siteTitle)
  const greeting =
    lodgeGreeting?.trim() ||
    `À Augusta e Respeitável Loja Simbólica ${siteTitle?.trim() || 'Templários da Paz'}`

  const paragraphs = body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <div className="lodge-prancha-document mx-auto w-full max-w-[210mm] bg-white p-6 text-black sm:p-10">
      <ReportHeader
        title="Prancha"
        subtitle="Para o saco de propostas"
        description={
          createdAtLabel
            ? `Documento gerado em ${createdAtLabel}`
            : 'Documento para leitura em loja e assinatura do autor'
        }
      />

      <div className="mt-6 space-y-5 text-[15px] leading-relaxed print:text-[14pt]">
        <p className="font-medium">{greeting},</p>

        <div className="space-y-1">
          <p>
            <span className="font-semibold">Assunto:</span> {subject.trim() || '—'}
          </p>
          {sessionDate ? (
            <p>
              <span className="font-semibold">Sessão de referência:</span>{' '}
              {formatDateBR(sessionDate)}
            </p>
          ) : null}
        </div>

        <div className="min-h-[220px] space-y-3 whitespace-pre-wrap">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
            ))
          ) : (
            <p className="text-gray-500">[Texto da prancha]</p>
          )}
        </div>

        <p className="pt-4">
          Sem mais para o momento, subscrevo-me com a consideração devida.
        </p>

        <div className="mt-10 flex flex-col items-center gap-8 pt-6">
          <div className="w-full max-w-sm text-center">
            <div className="mb-2 border-b border-black pt-16" />
            <p className="text-sm font-medium">{authorName.trim() || 'Irmão autor'}</p>
            <p className="text-xs text-gray-600">Assinatura</p>
          </div>
        </div>
      </div>
    </div>
  )
}
