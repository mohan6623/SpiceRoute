import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Package, Search, ClipboardList } from 'lucide-react'

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Package },
  { to: '/track', label: 'Track', icon: Search },
  { to: '/my-bookings', label: 'Bookings', icon: ClipboardList },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 no-print w-[96%] max-w-7xl">
      <div
        className={`
          rounded-[2.5rem] border transition-all duration-500 ease-out overflow-hidden
          ${scrolled
            ? 'bg-white/70 backdrop-blur-3xl shadow-xl border-white/50'
            : 'bg-white/50 backdrop-blur-2xl shadow-lg border-white/30'
          }
        `}
      >
        <div className="flex items-center justify-between h-16 px-6 sm:px-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <img
              src="/logo.png"
              alt="SpiceRoute Logo"
              className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            />
            <span className="text-base font-bold text-coffee tracking-tight hidden sm:block">
              SpiceRoute
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1 bg-paper/60 rounded-xl p-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-300 cursor-pointer
                    ${isActive(link.to)
                      ? 'bg-kraft text-white shadow-sm'
                      : 'text-coffee-light hover:bg-kraft/10 hover:text-kraft'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl text-coffee-light hover:bg-kraft/10
                     transition-colors duration-200 cursor-pointer"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out
            ${isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="flex flex-col gap-1 px-4 pb-3 border-t border-paper-border/50 pt-2">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200 cursor-pointer
                    ${isActive(link.to)
                      ? 'bg-kraft text-white'
                      : 'text-coffee-light hover:bg-kraft/10 hover:text-kraft'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
