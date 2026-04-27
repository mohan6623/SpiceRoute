import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator, ArrowRight } from 'lucide-react'
import RateCalculator from '../components/RateCalculator'
import PriceBreakdownCard from '../components/PriceBreakdownCard'
import type { PriceEstimate, PincodeData } from '../types'
import type { RateCalculatorFormValues } from '../lib/validators'
import { useAuth } from '../context/AuthContext'

export default function Rates() {
  const navigate = useNavigate()
  const { user } = useAuth()

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
    if (!user) {
      navigate('/login?redirect=/ship')
      return
    }
    navigate('/ship', {
      state: {
        estimate,
        rateValues,
        pickupPincodeData,
        deliveryPincodeData,
      },
    })
  }, [user, navigate, estimate, rateValues, pickupPincodeData, deliveryPincodeData])

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-3 bg-kraft/10 rounded-xl flex items-center justify-center">
            <Calculator className="w-6 h-6 text-kraft" />
          </div>
          <h1 className="text-h1 text-coffee mb-2">Rate Calculator</h1>
          <p className="text-body text-coffee-light/70">
            Get instant shipping rates for your parcel across India
          </p>
        </div>

        {/* Calculator */}
        <div className="space-y-4">
          <RateCalculator
            onEstimateCalculated={handleEstimateCalculated}
            onPincodeDataResolved={handlePincodeResolved}
          />

          {estimate && (
            <>
              <PriceBreakdownCard
                estimate={estimate}
                onProceedToBook={handleProceedToBook}
              />

              {/* Book Now CTA */}
              <div className="text-center">
                <button
                  onClick={handleProceedToBook}
                  className="btn-cta cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  {user ? 'Proceed to Book' : 'Sign In to Book'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
