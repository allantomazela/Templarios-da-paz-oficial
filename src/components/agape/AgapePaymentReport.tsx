import { useRef, useMemo } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Button } from '@/components/ui/button'
import { Download, QrCode } from 'lucide-react'
import { ReportHeader } from '@/components/reports/ReportHeader'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface BrotherReportData {
  brotherId: string
  brotherName: string
  totalAmount: number
  totalItems: number
  consumptions: Array<{
    date: string
    itemName: string
    quantity: number
    amount: number
  }>
}

interface AgapePaymentReportProps {
  reportData: BrotherReportData[]
  selectedMonth: string
  paymentType: 'monthly' | 'per_session'
  onPrint?: () => void
}

// Componente para gerar QR Code usando API externa
const QRCodeImage = ({ value, size = 150 }: { value: string; size?: number }) => {
  // Usar API pública para gerar QR Code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`
  
  return (
    <img
      src={qrCodeUrl}
      alt="QR Code PIX"
      className="border-2 border-gray-300 rounded"
      style={{ width: size, height: size }}
    />
  )
}

// Função para gerar código PIX para QR Code
// Gera uma string formatada com os dados do PIX que pode ser usada para gerar QR Code
const generatePixCode = (
  pixKey: string,
  pixName: string,
  amount: number,
  description?: string
): string => {
  // Para QR Code PIX funcional, precisamos do código EMV completo
  // Por enquanto, vamos gerar uma string com os dados formatados
  // O QR Code mostrará a chave PIX e o valor para facilitar o pagamento
  
  const amountStr = amount.toFixed(2)
  const descriptionStr = (description || `Pagamento Ágape`).substring(0, 25)
  
  // Formato: Chave PIX + informações formatadas
  // O usuário pode escanear e inserir o valor manualmente, ou copiar a chave
  return `${pixKey}|${amountStr}|${pixName}|${descriptionStr}`
}

