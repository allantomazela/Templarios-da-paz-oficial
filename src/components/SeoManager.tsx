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

    // Update Favicon
    if (faviconUrl) {
      let link: HTMLLinkElement | null =
        document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = faviconUrl
    }

    // Update Open Graph Tags
    updateMetaTag('og:title', siteTitle)
    updateMetaTag('og:description', metaDescription)
    // Update og:image if logo is available (optional, requires passing logoUrl to this component or store)
    // For now we focus on title and desc as per user story requirements for SEO settings
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
