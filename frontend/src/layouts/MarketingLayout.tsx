import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { LanguagePicker } from '@/components/LanguagePicker'

export default function MarketingLayout() {
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NAV_LINKS = [
    { to: '/about',    label: t('marketing.nav.about') },
    { to: '/features', label: t('marketing.nav.features') },
    { to: '/media',    label: t('marketing.nav.media') },
    { to: '/contact',  label: t('marketing.nav.contact') },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <img src="/Kampeni_Logo_transparent.png" alt="Kampeni" className="h-12 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn('text-sm font-medium transition-colors', isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <LanguagePicker variant="light" />
            <Link to="/login" className="hidden md:inline-flex btn-primary px-5 py-2 rounded text-sm">
              {t('marketing.nav.launch')} →
            </Link>
            <button className="md:hidden p-1 text-gray-600" onClick={() => setMobileOpen(v => !v)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-sm font-medium text-gray-700">{label}</NavLink>
            ))}
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="block mt-3 btn-primary px-5 py-2.5 rounded text-sm text-center">
              {t('marketing.nav.launch')} →
            </Link>
          </div>
        )}
      </header>

      <main className="pt-16">
        <Outlet />
      </main>

      <footer className="bg-gray-950 mt-32">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <img src="/Kampeni_Logo_transparent.png" alt="Kampeni" className="h-10 w-auto brightness-0 invert mb-4" />
            <p className="text-sm leading-relaxed text-gray-400">
              {t('marketing.footer.description')}
            </p>
          </div>
          {[
            { title: t('marketing.nav.features'), links: [{ label: t('marketing.nav.features'), to: '/features' }, { label: 'Dashboard', to: '/dashboard' }] },
            { title: 'Company', links: [{ label: t('marketing.nav.about'), to: '/about' }, { label: t('marketing.nav.contact'), to: '/contact' }, { label: t('marketing.nav.media'), to: '/media' }] },
            { title: 'Legal', links: [{ label: 'Privacy', to: '#' }, { label: 'Terms', to: '#' }, { label: 'Security', to: '#' }] },
          ].map(({ title, links }) => (
            <div key={title}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-gray-500">{title}</p>
              <ul className="space-y-2.5">
                {links.map(({ label, to }) => (
                  <li key={label}><Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-8 flex items-center justify-between text-xs text-gray-600 border-t border-gray-800 pt-6">
          <span>{t('marketing.footer.rights')}</span>
          <span>Powered by <span className="text-gray-400 font-semibold">CIF AI</span> · {t('marketing.footer.builtIn')} 🇰🇪</span>
        </div>
      </footer>
    </div>
  )
}
