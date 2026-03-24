import { Outlet } from 'react-router-dom'

export default function DashboardLayout() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '100vw' }}>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
        <strong>Kampeni</strong>
      </nav>
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
