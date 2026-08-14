import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../api/auth'
import toast from 'react-hot-toast'

const Sidebar = ({ counts = {} }) => {
  const [collapsed, setCollapsed] = useState(false)
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
  const accent = isSuperAdmin ? 'purple' : 'blue'

  const activeItemClass = isSuperAdmin
    ? 'bg-purple-50 text-purple-600 border-l-[3px] border-purple-600'
    : 'bg-blue-50 text-blue-600 border-l-[3px] border-blue-600'

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div
      className="bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-all duration-200"
      style={{ width: collapsed ? 52 : 220 }}
    >
      {/* Toggle */}
      <div className="flex items-center justify-end px-3 py-2.5 border-b border-gray-100">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-gray-400 hover:text-gray-600 p-0.5"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Main section */}
      <div className="py-2">
        {!collapsed && (
          <div className="text-[10px] font-medium text-gray-300 uppercase tracking-[0.06em] px-4 py-1.5">Main</div>
        )}

        {/* Dashboard */}
        <div
          onClick={() => navigate('/admin/dashboard')}
          className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm border-l-[3px] transition-colors ${
            isActive('/admin/dashboard') ? activeItemClass : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
          </svg>
          {!collapsed && <span className="text-[13px]">Dashboard</span>}
        </div>

        {/* Dashboard sub-counts */}
        {!collapsed && (
          <div className="pl-[43px] flex flex-col gap-0.5 mb-1">
            {[
              { label: 'Pending', key: 'pending', color: 'bg-orange-50 text-orange-600' },
              { label: 'Unresolved', key: 'unresolved', color: 'bg-red-50 text-red-500' },
              { label: 'Resolved', key: 'resolved', color: 'bg-green-50 text-green-600' },
            ].map(({ label, key, color }) => (
              <div
                key={key}
                onClick={() => navigate(`/admin/dashboard?status=${key}`)}
                className="flex items-center justify-between px-2 py-1 rounded-md cursor-pointer text-[12px] text-gray-500 hover:bg-blue-50 hover:text-blue-600"
              >
                {label}
                {counts[key] !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${color}`}>
                    {counts[key]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Inbox */}
        <div
          onClick={() => navigate('/admin/inbox')}
          className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm border-l-[3px] transition-colors ${
            isActive('/admin/inbox') ? activeItemClass : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          {!collapsed && <span className="text-[13px]">Inbox</span>}
        </div>

        {/* Super admin links */}
        {isSuperAdmin && !collapsed && (
          <div className="text-[10px] font-medium text-gray-300 uppercase tracking-[0.06em] px-4 py-1.5 mt-1">Super Admin</div>
        )}
        {isSuperAdmin && (
          <>
            <div
              onClick={() => navigate('/superadmin/analytics')}
              className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm border-l-[3px] transition-colors ${
                isActive('/superadmin/analytics') ? activeItemClass : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {!collapsed && <span className="text-[13px]">Analytics</span>}
            </div>
            <div
              onClick={() => navigate('/superadmin/admins')}
              className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm border-l-[3px] transition-colors ${
                isActive('/superadmin/admins') ? activeItemClass : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {!collapsed && <span className="text-[13px]">Admin Management</span>}
            </div>
          </>
        )}
      </div>

      {/* Account section */}
      <div className="mt-auto border-t border-gray-100 py-2">
        {!collapsed && (
          <div className="text-[10px] font-medium text-gray-300 uppercase tracking-[0.06em] px-4 py-1.5">Account</div>
        )}
        <div
          onClick={() => navigate('/admin/settings')}
          className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm border-l-[3px] transition-colors ${
            isActive('/admin/settings') ? activeItemClass : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!collapsed && <span className="text-[13px]">Settings</span>}
        </div>
        <div
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm border-l-[3px] border-transparent text-red-400 hover:bg-red-50 transition-colors"
        >
          <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span className="text-[13px]">Sign out</span>}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
