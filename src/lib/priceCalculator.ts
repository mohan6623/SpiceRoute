import type { ParcelDimensions, PriceEstimate, ServiceType, PaymentMode } from '../types'

/** Rate table: base price for first 500g, then per additional 500g */
const RATE_TABLE: Record<ServiceType, { base: number; per500g: number }> = {
  'Speed Post': { base: 50, per500g: 15 },
  'Registered Post': { base: 30, per500g: 10 },
  'Express Parcel Post': { base: 80, per500g: 20 },
}

/** Delivery time estimates by service type */
const DELIVERY_DAYS: Record<ServiceType, string> = {
  'Speed Post': '2–3 business days',
  'Registered Post': '5–7 business days',
  'Express Parcel Post': '1–2 business days',
}

/** COD surcharge in INR */
const COD_SURCHARGE = 40

/** GST rate */
const GST_RATE = 0.18

/** Weight limits in kg */
export const MAX_WEIGHT_KG = 35
export const MIN_WEIGHT_KG = 0.05

/**
 * Calculate volumetric weight from dimensions.
 * Formula: (L × B × H) / 5000
 */
export function calculateVolumetricWeight(dimensions: ParcelDimensions): number {
  const { length, breadth, height } = dimensions
  return (length * breadth * height) / 5000
}

/**
 * Round up weight to the nearest 500g slab.
 * e.g. 1.2kg → 1.5kg, 2.0kg → 2.0kg, 0.1kg → 0.5kg
 */
export function roundToNext500g(weightKg: number): number {
  return Math.ceil(weightKg * 2) / 2
}

/**
 * Calculate full price estimate for a parcel.
 */
export function calculatePrice(
  actualWeight: number,
  dimensions: ParcelDimensions,
  serviceType: ServiceType,
  paymentMode: PaymentMode
): PriceEstimate {
  if (actualWeight > MAX_WEIGHT_KG) {
    throw new Error(`Weight exceeds India Post maximum limit of ${MAX_WEIGHT_KG} kg`)
  }
  if (actualWeight < MIN_WEIGHT_KG) {
    throw new Error(`Weight must be at least ${MIN_WEIGHT_KG} kg (50g)`)
  }

  const volumetricWeight = calculateVolumetricWeight(dimensions)
  const chargeableWeight = roundToNext500g(
    Math.max(actualWeight, volumetricWeight)
  )

  const rates = RATE_TABLE[serviceType]
  const slabs = Math.max(1, chargeableWeight / 0.5)
  const basePrice = rates.base + (slabs - 1) * rates.per500g

  const codSurcharge = paymentMode === 'Cash on Delivery' ? COD_SURCHARGE : 0
  const gstAmount = Math.round((basePrice + codSurcharge) * GST_RATE * 100) / 100
  const totalPrice = Math.round((basePrice + codSurcharge + gstAmount) * 100) / 100

  return {
    actualWeight,
    volumetricWeight: Math.round(volumetricWeight * 100) / 100,
    chargeableWeight,
    basePrice,
    codSurcharge,
    gstAmount,
    totalPrice,
    deliveryDays: DELIVERY_DAYS[serviceType],
    serviceType,
  }
}
