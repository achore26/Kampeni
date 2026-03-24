import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import SentimentPage from './pages/SentimentPage'
import OpponentPage from './pages/OpponentPage'
import BriefingPage from './pages/BriefingPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<BriefingPage />} />
          <Route path="/sentiment" element={<SentimentPage />} />
          <Route path="/opponents" element={<OpponentPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
