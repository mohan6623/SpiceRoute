import { Check } from 'lucide-react'
import type { BookingStatus } from '../types'
import { BOOKING_STATUSES } from '../types'

interface StatusTimelineProps {
  currentStatus: BookingStatus
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  'Booked': '#1E40AF',
  'Picked Up': '#D97706',
  'In Transit': '#DC2626',
  'Out for Delivery': '#7C3AED',
  'Delivered': '#166534',
}

export default function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const currentIndex = BOOKING_STATUSES.indexOf(currentStatus)

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Connecting line (background) */}
        <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-paper-border" />
        {/* Connecting line (progress) */}
        <div
          className="absolute top-5 left-[10%] h-0.5 transition-all duration-500"
          style={{
            width: `${currentIndex === 0 ? 0 : (currentIndex / (BOOKING_STATUSES.length - 1)) * 80}%`,
            backgroundColor: STATUS_COLORS[currentStatus],
          }}
        />

        {BOOKING_STATUSES.map((status, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isActive = isCompleted || isCurrent
          const color = isActive ? STATUS_COLORS[status] : '#D1D5DB'

          return (
            <div key={status} className="flex flex-col items-center z-10 relative" style={{ width: '20%' }}>
              {/* Circle */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center
                           transition-all duration-300 border-2"
                style={{
                  backgroundColor: isActive ? color : '#FFFFFF',
                  borderColor: isActive ? color : '#D1D5DB',
                }}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span
                    className="text-xs font-bold"
                    style={{ color: isActive ? '#FFFFFF' : '#9CA3AF' }}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`mt-2 text-xs text-center font-medium leading-tight
                  ${isActive ? 'text-coffee' : 'text-gray-400'}`}
              >
                {status}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
