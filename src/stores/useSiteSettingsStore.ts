import { create } from 'zustand'

export interface Venerable {
  id: string
  name: string
  period: string
  imageUrl?: string
}

export interface SiteSettingsState {
  logoUrl: string
  history: {
    title: string
    text: string
    imageUrl: string
  }
  values: {
    liberty: string
    equality: string
    fraternity: string
  }
  contact: {
    address: string
    city: string
    zip: string
    email: string
    secondaryEmail: string
  }
  venerables: Venerable[]

  updateLogo: (url: string) => void
  updateHistory: (data: Partial<SiteSettingsState['history']>) => void
  updateValues: (data: Partial<SiteSettingsState['values']>) => void
  updateContact: (data: Partial<SiteSettingsState['contact']>) => void

  addVenerable: (venerable: Venerable) => void
  updateVenerable: (venerable: Venerable) => void
  deleteVenerable: (id: string) => void
}

export const useSiteSettingsStore = create<SiteSettingsState>((set) => ({
  logoUrl: '', // Empty means default ShieldCheck icon will be used if logic handles it, or we can set a default placeholder
  history: {
    title: 'Tradição e Modernidade',
    text: 'Fundada com o propósito de reunir homens livres e de bons costumes, a ARLS Templários da Paz tem sido um pilar de fraternidade em Botucatu. Nossa loja preserva as antigas tradições maçônicas enquanto busca aplicar seus ensinamentos no mundo contemporâneo.\n\nAtravés do estudo, da reflexão e da prática da beneficência, buscamos construir uma sociedade mais justa e igualitária, começando pela reforma íntima de cada um de nossos membros.',
    imageUrl: 'https://img.usecurling.com/p/800/800?q=old%20books%20library',
  },
  values: {
    liberty:
      'Defendemos a liberdade de consciência, de pensamento e de expressão, essenciais para a dignidade humana.',
    equality:
      'Reconhecemos que todos os homens nascem iguais em direitos e deveres, sem distinção de raça, credo ou condição social.',
    fraternity:
      'Cultivamos o amor fraternal que une todos os maçons como irmãos, estendendo essa benevolência a toda a humanidade.',
  },
  contact: {
    address: 'Rua das Acácias, 123',
    city: 'Jardim Tropical, Botucatu - SP',
    zip: '18600-000',
    email: 'contato@templariosdapaz.com.br',
    secondaryEmail: 'secretaria@templariosdapaz.com.br',
  },
  venerables: [
    { id: 'wm1', name: 'Antônio Souza', period: '2022 - 2024', imageUrl: '' },
    { id: 'wm2', name: 'Carlos Ferreira', period: '2020 - 2022', imageUrl: '' },
    { id: 'wm3', name: 'Mário Quintana', period: '2018 - 2020', imageUrl: '' },
    { id: 'wm4', name: 'Paulo Coelho', period: '2016 - 2018', imageUrl: '' },
  ],

  updateLogo: (url) => set({ logoUrl: url }),

  updateHistory: (data) =>
    set((state) => ({
      history: { ...state.history, ...data },
    })),

  updateValues: (data) =>
    set((state) => ({
      values: { ...state.values, ...data },
    })),

  updateContact: (data) =>
    set((state) => ({
      contact: { ...state.contact, ...data },
    })),

  addVenerable: (venerable) =>
    set((state) => ({
      venerables: [venerable, ...state.venerables],
    })),

  updateVenerable: (venerable) =>
    set((state) => ({
      venerables: state.venerables.map((v) =>
        v.id === venerable.id ? venerable : v,
      ),
    })),

  deleteVenerable: (id) =>
    set((state) => ({
      venerables: state.venerables.filter((v) => v.id !== id),
    })),
}))

export default useSiteSettingsStore
