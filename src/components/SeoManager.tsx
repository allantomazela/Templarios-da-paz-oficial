import { useEffect } from 'react'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'

export function SeoManager() {
  const { siteTitle, metaDescription, faviconUrl } = useSiteSettingsStore()

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

    // Update Favicon with multiple sizes and cache busting
    if (faviconUrl) {
      const timestamp = Date.now()
      const faviconUrlWithCache = `${faviconUrl}?t=${timestamp}`

      // Remove ALL existing favicon links (including default from index.html)
      const existingFavicons = document.querySelectorAll(
        "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon'], link[rel='mask-icon']",
      )
      existingFavicons.forEach((link) => link.remove())

      // Create standard favicon (primary - browsers will use this)
      const favicon = document.createElement('link')
      favicon.rel = 'icon'
      favicon.type = 'image/png'
      favicon.href = faviconUrlWithCache
      favicon.sizes = 'any'
      document.head.appendChild(favicon)

      // Create 16x16 favicon
      const favicon16 = document.createElement('link')
      favicon16.rel = 'icon'
      favicon16.type = 'image/png'
      favicon16.href = faviconUrlWithCache
      favicon16.sizes = '16x16'
      document.head.appendChild(favicon16)

      // Create 32x32 favicon
      const favicon32 = document.createElement('link')
      favicon32.rel = 'icon'
      favicon32.type = 'image/png'
      favicon32.href = faviconUrlWithCache
      favicon32.sizes = '32x32'
      document.head.appendChild(favicon32)

      // Create shortcut icon for older browsers
      const shortcutIcon = document.createElement('link')
      shortcutIcon.rel = 'shortcut icon'
      shortcutIcon.type = 'image/png'
      shortcutIcon.href = faviconUrlWithCache
      document.head.appendChild(shortcutIcon)

      // Create Apple Touch Icon (for iOS devices)
      const appleTouchIcon = document.createElement('link')
      appleTouchIcon.rel = 'apple-touch-icon'
      appleTouchIcon.href = faviconUrlWithCache
      appleTouchIcon.sizes = '180x180'
      document.head.appendChild(appleTouchIcon)

      // Create larger icon for modern browsers and PWA
      const largeIcon = document.createElement('link')
      largeIcon.rel = 'icon'
      largeIcon.type = 'image/png'
      largeIcon.href = faviconUrlWithCache
      largeIcon.sizes = '192x192'
      document.head.appendChild(largeIcon)

      // Create extra large icon for high DPI displays
      const xlIcon = document.createElement('link')
      xlIcon.rel = 'icon'
      xlIcon.type = 'image/png'
      xlIcon.href = faviconUrlWithCache
      xlIcon.sizes = '512x512'
      document.head.appendChild(xlIcon)
    }

    // Update Open Graph Tags
    updateMetaTag('og:title', siteTitle)
    updateMetaTag('og:description', metaDescription)
  }, [siteTitle, metaDescription, faviconUrl])

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
