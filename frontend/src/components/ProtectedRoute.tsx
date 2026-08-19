import { useAuth0 } from '@auth0/auth0-react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth0()

  if (DEMO_MODE) return <>{children}</>

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
