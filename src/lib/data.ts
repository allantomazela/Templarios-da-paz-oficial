
// Types
export interface Child {
  name: string
  dob: string
}

export interface Brother {
  id: string
  name: string
  email: string
  phone: string
  degree: 'Aprendiz' | 'Companheiro' | 'Mestre'
  role:
    | 'VenerÃ¡vel Mestre'
    | 'SecretÃ¡rio'
    | 'Tesoureiro'
    | 'Chanceler'
    | 'IrmÃ£o'
    | 'Administrador'
  status: 'Ativo' | 'Inativo'
  initiationDate: string
  elevationDate?: string
  exaltationDate?: string
  attendanceRate: number
  dob?: string
  cpf?: string
  photoUrl?: string
  
  // Additional masonic information
  masonicRegistrationNumber?: string
  obedience?: string
  originLodge?: string
  originLodgeNumber?: string
  currentLodgeNumber?: string
  affiliationDate?: string
  regularStatus?: string
  notes?: string
  
  // Spouse information
  spouseName?: string
  spouseDob?: string
  
  // Children information
  children?: Child[]
  
  // Complete address
  addressStreet?: string
  addressNumber?: string
  addressComplement?: string
  addressNeighborhood?: string
  addressCity?: string
  addressState?: string
  addressZipcode?: string
  
  // Legacy address field (for backward compatibility)
  address?: string
}

export interface Location {
  id: string
  name: string
  capacity: number
  description?: string
  equipment?: string
}

export interface EventReminder {
  id: string
  type: 'notification' | 'email'
  minutesBefore: number
}

export interface EventTimelineItem {
  id: string
  time: string
  title: string
  description?: string
}

export interface Event {
  id: string
  title: string
  date: string
  time: string
  type: 'SessÃ£o' | 'ReuniÃ£o' | 'Evento Social' | 'Outro'
  location: string // Legacy text location or fallback
  locationId?: string // Link to structured Location
  description: string
  attendees: number
  reminders?: EventReminder[]
  timeline?: EventTimelineItem[]
}

export interface Notification {
  id: string
  title: string
  message: string
  date: string
  read: boolean
  type: 'reminder' | 'system'
}

export interface Announcement {
  id: string
  title: string
  date: string
  author: string
  content: string
  isPrivate?: boolean
}

export interface BankAccount {
  id: string
  name: string
  type: 'Corrente' | 'PoupanÃ§a' | 'Caixa' | 'Investimento'
  initialBalance: number
  color?: string
}

export interface Transaction {
  id: string
  date: string
  description: string
  category: string
  type: 'Receita' | 'Despesa'
  amount: number
  accountId?: string
}

export interface Contribution {
  id: string
  brotherId: string
  month: string
  year: number
  amount: number
  status: 'Pago' | 'Pendente' | 'Atrasado'
  paymentDate?: string
}

export interface LibraryItem {
  id: string
  title: string
  type: 'PDF' | 'Imagem' | 'Video' | 'Texto'
  degree: 'Aprendiz' | 'Companheiro' | 'Mestre'
  addedAt: string
  fileUrl?: string | null
}

export interface LodgeDocument {
  id: string
  title: string
  description: string
  uploadDate: string
  category: string
  type: string
  url: string
}

/** Status do candidato Ã  iniciaÃ§Ã£o */
export type InitiationCandidateStatus =
  | 'indicado'
  | 'em_sindicancia'
  | 'aprovado'
  | 'reprovado'
  | 'iniciado'

/** Candidato indicado Ã  iniciaÃ§Ã£o na loja */
export interface InitiationCandidate {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  indicatedBy: string
  indicationDate: string
  status: InitiationCandidateStatus
  notes?: string | null
  createdAt: string
  updatedAt: string
}

/** DefiniÃ§Ã£o de uma fase da sindicÃ¢ncia (template da loja) */
export interface SindicanciaPhaseDefinition {
  id: string
  name: string
  order: number
  description?: string | null
  createdAt?: string
}

/** Status do andamento de uma fase para um candidato */
export type CandidatePhaseStatus = 'pending' | 'in_progress' | 'completed' | 'rejected'

/** Andamento de um candidato em uma fase da sindicÃ¢ncia */
export interface CandidatePhaseProgress {
  id: string
  candidateId: string
  phaseDefinitionId: string
  status: CandidatePhaseStatus
  startedAt?: string | null
  completedAt?: string | null
  /** Data prevista para a prÃ³xima verificaÃ§Ã£o/checagem desta fase (YYYY-MM-DD) */
  scheduledCheckDate?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  phaseDefinition?: SindicanciaPhaseDefinition
}

export interface Message {
  id: string
  subject: string
  content: string
  sender: string
  senderId: string
  recipients: string[]
  date: string
  read: boolean
  type: 'received' | 'sent'
}

export interface Category {
  id: string
  name: string
  type: 'Receita' | 'Despesa'
}

export interface Budget {
  id: string
  name: string
  type: 'Receita' | 'Despesa'
  category?: string
  amount: number
  period: 'Mensal' | 'Anual' | 'Personalizado'
  startDate?: string
  endDate?: string
}

export interface FinancialGoal {
  id: string
  name: string
  targetAmount: number
  linkedCategory?: string
  deadline: string
}

export interface ReminderSettings {
  enabled: boolean
  frequency: 'before' | 'on_due' | 'after'
  days: number
}

export interface ReminderLog {
  id: string
  brotherId: string
  contributionId: string
  sentDate: string
  method: 'Email' | 'WhatsApp'
}

// Chancellor Specific Types
export interface SessionRecord {
  id: string
  eventId: string
  date: string
  charityCollection: number
  observations: string
  status: 'Pendente' | 'Finalizada'
}

export interface Attendance {
  id: string
  sessionRecordId: string
  brotherId: string
  status: 'Presente' | 'Ausente' | 'Justificado'
  justification?: string
}

export interface VisitorAttendance {
  id: string
  sessionRecordId: string
  name: string
  degree: 'Aprendiz' | 'Companheiro' | 'Mestre'
  lodge: string
  lodgeNumber: string
  obedience: string
  masonicNumber?: string
}

export interface Solid {
  id: string
  date: string
  amount: number
  category: 'Hospitalaria' | 'ManutenÃ§Ã£o' | 'Eventos' | 'Outros'
  description: string
  brotherId?: string
}
