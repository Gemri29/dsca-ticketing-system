import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { updateMe, logout } from '../../api/auth'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import usePageTitle from '../../hooks/usePageTitle'

const PwField = ({ label, name, pwKey, value, onChange, showPw, setShowPw }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</label>
    <div className="relative">
      <input
        type={showPw[pwKey] ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={`Enter ${label.toLowerCase()}`}
        className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500"
      />
      <button
          type="button"
          onClick={() => setShowPw(prev => ({ ...prev, [pwKey]: !prev[pwKey] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-sm"
        >
          {showPw[pwKey] ? (
            <img src="/show.png" alt="Hide password" className="w-5 h-5" />
            ) : (
            <img src="/hidden.png" alt="Show password" className="w-5 h-5" />
            )}
        </button>


    </div>
  </div>
)

const Settings = () => {
  usePageTitle('Account Settings')
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 pl-16">
          <div>
            <h1 className="text-base font-medium text-gray-900">Account Settings</h1>
            <p className="text-xs text-gray-400">Manage your profile, password, and account preferences.</p>
          </div>
        </div>

        <div className="p-6 max-w-4xl mx-auto space-y-5">

          {/* Profile card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-4 pb-5 border-b border-gray-100 mb-5">
              <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-lg font-medium text-blue-600 flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-base font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
                  {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin (IT)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Full name</label>
                <input
                  type="text" name="name" value={profileForm.name}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</label>
                <input
                  type="email" name="email" value={profileForm.email}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-300 mt-1">Must match @dscacontacting.com domain</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Role</label>
                <input
                  type="text"
                  value={user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin (IT)'}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-300 mt-1">Only Super Admin can change roles</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Account status</label>
                <input
                  type="text" value="Active" disabled
                  className="w-full px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 text-sm text-green-500 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setProfileForm({ name: user?.name, email: user?.email })}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
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
          <div className="grid grid-cols-2 gap-5">

            {/* Change password */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Change password</h3>
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
              <p className="text-xs text-gray-300 mb-4">Min 8 characters · 1 number · 1 special character</p>
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
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Account info</h3>
              <div className="space-y-1">
                {[
                  { label: 'Member since', value: formatDate(user?.createdAt) },
                  { label: 'Last login', value: 'This session' },
                  { label: 'Tickets assigned', value: stats.assigned || '—' },
                  { label: 'Tickets resolved', value: stats.resolved || '—' },
                  { label: 'Avg. resolution time', value: stats.avgTime ? `${stats.avgTime}h` : '—' }
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-sm font-medium text-gray-800">{value}</span>
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