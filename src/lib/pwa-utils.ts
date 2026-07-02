const PWA_DISMISS_KEY = 'pwa-prompt-dismissed'
const PWA_DISMISS_DAYS = 7

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

export function isPwaPromptDismissedRecently(): boolean {
  if (typeof localStorage === 'undefined') return false
  const dismissed = localStorage.getItem(PWA_DISMISS_KEY)
  if (!dismissed) return false
  const dismissedTime = Number.parseInt(dismissed, 10)
  if (Number.isNaN(dismissedTime)) return false
  const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
  return daysSinceDismissed < PWA_DISMISS_DAYS
}

export function dismissPwaPrompt(): void {
  localStorage.setItem(PWA_DISMISS_KEY, Date.now().toString())
}
