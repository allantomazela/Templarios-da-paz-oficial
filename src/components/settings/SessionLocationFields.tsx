import type { Control } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Location } from '@/lib/data'
import { LODGE_EVENT_LOCATION_ID, LODGE_TEMPLE_NAME } from '@/lib/event-locations'
import type { SessionScheduleFormValues } from './SessionScheduleSettings'

interface SessionLocationFieldsProps {
  control: Control<SessionScheduleFormValues>
  lodgeLocationLabel: string
  locations: Location[]
}

export function SessionLocationFields({
  control,
  lodgeLocationLabel,
  locations,
}: SessionLocationFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={control}
        name="defaultLocationId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Local padrão</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={LODGE_EVENT_LOCATION_ID}>{lodgeLocationLabel}</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="templeName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do templo</FormLabel>
            <FormControl>
              <Input {...field} placeholder={LODGE_TEMPLE_NAME} maxLength={80} />
            </FormControl>
            <FormDescription>
              Aparece como “Local” na folha do livro de presença e no relatório GOB.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
