import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { setTokenProvider, setLogoutHandler } from '../api/client'

/**
 * Mounts once inside Auth0Provider and wires getAccessTokenSilently
 * into the axios client so all requests automatically carry a valid JWT.
 * Also registers a logout handler so 401 responses redirect to /login.
 */
export default function AuthTokenSync() {
  const { getAccessTokenSilently, logout } = useAuth0()

  useEffect(() => {
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
