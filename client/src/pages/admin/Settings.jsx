import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { updateMe, logout } from '../../api/auth'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import usePageTitle from '../../hooks/usePageTitle'
import useDarkMode from '../../hooks/useDarkMode'

const PwField = ({ label, name, pwKey, value, onChange, showPw, setShowPw }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</label>
    <div className="relative">
      <input
        type={showPw[pwKey] ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={`Enter ${label.toLowerCase()}`}
        className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500"
      />
      <button
        type="button"
        onClick={() => setShowPw(prev => ({ ...prev, [pwKey]: !prev[pwKey] }))}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 text-sm"
      >
        {showPw[pwKey] ? (
          <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M51.8,25.1c-1.6-3.2-3.7-6.1-6.3-8.4L37,25.1c0,0.3,0,0.6,0,0.9c0,6.1-4.9,11-11,11c-0.3,0-0.6,0-0.9,0 l-5.4,5.4c2,0.4,4.1,0.7,6.2,0.7c11.3,0,21.1-6.6,25.8-16.1C52.1,26.3,52.1,25.7,51.8,25.1z"></path> <path d="M48.5,5.6l-2.1-2.1C45.8,2.9,44.7,3,44,3.8l-7.3,7.3C33.4,9.7,29.8,9,26,9C14.7,9,4.9,15.6,0.2,25.1 c-0.3,0.6-0.3,1.3,0,1.8c2.2,4.5,5.5,8.2,9.6,11L3.8,44c-0.7,0.7-0.8,1.8-0.3,2.4l2.1,2.1C6.2,49.1,7.3,49,8,48.2L48.2,8 C49,7.3,49.1,6.2,48.5,5.6z M15,26c0-6.1,4.9-11,11-11c2,0,3.8,0.5,5.4,1.4l-3,3C27.6,19.2,26.8,19,26,19c-3.9,0-7,3.1-7,7 c0,0.8,0.2,1.6,0.4,2.4l-3,3C15.5,29.8,15,28,15,26z"></path> </g> </g></svg>) : (
          <svg fill="currentColor" width="24px" height="24px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>eye</title> <path d="M0 16q0.064 0.128 0.16 0.352t0.48 0.928 0.832 1.344 1.248 1.536 1.664 1.696 2.144 1.568 2.624 1.344 3.136 0.896 3.712 0.352 3.712-0.352 3.168-0.928 2.592-1.312 2.144-1.6 1.664-1.632 1.248-1.6 0.832-1.312 0.48-0.928l0.16-0.352q-0.032-0.128-0.16-0.352t-0.48-0.896-0.832-1.344-1.248-1.568-1.664-1.664-2.144-1.568-2.624-1.344-3.136-0.896-3.712-0.352-3.712 0.352-3.168 0.896-2.592 1.344-2.144 1.568-1.664 1.664-1.248 1.568-0.832 1.344-0.48 0.928zM10.016 16q0-2.464 1.728-4.224t4.256-1.76 4.256 1.76 1.76 4.224-1.76 4.256-4.256 1.76-4.256-1.76-1.728-4.256zM12 16q0 1.664 1.184 2.848t2.816 1.152 2.816-1.152 1.184-2.848-1.184-2.816-2.816-1.184-2.816 1.184l2.816 2.816h-4z"></path> </g></svg>)}
      </button>
    </div>
  </div>
)

const Settings = () => {
  usePageTitle('Account Settings')
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggle } = useDarkMode()

  const [profileForm, setProfileForm] = useState({ name: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  })
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [stats, setStats] = useState({
    assigned: 0, resolved: 0, avgTime: 0, joined: '', lastLogin: ''
  })

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, email: user.email })
      setStats({
        joined: user.createdAt,
        assigned: user.assignedTickets || 0,
        resolved: user.resolvedTickets || 0,
        avgTime: user.avgResolutionTime || 0
      })
    }
  }, [user])

  const handleProfileChange = (e) => {
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePasswordChange = (e) => {
    setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleProfileSave = async () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast.error('Name and email are required.')
      return
    }
    setSavingProfile(true)
    try {
      const res = await updateMe({ name: profileForm.name, email: profileForm.email })
      setUser(prev => ({ ...prev, ...res.user }))
      toast.success('Profile updated successfully.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All password fields are required.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    setSavingPassword(true)
    try {
      await updateMe({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password changed successfully.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setSavingPassword(false)
    }
  }


  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD'

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#1b1b1b] overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        {/* Topbar */}
        <div className="bg-white dark:bg-[#1b1b1b] border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-10 pl-16">
          <div>
            <h1 className="text-base font-medium text-gray-900 dark:text-gray-100">Account Settings</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">Manage your profile, password, and account preferences.</p>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">

          {/* Profile card */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-4 pb-5 border-b border-gray-100 dark:border-gray-800 mb-5">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-lg font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30">
                  {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin (IT)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Full name</label>
                <input
                  type="text" name="name" value={profileForm.name}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Email</label>
                <input
                  type="email" name="email" value={profileForm.email}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500"
                />
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Must match @dscacontacting.com domain</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Role</label>
                <input
                  type="text"
                  value={user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin (IT)'}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/5 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Only Super Admin can change roles</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Account status</label>
                <input
                  type="text" value="Active" disabled
                  className="w-full px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/5 text-sm text-green-500 dark:text-green-400 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setProfileForm({ name: user?.name, email: user?.email })}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleProfileSave}
                disabled={savingProfile}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* Bottom grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Change password */}
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Change password</h3>
              <div className="space-y-3 mb-4">
                <PwField
                  label="Current password" name="currentPassword" pwKey="current"
                  value={passwordForm.currentPassword} onChange={handlePasswordChange}
                  showPw={showPw} setShowPw={setShowPw}
                />
                <PwField
                  label="New password" name="newPassword" pwKey="new"
                  value={passwordForm.newPassword} onChange={handlePasswordChange}
                  showPw={showPw} setShowPw={setShowPw}
                />
                <PwField
                  label="Confirm new password" name="confirmPassword" pwKey="confirm"
                  value={passwordForm.confirmPassword} onChange={handlePasswordChange}
                  showPw={showPw} setShowPw={setShowPw}
                />
              </div>
              <p className="text-xs text-gray-300 dark:text-gray-600 mb-4">Min 8 characters · 1 number · 1 special character</p>
              <div className="flex justify-end">
                <button
                  onClick={handlePasswordSave}
                  disabled={savingPassword}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingPassword ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </div>

            {/* Account info */}
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Account info</h3>
              <div className="space-y-1">
                {[
                  { label: 'Member since', value: formatDate(user?.createdAt) },
                  { label: 'Last login', value: 'This session' },
                  { label: 'Tickets assigned', value: stats.assigned || '—' },
                  { label: 'Tickets resolved', value: stats.resolved || '—' },
                  { label: 'Avg. resolution time', value: stats.avgTime ? `${stats.avgTime}h` : '—' }
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings