import * as z from 'zod'
import { validateCPF, validatePhone, validateCEP } from '@/lib/format-utils'
import { BROTHER_PROFILE_AUTO } from '@/lib/brother-profile-link'

const childSchema = z.object({
  name: z.string().min(1, 'Nome do filho é obrigatório'),
  dob: z.string().min(1, 'Data de nascimento do filho é obrigatória'),
})

function filterFilledChildren(value: unknown): unknown {
  if (!Array.isArray(value)) return []
  return value.filter((child) => {
    if (!child || typeof child !== 'object') return false
    const row = child as { name?: string; dob?: string }
    return (
      String(row.name ?? '').trim().length > 0 &&
      String(row.dob ?? '').trim().length > 0
    )
  })
}

export const brotherFormSchema = z.object({
  name: z.string().min(3, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .refine(
      (val) => validatePhone(val),
      'Telefone inválido (deve ter 10 ou 11 dígitos)',
    ),
  cpf: z
    .string()
    .optional()
    .refine((val) => !val || validateCPF(val), 'CPF inválido'),
  dob: z.string().min(1, 'Data de nascimento é obrigatória'),
  photoUrl: z.string().optional(),
  initiationDate: z.string().min(1, 'Data de iniciação é obrigatória'),
  elevationDate: z.string().optional(),
  exaltationDate: z.string().optional(),
  degree: z.enum(['Aprendiz', 'Companheiro', 'Mestre']),
  masonicRegistrationNumber: z.string().optional(),
  obedience: z.string().optional(),
  originLodge: z.string().optional(),
  originLodgeNumber: z.string().optional(),
  currentLodgeNumber: z.string().optional(),
  affiliationDate: z.string().optional(),
  regularStatus: z.string().optional(),
  notes: z.string().optional(),
  spouseName: z.string().optional(),
  spouseDob: z.string().optional(),
  children: z.preprocess(filterFilledChildren, z.array(childSchema).default([])),
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
      'CEP inválido (deve ter 8 dígitos)',
    ),
  address: z.string().optional(),
  profileId: z.string().optional(),
})

export type BrotherFormValues = z.infer<typeof brotherFormSchema>

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export const brotherFormDefaultValues: BrotherFormValues = {
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
  profileId: BROTHER_PROFILE_AUTO,
}
