import type { Brother } from '@/lib/data'

export function mapBrotherFromDB(row: Record<string, unknown>): Brother {
  const childrenRaw = row.children
  const children = childrenRaw
    ? Array.isArray(childrenRaw)
      ? childrenRaw
      : JSON.parse(String(childrenRaw || '[]'))
    : []

  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    cpf: row.cpf ? String(row.cpf) : undefined,
    dob: row.dob ? String(row.dob) : undefined,
    photoUrl: row.photo_url ? String(row.photo_url) : undefined,
    profileId: row.profile_id ? String(row.profile_id) : undefined,
    degree: (row.degree as Brother['degree']) || 'Aprendiz',
    role: (row.role as Brother['role']) || 'Irmão',
    status: (row.status as Brother['status']) || 'Ativo',
    initiationDate: String(row.initiation_date ?? ''),
    elevationDate: row.elevation_date ? String(row.elevation_date) : undefined,
    exaltationDate: row.exaltation_date ? String(row.exaltation_date) : undefined,
    attendanceRate: Number(row.attendance_rate) || 0,
    masonicRegistrationNumber: row.masonic_registration_number
      ? String(row.masonic_registration_number)
      : undefined,
    obedience: row.obedience ? String(row.obedience) : undefined,
    originLodge: row.origin_lodge ? String(row.origin_lodge) : undefined,
    originLodgeNumber: row.origin_lodge_number
      ? String(row.origin_lodge_number)
      : undefined,
    currentLodgeNumber: row.current_lodge_number
      ? String(row.current_lodge_number)
      : undefined,
    affiliationDate: row.affiliation_date
      ? String(row.affiliation_date)
      : undefined,
    regularStatus: row.regular_status ? String(row.regular_status) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    spouseName: row.spouse_name ? String(row.spouse_name) : undefined,
    spouseDob: row.spouse_dob ? String(row.spouse_dob) : undefined,
    children: children.length ? children : undefined,
    addressStreet: row.address_street ? String(row.address_street) : undefined,
    addressNumber: row.address_number ? String(row.address_number) : undefined,
    addressComplement: row.address_complement
      ? String(row.address_complement)
      : undefined,
    addressNeighborhood: row.address_neighborhood
      ? String(row.address_neighborhood)
      : undefined,
    addressCity: row.address_city ? String(row.address_city) : undefined,
    addressState: row.address_state ? String(row.address_state) : undefined,
    addressZipcode: row.address_zipcode ? String(row.address_zipcode) : undefined,
    address: row.address ? String(row.address) : undefined,
  }
}
