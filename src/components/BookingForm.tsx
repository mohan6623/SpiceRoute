import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { bookingFormSchema, type BookingFormValues } from '../lib/validators'
import type { PriceEstimate, BookingFormData, PincodeData } from '../types'
import type { RateCalculatorFormValues } from '../lib/validators'
import SenderDetails from './SenderDetails'
import ReceiverDetails from './ReceiverDetails'
import ParcelDetails from './ParcelDetails'
import BookingSummaryCard from './BookingSummaryCard'
import { useState } from 'react'

interface BookingFormProps {
  estimate: PriceEstimate
  rateValues: RateCalculatorFormValues
  pickupPincodeData?: PincodeData
  deliveryPincodeData?: PincodeData
  onBookingSubmit: (formData: BookingFormData, estimate: PriceEstimate) => Promise<void>
}

export default function BookingForm({
  estimate,
  rateValues,
  pickupPincodeData,
  deliveryPincodeData,
  onBookingSubmit,
}: BookingFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill data from rate step
  const [senderPincode, setSenderPincode] = useState(rateValues.pickupPincode)
  const [senderCity, setSenderCity] = useState(pickupPincodeData?.city ?? '')
  const [senderState, setSenderState] = useState(pickupPincodeData?.state ?? '')
  const [receiverPincode, setReceiverPincode] = useState(rateValues.deliveryPincode)
  const [receiverCity, setReceiverCity] = useState(deliveryPincodeData?.city ?? '')
  const [receiverState, setReceiverState] = useState(deliveryPincodeData?.state ?? '')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      senderPincode: rateValues.pickupPincode,
      senderCity: pickupPincodeData?.city ?? '',
      senderState: pickupPincodeData?.state ?? '',
      receiverPincode: rateValues.deliveryPincode,
      receiverCity: deliveryPincodeData?.city ?? '',
      receiverState: deliveryPincodeData?.state ?? '',
      pickupTimeSlot: undefined,
    },
  })

  const watchedPickupDate = watch('pickupDate')
  const watchedPickupSlot = watch('pickupTimeSlot')

  const onSubmit = async (values: BookingFormValues) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const formData: BookingFormData = {
        ...values,
        senderEmail: values.senderEmail || undefined,
        contentsDescription: values.contentsDescription || undefined,
        declaredValue: values.declaredValue || undefined,
        actualWeight: estimate.actualWeight,
        dimensions: {
          length: rateValues.length,
          breadth: rateValues.breadth,
          height: rateValues.height,
        },
        serviceType: rateValues.serviceType,
        paymentMode: rateValues.paymentMode,
      }
      await onBookingSubmit(formData, estimate)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Booking failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form (2 columns) */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="lg:col-span-2 space-y-6"
        >
          {/* Sender */}
          <div className="card p-6">
            <SenderDetails
              register={register}
              errors={errors}
              senderPincode={senderPincode}
              senderCity={senderCity}
              senderState={senderState}
              onPincodeChange={(val) => {
                setSenderPincode(val)
                setValue('senderPincode', val, { shouldValidate: true })
              }}
              onPincodeResolved={(data: PincodeData) => {
                setSenderCity(data.city)
                setSenderState(data.state)
                setValue('senderCity', data.city)
                setValue('senderState', data.state)
              }}
            />
          </div>

          {/* Receiver */}
          <div className="card p-6">
            <ReceiverDetails
              register={register}
              errors={errors}
              receiverPincode={receiverPincode}
              receiverCity={receiverCity}
              receiverState={receiverState}
              onPincodeChange={(val) => {
                setReceiverPincode(val)
                setValue('receiverPincode', val, { shouldValidate: true })
              }}
              onPincodeResolved={(data: PincodeData) => {
                setReceiverCity(data.city)
                setReceiverState(data.state)
                setValue('receiverCity', data.city)
                setValue('receiverState', data.state)
              }}
            />
          </div>

          {/* Parcel + Pickup */}
          <div className="card p-6">
            <ParcelDetails
              register={register}
              errors={errors}
              prefilledWeight={estimate.actualWeight}
              prefilledDimensions={{
                length: rateValues.length,
                breadth: rateValues.breadth,
                height: rateValues.height,
              }}
            />
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="p-4 rounded-card bg-error/5 border border-error/20 text-error text-sm">
              {submitError}
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-cta w-full text-base py-4"
          >
            {isSubmitting ? (
              <>
                <div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                Processing Booking...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Confirm Booking
              </>
            )}
          </button>
        </form>

        {/* Summary Sidebar (1 column) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <BookingSummaryCard
              senderCity={senderCity}
              senderState={senderState}
              receiverCity={receiverCity}
              receiverState={receiverState}
              serviceType={rateValues.serviceType}
              paymentMode={rateValues.paymentMode}
              estimate={estimate}
              pickupDate={watchedPickupDate}
              pickupTimeSlot={watchedPickupSlot}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
