import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  dismissPwaPrompt,
  isAndroidDevice,
  isIosDevice,
  isPwaPromptDismissedRecently,
  isStandalonePwa,
} from './pwa-utils'

describe('pwa-utils', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detecta iPhone no user agent', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      platform: 'iPhone',
      maxTouchPoints: 5,
    })
    expect(isIosDevice()).toBe(true)
    expect(isAndroidDevice()).toBe(false)
  })

  it('detecta Android no user agent', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-P610)',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
    })
    expect(isAndroidDevice()).toBe(true)
    expect(isIosDevice()).toBe(false)
  })

  it('identifica app já instalado em modo standalone', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    expect(isStandalonePwa()).toBe(true)
  })

  it('respeita dismiss recente no localStorage', () => {
    dismissPwaPrompt()
    expect(isPwaPromptDismissedRecently()).toBe(true)
  })
})
