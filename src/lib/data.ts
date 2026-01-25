import { z } from 'zod'

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
    | 'Venerável Mestre'
    | 'Secretário'
    | 'Tesoureiro'
    | 'Chanceler'
    | 'Irmão'
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
  type: 'Sessão' | 'Reunião' | 'Evento Social' | 'Outro'
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
  type: 'Corrente' | 'Poupança' | 'Caixa' | 'Investimento'
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
  category: 'Hospitalaria' | 'Manutenção' | 'Eventos' | 'Outros'
  description: string
  brotherId?: string
}

// Mock Data
export const mockBrothers: Brother[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@loja.com',
    phone: '(14) 99999-0001',
    degree: 'Mestre',
    role: 'Venerável Mestre',
    status: 'Ativo',
    initiationDate: '2010-05-15',
    elevationDate: '2011-06-20',
    exaltationDate: '2012-08-10',
    attendanceRate: 98,
    dob: '1980-03-10',
    cpf: '123.456.789-00',
    address: 'Rua das Acácias, 123',
  },
  {
    id: '2',
    name: 'Pedro Santos',
    email: 'pedro@loja.com',
    phone: '(14) 99999-0002',
    degree: 'Mestre',
    role: 'Secretário',
    status: 'Ativo',
    initiationDate: '2012-08-20',
    elevationDate: '2013-09-15',
    exaltationDate: '2014-11-20',
    attendanceRate: 95,
    dob: '1982-07-22',
    cpf: '234.567.890-11',
    address: 'Av. Brasil, 456',
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    email: 'carlos@loja.com',
    phone: '(14) 99999-0003',
    degree: 'Mestre',
    role: 'Tesoureiro',
    status: 'Ativo',
    initiationDate: '2015-03-10',
    elevationDate: '2016-04-22',
    exaltationDate: '2017-06-15',
    attendanceRate: 92,
    dob: '1985-01-15',
    cpf: '345.678.901-22',
    address: 'Rua da Fraternidade, 789',
  },
  {
    id: '4',
    name: 'Marcos Souza',
    email: 'marcos@loja.com',
    phone: '(14) 99999-0004',
    degree: 'Companheiro',
    role: 'Irmão',
    status: 'Ativo',
    initiationDate: '2023-01-15',
    elevationDate: '2024-02-20',
    attendanceRate: 85,
    dob: '1990-11-05',
    cpf: '456.789.012-33',
    address: 'Travessa da Luz, 321',
  },
  {
    id: '5',
    name: 'Lucas Pereira',
    email: 'lucas@loja.com',
    phone: '(14) 99999-0005',
    degree: 'Aprendiz',
    role: 'Irmão',
    status: 'Ativo',
    initiationDate: '2023-11-20',
    attendanceRate: 100,
    dob: '1995-05-30',
    cpf: '567.890.123-44',
    address: 'Alameda dos Obreiros, 654',
  },
]

export const mockLocations: Location[] = [
  {
    id: '1',
    name: 'Templo Principal',
    capacity: 60,
    description: 'Templo para sessões magnas e ordinárias.',
    equipment: 'Som, Ar Condicionado, Projetor',
  },
  {
    id: '2',
    name: 'Salão de Banqueteria',
    capacity: 100,
    description: 'Área para ágapes e eventos sociais.',
    equipment: 'Cozinha Industrial, Palco, Som',
  },
  {
    id: '3',
    name: 'Sala de Reuniões',
    capacity: 15,
    description: 'Sala para reuniões administrativas e comissões.',
    equipment: 'TV, Quadro Branco',
  },
]

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Sessão Ordinária Grau I',
    date: '2025-05-20',
    time: '20:00',
    type: 'Sessão',
    location: 'Templo Principal',
    locationId: '1',
    description: 'Sessão regular de instrução.',
    attendees: 25,
    timeline: [
      { id: 't1', time: '19:30', title: 'Recepção dos Irmãos' },
      { id: 't2', time: '20:00', title: 'Abertura da Sessão' },
      { id: 't3', time: '22:00', title: 'Encerramento' },
    ],
    reminders: [
      { id: 'r1', type: 'notification', minutesBefore: 60 },
      { id: 'r2', type: 'email', minutesBefore: 1440 }, // 1 day
    ],
  },
  {
    id: '2',
    title: 'Banquete Ritualístico',
    date: '2025-06-21',
    time: '19:00',
    type: 'Evento Social',
    location: 'Salão de Festas',
    locationId: '2',
    description: 'Comemoração do Solstício.',
    attendees: 40,
    timeline: [
      { id: 't1', time: '19:00', title: 'Coquetel' },
      { id: 't2', time: '20:30', title: 'Jantar' },
    ],
  },
  {
    id: '3',
    title: 'Reunião de Diretoria',
    date: '2025-05-25',
    time: '19:30',
    type: 'Reunião',
    location: 'Sala Administrativa',
    locationId: '3',
    description: 'Planejamento do trimestre.',
    attendees: 7,
  },
  {
    id: '4',
    title: 'Sessão Magna de Iniciação',
    date: '2025-07-15',
    time: '16:00',
    type: 'Sessão',
    location: 'Templo Principal',
    locationId: '1',
    description: 'Iniciação de 2 candidatos.',
    attendees: 50,
  },
]

