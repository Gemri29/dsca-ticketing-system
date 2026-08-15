import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../api/auth'

const IDLE_TIMEOUT_MS = 19 * 60 * 1000 
const LOGOUT_TIMEOUT_MS = 20 * 60 * 1000

const useIdleTimeout = (onWarning, onDismissWarning) => {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const idleTimer = useRef(null)
  const warningTimer = useRef(null)
  const onWarningRef = useRef(onWarning)
  const onDismissRef = useRef(onDismissWarning)

  // Keep refs updated without triggering resetTimers re-creation
  useEffect(() => { onWarningRef.current = onWarning }, [onWarning])
  useEffect(() => { onDismissRef.current = onDismissWarning }, [onDismissWarning])

  const handleLogout = useCallback(async () => {
    clearTimeout(idleTimer.current)
    clearTimeout(warningTimer.current)
    try { await logout() } catch {}
    setUser(null)
    sessionStorage.setItem('idleLogout', 'true')
    navigate('/login')
  }, [setUser, navigate])

  const resetTimers = useCallback(() => {
    clearTimeout(idleTimer.current)
    clearTimeout(warningTimer.current)
    onDismissRef.current?.()

    warningTimer.current = setTimeout(() => {
      onWarningRef.current?.()
    }, IDLE_TIMEOUT_MS)

    idleTimer.current = setTimeout(() => {
      handleLogout()
    }, LOGOUT_TIMEOUT_MS)
  }, [handleLogout])

  useEffect(() => {
    if (!user) return

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, resetTimers, { passive: true }))
    resetTimers()

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimers))
      clearTimeout(idleTimer.current)
      clearTimeout(warningTimer.current)
    }
  }, [user, resetTimers])

  return { resetTimers }
}

export default useIdleTimeout