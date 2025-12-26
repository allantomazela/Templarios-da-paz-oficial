import { logError } from '@/lib/logger'

/**
 * Utility functions for CEP (Brazilian postal code) lookup
 */

export interface CEPData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

/**
 * Fetches address data from CEP using ViaCEP API
 * @param cep - The CEP (with or without formatting)
 * @returns Promise with address data or null if not found
 */
export async function fetchCEPData(cep: string): Promise<CEPData | null> {
  // Remove formatting
  const cleanCEP = cep.replace(/\D/g, '')
  
  if (cleanCEP.length !== 8) {
    return null
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
    
    if (!response.ok) {
      throw new Error('Erro ao buscar CEP')
    }

    const data: CEPData = await response.json()

    // ViaCEP returns { erro: true } when CEP is not found
    if (data.erro) {
      return null
    }

    return data
  } catch (error) {
    logError('Error fetching CEP', error)
    return null
  }
}

