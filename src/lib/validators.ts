import { z } from 'zod'

/** Validates Indian phone number: 10 digits starting with 6/7/8/9 */
const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian phone number')

/** Validates 6-digit pincode */
const pincodeSchema = z
  .string()
  .min(1, 'Pincode is required')
  .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits')

/** Validates name: min 3 chars, letters and spaces only */
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(3, 'Name must be at least 3 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')

/** Validates address: min 10 chars */
const addressSchema = z
  .string()
  .min(1, 'Address is required')
  .min(10, 'Address must be at least 10 characters')

/**
 * Validates a parcel dimension (length / breadth / height) in centimetres.
 * Rules:
 *  - Required, must be a number
 *  - Minimum: 1 cm  (anything smaller is sub-envelope and nonsensical for a parcel)
 *  - Maximum: 150 cm (India Post registered/speed post length limit)
 *  - Precision: at most 1 decimal place (e.g. 30.5 cm is fine; 30.55 is not)
 */
const dimensionSchema = (label: string) =>
  z
    .number({ message: `${label} must be a number` })
    .min(1, `${label} must be at least 1 cm`)
    .max(150, `${label} cannot exceed 150 cm (India Post limit)`)
    .refine(
      (v) => Math.round(v * 10) === v * 10,
      `${label} can have at most 1 decimal place (e.g. 30 or 30.5)`
    )

/** Rate Calculator validation schema */
export const rateCalculatorSchema = z
  .object({
    pickupPincode: pincodeSchema,
    deliveryPincode: pincodeSchema,
    actualWeight: z
      .number({ message: 'Weight is required' })
      .min(0.05, 'Minimum weight is 0.05 kg (50g)')
      .max(35, 'India Post maximum weight limit is 35 kg'),
    length: dimensionSchema('Length'),
    breadth: dimensionSchema('Breadth'),
    height: dimensionSchema('Height'),
    serviceType: z.enum(['Speed Post', 'Registered Post', 'Express Parcel Post'], {
      message: 'Select a service type',
    }),
    paymentMode: z.enum(['Prepaid', 'Cash on Delivery'], {
      message: 'Select a payment mode',
    }),
  })
  .refine(
    ({ length, breadth, height }) => {
      // India Post girth rule: length + 2*(breadth + height) ≤ 300 cm
      const girth = length + 2 * (breadth + height)
      return girth <= 300
    },
    {
      message:
        'Combined size too large: Length + 2×(Breadth + Height) must not exceed 300 cm',
      path: ['length'],
    }
  )

export type RateCalculatorFormValues = z.infer<typeof rateCalculatorSchema>

/** Full booking form validation schema */
export const bookingFormSchema = z.object({
  senderName: nameSchema,
  senderPhone: phoneSchema,
  senderEmail: z
    .string()
    .email('Enter a valid email address')
    .optional()
    .or(z.literal('')),
  senderAddress: addressSchema,
  senderPincode: pincodeSchema,
  senderCity: z.string().min(1, 'City is required'),
  senderState: z.string().min(1, 'State is required'),

  receiverName: nameSchema,
  receiverPhone: phoneSchema,
  receiverAddress: addressSchema,
  receiverPincode: pincodeSchema,
  receiverCity: z.string().min(1, 'City is required'),
  receiverState: z.string().min(1, 'State is required'),

  contentsDescription: z.string().optional().or(z.literal('')),
  declaredValue: z
    .number()
    .positive('Declared value must be positive')
    .optional()
    .or(z.literal(0)),

  pickupDate: z
    .string()
    .min(1, 'Pickup date is required')
    .refine((date) => {
      const pickup = new Date(date)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      return pickup >= tomorrow
    }, 'Pickup date must be tomorrow or later'),

  pickupTimeSlot: z.enum(['9 AM - 12 PM', '12 PM - 3 PM', '3 PM - 6 PM'], {
    message: 'Select a pickup time slot',
  }),
})

export type BookingFormValues = z.infer<typeof bookingFormSchema>

/** Phone number search schema (My Bookings page) */
export const phoneSearchSchema = z.object({
  phone: phoneSchema,
})

export type PhoneSearchValues = z.infer<typeof phoneSearchSchema>

/** Tracking ID search schema */
export const trackingSearchSchema = z.object({
  trackingId: z
    .string()
    .min(1, 'Tracking ID is required')
    .regex(/^IP\d{10}$/, 'Enter a valid tracking ID (e.g., IP2026123456)'),
})

export type TrackingSearchValues = z.infer<typeof trackingSearchSchema>
