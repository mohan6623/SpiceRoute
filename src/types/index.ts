export type ServiceType =
  | 'Speed Post'
  | 'Registered Post'
  | 'Express Parcel Post'

export type PaymentMode = 'Prepaid' | 'Cash on Delivery'

export type BookingStatus =
  | 'Booked'
  | 'Picked Up'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered'

export type PickupTimeSlot =
  | '9 AM - 12 PM'
  | '12 PM - 3 PM'
  | '3 PM - 6 PM'

export interface PincodeData {
  pincode: string
  city: string
  district: string
  state: string
}

export interface ParcelDimensions {
  length: number   // cm
  breadth: number  // cm
  height: number   // cm
}

export interface PriceEstimate {
  actualWeight: number
  volumetricWeight: number
  chargeableWeight: number
  basePrice: number
  codSurcharge: number
  gstAmount: number
  totalPrice: number
  deliveryDays: string
  serviceType: ServiceType
}

export interface BookingFormData {
  senderName: string
  senderPhone: string
  senderEmail?: string
  senderAddress: string
  senderPincode: string
  senderCity: string
  senderState: string
  receiverName: string
  receiverPhone: string
  receiverEmail?: string
  receiverAddress: string
  receiverPincode: string
  receiverCity: string
  receiverState: string
  actualWeight: number
  dimensions: ParcelDimensions
  contentsDescription?: string
  declaredValue?: number
  serviceType: ServiceType
  paymentMode: PaymentMode
  pickupDate: string       // ISO date string
  pickupTimeSlot: PickupTimeSlot
}

export interface Booking {
  id: string
  trackingId: string
  formData: BookingFormData
  estimate: PriceEstimate
  status: BookingStatus
  createdAt: string
}

export interface RateCalculatorInput {
  pickupPincode: string
  deliveryPincode: string
  actualWeight: number
  dimensions: ParcelDimensions
  serviceType: ServiceType
  paymentMode: PaymentMode
}

export const SERVICE_TYPES: ServiceType[] = [
  'Speed Post',
  'Registered Post',
  'Express Parcel Post',
]

export const PAYMENT_MODES: PaymentMode[] = ['Prepaid', 'Cash on Delivery']

export const PICKUP_TIME_SLOTS: PickupTimeSlot[] = [
  '9 AM - 12 PM',
  '12 PM - 3 PM',
  '3 PM - 6 PM',
]

export const BOOKING_STATUSES: BookingStatus[] = [
  'Booked',
  'Picked Up',
  'In Transit',
  'Out for Delivery',
  'Delivered',
]

export const STATUS_BADGE_CLASS: Record<BookingStatus, string> = {
  'Booked': 'badge-booked',
  'Picked Up': 'badge-picked-up',
  'In Transit': 'badge-in-transit',
  'Out for Delivery': 'badge-out-for-delivery',
  'Delivered': 'badge-delivered',
}
