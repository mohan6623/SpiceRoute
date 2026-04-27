import { supabase } from './supabase'
import type { Booking, BookingFormData, BookingStatus, PriceEstimate } from '../types'
import { generateTrackingId } from './trackingId'

/** Map a Supabase row to a Booking object */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToBooking(row: any): Booking {
  return {
    id: row.id,
    trackingId: row.tracking_id,
    formData: {
      senderName: row.sender_name,
      senderPhone: row.sender_phone,
      senderEmail: row.sender_email ?? undefined,
      senderAddress: row.sender_address,
      senderPincode: row.sender_pincode,
      senderCity: row.sender_city,
      senderState: row.sender_state,
      receiverName: row.receiver_name,
      receiverPhone: row.receiver_phone,
      receiverAddress: row.receiver_address,
      receiverPincode: row.receiver_pincode,
      receiverCity: row.receiver_city,
      receiverState: row.receiver_state,
      actualWeight: Number(row.actual_weight),
      dimensions: {
        length: Number(row.length_cm),
        breadth: Number(row.breadth_cm),
        height: Number(row.height_cm),
      },
      contentsDescription: row.contents_description ?? undefined,
      declaredValue: row.declared_value ? Number(row.declared_value) : undefined,
      serviceType: row.service_type,
      paymentMode: row.payment_mode,
      pickupDate: row.pickup_date,
      pickupTimeSlot: row.pickup_time_slot,
    },
    estimate: {
      actualWeight: Number(row.actual_weight),
      volumetricWeight: Number(row.volumetric_weight),
      chargeableWeight: Number(row.chargeable_weight),
      basePrice: Number(row.base_price),
      codSurcharge: Number(row.cod_surcharge),
      gstAmount: Number(row.gst_amount),
      totalPrice: Number(row.total_price),
      deliveryDays: '',
      serviceType: row.service_type,
    },
    status: row.status as BookingStatus,
    createdAt: row.created_at,
  }
}

/** Create a new booking in Supabase */
export async function createBooking(
  formData: BookingFormData,
  estimate: PriceEstimate
): Promise<Booking> {
  const trackingId = generateTrackingId()

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      tracking_id: trackingId,
      sender_name: formData.senderName,
      sender_phone: formData.senderPhone,
      sender_email: formData.senderEmail ?? null,
      sender_address: formData.senderAddress,
      sender_pincode: formData.senderPincode,
      sender_city: formData.senderCity,
      sender_state: formData.senderState,
      receiver_name: formData.receiverName,
      receiver_phone: formData.receiverPhone,
      receiver_address: formData.receiverAddress,
      receiver_pincode: formData.receiverPincode,
      receiver_city: formData.receiverCity,
      receiver_state: formData.receiverState,
      actual_weight: estimate.actualWeight,
      volumetric_weight: estimate.volumetricWeight,
      chargeable_weight: estimate.chargeableWeight,
      length_cm: formData.dimensions.length,
      breadth_cm: formData.dimensions.breadth,
      height_cm: formData.dimensions.height,
      contents_description: formData.contentsDescription ?? null,
      declared_value: formData.declaredValue ?? null,
      service_type: formData.serviceType,
      payment_mode: formData.paymentMode,
      base_price: estimate.basePrice,
      cod_surcharge: estimate.codSurcharge,
      gst_amount: estimate.gstAmount,
      total_price: estimate.totalPrice,
      pickup_date: formData.pickupDate,
      pickup_time_slot: formData.pickupTimeSlot,
      status: 'Booked',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapRowToBooking(data)
}

/** Get a booking by tracking ID */
export async function getBookingByTrackingId(
  trackingId: string
): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('tracking_id', trackingId)
    .single()

  if (error || !data) return null
  return mapRowToBooking(data)
}

/** Get all bookings by sender phone number */
export async function getBookingsByPhone(
  phone: string
): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('sender_phone', phone)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapRowToBooking)
}

/** Update booking status (for demo mode) */
export async function updateBookingStatus(
  trackingId: string,
  newStatus: BookingStatus
): Promise<boolean> {
  const { error } = await supabase
    .from('bookings')
    .update({ status: newStatus })
    .eq('tracking_id', trackingId)

  return !error
}
