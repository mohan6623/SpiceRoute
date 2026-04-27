import { supabase } from './supabase'
import type { Booking } from '../types'

type EmailType = 'booking_confirmation' | 'status_update'

interface EmailResponse {
  message: string
  provider?: string
  sent?: boolean
}

/**
 * Collect all recipient emails from a booking (sender + receiver).
 */
function getRecipientEmails(booking: Booking): string[] {
  const emails: string[] = []
  if (booking.formData.senderEmail) emails.push(booking.formData.senderEmail)
  if (booking.formData.receiverEmail) emails.push(booking.formData.receiverEmail)
  // Deduplicate
  return [...new Set(emails)]
}

/**
 * Send booking-related email notification via Supabase Edge Function.
 * Sends to both sender and receiver if emails are available.
 * Returns true only if the email was actually delivered by a provider.
 */
export async function sendBookingEmail(
  type: EmailType,
  booking: Booking
): Promise<boolean> {
  const recipients = getRecipientEmails(booking)
  if (recipients.length === 0) return false

  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await supabase.functions.invoke<EmailResponse>('send-booking-email', {
      body: { type, booking, recipients },
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined,
    })

    if (response.error) {
      console.warn('Email notification failed:', response.error.message)
      return false
    }

    // Only return true if the email was actually sent via a provider
    return response.data?.sent === true
  } catch (err) {
    console.warn('Email notification failed:', err)
    return false
  }
}
