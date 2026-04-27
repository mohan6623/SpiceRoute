import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, Package, AlertTriangle, Zap } from 'lucide-react'
import { trackingSearchSchema, type TrackingSearchValues } from '../lib/validators'
import { getBookingByTrackingId, updateBookingStatus } from '../lib/bookingService'
import type { Booking, BookingStatus } from '../types'
import { BOOKING_STATUSES, STATUS_BADGE_CLASS } from '../types'
import StatusTimeline from '../components/StatusTimeline'
import { CardSkeleton } from '../components/LoadingSkeleton'
import ValidationError from '../components/ValidationError'

export default function TrackParcel() {
  const [searchParams] = useSearchParams()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [demoUpdating, setDemoUpdating] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TrackingSearchValues>({
    resolver: zodResolver(trackingSearchSchema),
  })

  const doSearch = useCallback(async (trackingId: string) => {
    setLoading(true)
    setNotFound(false)
    setBooking(null)
    try {
      const result = await getBookingByTrackingId(trackingId)
      if (result) {
        setBooking(result)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Pre-fill from URL param
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setValue('trackingId', id)
      doSearch(id)
    }
  }, [searchParams, setValue, doSearch])

  // Demo mode shortcut: Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') {
        setDemoMode((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const onSubmit = (values: TrackingSearchValues) => {
    doSearch(values.trackingId)
  }

  const handleAdvanceStatus = async () => {
    if (!booking) return
    const currentIdx = BOOKING_STATUSES.indexOf(booking.status)
    if (currentIdx >= BOOKING_STATUSES.length - 1) return

    const nextStatus: BookingStatus = BOOKING_STATUSES[currentIdx + 1]
    setDemoUpdating(true)
    const success = await updateBookingStatus(booking.trackingId, nextStatus)
    if (success) {
      setBooking({ ...booking, status: nextStatus })
    }
    setDemoUpdating(false)
  }

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-3 bg-postal/10 rounded-xl flex items-center justify-center">
            <Search className="w-6 h-6 text-postal" />
          </div>
          <h1 className="text-h1 text-coffee mb-2">Track Your Parcel</h1>
          <p className="text-body text-coffee-light/70">
            Enter your tracking ID to see real-time shipment status
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                {...register('trackingId')}
                placeholder="Enter tracking ID (e.g., IP2026123456)"
                className="input-field font-mono uppercase"
              />
              <ValidationError message={errors.trackingId?.message} />
            </div>
            <button type="submit" disabled={loading} className="btn-cta self-start cursor-pointer">
              {loading ? <div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> : <Search className="w-5 h-5" />}
            </button>
          </div>
        </form>

        {/* Loading */}
        {loading && <CardSkeleton />}

        {/* Not Found */}
        {notFound && !loading && (
          <div className="card p-8 text-center animate-fade-in">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-h3 text-coffee mb-2">No Parcel Found</h3>
            <p className="text-sm text-coffee-light/70">
              No parcel found with this tracking ID. Please check and try again.
            </p>
          </div>
        )}

        {/* Booking Result */}
        {booking && !loading && (
          <div className="space-y-6 animate-slide-up">
            {/* Status + Tracking ID */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-coffee-light/60 mb-1">Tracking ID</p>
                  <p className="text-xl font-mono font-bold text-coffee">{booking.trackingId}</p>
                </div>
                <span className={STATUS_BADGE_CLASS[booking.status]}>
                  {booking.status}
                </span>
              </div>
              <StatusTimeline currentStatus={booking.status} />
            </div>

            {/* Booking Details */}
            <div className="card p-6">
              <h3 className="text-h3 text-coffee mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-kraft" />
                Shipment Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-coffee-light/60 mb-1">From</p>
                  <p className="font-medium text-coffee">{booking.formData.senderName}</p>
                  <p className="text-coffee-light">
                    {booking.formData.senderCity}, {booking.formData.senderState}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-coffee-light/60 mb-1">To</p>
                  <p className="font-medium text-coffee">{booking.formData.receiverName}</p>
                  <p className="text-coffee-light">
                    {booking.formData.receiverCity}, {booking.formData.receiverState}
                  </p>
                </div>
              </div>
              <hr className="border-paper-border my-4" />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-coffee-light/60">Service</p>
                  <p className="font-medium text-coffee">{booking.formData.serviceType}</p>
                </div>
                <div>
                  <p className="text-xs text-coffee-light/60">Weight</p>
                  <p className="font-medium text-coffee">{booking.estimate.chargeableWeight} kg</p>
                </div>
                <div>
                  <p className="text-xs text-coffee-light/60">Total</p>
                  <p className="font-medium text-coffee">₹{booking.estimate.totalPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Mode Panel */}
        {demoMode && booking && (
          <div className="mt-6 p-4 rounded-card border-2 border-dashed border-amber-400 bg-amber-50 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-800 uppercase tracking-wider">
                Demo Mode
              </span>
            </div>
            <p className="text-xs text-amber-700 mb-3">
              Current: <strong>{booking.status}</strong>
              {booking.status !== 'Delivered' && (
                <> → Next: <strong>{BOOKING_STATUSES[BOOKING_STATUSES.indexOf(booking.status) + 1]}</strong></>
              )}
            </p>
            <button
              onClick={handleAdvanceStatus}
              disabled={demoUpdating || booking.status === 'Delivered'}
              className="px-4 py-2 bg-amber-500 text-white rounded-card text-sm font-medium
                       hover:bg-amber-600 transition-colors duration-200 cursor-pointer
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {demoUpdating ? 'Updating...' : booking.status === 'Delivered' ? 'Already Delivered' : 'Advance Status'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
