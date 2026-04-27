import { ArrowRight, Scale, Truck, Clock } from 'lucide-react'
import type { PriceEstimate } from '../types'

interface PriceBreakdownCardProps {
  estimate: PriceEstimate
  onProceedToBook: () => void
}

export default function PriceBreakdownCard({
  estimate,
  onProceedToBook,
}: PriceBreakdownCardProps) {
  return (
    <div className="card p-6 sm:p-8 animate-slide-up">
      <h3 className="text-h3 text-coffee mb-5 flex items-center gap-2">
        <Scale className="w-5 h-5 text-kraft" />
        Price Breakdown
      </h3>

      {/* Weight Comparison */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-paper rounded-card p-3 text-center border border-paper-border">
          <p className="text-xs text-coffee-light/70 mb-1">Actual Weight</p>
          <p className="text-lg font-bold text-coffee">{estimate.actualWeight} kg</p>
        </div>
        <div className="bg-paper rounded-card p-3 text-center border border-paper-border">
          <p className="text-xs text-coffee-light/70 mb-1">Volumetric</p>
          <p className="text-lg font-bold text-coffee">{estimate.volumetricWeight} kg</p>
        </div>
        <div className="bg-kraft/5 rounded-card p-3 text-center border border-kraft/20">
          <p className="text-xs text-kraft mb-1 font-medium">Chargeable</p>
          <p className="text-lg font-bold text-kraft">{estimate.chargeableWeight} kg</p>
        </div>
      </div>

      {/* Price Lines */}
      <div className="space-y-2.5 mb-5">
        <div className="flex justify-between text-sm text-coffee-light">
          <span>Base Price ({estimate.serviceType})</span>
          <span className="font-medium">₹{estimate.basePrice.toFixed(2)}</span>
        </div>
        {estimate.codSurcharge > 0 && (
          <div className="flex justify-between text-sm text-coffee-light">
            <span>COD Surcharge</span>
            <span className="font-medium">₹{estimate.codSurcharge.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-coffee-light">
          <span>GST (18%)</span>
          <span className="font-medium">₹{estimate.gstAmount.toFixed(2)}</span>
        </div>

        <hr className="border-paper-border" />

        <div className="flex justify-between text-coffee font-bold text-lg">
          <span>Total</span>
          <span>₹{estimate.totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Delivery Estimate */}
      <div className="flex items-center gap-2 text-sm text-coffee-light mb-6 bg-paper rounded-card p-3 border border-paper-border">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-kraft" />
          <span>Estimated Delivery:</span>
        </div>
        <span className="font-semibold text-coffee flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {estimate.deliveryDays}
        </span>
      </div>

      {/* Proceed Button */}
      <button
        onClick={onProceedToBook}
        className="btn-primary w-full text-base"
      >
        Proceed to Book
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}
