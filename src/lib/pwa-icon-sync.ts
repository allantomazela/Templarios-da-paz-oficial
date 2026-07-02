import { supabase } from '@/lib/supabase/client'
import { logError, logWarning } from '@/lib/logger'
import { toErrorMessage } from '@/lib/async-utils'
import { resolveSiteLogoUrl } from '@/lib/default-brand-assets'
import {
  generatePwaIconBlob,
  PWA_ICON_SIZES,
} from '@/lib/pwa-icon-generator'

/**
 * Envia ícones PWA gerados para o Storage (caminhos fixos).
 * O script de build pode reutilizar estes arquivos no próximo deploy.
 */
export async function uploadPwaIconsFromLogo(logoUrl?: string | null): Promise<void> {
  const source = resolveSiteLogoUrl(logoUrl)
  const absoluteSource = source.startsWith('/')
    ? `${window.location.origin}${source}`
    : source

  for (const { size, filename } of PWA_ICON_SIZES) {
    const blob = await generatePwaIconBlob(absoluteSource, size)
    const filePath = `pwa/${filename}`
    const file = new File([blob], filename, { type: 'image/png' })

    const { error } = await supabase.storage.from('site-assets').upload(filePath, file, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: true,
    })

    if (error) {
      throw new Error(toErrorMessage(error, `Falha ao enviar ${filename}.`))
    }
  }
}

/**
 * Gera e envia ícones PWA após alteração do logo. Falhas não impedem salvar o logo.
 */
export async function syncPwaIconsAfterLogoChange(logoUrl?: string | null): Promise<boolean> {
  try {
    await uploadPwaIconsFromLogo(logoUrl)
    return true
  } catch (error) {
    logWarning('Não foi possível sincronizar ícones PWA no Storage', error)
    logError('syncPwaIconsAfterLogoChange', error)
    return false
  }
}
