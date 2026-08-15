import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import SplashScreen from './components/SplashScreen'
import ProtectedRoute from './components/ProtectedRoute'
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
import PainPointsPage from './pages/PainPointsPage'
import MapPage from './pages/MapPage'
import AIDashboardPage from './pages/AIDashboardPage'
import FieldSubmitPage from './pages/FieldSubmitPage'
import LoginPage from './pages/LoginPage'
import RequestAccessPage from './pages/RequestAccessPage'
import { DemoProvider } from './demo/DemoProvider'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const { isLoading } = useAuth0()

  function handleSplashComplete() {
    setShowSplash(false)
  }

  if (!DEMO_MODE && isLoading) return null

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
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
        <Route path="/request-access" element={<RequestAccessPage />} />

        {/* Field agent — minimal mobile layout, no dashboard sidebar */}
        <Route path="/field" element={<FieldSubmitPage />} />

        {/* Dashboard — protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<BriefingPage />} />
          <Route path="sentiment" element={<SentimentPage />} />
          <Route path="opponents" element={<OpponentPage />} />
          <Route path="field-reports" element={<FieldReportsPage />} />
          <Route path="painpoints" element={<PainPointsPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="ai-dashboard" element={<AIDashboardPage />} />
        </Route>

        {/* Public demo — no auth required, mock data via DemoProvider */}
        <Route
          path="/demo"
          element={
            <DemoProvider>
              <DashboardLayout />
            </DemoProvider>
          }
        >
          <Route index element={<BriefingPage />} />
          <Route path="sentiment" element={<SentimentPage />} />
          <Route path="opponents" element={<OpponentPage />} />
          <Route path="field-reports" element={<FieldReportsPage />} />
          <Route path="painpoints" element={<PainPointsPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="ai-dashboard" element={<AIDashboardPage />} />
        </Route>
      </Routes>
    </>
  )
}
