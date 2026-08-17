import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../api/auth'
import toast from 'react-hot-toast'

const Sidebar = ({ counts = {} }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    try {
      await logout()
      setUser(null)
      navigate('/login')
    } catch {
      toast.error('Logout failed.')
    }
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const activeItemClass = isSuperAdmin
    ? 'bg-purple-50 text-purple-600 border-l-[3px] border-purple-600 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-400'
    : 'bg-blue-50 text-blue-600 border-l-[3px] border-blue-600 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-400'

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const NavItem = ({ path, label, icon }) => (
    <div
      onClick={() => navigate(path)}
      className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm border-l-[3px] transition-colors ${
        isActive(path)
          ? activeItemClass
          : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
      }`}
    >
      <span className="w-[17px] h-[17px] flex-shrink-0">{icon}</span>
      {(!collapsed || mobileOpen) && <span className="text-[13px] whitespace-nowrap">{label}</span>}
    </div>
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Toggle — desktop only */}
      <div className="hidden md:flex items-center justify-end px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-0.5"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile header inside drawer */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Menu</span>
        <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main section */}
      <div className="py-2">
        {(!collapsed || mobileOpen) && (
          <div className="text-[10px] font-medium text-gray-300 dark:text-gray-600 uppercase tracking-[0.06em] px-4 py-1.5">Main</div>
        )}

        <NavItem path="/admin/dashboard" label="Dashboard" icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
          </svg>
        } />

        {/* Dashboard sub-counts */}
        {(!collapsed || mobileOpen) && (
          <div className="pl-[43px] flex flex-col gap-0.5 mb-1">
            {[
              { label: 'Pending', key: 'pending', color: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' },
              { label: 'Unresolved', key: 'unresolved', color: 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400' },
              { label: 'Resolved', key: 'resolved', color: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' },
            ].map(({ label, key, color }) => {
              const isSubActive = location.pathname === '/admin/dashboard' &&
                new URLSearchParams(location.search).get('status') === key
              return (
                <div
                  key={key}
                  onClick={() => navigate(`/admin/dashboard?status=${key}`)}
                  className={`flex items-center justify-between px-2 py-1 rounded-md cursor-pointer text-[12px] transition-colors ${
                    isSubActive
                      ? isSuperAdmin
                        ? 'bg-purple-50 text-purple-600 font-medium dark:bg-purple-500/10 dark:text-purple-400'
                        : 'text-blue-600 font-medium dark:text-blue-400'
                      : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-400'
                  }`}
                >
                  {label}
                  {counts[key] !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${color}`}>
                      {counts[key]}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <NavItem path="/admin/inbox" label="Inbox" icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        } />

        {isSuperAdmin && (!collapsed || mobileOpen) && (
          <div className="text-[10px] font-medium text-gray-300 dark:text-gray-600 uppercase tracking-[0.06em] px-4 py-1.5 mt-1">Super Admin</div>
        )}

        {isSuperAdmin && (
          <>
            <NavItem path="/superadmin/analytics" label="Analytics" icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            } />
            <NavItem path="/superadmin/admins" label="Admin Management" icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            } />
          </>
        )}
      </div>

      {/* Account section */}
      <div className="mt-auto border-t border-gray-100 dark:border-gray-800 py-2">
        {(!collapsed || mobileOpen) && (
          <div className="text-[10px] font-medium text-gray-300 dark:text-gray-600 uppercase tracking-[0.06em] px-4 py-1.5">Account</div>
        )}

        <NavItem path="/admin/settings" label="Settings" icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        } />

        <div
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm border-l-[3px] border-transparent text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <span className="w-[17px] h-[17px] flex-shrink-0">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
          {(!collapsed || mobileOpen) && <span className="text-[13px]">Sign out</span>}
        </div>
      </div>

      {/* Logout modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50">
          <div className="bg-white dark:bg-[#1b1b1b] rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 w-[320px] mx-4">
            <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100 mb-1">Sign out?</div>
            <div className="text-[13px] text-gray-400 dark:text-gray-500 mb-5 leading-relaxed">
              You'll be logged out of your current session. Any unsaved changes will be lost.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white text-[13px] font-medium hover:bg-red-600"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────── */}
      <div
        className="hidden md:flex flex-col bg-white dark:bg-[#1b1b1b] border-r border-gray-200 dark:border-gray-800 flex-shrink-0 transition-all duration-200"
        style={{ width: collapsed ? 52 : 220 }}
      >
        <SidebarContent />
      </div>

      {/* ── Mobile hamburger button ──────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-[13px] left-3 z-40 p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── Mobile backdrop ──────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 dark:bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ────────────────────────── */}
      <div className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#1b1b1b] border-r border-gray-200 dark:border-gray-800 z-50 flex flex-col transform transition-transform duration-200 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </div>
    </>
  )
}

export default Sidebar