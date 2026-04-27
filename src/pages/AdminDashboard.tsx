import { useState, useEffect, useMemo } from 'react'
import {
  BarChart3, Package, IndianRupee, TrendingUp, Activity,
  Clock, Truck, CheckCircle2, MapPin, ArrowRight, ChevronDown,
} from 'lucide-react'
import { getAllBookings, updateBookingStatus } from '../lib/bookingService'
import { sendBookingEmail } from '../lib/emailService'
import type { Booking, BookingStatus, ServiceType } from '../types'
import { BOOKING_STATUSES, STATUS_BADGE_CLASS } from '../types'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { useAuth } from '../context/AuthContext'

/** Status icon mapping */
const STATUS_ICONS: Record<BookingStatus, React.ReactNode> = {
  'Booked': <Package className="w-4 h-4" />,
  'Picked Up': <Clock className="w-4 h-4" />,
  'In Transit': <Truck className="w-4 h-4" />,
  'Out for Delivery': <Activity className="w-4 h-4" />,
  'Delivered': <CheckCircle2 className="w-4 h-4" />,
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const refreshBookings = () => {
    getAllBookings()
      .then(setBookings)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refreshBookings()
  }, [])

  const handleStatusChange = async (booking: Booking, newStatus: BookingStatus) => {
    if (booking.status === newStatus) return
    setUpdatingId(booking.id)
    const updatedBooking = await updateBookingStatus(booking.trackingId, newStatus, user?.id)
    if (updatedBooking) {
      setBookings((prev) =>
        prev.map((b) => b.id === booking.id ? { ...b, status: newStatus } : b)
      )
      // Send email notification to sender + receiver (fire-and-forget)
      sendBookingEmail('status_update', updatedBooking).catch(() => {})
    }
    setUpdatingId(null)
  }

  // ── Computed analytics ──
  const stats = useMemo(() => {
    const total = bookings.length
    const totalRevenue = bookings.reduce((sum, b) => sum + b.estimate.totalPrice, 0)
    const avgPrice = total > 0 ? totalRevenue / total : 0
    const active = bookings.filter((b) => b.status !== 'Delivered').length

    // Status distribution
    const byStatus: Record<string, number> = {}
    BOOKING_STATUSES.forEach((s) => { byStatus[s] = 0 })
    bookings.forEach((b) => { byStatus[b.status] = (byStatus[b.status] || 0) + 1 })

    // Service type distribution
    const byService: Record<string, number> = {}
    bookings.forEach((b) => {
      byService[b.formData.serviceType] = (byService[b.formData.serviceType] || 0) + 1
    })

    // Revenue by day (last 7 days)
    const revenueByDay: { label: string; value: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      const dayBookings = bookings.filter(
        (b) => b.createdAt.split('T')[0] === dateStr
      )
      const value = dayBookings.reduce((sum, b) => sum + b.estimate.totalPrice, 0)
      revenueByDay.push({ label, value })
    }

    // Recent 10
    const recent = bookings.slice(0, 10)

    return { total, totalRevenue, avgPrice, active, byStatus, byService, revenueByDay, recent }
  }, [bookings])

  const maxRevenue = Math.max(...stats.revenueByDay.map((d) => d.value), 1)
  const maxServiceCount = Math.max(...Object.values(stats.byService), 1)

  const SERVICE_COLORS: Record<string, string> = {
    'Speed Post': '#DC2626',
    'Registered Post': '#1E40AF',
    'Express Parcel Post': '#7C3AED',
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="max-w-6xl mx-auto space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-kraft/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-kraft" />
            </div>
            <div>
              <h1 className="text-h1 text-coffee">Admin Dashboard</h1>
              <p className="text-xs text-coffee-light/50">
                Logged in as {user?.email}
              </p>
            </div>
          </div>
          <p className="text-body text-coffee-light/70">
            Booking analytics and operational overview
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            icon={<Package className="w-5 h-5 text-postal" />}
            label="Total Bookings"
            value={stats.total.toString()}
            accent="bg-postal/10"
          />
          <SummaryCard
            icon={<IndianRupee className="w-5 h-5 text-success" />}
            label="Total Revenue"
            value={`₹${stats.totalRevenue.toFixed(0)}`}
            accent="bg-success/10"
          />
          <SummaryCard
            icon={<TrendingUp className="w-5 h-5 text-kraft" />}
            label="Avg. Price"
            value={`₹${stats.avgPrice.toFixed(0)}`}
            accent="bg-kraft/10"
          />
          <SummaryCard
            icon={<Activity className="w-5 h-5 text-purple-600" />}
            label="Active Parcels"
            value={stats.active.toString()}
            accent="bg-purple-100"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Day */}
          <div className="card p-6">
            <h3 className="text-h3 text-coffee mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-kraft" />
              Revenue — Last 7 Days
            </h3>
            <div className="flex items-end gap-2 h-40">
              {stats.revenueByDay.map((day) => (
                <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-coffee-light/60 font-medium">
                    {day.value > 0 ? `₹${day.value.toFixed(0)}` : ''}
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${Math.max((day.value / maxRevenue) * 100, 4)}%`,
                      background: day.value > 0
                        ? 'linear-gradient(to top, #8B5A2B, #C08552)'
                        : '#E5E7EB',
                    }}
                  />
                  <span className="text-[10px] text-coffee-light/50">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Service Type Distribution */}
          <div className="card p-6">
            <h3 className="text-h3 text-coffee mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-kraft" />
              Bookings by Service Type
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.byService).map(([service, count]) => (
                <div key={service}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-coffee">{service}</span>
                    <span className="text-sm text-coffee-light/70">
                      {count} ({stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(count / maxServiceCount) * 100}%`,
                        backgroundColor: SERVICE_COLORS[service as ServiceType] || '#8B5A2B',
                      }}
                    />
                  </div>
                </div>
              ))}
              {Object.keys(stats.byService).length === 0 && (
                <p className="text-sm text-coffee-light/50 text-center py-4">No data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="card p-6 mb-8">
          <h3 className="text-h3 text-coffee mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-kraft" />
            Status Distribution
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {BOOKING_STATUSES.map((status) => (
              <div
                key={status}
                className="p-4 rounded-xl bg-paper/50 border border-paper-border/50
                         text-center transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-center justify-center mb-2 text-coffee-light">
                  {STATUS_ICONS[status]}
                </div>
                <p className="text-2xl font-bold text-coffee mb-1">
                  {stats.byStatus[status] || 0}
                </p>
                <span className={`${STATUS_BADGE_CLASS[status]} text-[10px]`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings Table — with status change */}
        <div className="card p-6">
          <h3 className="text-h3 text-coffee mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-kraft" />
            Manage Bookings
          </h3>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-coffee-light/50 text-center py-8">No bookings yet</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-paper-border">
                    <th className="text-left py-2 px-2 text-xs text-coffee-light/60 font-medium">Tracking ID</th>
                    <th className="text-left py-2 px-2 text-xs text-coffee-light/60 font-medium">Sender</th>
                    <th className="text-left py-2 px-2 text-xs text-coffee-light/60 font-medium hidden sm:table-cell">Route</th>
                    <th className="text-left py-2 px-2 text-xs text-coffee-light/60 font-medium">Status</th>
                    <th className="text-left py-2 px-2 text-xs text-coffee-light/60 font-medium">Update Status</th>
                    <th className="text-right py-2 px-2 text-xs text-coffee-light/60 font-medium">Amount</th>
                    <th className="text-right py-2 px-2 text-xs text-coffee-light/60 font-medium hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((b) => (
                    <tr key={b.id} className="border-b border-paper-border/30 hover:bg-kraft/3 transition-colors">
                      <td className="py-2.5 px-2 font-mono text-xs font-semibold text-coffee">
                        {b.trackingId}
                      </td>
                      <td className="py-2.5 px-2 text-coffee">{b.formData.senderName}</td>
                      <td className="py-2.5 px-2 text-coffee-light hidden sm:table-cell">
                        <span className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3 text-kraft" />
                          {b.formData.senderCity}
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                          {b.formData.receiverCity}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`${STATUS_BADGE_CLASS[b.status]} text-[10px]`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        {b.status === 'Delivered' ? (
                          <span className="text-xs text-success/70 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Complete
                          </span>
                        ) : (
                          <div className="relative">
                            <select
                              value={b.status}
                              disabled={updatingId === b.id}
                              onChange={(e) => handleStatusChange(b, e.target.value as BookingStatus)}
                              className="appearance-none text-xs py-1.5 px-3 pr-7 rounded-lg border border-paper-border
                                       bg-white text-coffee font-medium cursor-pointer
                                       hover:border-kraft/50 focus:border-kraft focus:outline-none
                                       transition-colors duration-200
                                       disabled:opacity-50 disabled:cursor-wait"
                            >
                              {BOOKING_STATUSES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <ChevronDown className="w-3 h-3 text-coffee-light/50 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-medium text-coffee">
                        ₹{b.estimate.totalPrice.toFixed(0)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-xs text-coffee-light/60 hidden md:table-cell">
                        {new Date(b.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Summary Card Component ──
function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="card p-5 hover:shadow-kraft-md transition-shadow duration-200">
      <div className={`w-10 h-10 ${accent} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-coffee mb-0.5">{value}</p>
      <p className="text-xs text-coffee-light/60">{label}</p>
    </div>
  )
}
