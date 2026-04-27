import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { BookingFormValues } from '../lib/validators'
import type { PincodeData } from '../types'
import { User, Phone, Mail, MapPin } from 'lucide-react'
import PincodeInput from './PincodeInput'
import ValidationError from './ValidationError'

interface SenderDetailsProps {
  register: UseFormRegister<BookingFormValues>
  errors: FieldErrors<BookingFormValues>
  senderPincode: string
  senderCity: string
  senderState: string
  onPincodeChange: (value: string) => void
  onPincodeResolved: (data: PincodeData) => void
}

export default function SenderDetails({
  register,
  errors,
  senderPincode,
  senderCity,
  senderState,
  onPincodeChange,
  onPincodeResolved,
}: SenderDetailsProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-h3 text-coffee flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-kraft/10 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-kraft" />
        </div>
        Sender Details
      </legend>

      {/* Name + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sender-name" className="input-label flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-kraft" />
            Full Name
          </label>
          <input
            id="sender-name"
            type="text"
            {...register('senderName')}
            placeholder="Enter full name"
            className="input-field"
          />
          <ValidationError message={errors.senderName?.message} />
        </div>
        <div>
          <label htmlFor="sender-phone" className="input-label flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-kraft" />
            Phone Number
          </label>
          <input
            id="sender-phone"
            type="tel"
            {...register('senderPhone')}
            placeholder="10-digit phone number"
            className="input-field"
            maxLength={10}
          />
          <ValidationError message={errors.senderPhone?.message} />
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="sender-email" className="input-label flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-kraft" />
          Email (optional)
        </label>
        <input
          id="sender-email"
          type="email"
          {...register('senderEmail')}
          placeholder="email@example.com"
          className="input-field"
        />
        <ValidationError message={errors.senderEmail?.message} />
      </div>

      {/* Address */}
      <div>
        <label htmlFor="sender-address" className="input-label flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-kraft" />
          Full Address
        </label>
        <textarea
          id="sender-address"
          {...register('senderAddress')}
          placeholder="House no., street, locality, landmark"
          rows={3}
          className="input-field resize-none"
        />
        <ValidationError message={errors.senderAddress?.message} />
      </div>

      {/* Pincode */}
      <PincodeInput
        id="sender-pincode"
        label="Pincode"
        value={senderPincode}
        onChange={onPincodeChange}
        onPincodeResolved={onPincodeResolved}
        error={errors.senderPincode?.message}
        city={senderCity}
        state={senderState}
      />
    </fieldset>
  )
}
