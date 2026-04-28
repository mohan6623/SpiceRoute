import { GoogleGenAI } from '@google/genai'
import { getBookingByTrackingId, getBookingsByPhone, getBookingsByUserId } from './bookingService'
import dotenv from 'dotenv'

dotenv.config()

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

const SYSTEM_PROMPT = `
You are SpiceRoute's friendly AI customer support agent for India Post parcel bookings.
SpiceRoute is a web app for booking parcels via India Post across India.

Your job is to assist users with:
1. Tracking their parcels
2. Understanding their bookings
3. Explaining SpiceRoute services (Speed Post, Registered Post, Express Parcel Post)
4. Navigating the SpiceRoute application (Login, Sign up, finding pages)

App Guidance Instructions:
- If asked how to Log In or Sign Up: Tell the user they can click the "Login" or "Sign Up" buttons in the top right navigation bar.
- If asked how to book: Tell them they can click "Book Parcel" in the navigation bar to start a new booking.
- If asked to cancel or modify a booking: ask them to email support@spiceroute.in.

Services offered:
- Speed Post: 2-3 business days
- Registered Post: 5-7 business days
- Express Parcel Post: 1-2 business days

Keep all responses concise (under 2-3 sentences), helpful, and direct.
Be friendly, clear, and professional.
Never make up booking details — only use the data provided to you in the context.
Do not answer questions completely unrelated to SpiceRoute or parcel delivery.
`

export type ConversationTurn = {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

export const getAIResponse = async (
  userMessage: string,
  history: ConversationTurn[],
  userId?: string
): Promise<{
  responseText: string
  updatedHistory: ConversationTurn[]
}> => {
  // Extract tracking ID or phone from message
  const trackingIdMatch = userMessage.match(/IP2026\d{6}/i)
  const phoneMatch = userMessage.match(/\b[6-9]\d{9}\b/)

  let bookingContext = ''

  // Attempt to load context based on what was said or who is logged in
  if (trackingIdMatch) {
    const booking = await getBookingByTrackingId(trackingIdMatch[0].toUpperCase())
    if (booking) {
      bookingContext = `\n\nBooking data found for tracking ID ${trackingIdMatch[0].toUpperCase()}: ${JSON.stringify(booking)}`
    } else {
      bookingContext = `\n\nNote: The user asked about tracking ID ${trackingIdMatch[0]}, but no such booking was found in the database.`
    }
  } else if (phoneMatch) {
    const bookings = await getBookingsByPhone(phoneMatch[0])
    if (bookings.length > 0) {
      bookingContext = `\n\nBookings found for phone number ${phoneMatch[0]}: ${JSON.stringify(bookings)}`
    } else {
      bookingContext = `\n\nNote: The user asked about phone number ${phoneMatch[0]}, but no bookings were found.`
    }
  } else if (userId) {
    // If we have an authenticated user and no specific tracking ID/phone was mentioned,
    // we can attach their recent bookings just in case they ask "where is my package"
    const bookings = await getBookingsByUserId(userId)
    if (bookings.length > 0) {
      bookingContext = `\n\nContext for the logged-in user: Here are their recent bookings: ${JSON.stringify(bookings)}`
    }
  }

  const messageWithContext = userMessage + bookingContext

  try {
    const modelName = 'gemini-2.5-flash'
    console.log(`🤖 Using Gemini Model: ${modelName}`)

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: messageWithContext }] },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    })

    const responseText = response.text ?? ''

    const updatedHistory: ConversationTurn[] = [
      ...history,
      { role: 'user', parts: [{ text: userMessage }] }, // Store clean message, not context
      { role: 'model', parts: [{ text: responseText }] },
    ]

    return { responseText, updatedHistory }
  } catch (error) {
    console.error('Gemini AI Error:', error)
    return {
      responseText: 'Sorry, I am having trouble connecting to my brain right now. Please try again later.',
      updatedHistory: history,
    }
  }
}
