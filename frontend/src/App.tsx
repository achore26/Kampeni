import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SplashScreen from './components/SplashScreen'
import MarketingLayout from './layouts/MarketingLayout'
import DashboardLayout from './layouts/DashboardLayout'
import HomePage from './pages/marketing/HomePage'
import AboutPage from './pages/marketing/AboutPage'
import FeaturesPage from './pages/marketing/FeaturesPage'
import ContactPage from './pages/marketing/ContactPage'
import MediaPage from './pages/marketing/MediaPage'
import BriefingPage from './pages/BriefingPage'
import SentimentPage from './pages/SentimentPage'
import OpponentPage from './pages/OpponentPage'
import FieldReportsPage from './pages/FieldReportsPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  function handleSplashComplete() {
    setShowSplash(false)
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <BrowserRouter>
      <Routes>
        {/* Marketing site — public, dark theme */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/media" element={<MediaPage />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard — light theme, will be auth-protected in Month 2 */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<BriefingPage />} />
          <Route path="sentiment" element={<SentimentPage />} />
          <Route path="opponents" element={<OpponentPage />} />
          <Route path="field-reports" element={<FieldReportsPage />} />
        </Route>
      </Routes>
      </BrowserRouter>
    </>
  )
}
