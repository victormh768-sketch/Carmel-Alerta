import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'

const Router = import.meta.env.VITE_PREVIEW ? MemoryRouter : BrowserRouter
import { AppProvider } from './state/AppContext'
import Layout from './components/Layout'
import MapPage from './pages/MapPage'
import ReportPage from './pages/ReportPage'
import RewardsPage from './pages/RewardsPage'
import NewsPage from './pages/NewsPage'
import ProfilePage from './pages/ProfilePage'
import ModerationPage from './pages/ModerationPage'
import AuthPage from './pages/AuthPage'

export default function App() {
  return (
    <Router>
      <AppProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<MapPage />} />
            <Route path="reportar" element={<ReportPage />} />
            <Route path="comerc" element={<RewardsPage />} />
            <Route path="noticies" element={<NewsPage />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="moderacio" element={<ModerationPage />} />
            <Route path="acces" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AppProvider>
    </Router>
  )
}
