import { Link } from 'react-router-dom'
import { MapPin, ArrowRight, Calendar, IndianRupee } from 'lucide-react'
import type { Booking } from '../types'
import { STATUS_BADGE_CLASS } from '../types'

interface BookingCardProps {
  booking: Booking
}

export default function BookingCard({ booking }: BookingCardProps) {
  const { formData, estimate, status, trackingId, createdAt } = booking
  const badgeClass = STATUS_BADGE_CLASS[status]

  return (
    <div className="card p-5 hover:shadow-kraft-md transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {/* Left: Route + details */}
        <div className="flex-1 min-w-0">
          {/* Tracking ID + Status */}
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-sm font-semibold text-coffee">
              {trackingId}
            </span>
            <span className={badgeClass}>{status}</span>
          </div>

          {/* Route */}
          <div className="flex items-center gap-2 text-sm text-coffee-light mb-2">
            <MapPin className="w-4 h-4 text-kraft flex-shrink-0" />
            <span className="truncate">{formData.senderCity}, {formData.senderState}</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{formData.receiverCity}, {formData.receiverState}</span>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-coffee-light/70">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5" />
              ₹{estimate.totalPrice.toFixed(2)}
            </span>
            <span>{formData.serviceType}</span>
          </div>
        </div>

        {/* Right: Track button */}
        <Link
          to={`/track?id=${trackingId}`}
          className="btn-outline text-sm py-2 px-4 self-start cursor-pointer"
        >
          Track
        </Link>
      </div>
    </div>
  )
}
