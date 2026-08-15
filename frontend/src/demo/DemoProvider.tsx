import { createContext, useContext, useEffect } from 'react'
import { apiClient } from '../api/client'
import { getDemoResponse } from './mockData'

export const DemoContext = createContext(false)
export const useDemoMode = () => useContext(DemoContext)

export function DemoProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const id = apiClient.interceptors.request.use(async (config) => {
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
    return () => apiClient.interceptors.request.eject(id)
  }, [])

  return <DemoContext.Provider value={true}>{children}</DemoContext.Provider>
}
