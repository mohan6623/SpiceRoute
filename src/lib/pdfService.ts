import { jsPDF } from 'jspdf'
import type { Booking } from '../types'

/**
 * Load an image from a URL and return it as a base64 data URL.
 * Falls back to null if the image can't be loaded.
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/**
 * Generate a branded booking slip PDF with SpiceRoute logo watermark.
 * Pure client-side — no server dependency.
 */
export async function generateBookingSlipPDF(booking: Booking): Promise<void> {
  const { trackingId, formData, estimate, createdAt } = booking
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - 30 // 15mm margin each side
  const margin = 15

  // ── Load logo for header + watermark ──
  const logoBase64 = await loadImageAsBase64('/logo.png')

  // ── Watermark: logo at center with very low opacity ──
  if (logoBase64) {
    // jsPDF doesn't have native opacity for images, so we use a GState
    const gState = new (doc as any).GState({ opacity: 0.06 })
    doc.setGState(gState)
    const wmSize = 120
    doc.addImage(logoBase64, 'PNG', (pageWidth - wmSize) / 2, 80, wmSize, wmSize)
    // Reset opacity
    const fullOpacity = new (doc as any).GState({ opacity: 1 })
    doc.setGState(fullOpacity)
  } else {
    // Fallback: text watermark
    doc.setFontSize(80)
    doc.setTextColor(230, 220, 210)
    doc.text('SpiceRoute', pageWidth / 2, 160, { align: 'center', angle: 35 })
  }

  // Reset text color
  doc.setTextColor(60, 40, 30) // dark coffee

  // ── Header band ──
  doc.setFillColor(139, 90, 43) // kraft brown
  doc.rect(0, 0, pageWidth, 36, 'F')

  // Logo in header (top-left)
  if (logoBase64) {
    const logoH = 20
    const logoW = 20
    doc.addImage(logoBase64, 'PNG', margin, 8, logoW, logoH)
    // Brand name next to logo
    doc.setFontSize(20)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('SpiceRoute', margin + logoW + 4, 18)
  } else {
    doc.setFontSize(22)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('SpiceRoute', margin, 16)
  }

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text('India Post Parcel Booking Slip', margin + (logoBase64 ? 24 : 0), 28)

  // Tracking ID in header (right side)
  doc.setFontSize(14)
  doc.setFont('courier', 'bold')
  doc.text(trackingId, pageWidth - margin, 16, { align: 'right' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Booked: ${new Date(createdAt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    pageWidth - margin,
    24,
    { align: 'right' }
  )

  // ── Tracking ID prominent bar ──
  let y = 46
  doc.setFillColor(252, 249, 244) // paper bg
  doc.roundedRect(margin, y, contentWidth, 14, 3, 3, 'F')
  doc.setDrawColor(139, 90, 43)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, y, contentWidth, 14, 3, 3, 'S')

  doc.setFontSize(11)
  doc.setTextColor(139, 90, 43)
  doc.setFont('helvetica', 'bold')
  doc.text('Tracking ID:', margin + 5, y + 9)
  doc.setFontSize(14)
  doc.setFont('courier', 'bold')
  doc.text(trackingId, margin + 40, y + 9)

  // ── Sender & Receiver blocks ──
  y = 70
  doc.setTextColor(60, 40, 30)
  const colWidth = (contentWidth - 10) / 2

  // Sender
  drawAddressBlock(doc, margin, y, colWidth, 'FROM (Sender)', {
    name: formData.senderName,
    address: formData.senderAddress,
    city: formData.senderCity,
    state: formData.senderState,
    pincode: formData.senderPincode,
    phone: formData.senderPhone,
    email: formData.senderEmail,
  })

  // Receiver
  drawAddressBlock(doc, margin + colWidth + 10, y, colWidth, 'TO (Receiver)', {
    name: formData.receiverName,
    address: formData.receiverAddress,
    city: formData.receiverCity,
    state: formData.receiverState,
    pincode: formData.receiverPincode,
    phone: formData.receiverPhone,
  })

  // ── Shipment Details ──
  y = 130
  doc.setFillColor(139, 90, 43)
  doc.rect(margin, y, contentWidth, 7, 'F')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('SHIPMENT DETAILS', margin + 3, y + 5)

  y += 12
  doc.setTextColor(60, 40, 30)
  const details = [
    ['Service Type', formData.serviceType],
    ['Payment Mode', formData.paymentMode],
    ['Actual Weight', `${estimate.actualWeight} kg`],
    ['Chargeable Weight', `${estimate.chargeableWeight} kg`],
    ['Dimensions (L×B×H)', `${formData.dimensions.length} × ${formData.dimensions.breadth} × ${formData.dimensions.height} cm`],
    ['Pickup Date', formData.pickupDate ? new Date(formData.pickupDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
    ['Pickup Time Slot', formData.pickupTimeSlot || '—'],
    ['Contents', formData.contentsDescription || '—'],
    ['Declared Value', formData.declaredValue ? `Rs. ${formData.declaredValue.toFixed(2)}` : '—'],
  ]

  const detailColWidth = contentWidth / 2
  details.forEach(([label, value], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const xPos = margin + col * detailColWidth + 3
    const yPos = y + row * 8

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 100, 80)
    doc.text(label, xPos, yPos)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60, 40, 30)
    // Truncate value to fit within available column width
    const maxWidth = detailColWidth - 6
    const truncated = doc.splitTextToSize(value, maxWidth) as string[]
    doc.text(truncated[0], xPos, yPos + 4)
  })

  // ── Price Breakdown ──
  y += Math.ceil(details.length / 2) * 8 + 8
  doc.setFillColor(139, 90, 43)
  doc.rect(margin, y, contentWidth, 7, 'F')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('PRICE BREAKDOWN', margin + 3, y + 5)

  y += 12
  const priceRows = [
    ['Base Price', `Rs. ${estimate.basePrice.toFixed(2)}`],
    ['GST (18%)', `Rs. ${estimate.gstAmount.toFixed(2)}`],
  ]
  // Only show COD row if there's a surcharge
  if (estimate.codSurcharge > 0) {
    priceRows.push(['COD Surcharge', `Rs. ${estimate.codSurcharge.toFixed(2)}`])
  }

  doc.setTextColor(60, 40, 30)
  priceRows.forEach(([label, value], i) => {
    const yPos = y + i * 7
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(label, margin + 3, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, pageWidth - margin - 5, yPos, { align: 'right' })
  })

  // Total
  y += priceRows.length * 7 + 2
  doc.setDrawColor(139, 90, 43)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 7
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL AMOUNT', margin + 3, y)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  // Use Rs. prefix to avoid unicode issues with ₹ in PDF
  const totalText = `Rs. ${estimate.totalPrice.toFixed(2)}`
  doc.text(totalText, pageWidth - margin - 5, y, { align: 'right' })

  // ── Footer ──
  y += 16
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(160, 140, 120)
  doc.text(
    'This is a computer-generated booking slip. No signature required.',
    pageWidth / 2,
    y,
    { align: 'center' }
  )
  doc.text(
    'SpiceRoute — India Post Parcel Booking App',
    pageWidth / 2,
    y + 4,
    { align: 'center' }
  )

  // ── Download ──
  doc.save(`SpiceRoute-${trackingId}.pdf`)
}

/** Helper: draw a bordered address block */
function drawAddressBlock(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  addr: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
    email?: string
  }
) {
  // Title bar
  doc.setFillColor(252, 249, 244)
  doc.setDrawColor(200, 185, 170)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, width, 52, 2, 2, 'FD')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(139, 90, 43)
  doc.text(title, x + 3, y + 6)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(60, 40, 30)
  doc.text(addr.name, x + 3, y + 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 60, 40)

  // Wrap address text
  const lines = doc.splitTextToSize(addr.address, width - 6) as string[]
  let lineY = y + 20
  lines.forEach((line: string) => {
    doc.text(line, x + 3, lineY)
    lineY += 4
  })

  doc.text(`${addr.city}, ${addr.state} - ${addr.pincode}`, x + 3, lineY)
  lineY += 5
  doc.text(`Ph: ${addr.phone}`, x + 3, lineY)
  if (addr.email) {
    lineY += 4
    doc.text(addr.email, x + 3, lineY)
  }
}
