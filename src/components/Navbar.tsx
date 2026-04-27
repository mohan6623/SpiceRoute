import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Package, Search, ClipboardList, Send, Calculator, User, LogOut, LogIn, BarChart3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isAdminEmail } from './AdminRoute'

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Package },
  { to: '/ship', label: 'Ship', icon: Send },
  { to: '/track', label: 'Track', icon: Search },
  { to: '/rates', label: 'Rates', icon: Calculator },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const userMenuRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setUserMenuOpen(false)
    navigate('/')
  }

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 no-print w-[94%] max-w-5xl">
      <div
        className={`
          rounded-[2.5rem] border transition-all duration-500 ease-out overflow-visible
          ${scrolled
            ? 'bg-white/60 backdrop-blur-[28px] shadow-2xl border-white/60'
            : 'bg-white/40 backdrop-blur-[20px] shadow-lg border-white/30'
          }
        `}
      >
        <div className="flex items-center justify-between h-[4.5rem] px-6 sm:px-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <img
              src="/logo.png"
              alt="SpiceRoute Logo"
              className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
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

          {/* Right side: Mobile hamburger + User icon (user icon always rightmost) */}
          <div className="flex items-center gap-2">
            {/* Mobile Hamburger — only visible on mobile, comes before user icon */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-xl text-coffee-light hover:bg-kraft/10
                       transition-colors duration-200 cursor-pointer"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* User Icon / Dropdown — rightmost on all screen sizes */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  if (!user) {
                    navigate('/login')
                  } else {
                    setUserMenuOpen(!userMenuOpen)
                  }
                }}
                className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer
                  ${user
                    ? 'bg-kraft/10 text-kraft hover:bg-kraft/20'
                    : 'text-coffee-light hover:bg-kraft/10 hover:text-kraft'
                  }`}
                aria-label={user ? 'Account menu' : 'Sign in'}
              >
                {user ? (
                  <div className="w-5 h-5 rounded-full bg-kraft text-white flex items-center justify-center text-[10px] font-bold">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>

              {/* User Dropdown */}
              {userMenuOpen && user && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-kraft-lg
                              border border-paper-border/50 overflow-hidden animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-paper-border/50">
                    <p className="text-xs text-coffee-light/60">Signed in as</p>
                    <p className="text-sm font-medium text-coffee truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/my-bookings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-coffee-light
                               hover:bg-kraft/5 transition-colors duration-150"
                    >
                      <ClipboardList className="w-4 h-4" />
                      My Bookings
                    </Link>
                    {isAdminEmail(user.email) && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-kraft
                                 hover:bg-kraft/5 transition-colors duration-150"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600
                               hover:bg-red-50 transition-colors duration-150 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out
            ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}
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
            {/* Mobile login/logout */}
            {user ? (
              <>
                {isAdminEmail(user.email) && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                      text-kraft hover:bg-kraft/10 transition-all duration-200 cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { handleSignOut(); setIsOpen(false) }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                    text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  text-coffee-light hover:bg-kraft/10 hover:text-kraft
                  transition-all duration-200 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
