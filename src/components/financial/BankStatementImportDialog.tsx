import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Upload, Loader2 } from 'lucide-react'
import type { BankAccount, Transaction } from '@/lib/data'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import {
  matchStatementLinesToTransactions,
  parseBankStatementCsv,
  type BankStatementLine,
  type ParsedBankStatement,
} from '@/lib/bank-statement-csv-import'
import { Badge } from '@/components/ui/badge'

interface BankStatementImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: BankAccount[]
  transactions: Transaction[]
  defaultAccountId?: string
  onApply: (params: {
    accountId: string
    closingBalance: number
    lines: BankStatementLine[]
  }) => void
}

export function BankStatementImportDialog({
  open,
  onOpenChange,
  accounts,
  transactions,
  defaultAccountId,
  onApply,
}: BankStatementImportDialogProps) {
  const [accountId, setAccountId] = useState(defaultAccountId ?? '')
  const [parsed, setParsed] = useState<ParsedBankStatement | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)

  const matches = useMemo(() => {
    if (!parsed || !accountId) return []
    return matchStatementLinesToTransactions(
      parsed.lines,
      transactions,
      accountId,
    )
  }, [parsed, accountId, transactions])

  const unmatchedCount = matches.filter((row) => !row.matched).length
  const matchedCount = matches.length - unmatchedCount

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setReading(true)
    setParseError(null)
    setParsed(null)
    setFileName(file.name)

    try {
      const text = await file.text()
      const result = parseBankStatementCsv(text)
      if (result.lines.length === 0) {
        setParseError(
          'Não foi possível ler lançamentos. Use CSV com colunas Data, Descrição, Valor e Saldo.',
        )
        return
      }
      if (result.closingBalance === null) {
        setParseError(
          'Extrato lido, mas sem coluna Saldo. Informe o saldo final manualmente na tabela.',
        )
      }
      setParsed(result)
    } catch {
      setParseError('Falha ao ler o arquivo CSV.')
    } finally {
      setReading(false)
    }
  }

  const handleApply = () => {
    if (!parsed?.closingBalance || !accountId) return
    onApply({
      accountId,
      closingBalance: parsed.closingBalance,
      lines: parsed.lines,
    })
    onOpenChange(false)
    setParsed(null)
    setFileName(null)
    setParseError(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setParsed(null)
      setFileName(null)
      setParseError(null)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar extrato CSV</DialogTitle>
          <DialogDescription>
            Compatível com exportações comuns (Stone e similares): colunas Data,
            Descrição/Histórico, Valor e Saldo. O saldo final do arquivo preenche
            a conferência da conta selecionada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="import-account">Conta</Label>
            <Select
              value={accountId}
              onValueChange={setAccountId}
            >
              <SelectTrigger id="import-account">
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statement-csv">Arquivo CSV</Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" asChild disabled={reading}>
                <label htmlFor="statement-csv" className="cursor-pointer">
                  {reading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Escolher arquivo
                </label>
              </Button>
              <input
                id="statement-csv"
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={handleFileChange}
              />
              {fileName ? (
                <span className="text-sm text-muted-foreground truncate">
                  {fileName}
                </span>
              ) : null}
            </div>
          </div>

          {parseError ? (
            <p className="text-sm text-amber-700">{parseError}</p>
          ) : null}

          {parsed ? (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex flex-wrap gap-3 text-sm">
                <span>
                  <strong>{parsed.lines.length}</strong> lançamento(s)
                </span>
                {parsed.closingBalance !== null ? (
                  <span>
                    Saldo final:{' '}
                    <strong>{formatCurrencyBRL(parsed.closingBalance)}</strong>
                  </span>
                ) : null}
                {accountId && matches.length > 0 ? (
                  <span>
                    Cruzamento:{' '}
                    <strong className="text-green-700">{matchedCount}</strong>{' '}
                    no sistema ·{' '}
                    <strong className="text-amber-700">{unmatchedCount}</strong>{' '}
                    só no extrato
                  </span>
                ) : null}
              </div>

              {accountId && matches.length > 0 ? (
                <div className="max-h-48 overflow-auto rounded border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Extrato</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Sistema</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.slice(0, 20).map((row, index) => (
                        <TableRow key={`${row.statementLine.date}-${index}`}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {formatDateBR(row.statementLine.date)}
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">
                            {row.statementLine.description}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {formatCurrencyBRL(row.statementLine.amount)}
                          </TableCell>
                          <TableCell>
                            {row.matched ? (
                              <Badge variant="outline" className="text-green-700">
                                Encontrado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-700">
                                Só extrato
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {matches.length > 20 ? (
                    <p className="p-2 text-xs text-muted-foreground">
                      Mostrando 20 de {matches.length} linhas.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!parsed?.closingBalance || !accountId}
            onClick={handleApply}
          >
            Usar saldo do extrato
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
