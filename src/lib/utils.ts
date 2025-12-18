import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Hex color code to HSL string format (h s% l%) for Tailwind/CSS variables
 * @param hex - Hex color string (e.g. #007AFF)
 * @returns HSL string (e.g. 211 100% 50%)
 */
export function hexToHSL(hex: string): string {
  // Return default blue if invalid or empty
  if (!hex) return '211 100% 50%'

  let r = 0,
    g = 0,
    b = 0

  // Handle shorthand #000
  if (hex.length === 4) {
    r = parseInt('0x' + hex[1] + hex[1])
    g = parseInt('0x' + hex[2] + hex[2])
    b = parseInt('0x' + hex[3] + hex[3])
  } else if (hex.length === 7) {
    r = parseInt('0x' + hex[1] + hex[2])
    g = parseInt('0x' + hex[3] + hex[4])
    b = parseInt('0x' + hex[5] + hex[6])
  }

  // Normalize to 0-1
  r /= 255
  g /= 255
  b /= 255

  const cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin

  let h = 0,
    s = 0,
    l = 0

  // Calculate Hue
  if (delta === 0) h = 0
  else if (cmax === r) h = ((g - b) / delta) % 6
  else if (cmax === g) h = (b - r) / delta + 2
  else h = (r - g) / delta + 4

  h = Math.round(h * 60)
  if (h < 0) h += 360

  // Calculate Lightness
  l = (cmax + cmin) / 2

  // Calculate Saturation
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  // Format as percentages
  s = +(s * 100).toFixed(1)
  l = +(l * 100).toFixed(1)

  return `${h} ${s}% ${l}%`
}
