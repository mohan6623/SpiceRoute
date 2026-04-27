import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { BookingFormValues } from '../lib/validators'
import type { PincodeData } from '../types'
import { UserCheck, Phone, MapPin } from 'lucide-react'
import PincodeInput from './PincodeInput'
import ValidationError from './ValidationError'

interface ReceiverDetailsProps {
  register: UseFormRegister<BookingFormValues>
  errors: FieldErrors<BookingFormValues>
  receiverPincode: string
  receiverCity: string
  receiverState: string
  onPincodeChange: (value: string) => void
  onPincodeResolved: (data: PincodeData) => void
}

export default function ReceiverDetails({
  register,
  errors,
  receiverPincode,
  receiverCity,
  receiverState,
  onPincodeChange,
  onPincodeResolved,
}: ReceiverDetailsProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-h3 text-coffee flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-postal/10 rounded-lg flex items-center justify-center">
          <UserCheck className="w-4 h-4 text-postal" />
        </div>
        Receiver Details
      </legend>

      {/* Name + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="receiver-name" className="input-label flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-kraft" />
            Full Name
          </label>
          <input
            id="receiver-name"
            type="text"
            {...register('receiverName')}
            placeholder="Enter full name"
            className="input-field"
          />
          <ValidationError message={errors.receiverName?.message} />
        </div>
        <div>
          <label htmlFor="receiver-phone" className="input-label flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-kraft" />
            Phone Number
          </label>
          <input
            id="receiver-phone"
            type="tel"
            {...register('receiverPhone')}
            placeholder="10-digit phone number"
            className="input-field"
            maxLength={10}
          />
          <ValidationError message={errors.receiverPhone?.message} />
        </div>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="receiver-address" className="input-label flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-kraft" />
          Full Address
        </label>
        <textarea
          id="receiver-address"
          {...register('receiverAddress')}
          placeholder="House no., street, locality, landmark"
          rows={3}
          className="input-field resize-none"
        />
        <ValidationError message={errors.receiverAddress?.message} />
      </div>

      {/* Pincode */}
      <PincodeInput
        id="receiver-pincode"
        label="Pincode"
        value={receiverPincode}
        onChange={onPincodeChange}
        onPincodeResolved={onPincodeResolved}
        error={errors.receiverPincode?.message}
        city={receiverCity}
        state={receiverState}
      />
    </fieldset>
  )
}
