import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  CreditCard,
  Facebook,
  Globe,
  HeartHandshake,
  Instagram,
  Landmark,
  Link2,
  Mail,
  Monitor,
  Network,
  Scale,
  ScrollText,
  Youtube,
} from 'lucide-react'

/** Allowlist de ícones Lucide disponíveis no CRUD de Links Essenciais. */
export const ESSENTIAL_LINK_ICONS: Record<string, LucideIcon> = {
  Landmark,
  Mail,
  Youtube,
  CreditCard,
  Facebook,
  HeartHandshake,
  Instagram,
  Monitor,
  Network,
  Scale,
  Globe,
  Building2,
  ScrollText,
  Link2,
}

export const ESSENTIAL_LINK_ICON_OPTIONS = Object.keys(ESSENTIAL_LINK_ICONS).sort()

export function resolveEssentialLinkIcon(iconName: string | null | undefined): LucideIcon {
  if (iconName && ESSENTIAL_LINK_ICONS[iconName]) {
    return ESSENTIAL_LINK_ICONS[iconName]
  }
  return Link2
}