export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Lembrete de Sessão',
    message: 'Sessão Ordinária Grau I começa em 1 hora.',
    date: '2025-05-20T19:00:00',
    read: false,
    type: 'reminder',
  },
  {
    id: '2',
    title: 'Novo Documento',
    message: 'Novo ritual disponível na biblioteca.',
    date: '2025-05-18T10:00:00',
    read: true,
    type: 'system',
  },
]

export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Convocação para Sessão Magna',
    date: '2025-05-18',
    author: 'Secretaria',
    content:
      'Todos os irmãos estão convocados para a Sessão Magna de Iniciação.',
  },
  {
    id: '2',
    title: 'Campanha do Agasalho',
    date: '2025-05-10',
    author: 'Hospitalaria',
    content:
      'Estamos arrecadando agasalhos para doação. Entregar na secretaria.',
  },
]

export const mockCategories: Category[] = [
  { id: '1', name: 'Mensalidades', type: 'Receita' },
  { id: '2', name: 'Doações', type: 'Receita' },
  { id: '3', name: 'Aluguéis', type: 'Receita' },
  { id: '4', name: 'Eventos', type: 'Receita' },
  { id: '5', name: 'Outros', type: 'Receita' },
  { id: '6', name: 'Utilidades', type: 'Despesa' },
  { id: '7', name: 'Manutenção', type: 'Despesa' },
  { id: '8', name: 'Ritualística', type: 'Despesa' },
  { id: '9', name: 'Eventos', type: 'Despesa' },
  { id: '10', name: 'Administrativo', type: 'Despesa' },
  { id: '11', name: 'Beneficência', type: 'Despesa' },
  { id: '12', name: 'Outros', type: 'Despesa' },
  { id: '13', name: 'Tronco de Beneficência', type: 'Receita' },
]

export const mockBankAccounts: BankAccount[] = [
  {
    id: '1',
    name: 'Banco do Brasil',
    type: 'Corrente',
    initialBalance: 12000,
    color: 'hsl(var(--chart-1))',
  },
  {
    id: '2',
    name: 'Caixa da Tesouraria',
    type: 'Caixa',
    initialBalance: 500,
    color: 'hsl(var(--chart-2))',
  },
  {
    id: '3',
    name: 'Investimento CDI',
    type: 'Investimento',
    initialBalance: 50000,
    color: 'hsl(var(--chart-3))',
  },
]

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2025-05-01',
    description: 'Mensalidades Maio',
    category: 'Mensalidades',
    type: 'Receita',
    amount: 5500.0,
    accountId: '1',
  },
  {
    id: '2',
    date: '2025-05-05',
    description: 'Conta de Energia',
    category: 'Utilidades',
    type: 'Despesa',
    amount: 450.0,
    accountId: '1',
  },
  {
    id: '3',
    date: '2025-05-10',
    description: 'Manutenção Predial',
    category: 'Manutenção',
    type: 'Despesa',
    amount: 1200.0,
    accountId: '1',
  },
  {
    id: '4',
    date: '2025-05-12',
    description: 'Doação Benemérita',
    category: 'Doações',
    type: 'Receita',
    amount: 1000.0,
    accountId: '2',
  },
  {
    id: '5',
    date: '2025-05-15',
    description: 'Compra de Paramentos',
    category: 'Ritualística',
    type: 'Despesa',
    amount: 800.0,
    accountId: '1',
  },
  {
    id: '6',
    date: '2025-05-20',
    description: 'Aluguel Salão',
    category: 'Aluguéis',
    type: 'Receita',
    amount: 2500.0,
    accountId: '1',
  },
  {
    id: '7',
    date: '2025-05-25',
    description: 'Jantar Solstício',
    category: 'Eventos',
    type: 'Despesa',
    amount: 3500.0,
    accountId: '2',
  },
]

export const mockContributions: Contribution[] = [
  {
    id: '1',
    brotherId: '1',
    month: 'Maio',
    year: 2025,
    amount: 150.0,
    status: 'Pago',
    paymentDate: '2025-05-05',
  },
  {
    id: '2',
    brotherId: '2',
    month: 'Maio',
    year: 2025,
    amount: 150.0,
    status: 'Pago',
    paymentDate: '2025-05-10',
  },
  {
    id: '3',
    brotherId: '3',
    month: 'Maio',
    year: 2025,
    amount: 150.0,
    status: 'Pendente',
  },
  {
    id: '4',
    brotherId: '4',
    month: 'Abril',
    year: 2025,
    amount: 150.0,
    status: 'Atrasado',
  },
]

