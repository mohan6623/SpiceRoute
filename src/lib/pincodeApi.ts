import type { PincodeData } from '../types'

/** In-memory cache — never fetch the same pincode twice */
const pincodeCache = new Map<string, PincodeData>()

interface PostalApiResponse {
  Status: string
  Message: string
  PostOffice: Array<{
    Name: string
    District: string
    State: string
    Pincode: string
  }> | null
}

/**
 * Fetch pincode data from api.postalpincode.in with caching.
 * Returns cached data if available.
 */
export async function fetchPincodeData(pincode: string): Promise<PincodeData> {
  // Validate format
  if (!/^\d{6}$/.test(pincode)) {
    throw new Error('Pincode must be exactly 6 digits')
  }

  // Check cache first
  const cached = pincodeCache.get(pincode)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
    if (!response.ok) {
      throw new Error('Could not verify pincode. Try again.')
    }

    const data: PostalApiResponse[] = await response.json()
    const result = data[0]

    if (result.Status !== 'Success' || !result.PostOffice || result.PostOffice.length === 0) {
      throw new Error('Invalid pincode. Please check and try again.')
    }

    const postOffice = result.PostOffice[0]
    const pincodeData: PincodeData = {
      pincode,
      city: postOffice.Name,
      district: postOffice.District,
      state: postOffice.State,
    }

    // Cache the result
    pincodeCache.set(pincode, pincodeData)
    return pincodeData
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Could not verify pincode. Try again.')
  }
}

/**
 * Check if a pincode is already cached.
 */
export function isPincodeCached(pincode: string): boolean {
  return pincodeCache.has(pincode)
}

/**
 * Get cached pincode data without fetching.
 */
export function getCachedPincode(pincode: string): PincodeData | undefined {
  return pincodeCache.get(pincode)
}
