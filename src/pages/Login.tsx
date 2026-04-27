import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Package } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type Mode = 'signin' | 'signup'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  const { signIn, signUp } = useAuth()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    setLoading(true)

    try {
      if (mode === 'signin') {
        const err = await signIn(email, password)
        if (err) {
          setError(err)
        } else {
          navigate(redirectTo, { replace: true })
        }
      } else {
        const err = await signUp(email, password)
        if (err) {
          setError(err)
        } else {
          setSignUpSuccess(true)
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (signUpSuccess) {
    return (
      <div className="page-container">
        <div className="max-w-md mx-auto">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-h2 text-coffee mb-2">Check Your Email</h2>
            <p className="text-body text-coffee-light/70 mb-6">
              We've sent a confirmation link to <strong className="text-coffee">{email}</strong>.
              Click the link to activate your account.
            </p>
            <button
              onClick={() => {
                setSignUpSuccess(false)
                setMode('signin')
                setPassword('')
                setConfirmPassword('')
              }}
              className="btn-primary w-full cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <img
              src="/logo.png"
              alt="SpiceRoute"
              className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          <h1 className="text-h1 text-coffee mb-2">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-body text-coffee-light/70">
            {mode === 'signin'
              ? 'Sign in to your SpiceRoute account'
              : 'Join SpiceRoute to start shipping'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-paper-border/30 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode('signin'); setError(null) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-200 cursor-pointer
              ${mode === 'signin'
                ? 'bg-white text-coffee shadow-sm'
                : 'text-coffee-light/60 hover:text-coffee-light'
              }`}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-200 cursor-pointer
              ${mode === 'signup'
                ? 'bg-white text-coffee shadow-sm'
                : 'text-coffee-light/60 hover:text-coffee-light'
              }`}
          >
            <UserPlus className="w-4 h-4" />
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-card bg-red-50 border border-red-200 text-sm text-red-700 animate-fade-in">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="input-label flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-kraft" />
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field"
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="input-label flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-kraft" />
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Enter your password'}
                className="input-field pr-12"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-coffee-light/50
                         hover:text-coffee-light transition-colors duration-200 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (signup only) */}
          {mode === 'signup' && (
            <div className="animate-fade-in">
              <label htmlFor="confirm-password" className="input-label flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-kraft" />
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="input-field"
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full cursor-pointer"
          >
            {loading ? (
              <div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-coffee-light/40 mt-6 flex items-center justify-center gap-1">
          <Package className="w-3 h-3" />
          Powered by SpiceRoute × India Post
        </p>
      </div>
    </div>
  )
}
