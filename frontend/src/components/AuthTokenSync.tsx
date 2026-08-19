import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { setTokenProvider, setLogoutHandler } from '../api/client'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export default function AuthTokenSync() {
  const { getAccessTokenSilently, logout } = useAuth0()

  useEffect(() => {
    if (DEMO_MODE) return
    setTokenProvider(() =>
      getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE as string,
        },
      })
    )
    setLogoutHandler(() =>
      logout({ logoutParams: { returnTo: window.location.origin + '/login' } })
    )
  }, [getAccessTokenSilently, logout])

  return null
}
