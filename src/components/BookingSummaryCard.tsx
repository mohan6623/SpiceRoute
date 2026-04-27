import { MapPin, ArrowRight, Package, Truck, Calendar, IndianRupee } from 'lucide-react'
import type { PriceEstimate } from '../types'

interface BookingSummaryCardProps {
  senderCity?: string
  senderState?: string
  receiverCity?: string
  receiverState?: string
  serviceType?: string
  paymentMode?: string
  estimate?: PriceEstimate | null
  pickupDate?: string
  pickupTimeSlot?: string
}

export default function BookingSummaryCard({
  senderCity,
  senderState,
  receiverCity,
  receiverState,
  serviceType,
  paymentMode,
  estimate,
  pickupDate,
  pickupTimeSlot,
}: BookingSummaryCardProps) {
  const hasRoute = senderCity && receiverCity

  return (
    <div className="card p-5">
      <h3 className="text-h3 text-coffee mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-kraft" />
        Booking Summary
      </h3>

      <div className="space-y-3">
        {/* Route */}
        {hasRoute && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-kraft flex-shrink-0" />
            <span className="text-coffee-light">
              {senderCity}, {senderState}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-coffee-light">
              {receiverCity}, {receiverState}
            </span>
          </div>
        )}

        {/* Service + Payment */}
        {serviceType && (
          <div className="flex items-center gap-2 text-sm">
            <Truck className="w-4 h-4 text-kraft flex-shrink-0" />
            <span className="text-coffee-light">
              {serviceType} • {paymentMode}
            </span>
          </div>
        )}

        {/* Pickup */}
        {pickupDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-kraft flex-shrink-0" />
            <span className="text-coffee-light">
              {new Date(pickupDate + 'T00:00:00').toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {pickupTimeSlot && ` • ${pickupTimeSlot}`}
            </span>
          </div>
        )}

        {/* Price Breakdown */}
        {estimate && (
          <>
            <hr className="border-paper-border" />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-coffee-light">
                <span>Chargeable Weight</span>
                <span className="font-medium">{estimate.chargeableWeight} kg</span>
              </div>
              <div className="flex justify-between text-coffee-light">
                <span>Base Price</span>
                <span>₹{estimate.basePrice.toFixed(2)}</span>
              </div>
              {estimate.codSurcharge > 0 && (
                <div className="flex justify-between text-coffee-light">
                  <span>COD Surcharge</span>
                  <span>₹{estimate.codSurcharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-coffee-light">
                <span>GST (18%)</span>
                <span>₹{estimate.gstAmount.toFixed(2)}</span>
              </div>
              <hr className="border-paper-border" />
              <div className="flex justify-between text-coffee font-bold text-base">
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" />
                  Total
                </span>
                <span>₹{estimate.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!hasRoute && !estimate && (
          <p className="text-sm text-gray-400 italic">
            Summary will update as you fill in the form...
          </p>
        )}
      </div>
    </div>
  )
}
