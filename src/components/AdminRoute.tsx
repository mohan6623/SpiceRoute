import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Emails allowed to access the admin dashboard */
export const ADMIN_EMAILS = ['mohanaprasath6623@gmail.com']

export function isAdminEmail(email: string | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-sm text-coffee-light/70">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login?redirect=/admin" replace />
  }

  if (!isAdminEmail(user.email)) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="card p-8 text-center max-w-md animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-h2 text-coffee mb-2">Access Denied</h2>
          <p className="text-sm text-coffee-light/70">
            You don't have permission to access the admin dashboard.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
