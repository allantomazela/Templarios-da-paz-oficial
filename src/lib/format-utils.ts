/**
 * Utility functions for formatting Brazilian documents and data
 */

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

/**
 * Formats a date string to Brazilian format (DD/MM/YYYY)
 * @param date - Date string (YYYY-MM-DD) or Date object
 * @returns Formatted date string (DD/MM/YYYY)
 */
export function formatDateBR(date: string | Date | null | undefined): string {
  if (!date) return ''
  
  let dateObj: Date
  if (typeof date === 'string') {
    // Handle YYYY-MM-DD format
    if (date.includes('-')) {
      const [year, month, day] = date.split('-')
      dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }
  
  if (isNaN(dateObj.getTime())) return ''
  
  const day = String(dateObj.getDate()).padStart(2, '0')
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const year = dateObj.getFullYear()
  
  return `${day}/${month}/${year}`
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

