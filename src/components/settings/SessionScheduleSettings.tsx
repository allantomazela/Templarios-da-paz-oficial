import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Form,
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
import { Checkbox } from '@/components/ui/checkbox'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import useChancellorStore from '@/stores/useChancellorStore'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, CalendarClock } from 'lucide-react'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  SESSION_WEEKDAY_OPTIONS,
  SESSION_WEEK_OF_MONTH_OPTIONS,
} from '@/lib/session-generator'
import {
  LODGE_EVENT_LOCATION_ID,
  buildLodgeLocationName,
} from '@/lib/event-locations'

const sessionScheduleSchema = z.object({
  weekday: z.coerce.number().min(0).max(6),
  weeksOfMonth: z
    .array(z.number())
    .min(1, 'Selecione ao menos uma semana do mês'),
  defaultTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use o formato HH:mm'),
  defaultTitle: z.string().min(3, 'Título é obrigatório'),
  defaultLocationId: z.string().min(1, 'Selecione um local'),
  monthsAhead: z.coerce.number().min(1).max(24),
})

type SessionScheduleFormValues = z.infer<typeof sessionScheduleSchema>

export function SessionScheduleSettings() {
  const {
    sessionSchedule,
    updateSessionSchedule,
    siteTitle,
    contact,
  } = useSiteSettingsStore()
  const locations = useChancellorStore((s) => s.locations)
  const { toast } = useToast()
  const prevValuesRef = useRef<string>('')

  const form = useForm<SessionScheduleFormValues>({
    resolver: zodResolver(sessionScheduleSchema),
    defaultValues: {
      weekday: sessionSchedule.weekday,
      weeksOfMonth: sessionSchedule.weeksOfMonth,
      defaultTime: sessionSchedule.defaultTime,
      defaultTitle: sessionSchedule.defaultTitle,
      defaultLocationId: sessionSchedule.defaultLocationId,
      monthsAhead: sessionSchedule.monthsAhead,
    },
  })

  useEffect(() => {
    const currentValues = JSON.stringify(sessionSchedule)
    if (prevValuesRef.current !== currentValues) {
      prevValuesRef.current = currentValues
      form.reset({
        weekday: sessionSchedule.weekday,
        weeksOfMonth: sessionSchedule.weeksOfMonth,
        defaultTime: sessionSchedule.defaultTime,
        defaultTitle: sessionSchedule.defaultTitle,
        defaultLocationId: sessionSchedule.defaultLocationId,
        monthsAhead: sessionSchedule.monthsAhead,
      })
    }
  }, [sessionSchedule, form])

  const { execute: handleSave, loading } = useAsyncOperation(
    async (data: SessionScheduleFormValues) => {
      await updateSessionSchedule(data)
      toast({
        title: 'Calendário de sessões salvo',
        description:
          'As configurações serão usadas na geração automática da agenda.',
      })
    },
    {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar o calendário de sessões.',
        })
      },
    },
  )

  const selectedWeeks = form.watch('weeksOfMonth') ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Calendário de Sessões
        </CardTitle>
        <CardDescription>
          Defina o padrão de sessões da loja (dia da semana e semanas do mês).
          Use a agenda para gerar automaticamente os próximos meses e edite datas
          individuais quando necessário.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="weekday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia da semana</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o dia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SESSION_WEEKDAY_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={String(option.value)}
                          >
                            {option.label}
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
                name="defaultTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário padrão</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="weeksOfMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semanas do mês</FormLabel>
                  <FormDescription>
                    Ex.: 1ª, 3ª e 4ª semana = três sessões por mês naquele dia.
                  </FormDescription>
                  <div className="flex flex-wrap gap-4 pt-2">
                    {SESSION_WEEK_OF_MONTH_OPTIONS.map((option) => {
                      const checked = field.value?.includes(option.value)
                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(isChecked) => {
                              const current = field.value ?? []
                              if (isChecked) {
                                field.onChange(
                                  [...current, option.value].sort(
                                    (a, b) => a - b,
                                  ),
                                )
                              } else {
                                field.onChange(
                                  current.filter((week) => week !== option.value),
                                )
                              }
                            }}
                          />
                          {option.label}
                        </label>
                      )
                    })}
                  </div>
                  <FormMessage />
                  {selectedWeeks.length === 0 && (
                    <p className="text-sm text-destructive">
                      Selecione ao menos uma semana.
                    </p>
                  )}
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="defaultTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título padrão</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Sessão Ordinária" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthsAhead"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meses à frente (geração)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={24} {...field} />
                    </FormControl>
                    <FormDescription>
                      Quantidade de meses criados ao gerar sessões na agenda.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
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
                      <SelectItem value={LODGE_EVENT_LOCATION_ID}>
                        {buildLodgeLocationName(siteTitle, contact.city)}
                      </SelectItem>
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

            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar calendário
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
