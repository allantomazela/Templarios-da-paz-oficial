import { useEffect } from 'react'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { resolveSiteFaviconUrl } from '@/lib/default-brand-assets'

export function SeoManager() {
  const { siteTitle, metaDescription, faviconUrl, logoUrl } =
    useSiteSettingsStore()

  useEffect(() => {
    // Update Title
    if (siteTitle) {
      document.title = siteTitle
    }

    // Update Meta Description
    let metaDesc = document.querySelector("meta[name='description']")
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    if (metaDescription) {
      metaDesc.setAttribute('content', metaDescription)
    }

    const resolvedFavicon = resolveSiteFaviconUrl(faviconUrl, logoUrl)
    const timestamp = Date.now()
    const faviconUrlWithCache = resolvedFavicon.includes('?')
      ? `${resolvedFavicon}&t=${timestamp}`
      : `${resolvedFavicon}?t=${timestamp}`

    // Remove ALL existing favicon links (including default from index.html)
    const existingFavicons = document.querySelectorAll(
      "link[rel='icon'], link[rel='shortcut icon'], link[rel='mask-icon']",
    )
    existingFavicons.forEach((link) => link.remove())

    // Preferência .ico para navegadores que pedem /favicon.ico na abertura
    if (resolvedFavicon.startsWith('/')) {
      const ico = document.createElement('link')
      ico.rel = 'icon'
      ico.href = `/favicon.ico?t=${timestamp}`
      ico.sizes = 'any'
      document.head.appendChild(ico)
    }

    const favicon = document.createElement('link')
    favicon.rel = 'icon'
    favicon.type = 'image/png'
    favicon.href = faviconUrlWithCache
    favicon.sizes = 'any'
    document.head.appendChild(favicon)

    const favicon32 = document.createElement('link')
    favicon32.rel = 'icon'
    favicon32.type = 'image/png'
    favicon32.href = faviconUrlWithCache
    favicon32.sizes = '32x32'
    document.head.appendChild(favicon32)

    const shortcutIcon = document.createElement('link')
    shortcutIcon.rel = 'shortcut icon'
    shortcutIcon.type = 'image/png'
    shortcutIcon.href = faviconUrlWithCache
    document.head.appendChild(shortcutIcon)

    // apple-touch-icon e ícones PWA permanecem fixos em index.html (/icon-192.png, /icon-512.png)
    // para não quebrar instalação no iOS/Android com tamanhos incorretos do favicon dinâmico.

    // Update Open Graph Tags
    updateMetaTag('og:title', siteTitle)
    updateMetaTag('og:description', metaDescription)
  }, [siteTitle, metaDescription, faviconUrl, logoUrl])

  return null
}

function updateMetaTag(property: string, content: string) {
  if (!content) return
  let tag = document.querySelector(`meta[property='${property}']`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}
