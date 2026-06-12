/**
 * Utility functions for formatting Brazilian documents and data
 */

import { format as dateFnsFormat, type FormatOptions } from 'date-fns'

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/**
 * Formata valor monetário no padrão brasileiro (ex.: R$ 290,00).
 */
export function formatCurrencyBRL(
  value: number | string | null | undefined,
): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (num == null || Number.isNaN(num)) return 'R$ 0,00'
  return brlFormatter.format(num)
}

/** Converte Date no fuso local para yyyy-MM-dd (sem passar por UTC). */
export function toLocalISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Data local de hoje no formato yyyy-MM-dd (inputs type="date"). */
export function todayLocalISODate(): string {
  return toLocalISODate(new Date())
}

/**
 * Formats a CPF string (removes non-digits and applies mask)
 * @param value - The CPF value (with or without formatting)
 * @returns Formatted CPF string (000.000.000-00)
 */
export function formatCPF(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')
  
  // Apply mask: 000.000.000-00
  if (digits.length <= 3) {
    return digits
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`
  } else if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  } else {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }
}

/**
 * Removes formatting from CPF
 * @param value - The formatted CPF
 * @returns CPF with only digits
 */
export function unformatCPF(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Formats a phone number string
 * @param value - The phone value (with or without formatting)
 * @returns Formatted phone string ((00) 00000-0000 or (00) 0000-0000)
 */
export function formatPhone(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')
  
  // Apply mask based on length
  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : digits
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  } else if (digits.length <= 10) {
    // Landline: (00) 0000-0000
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  } else {
    // Cellphone: (00) 00000-0000
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }
}

/**
 * Removes formatting from phone
 * @param value - The formatted phone
 * @returns Phone with only digits
 */
export function unformatPhone(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Formats a CEP (Brazilian postal code) string
 * @param value - The CEP value (with or without formatting)
 * @returns Formatted CEP string (00000-000)
 */
export function formatCEP(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')
  
  // Apply mask: 00000-000
  if (digits.length <= 5) {
    return digits
  } else {
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
  }
}

/**
 * Removes formatting from CEP
 * @param value - The formatted CEP
 * @returns CEP with only digits
 */
export function unformatCEP(value: string): string {
  return value.replace(/\D/g, '')
}

/** Interpreta data de calendário (YYYY-MM-DD) no fuso local, sem deslocar o dia. */
export function parseCalendarDate(
  date: string | Date | null | undefined,
): Date | null {
  if (!date) return null
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date
  }

  const trimmed = date.trim()
  const isoDatePart = trimmed.split('T')[0]?.split(' ')[0] ?? ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDatePart)) {
    const [year, month, day] = isoDatePart.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    return isNaN(dateObj.getTime()) ? null : dateObj
  }

  const parsed = new Date(trimmed)
  return isNaN(parsed.getTime()) ? null : parsed
}

/** Valor para input[type=date] (YYYY-MM-DD) sem conversão de fuso. */
export function toDateInputValue(date: string | null | undefined): string {
  if (!date?.trim()) return ''
  const isoDatePart = date.trim().split('T')[0]?.split(' ')[0] ?? ''
  return /^\d{4}-\d{2}-\d{2}$/.test(isoDatePart) ? isoDatePart : ''
}

/**
 * Formats a date string to Brazilian format (DD/MM/YYYY)
 * @param date - Date string (YYYY-MM-DD) or Date object
 * @returns Formatted date string (DD/MM/YYYY)
 */
export function formatDateBR(date: string | Date | null | undefined): string {
  const dateObj = parseCalendarDate(date)
  if (!dateObj) return ''

  const day = String(dateObj.getDate()).padStart(2, '0')
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const year = dateObj.getFullYear()

  return `${day}/${month}/${year}`
}

/** Timestamp local para ordenar/comparar datas de calendário (YYYY-MM-DD). */
export function getCalendarDateTimestamp(
  date: string | Date | null | undefined,
): number {
  return parseCalendarDate(date)?.getTime() ?? 0
}

/** Formata data de calendário com padrão date-fns no fuso local (sem deslocar o dia). */
export function formatCalendarDate(
  date: string | Date | null | undefined,
  pattern: string,
  options?: FormatOptions,
): string {
  const dateObj = parseCalendarDate(date)
  if (!dateObj) return ''
  return dateFnsFormat(dateObj, pattern, options)
}

/**
 * Formats a date string from Brazilian format to ISO format (YYYY-MM-DD)
 * @param date - Date string in Brazilian format (DD/MM/YYYY)
 * @returns Date string in ISO format (YYYY-MM-DD)
 */
export function formatDateISO(date: string): string {
  if (!date) return ''
  
  // If already in ISO format, return as is
  if (date.includes('-') && date.length === 10) {
    return date
  }
  
  // Handle DD/MM/YYYY format
  const parts = date.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  
  return date
}

/**
 * Validates CPF format and checksum
 * @param cpf - The CPF to validate
 * @returns true if CPF is valid
 */
export function validateCPF(cpf: string): boolean {
  const digits = unformatCPF(cpf)
  
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false // All same digits
  
  let sum = 0
  let remainder
  
  // Validate first digit
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(digits.substring(i - 1, i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits.substring(9, 10))) return false
  
  // Validate second digit
  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(digits.substring(i - 1, i)) * (12 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits.substring(10, 11))) return false
  
  return true
}

/**
 * Validates phone number (Brazilian format)
 * @param phone - The phone to validate
 * @returns true if phone is valid (10 or 11 digits)
 */
export function validatePhone(phone: string): boolean {
  const digits = unformatPhone(phone)
  return digits.length === 10 || digits.length === 11
}

/**
 * Validates CEP format
 * @param cep - The CEP to validate
 * @returns true if CEP is valid (8 digits)
 */
export function validateCEP(cep: string): boolean {
  const digits = unformatCEP(cep)
  return digits.length === 8
}

