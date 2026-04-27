import { Link } from 'react-router-dom'
import { Package, MapPin, Phone, Mail, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-coffee text-white/80 no-print mt-16">
      {/* Main Footer */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="SpiceRoute" className="h-10 w-auto object-contain brightness-200" />
              <div>
                <h3 className="text-white text-lg font-bold leading-tight">SpiceRoute</h3>
                <p className="text-[0.625rem] text-white/40 tracking-wider uppercase">India Post Booking</p>
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              India's trusted parcel booking platform. Ship smarter with real-time tracking,
              door-to-door pickup, and transparent pricing.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" className="text-sm text-white/50 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5" /> Book a Parcel
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-sm text-white/50 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Track Shipment
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="text-sm text-white/50 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5" /> My Bookings
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Services</h4>
            <ul className="space-y-2.5">
              <li className="text-sm text-white/50">Speed Post</li>
              <li className="text-sm text-white/50">Registered Post</li>
              <li className="text-sm text-white/50">Express Parcel</li>
              <li className="text-sm text-white/50">COD Delivery</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li className="text-sm text-white/50 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0" /> 1800-123-4567 (Toll Free)
              </li>
              <li className="text-sm text-white/50 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0" /> support@spiceroute.in
              </li>
              <li className="text-sm text-white/50 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Department of Posts, Dak Bhawan, New Delhi - 110001
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} SpiceRoute. All rights reserved.
          </p>
          <p className="text-xs text-white/30 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for India
          </p>
        </div>
      </div>
    </footer>
  )
}
