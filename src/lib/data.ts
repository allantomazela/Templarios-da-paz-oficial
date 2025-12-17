import { z } from 'zod'

// Types
export interface Brother {
  id: string
  name: string
  email: string
  phone: string
  degree: 'Aprendiz' | 'Companheiro' | 'Mestre'
  role:
    | 'Mestre'
    | 'Secretário'
    | 'Tesoureiro'
    | 'Chanceler'
    | 'Irmão'
    | 'Administrador'
  status: 'Ativo' | 'Inativo'
  initiationDate: string
  attendanceRate: number
}

export interface Event {
  id: string
  title: string
  date: string
  time: string
  type: 'Sessão' | 'Reunião' | 'Evento Social' | 'Outro'
  location: string
  description: string
  attendees: number
}

export interface Announcement {
  id: string
  title: string
  date: string
  author: string
  content: string
}

export interface Transaction {
  id: string
  date: string
  description: string
  category: string
  type: 'Receita' | 'Despesa'
  amount: number
}

export interface LibraryItem {
  id: string
  title: string
  type: 'PDF' | 'Imagem' | 'Video' | 'Texto'
  degree: 'Aprendiz' | 'Companheiro' | 'Mestre'
  addedAt: string
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
    attendanceRate: 98,
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
    attendanceRate: 95,
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
    attendanceRate: 92,
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
    attendanceRate: 85,
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
    description: 'Sessão regular de instrução.',
    attendees: 25,
  },
  {
    id: '2',
    title: 'Banquete Ritualístico',
    date: '2025-06-21',
    time: '19:00',
    type: 'Evento Social',
    location: 'Salão de Festas',
    description: 'Comemoração do Solstício.',
    attendees: 40,
  },
  {
    id: '3',
    title: 'Reunião de Diretoria',
    date: '2025-05-25',
    time: '19:30',
    type: 'Reunião',
    location: 'Sala Administrativa',
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
    description: 'Iniciação de 2 candidatos.',
    attendees: 50,
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

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2025-05-01',
    description: 'Mensalidades Maio',
    category: 'Mensalidades',
    type: 'Receita',
    amount: 5500.0,
  },
  {
    id: '2',
    date: '2025-05-05',
    description: 'Conta de Energia',
    category: 'Utilidades',
    type: 'Despesa',
    amount: 450.0,
  },
  {
    id: '3',
    date: '2025-05-10',
    description: 'Manutenção Predial',
    category: 'Manutenção',
    type: 'Despesa',
    amount: 1200.0,
  },
  {
    id: '4',
    date: '2025-05-12',
    description: 'Doação Benemérita',
    category: 'Doações',
    type: 'Receita',
    amount: 1000.0,
  },
  {
    id: '5',
    date: '2025-05-15',
    description: 'Compra de Paramentos',
    category: 'Ritualística',
    type: 'Despesa',
    amount: 800.0,
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
