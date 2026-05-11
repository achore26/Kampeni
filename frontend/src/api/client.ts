import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10_000, // 10s — account for 3G latency
  headers: { 'Content-Type': 'application/json' },
})

// Token store — populated by AuthTokenSync component at app boot
let _getToken: (() => Promise<string>) | null = null
let _logout: (() => void) | null = null

export function setTokenProvider(fn: () => Promise<string>) {
  _getToken = fn
}

export function setLogoutHandler(fn: () => void) {
  _logout = fn
}

// Attach JWT to every request
apiClient.interceptors.request.use(async (config) => {
  if (_getToken) {
    try {
      const token = await _getToken()
      config.headers.Authorization = `Bearer ${token}`
    } catch {
      // Token fetch failed (e.g. session expired) — send without token, 401 handler below will redirect
    }
  }
  return config
})

// 401 → redirect to login so the user re-authenticates
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && _logout) {
      _logout()
    }
    return Promise.reject(error)
  }
)
