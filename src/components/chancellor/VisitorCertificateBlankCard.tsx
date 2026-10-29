import { useRef, useState } from 'react'
import { Loader2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  buildBlankVisitorCertificateFileBaseName,
  exportVisitorCertificateAssets,
  getVisitorCertificateCaptureElement,
  openVisitorCertificatePrintWindow,
  VISITOR_CERTIFICATE_WIDTH_CSS,
} from '@/lib/visitor-certificate-export'
import { VisitorCertificateDocument } from './VisitorCertificateDocument'

type VisitorCertificateBlankCardProps = {
  venerableMaster: string
  chancellor: string
}

export function VisitorCertificateBlankCard({
  venerableMaster,
  chancellor,
}: VisitorCertificateBlankCardProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [printing, setPrinting] = useState(false)
  const { toast } = useToast()

  async function handlePrint() {
    const element = getVisitorCertificateCaptureElement(sheetRef.current)
    if (!element) return

    setPrinting(true)
    try {
      const assets = await exportVisitorCertificateAssets(element)
      const opened = openVisitorCertificatePrintWindow(
        assets.jpegDataUrl,
        buildBlankVisitorCertificateFileBaseName(),
      )
      if (!opened) {
        toast({
          title: 'Pop-up bloqueado',
          description:
            'Permita pop-ups para abrir o visualizador de impressão do certificado.',
          variant: 'destructive',
        })
        return
      }
      toast({
        title: 'Formulário em branco',
        description:
          'O cartão foi aberto para impressão. Escolha quantas cópias quiser.',
      })
    } catch (error) {
      console.error('Erro ao imprimir certificado em branco:', error)
      toast({
        title: 'Erro ao imprimir',
        description: 'Não foi possível gerar o formulário em branco.',
        variant: 'destructive',
      })
    } finally {
      setPrinting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preenchimento manual</CardTitle>
        <CardDescription>
          Imprime o mesmo cartão de 20 cm × 15 cm com linhas em branco. Não
          precisa escolher a sessão nem preencher o visitante. Na janela de
          impressão, escolha a quantidade de cópias.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handlePrint()}
            disabled={printing}
            className="gap-2"
          >
            {printing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Imprimir para preenchimento manual
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border bg-neutral-200/60 p-4 dark:bg-neutral-900/40">
          <div
            ref={sheetRef}
            className="visitor-certificate-print-sheet mx-auto shadow-lg"
            style={{ width: VISITOR_CERTIFICATE_WIDTH_CSS }}
          >
            <VisitorCertificateDocument
              blank
              venerableMaster={venerableMaster}
              chancellor={chancellor}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
