import { useEffect, useState, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Brother, Child } from '@/lib/data'
import { DialogFooter } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Upload, X, Plus, Search, User } from 'lucide-react'
import { useImageUpload } from '@/hooks/use-image-upload'
import {
  formatCPF,
  formatPhone,
  formatCEP,
  unformatCPF,
  unformatPhone,
  unformatCEP,
} from '@/lib/format-utils'
import { fetchCEPData } from '@/lib/cep-utils'
import { useToast } from '@/hooks/use-toast'
import {
  BROTHER_PROFILE_AUTO,
  BROTHER_PROFILE_NONE,
  fetchApprovedProfilesForLink,
  profileLinkLabel,
} from '@/lib/brother-profile-link'
import {
  brotherFormSchema,
  brotherFormDefaultValues,
  BRAZILIAN_STATES,
  type BrotherFormValues,
} from '@/lib/brother-form-schema'
import {
  normalizeBrotherPhoneForForm,
  resolveBrotherPhotoFromProfile,
} from '@/lib/brother-registration-utils'
import {
  getProfileInitials,
  resolveProfileAvatarUrl,
} from '@/lib/profile-avatar'

export type { BrotherFormValues }

export type BrotherFormMode = 'secretariat' | 'self'

interface BrotherFormProps {
  brotherToEdit: Brother | null
  onSave: (data: BrotherFormValues) => void | Promise<void>
  isSaving?: boolean
  mode?: BrotherFormMode
  active?: boolean
  onCancel?: () => void
  submitLabel?: string
  /** Avatar do perfil — no modo self a foto segue sempre o Meu Perfil */
  profileAvatarUrl?: string | null
  userName?: string
}

