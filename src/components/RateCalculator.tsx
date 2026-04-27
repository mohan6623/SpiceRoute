import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calculator, Package, Truck, CreditCard } from 'lucide-react'
import { rateCalculatorSchema, type RateCalculatorFormValues } from '../lib/validators'
import { calculatePrice } from '../lib/priceCalculator'
import type { PriceEstimate, PincodeData } from '../types'
import { SERVICE_TYPES, PAYMENT_MODES } from '../types'
import PincodeInput from './PincodeInput'
import ValidationError from './ValidationError'
import { useState } from 'react'

interface RateCalculatorProps {
  onEstimateCalculated: (estimate: PriceEstimate, formValues: RateCalculatorFormValues) => void
  onPincodeDataResolved: (type: 'pickup' | 'delivery', data: PincodeData) => void
}

export default function RateCalculator({
  onEstimateCalculated,
  onPincodeDataResolved,
}: RateCalculatorProps) {
  const [calcError, setCalcError] = useState<string | null>(null)
  const [pickupCity, setPickupCity] = useState('')
  const [pickupState, setPickupState] = useState('')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [deliveryState, setDeliveryState] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RateCalculatorFormValues>({
    resolver: zodResolver(rateCalculatorSchema),
    defaultValues: {
      pickupPincode: '',
      deliveryPincode: '',
      serviceType: 'Speed Post',
      paymentMode: 'Prepaid',
    },
  })

  const pickupPincode = watch('pickupPincode')
  const deliveryPincode = watch('deliveryPincode')
  const selectedPaymentMode = watch('paymentMode')

  const onSubmit = (values: RateCalculatorFormValues) => {
    setCalcError(null)
    try {
      const estimate = calculatePrice(
        values.actualWeight,
        { length: values.length, breadth: values.breadth, height: values.height },
        values.serviceType,
        values.paymentMode
      )
      onEstimateCalculated(estimate, values)
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : 'Calculation failed')
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-postal/10 rounded-lg flex items-center justify-center">
          <Calculator className="w-5 h-5 text-postal" />
        </div>
        <div>
          <h2 className="text-h2 text-coffee">Rate Calculator</h2>
          <p className="text-sm text-coffee-light/70">
            Check shipping rates before booking
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Pincodes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PincodeInput
            id="pickup-pincode"
            label="Pickup Pincode"
            value={pickupPincode}
            onChange={(val) => setValue('pickupPincode', val, { shouldValidate: true })}
            onPincodeResolved={(data) => {
              setPickupCity(data.city)
              setPickupState(data.state)
              onPincodeDataResolved('pickup', data)
            }}
            error={errors.pickupPincode?.message}
            city={pickupCity}
            state={pickupState}
          />
          <PincodeInput
            id="delivery-pincode"
            label="Delivery Pincode"
            value={deliveryPincode}
            onChange={(val) => setValue('deliveryPincode', val, { shouldValidate: true })}
            onPincodeResolved={(data) => {
              setDeliveryCity(data.city)
              setDeliveryState(data.state)
              onPincodeDataResolved('delivery', data)
            }}
            error={errors.deliveryPincode?.message}
            city={deliveryCity}
            state={deliveryState}
          />
        </div>

        {/* Weight */}
        <div>
          <label htmlFor="actual-weight" className="input-label flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-kraft" />
            Actual Weight (kg)
          </label>
          <input
            id="actual-weight"
            type="number"
            step="0.01"
            {...register('actualWeight', { valueAsNumber: true })}
            placeholder="e.g. 1.5"
            className="input-field"
          />
          <ValidationError message={errors.actualWeight?.message} />
        </div>

        {/* Dimensions */}
        <div>
          <label className="input-label">Dimensions (cm)</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <input
                type="number"
                step="0.1"
                {...register('length', { valueAsNumber: true })}
                placeholder="Length"
                className="input-field"
                aria-label="Length in cm"
              />
              <ValidationError message={errors.length?.message} />
            </div>
            <div>
              <input
                type="number"
                step="0.1"
                {...register('breadth', { valueAsNumber: true })}
                placeholder="Breadth"
                className="input-field"
                aria-label="Breadth in cm"
              />
              <ValidationError message={errors.breadth?.message} />
            </div>
            <div>
              <input
                type="number"
                step="0.1"
                {...register('height', { valueAsNumber: true })}
                placeholder="Height"
                className="input-field"
                aria-label="Height in cm"
              />
              <ValidationError message={errors.height?.message} />
            </div>
          </div>
        </div>

        {/* Service Type */}
        <div>
          <label htmlFor="service-type" className="input-label flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-kraft" />
            Service Type
          </label>
          <select
            id="service-type"
            {...register('serviceType')}
            className="select-field"
          >
            {SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <ValidationError message={errors.serviceType?.message} />
        </div>

        {/* Payment Mode */}
        <div>
          <label className="input-label flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-kraft" />
            Payment Mode
          </label>
          <div className="flex gap-4 mt-1">
            {PAYMENT_MODES.map((mode) => (
              <label
                key={mode}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-card border-2 cursor-pointer
                  transition-all duration-200 text-sm font-medium
                  ${selectedPaymentMode === mode
                    ? 'border-kraft bg-kraft/5 text-kraft'
                    : 'border-paper-border text-coffee-light hover:border-kraft/30'
                  }`}
              >
                <input
                  type="radio"
                  value={mode}
                  {...register('paymentMode')}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${selectedPaymentMode === mode
                    ? 'border-kraft'
                    : 'border-gray-300'
                  }`}
                >
                  {selectedPaymentMode === mode && (
                    <div className="w-2 h-2 rounded-full bg-kraft" />
                  )}
                </div>
                {mode}
              </label>
            ))}
          </div>
          <ValidationError message={errors.paymentMode?.message} />
        </div>

        {/* Error message */}
        {calcError && (
          <div className="p-3 rounded-card bg-error/5 border border-error/20 text-error text-sm">
            {calcError}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-cta w-full text-base"
        >
          {isSubmitting ? (
            <>
              <div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5" />
              Check Price
            </>
          )}
        </button>
      </form>
    </div>
  )
}
