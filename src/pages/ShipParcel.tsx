import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Package } from 'lucide-react'
import RateCalculator from '../components/RateCalculator'
import PriceBreakdownCard from '../components/PriceBreakdownCard'
import BookingForm from '../components/BookingForm'
import type { PriceEstimate, PincodeData, BookingFormData } from '../types'
import type { RateCalculatorFormValues } from '../lib/validators'
import { createBooking } from '../lib/bookingService'
import { autoSaveAddressFromBooking } from '../lib/addressService'
import { useAuth } from '../context/AuthContext'

type Step = 'rate' | 'book'

export default function ShipParcel() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // Check if we arrived from /rates with pre-calculated data
  const incomingState = (location.state as {
    estimate?: PriceEstimate
    rateValues?: RateCalculatorFormValues
    pickupPincodeData?: PincodeData
    deliveryPincodeData?: PincodeData
  } | null) ?? (() => {
    // Fallback: recover from sessionStorage (survives login redirect)
    try {
      const saved = sessionStorage.getItem('spiceroute_pending_booking')
      if (saved) {
        sessionStorage.removeItem('spiceroute_pending_booking')
        return JSON.parse(saved)
      }
    } catch { /* ignore */ }
    return null
  })()

  const [step, setStep] = useState<Step>(incomingState?.estimate ? 'book' : 'rate')
  const [estimate, setEstimate] = useState<PriceEstimate | null>(incomingState?.estimate ?? null)
  const [rateValues, setRateValues] = useState<RateCalculatorFormValues | null>(
    incomingState?.rateValues ?? null
  )
  const [pickupPincodeData, setPickupPincodeData] = useState<PincodeData | undefined>(
    incomingState?.pickupPincodeData
  )
  const [deliveryPincodeData, setDeliveryPincodeData] = useState<PincodeData | undefined>(
    incomingState?.deliveryPincodeData
  )

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
      const booking = await createBooking(formData, est, user?.id)

      // Auto-save sender and receiver addresses (fire-and-forget)
      if (user?.id) {
        autoSaveAddressFromBooking(user.id, 'sender', {
          name: formData.senderName,
          phone: formData.senderPhone,
          email: formData.senderEmail,
          address: formData.senderAddress,
          pincode: formData.senderPincode,
          city: formData.senderCity,
          state: formData.senderState,
        }).catch(() => {})

        autoSaveAddressFromBooking(user.id, 'receiver', {
          name: formData.receiverName,
          phone: formData.receiverPhone,
          email: formData.receiverEmail,
          address: formData.receiverAddress,
          pincode: formData.receiverPincode,
          city: formData.receiverCity,
          state: formData.receiverState,
        }).catch(() => {})
      }

      navigate('/confirmation', { state: { booking } })
    },
    [navigate, user]
  )

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-3 bg-kraft/10 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6 text-kraft" />
          </div>
          <h1 className="text-h1 text-coffee mb-2">Ship a Parcel</h1>
          <p className="text-body text-coffee-light/70">
            Calculate your rate and book your shipment
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setStep('rate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              transition-all duration-200 cursor-pointer
              ${step === 'rate'
                ? 'bg-kraft text-white shadow-sm'
                : 'bg-kraft/10 text-kraft hover:bg-kraft/20'
              }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center font-bold">
              1
            </span>
            Rate Check
          </button>
          <div className="w-6 h-0.5 bg-paper-border" />
          <button
            onClick={() => estimate && setStep('book')}
            disabled={!estimate}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              transition-all duration-200 cursor-pointer
              ${step === 'book'
                ? 'bg-kraft text-white shadow-sm'
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
          <div className="space-y-4">
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
    </div>
  )
}
