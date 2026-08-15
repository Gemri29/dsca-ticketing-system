import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import IdleWarningModal from './components/IdleWarningModal'
import useIdleTimeout from './hooks/useIdleTimeout'
import { logout } from './api/auth'

import LandingPage from './pages/LandingPage'
import TrackTicket from './pages/TrackTicket'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/admin/Dashboard'
import Inbox from './pages/admin/Inbox'
import TicketDetail from './pages/admin/TicketDetail'
import Settings from './pages/admin/Settings'
import Analytics from './pages/superadmin/Analytics'
import AdminManagement from './pages/superadmin/AdminManagement'

// Separate component so it can access AuthContext + useNavigate
const IdleManager = () => {
  const [warningVisible, setWarningVisible] = useState(false)
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  const handleLogoutNow = async () => {
    setWarningVisible(false)
    try { await logout() } catch {}
    setUser(null)
    navigate('/login', { state: { idleLogout: true } })
  }

  const { resetTimers } = useIdleTimeout(
    () => setWarningVisible(true),
    () => setWarningVisible(false)
  )

  const handleStayLoggedIn = () => {
    setWarningVisible(false)
    resetTimers()
  }

  if (!user) return null

  return (
    <IdleWarningModal
      visible={warningVisible}
      onStayLoggedIn={handleStayLoggedIn}
      onLogoutNow={handleLogoutNow}
    />
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <IdleManager />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/track" element={<TrackTicket />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/inbox" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <Inbox />
            </ProtectedRoute>
          } />
          <Route path="/admin/tickets/:id" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <TicketDetail />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <Settings />
            </ProtectedRoute>
          } />

          {/* Super Admin */}
          <Route path="/superadmin/analytics" element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/superadmin/admins" element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <AdminManagement />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App