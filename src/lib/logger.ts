/**
 * Logger utility for development and production environments
 * In production, only errors are logged to avoid exposing sensitive information
 */

type LogLevel = 'log' | 'warn' | 'error' | 'debug'

const isDevelopment = import.meta.env.DEV

/**
 * Logs a message only in development environment
 */
export function devLog(level: LogLevel, ...args: unknown[]): void {
  if (!isDevelopment) return

  switch (level) {
    case 'log':
      console.log(...args)
      break
    case 'warn':
      console.warn(...args)
      break
    case 'error':
      console.error(...args)
      break
    case 'debug':
      console.debug(...args)
      break
  }
}

/**
 * Logs an error in all environments (for critical errors)
 */
export function logError(message: string, error?: unknown): void {
  if (error instanceof Error) {
    console.error(`[ERROR] ${message}`, error)
  } else {
    console.error(`[ERROR] ${message}`, error)
  }
}

/**
 * Logs a warning only in development
 */
export function logWarning(message: string, ...args: unknown[]): void {
  if (isDevelopment) {
    console.warn(`[WARN] ${message}`, ...args)
  }
}

/**
 * Logs debug information only in development
 */
export function logDebug(message: string, ...args: unknown[]): void {
  if (isDevelopment) {
    console.debug(`[DEBUG] ${message}`, ...args)
  }
}

