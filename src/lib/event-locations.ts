import type { Location } from '@/lib/data'

export const MANUAL_EVENT_LOCATION_ID = '__manual__'
export const LODGE_EVENT_LOCATION_ID = '__lodge__'

export interface LodgeContactInfo {
  address?: string
  city?: string
  zip?: string
}

export function buildLodgeLocationName(
  siteTitle: string,
  city?: string,
): string {
  const base = siteTitle?.trim() || 'Templo da Loja'
  return city?.trim() ? `${base} — ${city.trim()}` : base
}

export function buildLodgeLocationDescription(
  contact: LodgeContactInfo,
): string {
  return [contact.address, contact.city, contact.zip]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
}

export function resolveEventLocationInput(params: {
  locationId: string
  customLocation?: string
  siteTitle: string
  contact: LodgeContactInfo
  locations: Location[]
}): { location: string; locationId?: string } {
  const { locationId, customLocation, siteTitle, contact, locations } = params

  if (locationId === MANUAL_EVENT_LOCATION_ID) {
    return {
      location: customLocation?.trim() || 'Local não informado',
      locationId: undefined,
    }
  }

  if (locationId === LODGE_EVENT_LOCATION_ID) {
    return {
      location: buildLodgeLocationName(siteTitle, contact.city),
      locationId: LODGE_EVENT_LOCATION_ID,
    }
  }

  const loc = locations.find((l) => l.id === locationId)
  return {
    location: loc?.name || 'Local não definido',
    locationId,
  }
}

export function inferLocationIdFromEvent(
  event: { location?: string; locationId?: string },
  locations: Location[],
  siteTitle: string,
  contact: LodgeContactInfo,
): { locationId: string; customLocation: string } {
  if (event.locationId === LODGE_EVENT_LOCATION_ID) {
    return { locationId: LODGE_EVENT_LOCATION_ID, customLocation: '' }
  }

  if (event.locationId === MANUAL_EVENT_LOCATION_ID) {
    return {
      locationId: MANUAL_EVENT_LOCATION_ID,
      customLocation: event.location || '',
    }
  }

  if (event.locationId) {
    const exists = locations.some((l) => l.id === event.locationId)
    if (exists) {
      return { locationId: event.locationId, customLocation: '' }
    }
  }

  const lodgeName = buildLodgeLocationName(siteTitle, contact.city)
  if (
    event.location === lodgeName ||
    (event.location && contact.address && event.location.includes(contact.address))
  ) {
    return { locationId: LODGE_EVENT_LOCATION_ID, customLocation: '' }
  }

  if (event.location) {
    const byName = locations.find((l) => l.name === event.location)
    if (byName) {
      return { locationId: byName.id, customLocation: '' }
    }
    return {
      locationId: MANUAL_EVENT_LOCATION_ID,
      customLocation: event.location,
    }
  }

  return { locationId: LODGE_EVENT_LOCATION_ID, customLocation: '' }
}

export function defaultNewEventLocationId(): string {
  return LODGE_EVENT_LOCATION_ID
}
