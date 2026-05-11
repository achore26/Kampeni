import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { Auth0Provider, AppState } from '@auth0/auth0-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import AuthTokenSync from './components/AuthTokenSync'
import './index.css'
import './i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
    },
  },
})

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN as string
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE as string

function Auth0ProviderWithNavigate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  function onRedirectCallback(appState?: AppState) {
    navigate(appState?.returnTo ?? '/dashboard', { replace: true })
  }

  return (
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: window.location.origin + '/dashboard',
        audience: auth0Audience,
      }}
      cacheLocation="localstorage"
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Auth0ProviderWithNavigate>
          <QueryClientProvider client={queryClient}>
            <AuthTokenSync />
            <App />
          </QueryClientProvider>
        </Auth0ProviderWithNavigate>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
