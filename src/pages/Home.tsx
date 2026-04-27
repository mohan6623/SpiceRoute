import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package } from 'lucide-react'
import RateCalculator from '../components/RateCalculator'
import PriceBreakdownCard from '../components/PriceBreakdownCard'
import BookingForm from '../components/BookingForm'
import type { PriceEstimate, PincodeData, BookingFormData } from '../types'
import type { RateCalculatorFormValues } from '../lib/validators'
import { createBooking } from '../lib/bookingService'

type Step = 'rate' | 'book'

export default function Home() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('rate')
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null)
  const [rateValues, setRateValues] = useState<RateCalculatorFormValues | null>(null)
  const [pickupPincodeData, setPickupPincodeData] = useState<PincodeData | undefined>()
  const [deliveryPincodeData, setDeliveryPincodeData] = useState<PincodeData | undefined>()

  const handleEstimateCalculated = useCallback(
    (est: PriceEstimate, values: RateCalculatorFormValues) => {
      setEstimate(est)
      setRateValues(values)
    },
    []
  )

  const handlePincodeResolved = useCallback(
    (type: 'pickup' | 'delivery', data: PincodeData) => {
      if (type === 'pickup') setPickupPincodeData(data)
      else setDeliveryPincodeData(data)
    },
    []
  )

  const handleProceedToBook = useCallback(() => {
    setStep('book')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleBookingSubmit = useCallback(
    async (formData: BookingFormData, est: PriceEstimate) => {
      const booking = await createBooking(formData, est)
      navigate('/confirmation', { state: { booking } })
    },
    [navigate]
  )

  return (
    <div className="page-container">
      {/* Watermark Logo */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 -z-10 opacity-5 pointer-events-none no-print">
        <img src="/logo.png" alt="" className="w-96 h-96 object-contain" />
      </div>

      {/* Hero Section */}
      <div className="text-center mb-8 relative">
        <div className="flex items-center justify-center gap-3 mb-3">
          <img src="/logo.png" alt="SpiceRoute Logo" className="w-16 h-16 object-contain drop-shadow-md" />
        </div>
        <h1 className="text-h1 text-coffee mb-2">
          Ship Smarter. Deliver Faster.
        </h1>
        <p className="text-body text-coffee-light/70 max-w-lg mx-auto">
          Calculate rates, book parcels with doorstep pickup, and track your shipments — all in one place.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={() => setStep('rate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-200 cursor-pointer
            ${step === 'rate'
              ? 'bg-kraft text-white'
              : 'bg-kraft/10 text-kraft hover:bg-kraft/20'
            }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center font-bold">
            1
          </span>
          Rate Check
        </button>
        <div className="w-8 h-0.5 bg-paper-border" />
        <button
          onClick={() => estimate && setStep('book')}
          disabled={!estimate}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-200 cursor-pointer
            ${step === 'book'
              ? 'bg-kraft text-white'
              : estimate
                ? 'bg-kraft/10 text-kraft hover:bg-kraft/20'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center font-bold">
            2
          </span>
          Book Parcel
        </button>
      </div>

      {/* Step Content */}
      {step === 'rate' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <RateCalculator
            onEstimateCalculated={handleEstimateCalculated}
            onPincodeDataResolved={handlePincodeResolved}
          />

          {estimate && (
            <PriceBreakdownCard
              estimate={estimate}
              onProceedToBook={handleProceedToBook}
            />
          )}
        </div>
      )}

      {step === 'book' && estimate && rateValues && (
        <BookingForm
          estimate={estimate}
          rateValues={rateValues}
          pickupPincodeData={pickupPincodeData}
          deliveryPincodeData={deliveryPincodeData}
          onBookingSubmit={handleBookingSubmit}
        />
      )}
    </div>
  )
}
