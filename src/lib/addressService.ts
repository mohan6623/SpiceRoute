import { supabase } from './supabase'

export interface SavedAddress {
  id: string
  label: string
  name: string
  phone: string
  email?: string
  address: string
  pincode: string
  city: string
  state: string
  isDefault: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): SavedAddress {
  return {
    id: row.id,
    label: row.label,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    address: row.address,
    pincode: row.pincode,
    city: row.city,
    state: row.state,
    isDefault: row.is_default ?? false,
  }
}

/** Get all saved addresses for the current user */
export async function getSavedAddresses(userId: string): Promise<SavedAddress[]> {
  const { data, error } = await supabase
    .from('saved_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapRow)
}

/** Save a new address */
export async function saveAddress(
  userId: string,
  addr: Omit<SavedAddress, 'id' | 'isDefault'>
): Promise<SavedAddress | null> {
  const { data, error } = await supabase
    .from('saved_addresses')
    .insert({
      user_id: userId,
      label: addr.label,
      name: addr.name,
      phone: addr.phone,
      email: addr.email ?? null,
      address: addr.address,
      pincode: addr.pincode,
      city: addr.city,
      state: addr.state,
    })
    .select()
    .single()

  if (error || !data) return null
  return mapRow(data)
}

/** Delete a saved address */
export async function deleteAddress(addressId: string): Promise<boolean> {
  const { error } = await supabase
    .from('saved_addresses')
    .delete()
    .eq('id', addressId)

  return !error
}

/**
 * Auto-save sender address from a completed booking.
 * Skips if an address with the same pincode + name already exists.
 */
export async function autoSaveAddressFromBooking(
  userId: string,
  type: 'sender' | 'receiver',
  data: {
    name: string
    phone: string
    email?: string
    address: string
    pincode: string
    city: string
    state: string
  }
): Promise<void> {
  // Check for duplicate (same name + pincode)
  const existing = await getSavedAddresses(userId)
  const isDuplicate = existing.some(
    (a) => a.name === data.name && a.pincode === data.pincode
  )
  if (isDuplicate) return

  await saveAddress(userId, {
    label: type === 'sender' ? 'My Address' : `${data.name}'s Address`,
    ...data,
  })
}
