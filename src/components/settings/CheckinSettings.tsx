import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { Loader2, Save, MapPin } from 'lucide-react'
import { useAsyncOperation } from '@/hooks/use-async-operation'

const checkinSchema = z.object({
  latitude: z
    .union([z.string().regex(/^-?\d+(\.\d+)?$/, 'Use número decimal (ex: -22.8864)'), z.literal('')])
    .optional()
    .default(''),
  longitude: z
    .union([z.string().regex(/^-?\d+(\.\d+)?$/, 'Use número decimal (ex: -48.4414)'), z.literal('')])
    .optional()
    .default(''),
  radiusMeters: z
    .union([z.string().regex(/^\d+$/, 'Apenas número inteiro'), z.literal('')])
    .optional()
    .default(''),
  openMinutesBefore: z
    .union([z.string().regex(/^\d+$/, 'Apenas número inteiro'), z.literal('')])
    .optional()
    .default(''),
})

type CheckinFormValues = z.infer<typeof checkinSchema>

function formatCoord(value: number | null): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

export function CheckinSettings() {
  const { templeCheckin, updateTempleCheckin } = useSiteSettingsStore()
  const { toast } = useToast()
  const prevValuesRef = useRef<string>('')

  const form = useForm<CheckinFormValues>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      latitude: formatCoord(templeCheckin.latitude) as string,
      longitude: formatCoord(templeCheckin.longitude) as string,
      radiusMeters: templeCheckin.radiusMeters != null ? String(templeCheckin.radiusMeters) : '',
      openMinutesBefore:
        templeCheckin.openMinutesBefore != null ? String(templeCheckin.openMinutesBefore) : '',
    },
  })

  useEffect(() => {
    const currentValues = `${templeCheckin.latitude}|${templeCheckin.longitude}|${templeCheckin.radiusMeters}|${templeCheckin.openMinutesBefore}`
    if (prevValuesRef.current !== currentValues) {
      prevValuesRef.current = currentValues
      form.reset({
        latitude: formatCoord(templeCheckin.latitude),
        longitude: formatCoord(templeCheckin.longitude),
        radiusMeters: templeCheckin.radiusMeters != null ? String(templeCheckin.radiusMeters) : '',
        openMinutesBefore:
          templeCheckin.openMinutesBefore != null ? String(templeCheckin.openMinutesBefore) : '',
      })
    }
  }, [
    templeCheckin.latitude,
    templeCheckin.longitude,
    templeCheckin.radiusMeters,
    templeCheckin.openMinutesBefore,
    form,
  ])

  const { execute: handleSave, loading } = useAsyncOperation(
    async (data: CheckinFormValues) => {
      const lat = data.latitude?.trim() ? Number(data.latitude) : undefined
      const lng = data.longitude?.trim() ? Number(data.longitude) : undefined
      const radius = data.radiusMeters?.trim() ? Number(data.radiusMeters) : undefined
      const minutes = data.openMinutesBefore?.trim() ? Number(data.openMinutesBefore) : undefined
      await updateTempleCheckin({
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
        radiusMeters: radius ?? undefined,
        openMinutesBefore: minutes ?? undefined,
      })
      toast({
        title: 'Configurações salvas',
        description: 'As configurações de check-in por QR foram atualizadas.',
      })
    },
    {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as configurações de check-in.',
        })
      },
    },
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Check-in por QR Code
        </CardTitle>
        <CardDescription>
          Defina a localização do templo e o raio permitido para check-in por geolocalização, e quantos
          minutos antes do início da sessão o check-in é liberado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => handleSave(data))} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude do templo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="-22.8864"
                        type="text"
                        inputMode="decimal"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>Ex.: -22.8864 para Botucatu</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude do templo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="-48.4414"
                        type="text"
                        inputMode="decimal"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>Ex.: -48.4414 para Botucatu</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="radiusMeters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raio permitido (metros)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="100"
                        type="text"
                        inputMode="numeric"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>Check-in só é aceito dentro deste raio do ponto do templo.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="openMinutesBefore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liberar check-in (minutos antes)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="30"
                        type="text"
                        inputMode="numeric"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>Ex.: 30 = check-in liberado 30 min antes do horário da sessão.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-5" />
                  Salvar configurações
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
