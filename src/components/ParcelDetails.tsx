import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { BookingFormValues } from '../lib/validators'
import { PICKUP_TIME_SLOTS } from '../types'
import { Package, Calendar, Clock, FileText, IndianRupee, AlertCircle } from 'lucide-react'
import ValidationError from './ValidationError'

interface ParcelDetailsProps {
  register: UseFormRegister<BookingFormValues>
  errors: FieldErrors<BookingFormValues>
  prefilledWeight?: number
  prefilledDimensions?: { length: number; breadth: number; height: number }
  /** When true, declared value becomes mandatory with COD limits */
  isCOD?: boolean
}

export default function ParcelDetails({
  register,
  errors,
  isCOD = false,
}: ParcelDetailsProps) {
  // Compute tomorrow's date for minimum pickup date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <fieldset className="space-y-4">
      <legend className="text-h3 text-coffee flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-kraft/10 rounded-lg flex items-center justify-center">
          <Package className="w-4 h-4 text-kraft" />
        </div>
        Parcel &amp; Pickup Details
      </legend>

      {/* Contents Description */}
      <div>
        <label htmlFor="contents-desc" className="input-label flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-kraft" />
          Contents Description (optional)
        </label>
        <input
          id="contents-desc"
          type="text"
          {...register('contentsDescription')}
          placeholder="e.g. Books, Electronics, Clothing"
          className="input-field"
        />
      </div>

      {/* Declared Value */}
      <div>
        <label htmlFor="declared-value" className="input-label flex items-center gap-1.5">
          <IndianRupee className="w-3.5 h-3.5 text-kraft" />
          Declared Value ₹ {isCOD ? <span className="text-error">*</span> : '(optional)'}
        </label>
        <input
          id="declared-value"
          type="number"
          step="1"
          {...register('declaredValue', { valueAsNumber: true })}
          placeholder={isCOD ? 'Required for COD (₹1 – ₹50,000)' : 'e.g. 500'}
          className={`input-field ${isCOD ? 'border-amber-300 focus:border-amber-500' : ''}`}
        />
        <ValidationError message={errors.declaredValue?.message} />
        {isCOD && !errors.declaredValue && (
          <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Required for Cash on Delivery. India Post limit: ₹50,000
          </p>
        )}
      </div>

      {/* Pickup Date + Time Slot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pickup-date" className="input-label flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-kraft" />
            Pickup Date
          </label>
          <input
            id="pickup-date"
            type="date"
            {...register('pickupDate')}
            min={minDate}
            className="input-field"
          />
          <ValidationError message={errors.pickupDate?.message} />
        </div>
        <div>
          <label htmlFor="pickup-slot" className="input-label flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-kraft" />
            Pickup Time Slot
          </label>
          <select
            id="pickup-slot"
            {...register('pickupTimeSlot')}
            className="select-field"
          >
            <option value="">Select time slot</option>
            {PICKUP_TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
          <ValidationError message={errors.pickupTimeSlot?.message} />
        </div>
      </div>
    </fieldset>
  )
}
