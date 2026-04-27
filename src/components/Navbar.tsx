import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Package, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/track', label: 'Track Parcel' },
  { to: '/my-bookings', label: 'My Bookings' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-paper-border backdrop-blur-md no-print"
         style={{ backgroundColor: 'rgba(253, 248, 243, 0.95)' }}>
      <div className="section-container">
        <div className="flex items-center justify-between h-[4.5rem]">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
            <img src="/logo.png" alt="SpiceRoute Logo" className="w-10 h-10 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-coffee leading-tight">SpiceRoute</span>
              <span className="text-[0.625rem] text-coffee-light/60 leading-tight tracking-wide uppercase">
                India Post Booking
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-card text-sm font-medium transition-colors duration-200 cursor-pointer
                  ${isActive(link.to)
                    ? 'bg-kraft/10 text-kraft'
                    : 'text-coffee-light hover:bg-kraft/5 hover:text-kraft'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-card text-coffee-light hover:bg-kraft/5
                     transition-colors duration-200 cursor-pointer"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-1 border-t border-paper-border pt-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-2.5 rounded-card text-sm font-medium transition-colors duration-200 cursor-pointer
                    ${isActive(link.to)
                      ? 'bg-kraft/10 text-kraft'
                      : 'text-coffee-light hover:bg-kraft/5 hover:text-kraft'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
