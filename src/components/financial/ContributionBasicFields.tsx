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
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BrotherSearchCombobox,
  type BrotherOption,
} from '@/components/financial/BrotherSearchCombobox'
import { CONTRIBUTION_MONTHS } from '@/lib/contribution-payments'
import type { ContributionFormValues } from '@/lib/contribution-form-schema'
import { formatCurrencyBRL } from '@/lib/member-payments'

interface ContributionBasicFieldsProps {
  form: UseFormReturn<ContributionFormValues>
  brothers: BrotherOption[]
  brotherSelectedLabel?: string
  isEditing: boolean
  loadingBrothers: boolean
  defaultAmount: number
}

/** Irmão, mês/ano de referência, valor e status da mensalidade. */
export function ContributionBasicFields({
  form,
  brothers,
  brotherSelectedLabel,
  isEditing,
  loadingBrothers,
  defaultAmount,
}: ContributionBasicFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="brotherId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Irmão</FormLabel>
            <FormControl>
              <BrotherSearchCombobox
                brothers={brothers}
                value={field.value}
                onChange={field.onChange}
                selectedLabel={brotherSelectedLabel}
                disabled={isEditing}
                loading={loadingBrothers}
                placeholder="Buscar e selecionar irmão"
              />
            </FormControl>
            <FormDescription>Digite o nome para filtrar a lista de irmãos.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="month"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mês referência</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CONTRIBUTION_MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ano</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormDescription className="flex flex-wrap items-center gap-1">
                <span>Padrão: {formatCurrencyBRL(defaultAmount)}</span>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() =>
                    form.setValue('amount', defaultAmount, { shouldDirty: true })
                  }
                >
                  Aplicar
                </Button>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  )
}