export const mockLibrary: LibraryItem[] = [
  {
    id: '1',
    title: 'Ritual de Aprendiz Comentado',
    type: 'PDF',
    degree: 'Aprendiz',
    addedAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'Simbologia do Grau II',
    type: 'PDF',
    degree: 'Companheiro',
    addedAt: '2024-02-20',
  },
  {
    id: '3',
    title: 'A Lenda de Hiram Abiff',
    type: 'Texto',
    degree: 'Mestre',
    addedAt: '2024-03-10',
  },
  {
    id: '4',
    title: 'Constituição do GOB',
    type: 'PDF',
    degree: 'Aprendiz',
    addedAt: '2023-11-05',
  },
]

export const mockDocuments: LodgeDocument[] = [
  {
    id: '1',
    title: 'Estatuto Social',
    description: 'Estatuto consolidado da loja - 2024',
    uploadDate: '2024-01-10',
    category: 'Jurídico',
    type: 'PDF',
    url: '#',
  },
  {
    id: '2',
    title: 'Ata de Eleição',
    description: 'Ata da eleição da diretoria atual',
    uploadDate: '2024-05-20',
    category: 'Atas',
    type: 'PDF',
    url: '#',
  },
  {
    id: '3',
    title: 'Balaústre Nº 1250',
    description: 'Registro da sessão de 15/05/2025',
    uploadDate: '2025-05-16',
    category: 'Balaústres',
    type: 'DOCX',
    url: '#',
  },
]

export const mockMessages: Message[] = [
  {
    id: '1',
    subject: 'Solicitação de Documentos',
    content:
      'Prezado Ir. Secretário, solicito o envio da minha certidão de regularidade.',
    sender: 'Marcos Souza',
    senderId: '4',
    recipients: ['Secretaria'],
    date: '2025-05-19',
    read: false,
    type: 'received',
  },
  {
    id: '2',
    subject: 'Confirmação de Presença',
    content: 'Informo que estarei presente no Banquete Ritualístico.',
    sender: 'Lucas Pereira',
    senderId: '5',
    recipients: ['Secretaria'],
    date: '2025-05-18',
    read: true,
    type: 'received',
  },
  {
    id: '3',
    subject: 'Convocação Extraordinária',
    content:
      'Lembramos a todos da convocação para a sessão extraordinária de amanhã.',
    sender: 'Secretaria',
    senderId: '2',
    recipients: ['Todos'],
    date: '2025-05-15',
    read: true,
    type: 'sent',
  },
]

export const mockBudgets: Budget[] = [
  {
    id: '1',
    name: 'Despesas Eventos 2025',
    type: 'Despesa',
    category: 'Eventos',
    amount: 15000,
    period: 'Anual',
  },
  {
    id: '2',
    name: 'Manutenção Mensal',
    type: 'Despesa',
    category: 'Manutenção',
    amount: 1500,
    period: 'Mensal',
  },
]

export const mockGoals: FinancialGoal[] = [
  {
    id: '1',
    name: 'Fundo de Reserva',
    targetAmount: 50000,
    linkedCategory: 'Doações',
    deadline: '2026-12-31',
  },
  {
    id: '2',
    name: 'Reforma do Templo',
    targetAmount: 20000,
    linkedCategory: 'Outros',
    deadline: '2025-10-20',
  },
]

export const mockReminderLogs: ReminderLog[] = [
  {
    id: '1',
    brotherId: '3',
    contributionId: '3',
    sentDate: '2025-05-10',
    method: 'Email',
  },
]

// Mock Chancellor Data
export const mockSessionRecords: SessionRecord[] = [
  {
    id: '1',
    eventId: '1',
    date: '2025-05-20',
    charityCollection: 150.5,
    observations: 'Sessão tranquila.',
    status: 'Finalizada',
  },
]

export const mockAttendance: Attendance[] = [
  {
    id: '1',
    sessionRecordId: '1',
    brotherId: '1',
    status: 'Presente',
  },
  {
    id: '2',
    sessionRecordId: '1',
    brotherId: '2',
    status: 'Presente',
  },
  {
    id: '3',
    sessionRecordId: '1',
    brotherId: '3',
    status: 'Presente',
  },
  {
    id: '4',
    sessionRecordId: '1',
    brotherId: '4',
    status: 'Ausente',
  },
  {
    id: '5',
    sessionRecordId: '1',
    brotherId: '5',
    status: 'Justificado',
    justification: 'Viagem a trabalho',
  },
]

export const mockSolids: Solid[] = [
  {
    id: '1',
    date: '2025-05-20',
    amount: 50.0,
    category: 'Hospitalaria',
    description: 'Doação para cesta básica',
    brotherId: '1',
  },
  {
    id: '2',
    date: '2025-05-20',
    amount: 100.0,
    category: 'Manutenção',
    description: 'Ajuda para pintura',
    brotherId: '3',
  },
]
