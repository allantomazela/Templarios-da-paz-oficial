import { useState, useEffect, useRef } from 'react'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useToast } from '@/hooks/use-toast'
import {
  Image as ImageIcon,
  Loader2,
  Upload,
  Building2,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react'
import {
  BrandLogoImg,
  BRAND_LOGO_INTRINSIC_SIZE,
} from '@/components/brand/BrandLogoImg'
import { compressLogoForUpload } from '@/lib/image-utils'
import { uploadToStorage } from '@/lib/upload-utils'
import { logError } from '@/lib/logger'
import { getSaveErrorMessage } from '@/lib/auth-utils'

const lodgeInfoSchema = z.object({
  lodgeName: z.string().min(1, 'Nome da loja é obrigatório'),
  logoUrl: z.string().optional(),
  address: z.string().min(1, 'Endereço é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  zip: z.string().min(1, 'CEP é obrigatório'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido'),
  secondaryEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  messageEmail: z.string().email('Email inválido').optional().or(z.literal('')),
})

export function LodgeInfoSettings() {
  const {
    siteTitle,
    metaDescription,
    logoUrl,
    contact,
    updateSeo,
    updateLogo,
    updateContact,
  } = useSiteSettingsStore()
  const { toast } = useToast()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoPreviewVersion, setLogoPreviewVersion] = useState(0)

  const form = useForm({
    resolver: zodResolver(lodgeInfoSchema),
    defaultValues: {
      lodgeName: siteTitle,
      logoUrl: logoUrl,
      address: contact.address,
      city: contact.city,
      zip: contact.zip,
      phone: contact.phone || '',
      email: contact.email,
      secondaryEmail: contact.secondaryEmail || '',
      messageEmail: contact.messageEmail || '',
    },
  })

  // Synchronize form when store data changes
  useEffect(() => {
    form.reset({
      lodgeName: siteTitle,
      logoUrl: logoUrl,
      address: contact.address,
      city: contact.city,
      zip: contact.zip,
      phone: contact.phone || '',
      email: contact.email,
      secondaryEmail: contact.secondaryEmail || '',
      messageEmail: contact.messageEmail || '',
    })
  }, [siteTitle, logoUrl, contact, form])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    try {
      const optimizedFile = await compressLogoForUpload(file)
      const publicUrl = await uploadToStorage(
        optimizedFile,
        'site-assets',
        'logos',
      )
      form.setValue('logoUrl', publicUrl, { shouldDirty: true })
      setLogoPreviewVersion(Date.now())
      toast({
        title: 'Upload Concluído',
        description: 'A imagem do logo foi carregada com sucesso.',
      })
    } catch (error) {
      logError('Error uploading logo', error)
      toast({
        variant: 'destructive',
        title: 'Erro no Upload',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar a imagem do logo.',
      })
    } finally {
      setIsUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: z.infer<typeof lodgeInfoSchema>) => {
    try {
      // Update site title (lodge name) - preserve existing description
      await updateSeo({ title: data.lodgeName, description: metaDescription })

      // Update logo if changed
      if (data.logoUrl && data.logoUrl !== logoUrl) {
        await updateLogo(data.logoUrl)
        setLogoPreviewVersion(Date.now())
      }

      // Update contact information
      await updateContact({
        address: data.address,
        city: data.city,
        zip: data.zip,
        phone: data.phone || '',
        email: data.email,
        secondaryEmail: data.secondaryEmail || '',
        messageEmail: data.messageEmail || '',
      })

      toast({
        title: 'Dados da Loja Atualizados',
        description: 'As informações foram salvas com sucesso.',
      })
    } catch (error) {
      logError('Error updating lodge info', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: getSaveErrorMessage(error),
      })
    }
  }

  const currentLogoUrl = form.watch('logoUrl')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Loja
            </CardTitle>
            <CardDescription>
              Configure as informações básicas da loja maçônica, incluindo nome,
              logo, endereço e contatos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nome da Loja */}
            <FormField
              control={form.control}
              name="lodgeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Loja</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: ARLS Templários da Paz"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Nome oficial da loja maçônica.
                  </p>
                </FormItem>
              )}
            />

            {/* Logo */}
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo da Loja</FormLabel>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/10 overflow-hidden relative p-4">
                        {isUploadingLogo ? (
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : (
                          <BrandLogoImg
                            logoUrl={currentLogoUrl}
                            alt="Logo Preview"
                            className="h-full w-full object-contain"
                            fallbackClassName="w-16 h-16 text-primary/50"
                            width={BRAND_LOGO_INTRINSIC_SIZE}
                            height={BRAND_LOGO_INTRINSIC_SIZE}
                            sizes="128px"
                            loading="eager"
                            fetchPriority="high"
                            cacheBustKey={logoPreviewVersion || undefined}
                          />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Pré-visualização
                      </span>
                    </div>

                    <div className="flex-1 space-y-4 w-full">
                      <div className="space-y-2">
                        <FormControl>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="https://..."
                                className="pl-9"
                                {...field}
                                disabled={isUploadingLogo}
                              />
                            </div>
                            <input
                              type="file"
                              ref={logoInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleLogoUpload}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => logoInputRef.current?.click()}
                              disabled={isUploadingLogo}
                            >
                              {isUploadingLogo ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground">
                          URL da imagem ou upload. Para melhor nitidez (incluindo
                          retina), use PNG ou SVG com fundo transparente; raster
                          até cerca de 768–1024 px no maior lado (o sistema
                          otimiza até 768 px e preserva transparência em PNG/WebP).
                        </p>
                      </div>
                    </div>
                  </div>
                </FormItem>
              )}
            />

            {/* Endereço */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                Endereço
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, número..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade/Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="Botucatu - SP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Telefone */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4" />
                Telefone
              </div>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone de Contato</FormLabel>
                    <FormControl>
                      <Input placeholder="(14) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      Telefone exibido na seção de contato do site.
                    </p>
                  </FormItem>
                )}
              />
            </div>

            {/* Emails */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4" />
                Emails
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Principal</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contato@..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondaryEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Secundário</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="secretaria@..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="messageEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email para Receber Mensagens do Site</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="mensagens@..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      Este email receberá as mensagens enviadas pelo formulário
                      de contato do site.
                    </p>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={form.formState.isSubmitting || isUploadingLogo}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar Dados da Loja
          </Button>
        </div>
      </form>
    </Form>
  )
}
