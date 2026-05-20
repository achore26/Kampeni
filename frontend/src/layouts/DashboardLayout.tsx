import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { BarChart2, Users, Newspaper, ClipboardList, AlertTriangle, LogOut, Globe, Menu, X, Map, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth0 } from '@auth0/auth0-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', labelKey: 'nav.briefing', icon: Newspaper, end: true },
  { to: '/dashboard/sentiment', labelKey: 'nav.sentiment', icon: BarChart2, end: false },
  { to: '/dashboard/opponents', labelKey: 'nav.opponents', icon: Users, end: false },
  { to: '/dashboard/map', labelKey: 'nav.map', icon: Map, end: false },
  { to: '/dashboard/field-reports', labelKey: 'nav.fieldReports', icon: ClipboardList, end: false },
  { to: '/dashboard/painpoints', labelKey: 'nav.painpoints', icon: AlertTriangle, end: false },
  { to: '/dashboard/ai-dashboard', labelKey: 'nav.aiDashboard', icon: Sparkles, end: false },
]

// Sidebar background: deep navy
const SIDEBAR_BG = '#0d1b2a'
const SIDEBAR_ACTIVE = '#1d4ed8'

function SidebarNav({ onNav }: { onNav?: () => void }) {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth0()
  const isEn = i18n.language === 'en'

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'K'

  return (
    <div className="flex flex-col h-full" style={{ background: SIDEBAR_BG }}>

      {/* ── Logo zone — white background so black logo is visible ── */}
      <div className="px-5 py-4 bg-white border-b-2" style={{ borderColor: SIDEBAR_ACTIVE }}>
        <img
          src="/kampeni-logo.png"
          alt="Kampeni Intelligence"
          className="h-8 w-auto object-contain object-left"
          style={{ maxWidth: 160 }}
        />
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <p className="px-3 mb-3 text-[9px] font-bold uppercase tracking-[0.15em]"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          Main Menu
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ to, labelKey, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onNav}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'text-white shadow-lg'
                    : 'hover:bg-white/10'
                )}
                style={({ isActive }) => isActive
                  ? { background: SIDEBAR_ACTIVE }
                  : { color: 'rgba(255,255,255,0.65)' }
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-all',
                      isActive ? 'bg-white/20' : 'bg-white/10'
                    )}>
                      <Icon className="w-3.5 h-3.5" style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.7)' }} />
                    </span>
                    <span style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.75)' }}>
                      {t(labelKey)}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Language toggle ── */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => i18n.changeLanguage(isEn ? 'sw' : 'en')}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <Globe className="w-3.5 h-3.5" />
          <span style={{ color: isEn ? 'rgba(255,255,255,0.35)' : 'white' }}>SW</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: !isEn ? 'rgba(255,255,255,0.35)' : 'white' }}>EN</span>
        </button>
      </div>

      {/* ── User + logout ── */}
      <div className="px-4 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: SIDEBAR_ACTIVE }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Campaign Team'}</p>
            <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {user?.email || 'Kampeni 2026'}
            </p>
          </div>
        </div>
        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin + '/login' } })}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-xs font-medium transition-colors hover:bg-red-500/20"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function DashboardLayout() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth0()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isEn = i18n.language === 'en'

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'K'

  return (
    <div className="min-h-screen flex" style={{ background: '#f0f2f8' }}>

      {/* ── Desktop sidebar — slides in from left on load ── */}
      <motion.aside
        className="w-64 fixed inset-y-0 hidden md:flex flex-col z-20"
        style={{ boxShadow: '2px 0 20px rgba(0,0,0,0.15)' }}
        initial={{ x: -260, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <SidebarNav />
      </motion.aside>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <motion.aside
              className="absolute inset-y-0 left-0 w-72 flex flex-col"
              style={{ boxShadow: '4px 0 30px rgba(0,0,0,0.3)' }}
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute top-3 right-3 z-10">
                <button onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SidebarNav onNav={() => setMobileOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="h-14 md:h-16 bg-white border-b border-gray-200/60 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            {/* Mobile logo */}
            <img src="/kampeni-logo.png" alt="Kampeni" className="h-6 md:hidden object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => i18n.changeLanguage(isEn ? 'sw' : 'en')}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <span className={isEn ? 'text-gray-400' : 'text-gray-700'}>SW</span>
              <span className="text-gray-200">|</span>
              <span className={!isEn ? 'text-gray-400' : 'text-gray-700'}>EN</span>
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: '#0d1b2a' }}>
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-5 md:py-6 pb-20 md:pb-6">
          <Outlet />
        </main>

        <footer className="hidden md:block px-8 py-3 bg-white border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-semibold text-gray-500">Kampeni Intelligence</span> · Built in Kenya · 2026
          </p>
        </footer>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-20 flex items-stretch"
        style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.08)' }}>
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
              isActive ? 'text-blue-600' : 'text-gray-400'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
                <span className="leading-none">{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
