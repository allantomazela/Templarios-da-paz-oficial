import type { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LinkableMensalidadeTransaction } from '@/lib/contribution-payments'
import type { ContributionFormValues } from '@/lib/contribution-form-schema'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { formatDateBR } from '@/lib/format-utils'
import { ContributionTreasuryModeField } from '@/components/financial/ContributionTreasuryModeField'

interface ContributionTreasuryFieldsProps {
  form: UseFormReturn<ContributionFormValues>
  isProductionPeriod: boolean
  accounts: { id: string; name: string }[]
  loadingOptions: boolean
  linkableTransactions: LinkableMensalidadeTransaction[]
  loadingLinkable: boolean
}

/** Campos exibidos quando a mensalidade está como "Pago". */
export function ContributionTreasuryFields({
  form,
  isProductionPeriod,
  accounts,
  loadingOptions,
  linkableTransactions,
  loadingLinkable,
}: ContributionTreasuryFieldsProps) {
  const treasuryMode = form.watch('treasuryMode') ?? 'standard'

  return (
    <>
      <FormField
        control={form.control}
        name="paymentDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data do pagamento</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {isProductionPeriod ? <ContributionTreasuryModeField form={form} /> : null}

      {treasuryMode === 'link_existing' && isProductionPeriod ? (
        <FormField
          control={form.control}
          name="linkedTransactionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Receita existente</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={loadingLinkable}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingLinkable ? 'Carregando receitas...' : 'Selecione a receita'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {linkableTransactions.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      Nenhuma receita disponível para este irmão
                    </SelectItem>
                  ) : (
                    linkableTransactions.map((tx) => (
                      <SelectItem key={tx.id} value={tx.id}>
                        {formatDateBR(tx.date)} — {formatCurrencyBRL(tx.amount)}
                        {tx.referenceMatch && tx.referenceLabel
                          ? ` · ref. ${tx.referenceLabel}`
                          : ' · sem ref. na descrição'}
                        {tx.accountName ? ` (${tx.accountName})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Inclui receitas manuais sem (MM/AAAA) na descrição. Prioriza as da
                referência do mês selecionado.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {treasuryMode === 'standard' ? (
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta bancária (tesouraria)</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={loadingOptions}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Onde entrou o valor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Gera receita na categoria Mensalidade e compõe o saldo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </>
  )
}
