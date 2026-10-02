import type { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { ContributionTreasuryMode } from '@/lib/contribution-payments'
import type { ContributionFormValues } from '@/lib/contribution-form-schema'

interface ContributionTreasuryModeFieldProps {
  form: UseFormReturn<ContributionFormValues>
}

export function ContributionTreasuryModeField({ form }: ContributionTreasuryModeFieldProps) {
  return (
    <FormField
      control={form.control}
      name="treasuryMode"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>Tesouraria</FormLabel>
          <FormControl>
            <RadioGroup
              value={field.value ?? 'standard'}
              onValueChange={(value) => {
                field.onChange(value as ContributionTreasuryMode)
                if (value === 'control_only') {
                  form.setValue('accountId', '')
                  form.setValue('linkedTransactionId', '')
                }
                if (value === 'standard') {
                  form.setValue('linkedTransactionId', '')
                }
              }}
              className="space-y-2"
            >
              {TREASURY_MODE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-start gap-2 rounded-md border p-3">
                  <RadioGroupItem value={option.value} id={option.id} className="mt-0.5" />
                  <Label
                    htmlFor={option.id}
                    className="cursor-pointer space-y-1 font-normal"
                  >
                    <span className="block text-sm font-medium">{option.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

const TREASURY_MODE_OPTIONS: {
  value: ContributionTreasuryMode
  id: string
  title: string
  description: string
}[] = [
  {
    value: 'standard',
    id: 'treasury-standard',
    title: 'Lançar receita no caixa',
    description: 'Cria ou atualiza a receita na conta bancária selecionada.',
  },
  {
    value: 'control_only',
    id: 'treasury-control-only',
    title: 'Pago — somente controle',
    description: 'Marca o mês como quitado sem gerar nova receita (valor já está no caixa).',
  },
  {
    value: 'link_existing',
    id: 'treasury-link-existing',
    title: 'Vincular receita existente',
    description: 'Associa uma receita de mensalidade já lançada na tesouraria.',
  },
]