export function BrotherForm({
  brotherToEdit,
  onSave,
  isSaving = false,
  mode = 'secretariat',
  active = true,
  onCancel,
  submitLabel,
  profileAvatarUrl,
  userName,
}: BrotherFormProps) {
  const isSelfMode = mode === 'self'
  const syncedProfilePhoto = resolveBrotherPhotoFromProfile(
    profileAvatarUrl,
    brotherToEdit?.photoUrl,
  )
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    isSelfMode ? (syncedProfilePhoto ?? null) : null,
  )
  const [isLoadingCEP, setIsLoadingCEP] = useState(false)
  const [approvedProfiles, setApprovedProfiles] = useState<
    { id: string; full_name: string | null; email: string | null }[]
  >([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false)
  const photoBlobRef = useRef<string | null>(null)
  const { toast } = useToast()

  const revokePhotoBlob = () => {
    if (photoBlobRef.current) {
      URL.revokeObjectURL(photoBlobRef.current)
      photoBlobRef.current = null
    }
  }

  const imageUpload = useImageUpload({
    bucket: 'site-assets',
    folder: 'brothers-photos',
    maxSize: 800,
    maxFileSizeBytes: 5 * 1024 * 1024, // 5 MB — rejeita arquivos grandes antes do upload
    quality: 0.85,
    successMessage: 'Foto enviada com sucesso.',
    errorMessage: 'Não foi possível enviar a foto. Use imagem de até 5 MB (JPG ou PNG) e tente novamente.',
  })

  const form = useForm<BrotherFormValues>({
    resolver: zodResolver(brotherFormSchema),
    defaultValues: brotherFormDefaultValues,
  })

  const isSavingForm =
    isSaving || isSubmittingLocal || form.formState.isSubmitting

  useEffect(() => {
    if (!active || isSelfMode) return
    setLoadingProfiles(true)
    fetchApprovedProfilesForLink()
      .then(setApprovedProfiles)
      .catch(() => setApprovedProfiles([]))
      .finally(() => setLoadingProfiles(false))
  }, [active, isSelfMode])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'children',
  })

  useEffect(() => {
    if (!active) {
      revokePhotoBlob()
      return
    }
    revokePhotoBlob()

    if (brotherToEdit) {
      const children: Child[] = brotherToEdit.children || []

      form.reset({
        name: brotherToEdit.name,
        email: brotherToEdit.email,
        phone: normalizeBrotherPhoneForForm(brotherToEdit.phone),
        cpf: brotherToEdit.cpf || '',
        dob: brotherToEdit.dob || '',
        photoUrl: isSelfMode
          ? (syncedProfilePhoto ?? '')
          : (brotherToEdit.photoUrl || ''),
        initiationDate: brotherToEdit.initiationDate,
        elevationDate: brotherToEdit.elevationDate || '',
        exaltationDate: brotherToEdit.exaltationDate || '',
        degree: brotherToEdit.degree,
        masonicRegistrationNumber: brotherToEdit.masonicRegistrationNumber || '',
        obedience: brotherToEdit.obedience || '',
        originLodge: brotherToEdit.originLodge || '',
        originLodgeNumber: brotherToEdit.originLodgeNumber || '',
        currentLodgeNumber: brotherToEdit.currentLodgeNumber || '',
        affiliationDate: brotherToEdit.affiliationDate || '',
        regularStatus: brotherToEdit.regularStatus || '',
        notes: brotherToEdit.notes || '',
        spouseName: brotherToEdit.spouseName || '',
        spouseDob: brotherToEdit.spouseDob || '',
        children: children,
        addressStreet: brotherToEdit.addressStreet || '',
        addressNumber: brotherToEdit.addressNumber || '',
        addressComplement: brotherToEdit.addressComplement || '',
        addressNeighborhood: brotherToEdit.addressNeighborhood || '',
        addressCity: brotherToEdit.addressCity || '',
        addressState: brotherToEdit.addressState || '',
        addressZipcode: brotherToEdit.addressZipcode || '',
        address: brotherToEdit.address || '',
        profileId: brotherToEdit.profileId || BROTHER_PROFILE_AUTO,
      })

      if (isSelfMode) {
        setPhotoPreview(syncedProfilePhoto ?? null)
        imageUpload.reset()
      } else if (brotherToEdit.photoUrl) {
        setPhotoPreview(brotherToEdit.photoUrl)
        imageUpload.reset()
      } else {
        setPhotoPreview(null)
        imageUpload.reset()
      }
    } else {
      form.reset(brotherFormDefaultValues)
      setPhotoPreview(null)
      imageUpload.reset()
    }
    return () => revokePhotoBlob()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brotherToEdit?.id, active, isSelfMode, profileAvatarUrl])

  useEffect(() => {
    if (!active || !isSelfMode) return
    const url = syncedProfilePhoto ?? ''
    form.setValue('photoUrl', url)
    setPhotoPreview(url || null)
  }, [active, form, isSelfMode, syncedProfilePhoto])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    revokePhotoBlob()
    const blobUrl = URL.createObjectURL(file)
    photoBlobRef.current = blobUrl
    setPhotoPreview(blobUrl)

    const url = await imageUpload.handleUpload(file)
    revokePhotoBlob()
    if (url) {
      setPhotoPreview(url)
      form.setValue('photoUrl', url)
    }
  }

  const handleRemovePhoto = () => {
    form.setValue('photoUrl', '')
    setPhotoPreview(null)
    imageUpload.reset()
  }

  const handleCEPBlur = async () => {
    const cep = form.getValues('addressZipcode')
    if (!cep || cep.replace(/\D/g, '').length !== 8) return

    setIsLoadingCEP(true)
    try {
      const cepData = await fetchCEPData(cep)

      if (cepData) {
        form.setValue('addressStreet', cepData.logradouro)
        form.setValue('addressNeighborhood', cepData.bairro)
        form.setValue('addressCity', cepData.localidade)
        form.setValue('addressState', cepData.uf)
        if (cepData.complemento) {
          form.setValue('addressComplement', cepData.complemento)
        }

        toast({
          title: 'CEP encontrado',
          description: 'Endereço preenchido automaticamente.',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'CEP não encontrado',
          description: 'Verifique o CEP digitado.',
        })
      }
    } catch (_error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível buscar o CEP. Tente novamente.',
      })
    } finally {
      setIsLoadingCEP(false)
    }
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    form.setValue('cpf', formatted)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    form.setValue('phone', formatted)
  }

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value)
    form.setValue('addressZipcode', formatted)
  }

  const handleSubmit = async (data: BrotherFormValues) => {
    if (imageUpload.isUploading) {
      toast({
        variant: 'destructive',
        title: 'Aguarde o envio da foto',
        description: 'Espere o upload da foto terminar antes de salvar.',
      })
      return
    }

    setIsSubmittingLocal(true)
    try {
      const unformattedData = {
        ...data,
        photoUrl: isSelfMode
          ? (syncedProfilePhoto ?? undefined)
          : data.photoUrl,
        cpf: data.cpf ? unformatCPF(data.cpf) : undefined,
        phone: unformatPhone(data.phone),
        addressZipcode: data.addressZipcode
          ? unformatCEP(data.addressZipcode)
          : undefined,
      }
      await onSave(unformattedData)
    } finally {
      setIsSubmittingLocal(false)
    }
  }

  const saveButtonLabel = isSavingForm
    ? 'Salvando...'
    : (submitLabel ?? 'Salvar')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Photo */}
            <div className="space-y-2">
              <FormLabel>Foto</FormLabel>
              {isSelfMode ? (
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24 border">
                    <AvatarImage
                      src={resolveProfileAvatarUrl(profileAvatarUrl)}
                      alt={userName || 'Foto de perfil'}
                    />
                    <AvatarFallback className="bg-muted text-xl font-medium text-muted-foreground">
                      {resolveProfileAvatarUrl(profileAvatarUrl) ? (
                        <User className="h-10 w-10" aria-hidden />
                      ) : (
                        getProfileInitials(userName)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">
                    Esta é a mesma foto exibida no menu e na aba Informações
                    Pessoais. Para alterá-la, use a seção Foto de Perfil nessa
                    aba.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                      {imageUpload.isUploading && (
                        <div className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                          <span className="sr-only">Enviando foto...</span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleRemovePhoto}
                        disabled={imageUpload.isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center">
                      {imageUpload.isUploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      ref={imageUpload.inputRef}
                      onChange={handlePhotoUpload}
                      disabled={imageUpload.isUploading}
                      className="cursor-pointer"
                    />
                    {imageUpload.isUploading && !photoPreview && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando foto...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do irmão" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@exemplo.com"
                          {...field}
                          disabled={isSelfMode}
                          readOnly={isSelfMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!isSelfMode && (
                  <FormField
                    control={form.control}
                    name="profileId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Conta no sistema (mensalidades)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || BROTHER_PROFILE_AUTO}
                          disabled={loadingProfiles}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  loadingProfiles
                                    ? 'Carregando contas...'
                                    : 'Selecione o vínculo'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={BROTHER_PROFILE_AUTO}>
                              Vincular automaticamente pelo e-mail
                            </SelectItem>
                            <SelectItem value={BROTHER_PROFILE_NONE}>
                              Sem vínculo com conta
                            </SelectItem>
                            {approvedProfiles.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profileLinkLabel(profile)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Usado para mensalidades na tesouraria e histórico na
                          secretaria.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          maxLength={14}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleCPFChange(e)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handlePhoneChange(e)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Masonic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados Maçônicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="initiationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Iniciação *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="degree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grau *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o grau" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                          <SelectItem value="Companheiro">Companheiro</SelectItem>
                          <SelectItem value="Mestre">Mestre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="elevationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Elevação</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="exaltationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Exaltação</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="masonicRegistrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Registro Maçônico</FormLabel>
                      <FormControl>
                        <Input placeholder="Número de registro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="obedience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obediência</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a obediência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GOB">GOB - Grande Oriente do Brasil</SelectItem>
                          <SelectItem value="GLESP">GLESP - Grande Loja do Estado de São Paulo</SelectItem>
                          <SelectItem value="COMAB">COMAB - Confederação da Maçonaria do Brasil</SelectItem>
                          <SelectItem value="Outra">Outra</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="originLodge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loja de Origem</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da loja de origem" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="originLodgeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Loja de Origem</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentLodgeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Loja Atual</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="affiliationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Filiação à Loja Atual</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="regularStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status de Regularidade</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Regular">Regular</SelectItem>
                          <SelectItem value="Irregular">Irregular</SelectItem>
                          <SelectItem value="Suspenso">Suspenso</SelectItem>
                          <SelectItem value="Afastado">Afastado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações gerais sobre o irmão..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Spouse Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados do Cônjuge</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="spouseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cônjuge</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="spouseDob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento do Cônjuge</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Children Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filhos</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: '', dob: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Filho
                </Button>
              </div>
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum filho adicionado. Clique em "Adicionar Filho" para incluir.
                </p>
              )}
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg"
                >
                  <FormField
                    control={form.control}
                    name={`children.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Filho</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`children.${index}.dob`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Endereço Completo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="addressZipcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="00000-000"
                            maxLength={9}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handleCEPChange(e)
                            }}
                            onBlur={handleCEPBlur}
                            className="pr-10"
                          />
                          {isLoadingCEP && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          {!isLoadingCEP && field.value && field.value.replace(/\D/g, '').length === 8 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={handleCEPBlur}
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Digite o CEP e pressione Tab ou clique no ícone para buscar o endereço
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logradouro</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, Avenida, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressComplement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Apto, Bloco, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressNeighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BRAZILIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

        {onCancel ? (
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSavingForm || imageUpload.isUploading}
            >
              {isSavingForm && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {saveButtonLabel}
            </Button>
          </DialogFooter>
        ) : (
          <div className="flex justify-end pt-6 border-t">
            <Button
              type="submit"
              disabled={isSavingForm || imageUpload.isUploading}
            >
              {isSavingForm && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {saveButtonLabel}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
