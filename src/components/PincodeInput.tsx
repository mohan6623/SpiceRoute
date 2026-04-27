import { useState, useEffect, useCallback } from 'react'
import { fetchPincodeData, isPincodeCached, getCachedPincode } from '../lib/pincodeApi'
import type { PincodeData } from '../types'

interface PincodeInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  onPincodeResolved: (data: PincodeData) => void
  error?: string
  city?: string
  state?: string
  id: string
}

export default function PincodeInput({
  label,
  value,
  onChange,
  onPincodeResolved,
  error,
  city,
  state,
  id,
}: PincodeInputProps) {
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const fetchData = useCallback(
    async (pincode: string) => {
      if (!/^\d{6}$/.test(pincode)) return
      if (isPincodeCached(pincode)) {
        const cached = getCachedPincode(pincode)
        if (cached) {
          onPincodeResolved(cached)
          setApiError(null)
        }
        return
      }

      setLoading(true)
      setApiError(null)
      try {
        const data = await fetchPincodeData(pincode)
        onPincodeResolved(data)
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Could not verify pincode.')
      } finally {
        setLoading(false)
      }
    },
    [onPincodeResolved]
  )

  // Auto-fetch when exactly 6 digits typed
  useEffect(() => {
    if (/^\d{6}$/.test(value)) {
      fetchData(value)
    }
  }, [value, fetchData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
    onChange(val)
  }

  const handleBlur = () => {
    if (/^\d{6}$/.test(value)) {
      fetchData(value)
    }
  }

  const displayError = error || apiError

  return (
    <div>
      <label htmlFor={id} className="input-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g. 110001"
          className={`input-field ${displayError ? 'border-error' : ''}`}
          maxLength={6}
          autoComplete="postal-code"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="spinner spinner-sm" />
          </div>
        )}
      </div>

      {displayError && (
        <p className="mt-1 text-xs text-error">{displayError}</p>
      )}

      {/* Auto-filled city and state */}
      {city && state && (
        <div className="mt-2 flex gap-3">
          <div className="flex-1">
            <label className="input-label text-xs">City</label>
            <input
              type="text"
              value={city}
              readOnly
              className="input-field bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
              tabIndex={-1}
            />
          </div>
          <div className="flex-1">
            <label className="input-label text-xs">State</label>
            <input
              type="text"
              value={state}
              readOnly
              className="input-field bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
              tabIndex={-1}
            />
          </div>
        </div>
      )}
    </div>
  )
}
