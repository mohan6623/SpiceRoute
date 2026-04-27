import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Phone, PackageSearch, Search, Inbox } from 'lucide-react'
import { phoneSearchSchema, type PhoneSearchValues } from '../lib/validators'
import { getBookingsByPhone } from '../lib/bookingService'
import type { Booking } from '../types'
import BookingCard from '../components/BookingCard'
import { CardSkeleton } from '../components/LoadingSkeleton'
import ValidationError from '../components/ValidationError'

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneSearchValues>({
    resolver: zodResolver(phoneSearchSchema),
  })

  const onSubmit = async (values: PhoneSearchValues) => {
    setLoading(true)
    setSearched(false)
    try {
      const results = await getBookingsByPhone(values.phone)
      setBookings(results)
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-3 bg-kraft/10 rounded-xl flex items-center justify-center">
            <PackageSearch className="w-6 h-6 text-kraft" />
          </div>
          <h1 className="text-h1 text-coffee mb-2">My Bookings</h1>
          <p className="text-body text-coffee-light/70">
            View all your bookings by entering your phone number
          </p>
        </div>

        {/* Phone Search */}
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 mb-6">
          <label htmlFor="phone-search" className="input-label flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-kraft" />
            Sender Phone Number
          </label>
          <div className="flex gap-3 mt-1">
            <div className="flex-1">
              <input
                id="phone-search"
                type="tel"
                {...register('phone')}
                placeholder="Enter 10-digit phone number"
                className="input-field"
                maxLength={10}
              />
              <ValidationError message={errors.phone?.message} />
            </div>
            <button type="submit" disabled={loading} className="btn-cta self-start cursor-pointer">
              {loading ? (
                <div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {/* Results */}
        {!loading && searched && bookings.length > 0 && (
          <div className="space-y-4 animate-slide-up">
            <p className="text-sm text-coffee-light/70">
              Found <strong className="text-coffee">{bookings.length}</strong> booking{bookings.length !== 1 ? 's' : ''}
            </p>
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && searched && bookings.length === 0 && (
          <div className="card p-8 text-center animate-fade-in">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-h3 text-coffee mb-2">No Bookings Found</h3>
            <p className="text-sm text-coffee-light/70">
              No bookings found for this phone number. Book a parcel from the home page to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