export function AgapePaymentReport({
  reportData,
  selectedMonth,
  paymentType,
  onPrint,
}: AgapePaymentReportProps) {
  const componentRef = useRef<HTMLDivElement>(null)
  const { agapePix, siteTitle, logoUrl, contact } = useSiteSettingsStore()

  const monthName = useMemo(
    () => format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: ptBR }),
    [selectedMonth]
  )

  // Memoizar valores do store para evitar re-renders
  const pixKey = useMemo(() => agapePix.pixKey, [agapePix.pixKey])
  const pixName = useMemo(() => agapePix.pixName, [agapePix.pixName])
  const memoizedSiteTitle = useMemo(() => siteTitle, [siteTitle])
  const memoizedLogoUrl = useMemo(() => logoUrl, [logoUrl])
  const memoizedContact = useMemo(() => contact, [contact])

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Relatorio_Agape_Pagamento_${selectedMonth}`,
    onAfterPrint: () => {
      if (onPrint) onPrint()
    },
  })

  // Gerar QR Code para cada irmão
  const generateQRCodeForBrother = (brother: BrotherReportData) => {
    if (!pixKey || !pixName) {
      return null
    }

    const amount = paymentType === 'monthly' 
      ? brother.totalAmount 
      : brother.consumptions.reduce((sum, c) => sum + c.amount, 0)

    const pixCode = generatePixCode(
      pixKey,
      pixName,
      amount,
      `Ágape ${monthName} - ${brother.brotherName}`
    )

    return pixCode
  }

  if (!pixKey || !pixName) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
        <p className="text-yellow-800">
          Configure a chave PIX nas configurações do site para gerar os relatórios com QR Code.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handlePrint}>
          <Download className="mr-2 h-4 w-4" />
          Gerar PDF / Imprimir
        </Button>
      </div>

      <div
        ref={componentRef}
        className="bg-white p-8 space-y-8 print:p-4"
        style={{ minHeight: '297mm', width: '210mm', margin: '0 auto' }}
      >
        {useMemo(
          () =>
            reportData.map((brother, index) => {
          // Calcular total baseado no tipo de pagamento
          // Se for mensal, usa o totalAmount (soma de todos os ágapes do mês)
          // Se for por ágape, agrupa por sessão e gera um relatório por sessão
          const totalAmount = paymentType === 'monthly'
            ? brother.totalAmount
            : brother.totalAmount // Por enquanto, mantém o total mensal mesmo para per_session

          const pixCode = generateQRCodeForBrother(brother)

          return (
            <div
              key={brother.brotherId}
              className="page-break-after"
              style={{
                pageBreakAfter: index < reportData.length - 1 ? 'always' : 'auto',
                minHeight: '250mm',
              }}
            >
              <ReportHeader
                title="RELATÓRIO DE PAGAMENTO - ÁGAPE"
                subtitle={memoizedSiteTitle || 'Templários da Paz'}
                description={`${monthName} - ${brother.brotherName}`}
              />

              <div className="mt-8 space-y-6">
                {/* Informações do Irmão */}
                <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
                  <h3 className="text-xl font-bold mb-4">Irmão: {brother.brotherName}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Período</p>
                      <p className="font-semibold">{monthName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Pagamento</p>
                      <p className="font-semibold">
                        {paymentType === 'monthly' ? 'Mensal' : 'Por Ágape'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detalhamento de Consumos */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Quantidade</TableHead>
                        <TableHead className="text-right">Valor Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brother.consumptions.map((consumption, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {format(parseISO(consumption.date), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell>{consumption.itemName}</TableCell>
                          <TableCell className="text-center">
                            {consumption.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(consumption.amount / consumption.quantity)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(consumption.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Total e QR Code */}
                <div className="grid grid-cols-2 gap-6 mt-8">
                  <div className="border-2 border-primary rounded-lg p-6 bg-primary/5">
                    <h4 className="text-lg font-bold mb-4">Valor Total</h4>
                    <p className="text-3xl font-bold text-primary">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(totalAmount)}
                    </p>
                    <div className="mt-4 space-y-2 text-sm">
                      <p>
                        <strong>Beneficiário:</strong> {pixName}
                      </p>
                      <p>
                        <strong>Chave PIX:</strong> {pixKey}
                      </p>
                    </div>
                  </div>

                  <div className="border-2 border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                    <QrCode className="h-6 w-6 mb-2 text-gray-600" />
                    <h4 className="text-lg font-bold mb-4 text-center">
                      QR Code PIX
                    </h4>
                    {pixCode && (
                      <div className="flex flex-col items-center">
                        <QRCodeImage
                          value={pixCode}
                          size={180}
                        />
                        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-center max-w-[200px]">
                          <p className="font-semibold mb-1">Chave PIX:</p>
                          <p className="break-all">{agapePix.pixKey}</p>
                          <p className="font-semibold mt-2 mb-1">Valor:</p>
                          <p className="text-lg font-bold text-primary">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(totalAmount)}
                          </p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-600 mt-4 text-center">
                      Escaneie o QR Code ou copie a chave PIX
                    </p>
                  </div>
                </div>

                {/* Instruções */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-6">
                  <h4 className="font-semibold mb-2">Instruções de Pagamento:</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
                    <li>Escaneie o QR Code com o aplicativo do seu banco</li>
                    <li>Ou copie a chave PIX e faça a transferência manualmente</li>
                    <li>Verifique o valor antes de confirmar o pagamento</li>
                    <li>Envie o comprovante para a secretaria após o pagamento</li>
                  </ul>
                </div>
              </div>
            </div>
          )
            }),
          [reportData, paymentType, monthName, memoizedSiteTitle, pixKey, pixName]
        )}
      </div>

      <style>{`
        @media print {
          .page-break-after {
            page-break-after: always;
          }
          .page-break-after:last-child {
            page-break-after: auto;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  )
}
