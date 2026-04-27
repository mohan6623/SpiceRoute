import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Truck, Shield, Clock, MapPin, Package, IndianRupee, Search, Calculator, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  {
    icon: Truck,
    title: 'Doorstep Pickup',
    desc: 'Free pickup from your home or office. No need to visit the post office.',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    icon: Shield,
    title: 'Insured Delivery',
    desc: 'Every parcel is insured up to ₹5,000 for damage or loss during transit.',
    color: 'bg-green-500/10 text-green-600',
  },
  {
    icon: Clock,
    title: 'Real-time Tracking',
    desc: 'Track your shipment at every step from booking to final delivery.',
    color: 'bg-amber-500/10 text-amber-600',
  },
  {
    icon: MapPin,
    title: 'Pan-India Network',
    desc: 'Deliver to 19,000+ pin codes across every state and union territory.',
    color: 'bg-purple-500/10 text-purple-600',
  },
]

const STATS = [
  { value: '19,000+', label: 'Pin Codes', icon: MapPin },
  { value: '₹25', label: 'Starting Price', icon: IndianRupee },
  { value: '2-5', label: 'Delivery Days', icon: Clock },
  { value: '1,55,000+', label: 'Post Offices', icon: Package },
]

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trackingInput, setTrackingInput] = useState('')

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingInput.trim()) {
      navigate(`/track?id=${trackingInput.trim().toUpperCase()}`)
    }
  }

  return (
    <div className="min-h-screen">
      {/* ===== HERO SECTION ===== */}
      <section className="pt-32 pb-12 px-6 sm:px-10 lg:px-14">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-20 items-start">
            {/* LEFT — Hero Content */}
            <div className="pt-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-kraft/10 text-kraft rounded-full
                            px-4 py-1.5 text-xs font-semibold tracking-wide mb-6">
                <Package className="w-3.5 h-3.5" />
                India's Trusted Parcel Service
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-coffee leading-tight mb-4">
                Ship Anywhere in India,
                <span className="text-kraft block mt-1">Right From Home.</span>
              </h1>

              <p className="text-lg text-coffee-light/70 leading-relaxed mb-8 max-w-md">
                Calculate shipping rates instantly, book parcels with doorstep pickup,
                and track every step of the journey — all in one place.
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {STATS.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Icon className="w-4 h-4 text-kraft/60 mr-1" />
                        <span className="text-xl font-bold text-coffee">{stat.value}</span>
                      </div>
                      <p className="text-xs text-coffee-light/50">{stat.label}</p>
                    </div>
                  )
                })}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/rates"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coffee text-white
                           text-sm font-medium hover:bg-coffee/90 transition-all duration-200"
                >
                  <Calculator className="w-4 h-4" />
                  Calculate Rate
                </Link>
                <Link
                  to={user ? '/ship' : '/login?redirect=/ship'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-kraft text-white
                           text-sm font-medium hover:bg-kraft-light transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                  Ship a Parcel
                </Link>
              </div>
            </div>

            {/* RIGHT — Track Order Widget */}
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Track Order Card */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 bg-postal/10 rounded-lg flex items-center justify-center">
                    <Search className="w-5 h-5 text-postal" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-coffee">Track Your Order</h3>
                    <p className="text-xs text-coffee-light/60">Enter tracking ID to get live status</p>
                  </div>
                </div>

                <form onSubmit={handleTrack} className="space-y-3">
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Enter tracking ID (e.g., IP2026123456)"
                    className="input-field font-mono uppercase text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!trackingInput.trim()}
                    className="btn-cta w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Search className="w-4 h-4" />
                    Track Order
                  </button>
                </form>
              </div>

              {/* Quick Action Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/rates"
                  className="card-flat p-4 text-center hover:border-kraft/30 hover:shadow-md
                           transition-all duration-300 hover:-translate-y-0.5 group"
                >
                  <div className="w-10 h-10 mx-auto mb-2 bg-amber-500/10 rounded-xl
                               flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Calculator className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-xs font-semibold text-coffee">Calculate Rate</p>
                  <p className="text-[0.625rem] text-coffee-light/50 mt-0.5">Instant pricing</p>
                </Link>
                <Link
                  to={user ? '/my-bookings' : '/login?redirect=/my-bookings'}
                  className="card-flat p-4 text-center hover:border-kraft/30 hover:shadow-md
                           transition-all duration-300 hover:-translate-y-0.5 group"
                >
                  <div className="w-10 h-10 mx-auto mb-2 bg-purple-500/10 rounded-xl
                               flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-xs font-semibold text-coffee">My Bookings</p>
                  <p className="text-[0.625rem] text-coffee-light/50 mt-0.5">View history</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-16 bg-coffee/[0.03]">
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-14">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-coffee mb-2">Why Choose SpiceRoute?</h2>
            <p className="text-coffee-light/60 text-sm max-w-md mx-auto">
              Everything you need to ship parcels across India, powered by the India Post network.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-paper-border/50
                           hover:border-kraft/30 hover:shadow-lg transition-all duration-300
                           hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4
                                group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-coffee mb-2">{feature.title}</h3>
                  <p className="text-xs text-coffee-light/60 leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS SECTION ===== */}
      <section className="py-16">
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-14">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-coffee mb-2">How It Works</h2>
            <p className="text-coffee-light/60 text-sm">Three simple steps to ship your parcel</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Check Rate', desc: 'Enter pickup & delivery pin codes, weight, and dimensions to get instant pricing.' },
              { step: '02', title: 'Book Parcel', desc: 'Fill in sender & receiver details, choose a pickup date, and confirm your booking.' },
              { step: '03', title: 'Track & Receive', desc: 'Get a tracking ID instantly. Monitor your shipment at every step until delivery.' },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="text-5xl font-black text-kraft/10 mb-2">{item.step}</div>
                <h3 className="text-base font-bold text-coffee mb-2 -mt-4">{item.title}</h3>
                <p className="text-sm text-coffee-light/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
