import { createContext, useContext, useMemo } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

const CLAIM_NS = 'https://kampeni.net'
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const DEMO_CANDIDATE_ID = import.meta.env.VITE_CANDIDATE_ID || ''

interface CandidateContextValue {
  candidateId: string
}

const CandidateContext = createContext<CandidateContextValue>({ candidateId: '' })

export function CandidateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth0()

  const candidateId = useMemo(() => {
    if (DEMO_MODE) return DEMO_CANDIDATE_ID
    if (!user) return ''
    // Auth0 Action injects this as a namespaced custom claim
    return (
      (user[`${CLAIM_NS}/candidate_id`] as string | undefined) ||
      (user['candidate_id'] as string | undefined) ||
      user.sub ||
      ''
    )
  }, [user])

  return (
    <CandidateContext.Provider value={{ candidateId }}>
      {children}
    </CandidateContext.Provider>
  )
}

export function useCandidateId(): string {
  return useContext(CandidateContext).candidateId
}
