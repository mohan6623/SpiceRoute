import { useLocation, Navigate, Link } from 'react-router-dom'
import { CheckCircle, Copy, Check, Printer, Search, Package, Download, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Booking } from '../types'
import StatusTimeline from '../components/StatusTimeline'
import { generateBookingSlipPDF } from '../lib/pdfService'
import { sendBookingEmail } from '../lib/emailService'

export default function Confirmation() {
  const location = useLocation()
  const booking = (location.state as { booking?: Booking })?.booking
  const [copied, setCopied] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

  // Automatically send confirmation email on mount
  useEffect(() => {
    if (booking && booking.formData.senderEmail) {
      setEmailStatus('sending')
      sendBookingEmail('booking_confirmation', booking)
        .then((ok) => setEmailStatus(ok ? 'sent' : 'failed'))
        .catch(() => setEmailStatus('failed'))
    }
  }, [booking])

  if (!booking) {
    return <Navigate to="/" replace />
  }

  const { trackingId, formData, estimate, status, createdAt } = booking

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = trackingId
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    await generateBookingSlipPDF(booking)
  }

  const handleResendEmail = async () => {
    setEmailStatus('sending')
    const ok = await sendBookingEmail('booking_confirmation', booking)
    setEmailStatus(ok ? 'sent' : 'failed')
  }

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">
        {/* Success Animation */}
        <div className="text-center mb-8 no-print">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-success/10
                        flex items-center justify-center animate-check">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-h1 text-coffee mb-2">Booking Confirmed!</h1>
          <p className="text-body text-coffee-light/70">
            Your parcel has been booked successfully
          </p>

          {/* Email notification status */}
          {formData.senderEmail && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm">
              {emailStatus === 'sending' && (
                <span className="text-coffee-light/60 flex items-center gap-1.5">
                  <div className="spinner spinner-sm" /> Sending confirmation email...
                </span>
              )}
              {emailStatus === 'sent' && (
                <span className="text-success flex items-center gap-1.5">
                  <Mail className="w-4 h-4" /> Confirmation email sent!
                </span>
              )}
              {emailStatus === 'failed' && (
                <span className="text-coffee-light/50 flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  Email couldn't be sent.{' '}
                  <button
                    onClick={handleResendEmail}
                    className="underline hover:text-kraft cursor-pointer"
                  >
                    Retry
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tracking ID */}
        <div className="card p-6 mb-6 text-center">
          <p className="text-sm text-coffee-light/70 mb-2">Your Tracking ID</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-postal tracking-wider">
              {trackingId}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-card hover:bg-kraft/5 transition-colors duration-200 cursor-pointer"
              aria-label={copied ? 'Copied' : 'Copy tracking ID'}
            >
              {copied ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Copy className="w-5 h-5 text-kraft" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-success mt-1 animate-fade-in">Copied to clipboard!</p>
          )}
          <div className="mt-3">
            <span className="badge-booked">Booked</span>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="card p-6 mb-6 no-print">
          <h3 className="text-h3 text-coffee mb-4">Shipment Status</h3>
          <StatusTimeline currentStatus={status} />
        </div>

        {/* Booking Summary */}
        <div className="card p-6 mb-6">
          <h3 className="text-h3 text-coffee mb-4">Booking Summary</h3>
          <div className="space-y-4 text-sm">
            {/* Route */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-coffee-light/60 mb-1">From</p>
                <p className="font-medium text-coffee">{formData.senderName}</p>
                <p className="text-coffee-light">{formData.senderAddress}</p>
                <p className="text-coffee-light">{formData.senderCity}, {formData.senderState} - {formData.senderPincode}</p>
                <p className="text-coffee-light">{formData.senderPhone}</p>
              </div>
              <div>
                <p className="text-xs text-coffee-light/60 mb-1">To</p>
                <p className="font-medium text-coffee">{formData.receiverName}</p>
                <p className="text-coffee-light">{formData.receiverAddress}</p>
                <p className="text-coffee-light">{formData.receiverCity}, {formData.receiverState} - {formData.receiverPincode}</p>
                <p className="text-coffee-light">{formData.receiverPhone}</p>
              </div>
            </div>

            <hr className="border-paper-border" />

            {/* Details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
              <div>
                <p className="text-xs text-coffee-light/60">Service</p>
                <p className="font-medium text-coffee">{formData.serviceType}</p>
              </div>
              <div>
                <p className="text-xs text-coffee-light/60">Payment</p>
                <p className="font-medium text-coffee">{formData.paymentMode}</p>
              </div>
              <div>
                <p className="text-xs text-coffee-light/60">Weight</p>
                <p className="font-medium text-coffee">{estimate.chargeableWeight} kg</p>
              </div>
              <div>
                <p className="text-xs text-coffee-light/60">Pickup Date</p>
                <p className="font-medium text-coffee">
                  {new Date(formData.pickupDate + 'T00:00:00').toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-coffee-light/60">Time Slot</p>
                <p className="font-medium text-coffee">{formData.pickupTimeSlot}</p>
              </div>
              <div>
                <p className="text-xs text-coffee-light/60">Booked At</p>
                <p className="font-medium text-coffee">
                  {new Date(createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <hr className="border-paper-border" />

            {/* Total */}
            <div className="flex justify-between items-center text-lg font-bold text-coffee">
              <span>Total Amount</span>
              <span>₹{estimate.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 no-print">
          <Link
            to={`/track?id=${trackingId}`}
            className="btn-cta flex-1 text-center cursor-pointer"
          >
            <Search className="w-5 h-5" />
            Track This Parcel
          </Link>
          <button
            onClick={handleDownloadPDF}
            className="btn-outline flex-1 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <Link
            to="/"
            className="btn-outline flex-1 text-center cursor-pointer"
          >
            <Package className="w-5 h-5" />
            Book Another
          </Link>
          <button
            onClick={handlePrint}
            className="btn-ghost flex-1 cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            Print Label
          </button>
        </div>

        {/* ===== Print-only Label ===== */}
        <div className="print-only mt-8">
          <div className="border-2 border-black p-6">
            <div className="text-center border-b-2 border-black pb-3 mb-4">
              <h2 className="text-xl font-bold">SpiceRoute — India Post Booking</h2>
              <p className="text-2xl font-mono font-bold mt-1">{trackingId}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-bold mb-1">FROM:</p>
                <p>{formData.senderName}</p>
                <p>{formData.senderAddress}</p>
                <p>{formData.senderCity}, {formData.senderState} - {formData.senderPincode}</p>
                <p>Ph: {formData.senderPhone}</p>
              </div>
              <div>
                <p className="font-bold mb-1">TO:</p>
                <p>{formData.receiverName}</p>
                <p>{formData.receiverAddress}</p>
                <p>{formData.receiverCity}, {formData.receiverState} - {formData.receiverPincode}</p>
                <p>Ph: {formData.receiverPhone}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-black text-sm flex justify-between">
              <span>Service: {formData.serviceType}</span>
              <span>Weight: {estimate.chargeableWeight} kg</span>
              <span>Amount: ₹{estimate.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
