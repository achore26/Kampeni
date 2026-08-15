import { createContext, useContext, useEffect, useRef } from 'react'
import { apiClient } from '../api/client'
import { getDemoResponse } from './mockData'

export const DemoContext = createContext(false)
export const useDemoMode = () => useContext(DemoContext)

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const idRef = useRef<number | null>(null)

  // Register synchronously during render — child useEffects fire before parent
  // useEffects, so if we register here we're guaranteed to intercept the very
  // first API call any child page makes.
  if (idRef.current === null) {
    idRef.current = apiClient.interceptors.request.use(async (config) => {
      const mock = getDemoResponse(config.url ?? '', config.method ?? 'get')
      if (mock !== null) {
        config.adapter = () =>
          Promise.resolve({
            data: mock,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          })
      }
      return config
    })
  }

  // Eject on unmount
  useEffect(() => {
    return () => {
      if (idRef.current !== null) {
        apiClient.interceptors.request.eject(idRef.current)
        idRef.current = null
      }
    }
  }, [])

  return <DemoContext.Provider value={true}>{children}</DemoContext.Provider>
}
