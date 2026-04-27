import { useState, useEffect } from 'react'
import { PackageSearch, Inbox } from 'lucide-react'
import { getBookingsByUserId } from '../lib/bookingService'
import type { Booking } from '../types'
import BookingCard from '../components/BookingCard'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { useAuth } from '../context/AuthContext'

export default function MyBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchBookings = async () => {
      setLoading(true)
      try {
        const results = await getBookingsByUserId(user.id)
        setBookings(results)
      } catch {
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user])

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
            All your parcel bookings in one place
          </p>
          {user && (
            <p className="text-xs text-coffee-light/40 mt-1">
              Signed in as {user.email}
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {/* Results */}
        {!loading && bookings.length > 0 && (
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
        {!loading && bookings.length === 0 && (
          <div className="card p-8 text-center animate-fade-in">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-h3 text-coffee mb-2">No Bookings Yet</h3>
            <p className="text-sm text-coffee-light/70">
              You haven't booked any parcels yet. Ship your first parcel to see it here!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
