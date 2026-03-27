import { NavLink, Outlet } from 'react-router-dom'
import { BarChart2, Users, Newspaper } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export default function DashboardLayout() {
  const { t, i18n } = useTranslation()
  const isEn = i18n.language === 'en'

  const NAV = [
    { to: '/dashboard', label: t('nav.briefing'), icon: Newspaper, end: true },
    { to: '/dashboard/sentiment', label: t('nav.sentiment'), icon: BarChart2, end: false },
    { to: '/dashboard/opponents', label: t('nav.opponents'), icon: Users, end: false },
  ]

  return (
    <div className="min-h-screen bg-dot-grid flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold text-gray-900">🗳 Kampeni</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-2',
                  isActive
                    ? 'bg-[#f0f7eb] text-[#2e6417] border-[#2e6417]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#2e6417] flex items-center justify-center text-white text-xs font-bold">K</div>
            <div>
              <p className="text-xs font-semibold text-gray-900">Kampeni MVP</p>
              <p className="text-xs text-gray-400">Month 1 · 2026</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 sticky top-0 z-10">
          {/* Language toggle */}
          <button
            onClick={() => i18n.changeLanguage(isEn ? 'sw' : 'en')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span className={isEn ? 'opacity-40' : ''}> 🇰🇪 SW</span>
            <span className="text-gray-300">|</span>
            <span className={!isEn ? 'opacity-40' : ''}>🇬🇧 EN</span>
          </button>
        </header>
        <main className="flex-1 px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
