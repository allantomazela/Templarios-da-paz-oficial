import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Brother, Child } from '@/lib/data'
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { FormHeader } from '@/components/ui/form-header'
import { Loader2, Upload, X, Plus, Search, UserPlus } from 'lucide-react'
import { useImageUpload } from '@/hooks/use-image-upload'
import {
  formatCPF,
  formatPhone,
  formatCEP,
  unformatCPF,
  unformatPhone,
  unformatCEP,
  validateCPF,
  validatePhone,
  validateCEP,
} from '@/lib/format-utils'
import { fetchCEPData } from '@/lib/cep-utils'
import { useToast } from '@/hooks/use-toast'

// Schema for a single child
const childSchema = z.object({
  name: z.string().min(1, 'Nome do filho é obrigatório'),
  dob: z.string().min(1, 'Data de nascimento do filho é obrigatória'),
})

// Main form schema
const brotherSchema = z.object({
  name: z.string().min(3, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório').refine(
    (val) => validatePhone(val),
    'Telefone inválido (deve ter 10 ou 11 dígitos)'
  ),
  cpf: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateCPF(val),
      'CPF inválido'
    ),
  dob: z.string().min(1, 'Data de nascimento é obrigatória'),
  photoUrl: z.string().optional(),
  initiationDate: z.string().min(1, 'Data de iniciação é obrigatória'),
  elevationDate: z.string().optional(),
  exaltationDate: z.string().optional(),
  degree: z.enum(['Aprendiz', 'Companheiro', 'Mestre']),
  
  // Additional masonic information
  masonicRegistrationNumber: z.string().optional(),
  obedience: z.string().optional(),
  originLodge: z.string().optional(),
  originLodgeNumber: z.string().optional(),
  currentLodgeNumber: z.string().optional(),
  affiliationDate: z.string().optional(),
  regularStatus: z.string().optional(),
  notes: z.string().optional(),
  
  // Spouse
  spouseName: z.string().optional(),
  spouseDob: z.string().optional(),
  
  // Children
  children: z.array(childSchema).default([]),
  
  // Address
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZipcode: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateCEP(val),
      'CEP inválido (deve ter 8 dígitos)'
    ),
  
  // Legacy address
  address: z.string().optional(),
})

type BrotherFormValues = z.infer<typeof brotherSchema>

interface BrotherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brotherToEdit: Brother | null
  onSave: (data: BrotherFormValues) => void
}

export function BrotherDialog({
  open,
  onOpenChange,
  brotherToEdit,
  onSave,
}: BrotherDialogProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isLoadingCEP, setIsLoadingCEP] = useState(false)
  const { toast } = useToast()

  const imageUpload = useImageUpload({
    bucket: 'site-assets',
    folder: 'brothers-photos',
    maxSize: 800,
    quality: 0.85,
    successMessage: 'Foto enviada com sucesso.',
    errorMessage: 'Não foi possível enviar a foto. Tente novamente.',
  })

  const form = useForm<BrotherFormValues>({
    resolver: zodResolver(brotherSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      dob: '',
      photoUrl: '',
      initiationDate: '',
      elevationDate: '',
      exaltationDate: '',
      degree: 'Aprendiz',
      masonicRegistrationNumber: '',
      obedience: '',
      originLodge: '',
      originLodgeNumber: '',
      currentLodgeNumber: '',
      affiliationDate: '',
      regularStatus: '',
      notes: '',
      spouseName: '',
      spouseDob: '',
      children: [],
      addressStreet: '',
      addressNumber: '',
      addressComplement: '',
      addressNeighborhood: '',
      addressCity: '',
      addressState: '',
      addressZipcode: '',
      address: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'children',
  })

  useEffect(() => {
    if (!open) return

    if (brotherToEdit) {
      const children: Child[] = brotherToEdit.children || []
      
      form.reset({
        name: brotherToEdit.name,
        email: brotherToEdit.email,
        phone: brotherToEdit.phone,
        cpf: brotherToEdit.cpf || '',
        dob: brotherToEdit.dob || '',
        photoUrl: brotherToEdit.photoUrl || '',
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
      })
      
      if (brotherToEdit.photoUrl) {
        setPhotoPreview(brotherToEdit.photoUrl)
        imageUpload.reset()
      } else {
        setPhotoPreview(null)
        imageUpload.reset()
      }
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        dob: '',
        photoUrl: '',
        initiationDate: '',
        elevationDate: '',
        exaltationDate: '',
        degree: 'Aprendiz',
        masonicRegistrationNumber: '',
        obedience: '',
        originLodge: '',
        originLodgeNumber: '',
        currentLodgeNumber: '',
        affiliationDate: '',
        regularStatus: '',
        notes: '',
        spouseName: '',
        spouseDob: '',
        children: [],
        addressStreet: '',
        addressNumber: '',
        addressComplement: '',
        addressNeighborhood: '',
        addressCity: '',
        addressState: '',
        addressZipcode: '',
        address: '',
      })
      setPhotoPreview(null)
      imageUpload.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brotherToEdit?.id, open])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await imageUpload.handleUpload(file)
    if (url) {
      form.setValue('photoUrl', url)
      setPhotoPreview(url)
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
    } catch (error) {
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

  const handleSubmit = (data: BrotherFormValues) => {
    // Unformat values before saving
    const unformattedData = {
      ...data,
      cpf: data.cpf ? unformatCPF(data.cpf) : undefined,
      phone: unformatPhone(data.phone),
      addressZipcode: data.addressZipcode ? unformatCEP(data.addressZipcode) : undefined,
    }
    onSave(unformattedData)
  }

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <FormHeader
          title={brotherToEdit ? 'Editar Irmão' : 'Adicionar Novo Irmão'}
          description="Gerencie as informações pessoais e maçônicas do irmão."
          icon={<UserPlus className="h-5 w-5" />}
        />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Photo Upload Section */}
            <div className="space-y-2">
              <FormLabel>Foto</FormLabel>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={handleRemovePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
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
                  {imageUpload.isUploading && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando foto...
                    </div>
                  )}
                </div>
              </div>
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          {brazilianStates.map((state) => (
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

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
