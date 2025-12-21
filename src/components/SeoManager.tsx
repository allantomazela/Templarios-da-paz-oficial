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

    // Update Favicon with Cache Busting if URL exists
    if (faviconUrl) {
      let link: HTMLLinkElement | null =
        document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      // Appending timestamp to force browser to refresh the icon
      link.href = `${faviconUrl}?t=${Date.now()}`
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
