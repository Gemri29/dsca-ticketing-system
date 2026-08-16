import { useState, useEffect } from 'react'
import { getAdminUsers, createAdminUser, updateAdminUser } from '../../api/admin'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/Sidebar'
import toast from 'react-hot-toast'
import usePageTitle from '../../hooks/usePageTitle'

const EMPTY_FORM = { name: '', email: '', password: '', role: 'ADMIN' }

const AdminManagement = () => {
  usePageTitle ('Admin Management')
  const { user } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const res = await getAdminUsers()
      setAdmins(res.users || [])
    } catch {
      toast.error('Failed to load admin accounts.')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setShowPw(false)
    setModalOpen(true)
  }

  const openEdit = (admin) => {
    setEditTarget(admin)
    setForm({ name: admin.name, email: admin.email, password: '', role: admin.role })
    setShowPw(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    setForm(EMPTY_FORM)
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required.')
      return
    }
    if (!editTarget && !form.password) {
      toast.error('Password is required for new accounts.')
      return
    }
    setSaving(true)
    try {
      if (editTarget) {
        const updateData = { name: form.name, role: form.role }
        const res = await updateAdminUser(editTarget.id, updateData)
        setAdmins(prev => prev.map(a => a.id === editTarget.id ? { ...a, ...res.user } : a))
        toast.success('Admin account updated.')
      } else {
        const res = await createAdminUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role
        })
        setAdmins(prev => [...prev, res.user])
        toast.success('Admin account created.')
      }
      closeModal()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save account.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (admin) => {
    if (admin.id === user.id) {
      toast.error('You cannot deactivate your own account.')
      return
    }
    try {
      const res = await updateAdminUser(admin.id, { active: !admin.active })
      setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, ...res.user } : a))
      toast.success(admin.active ? 'Account deactivated.' : 'Account reactivated.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update account.')
    }
  }

  const initials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'

  const activeCount = admins.filter(a => a.active).length

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 pl-16">
          <div>
            <h1 className="text-base font-medium text-gray-900">Admin Management</h1>
            <p className="text-xs text-gray-400">
              {admins.length} accounts · {activeCount} active · {admins.length - activeCount} deactivated
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-all"
          >
            + Add admin
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <p className="text-sm text-gray-400">Loading accounts...</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    {['Admin', 'Role', 'Status', 'Joined', 'Tickets', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-sm text-gray-400 py-12">
                        No admin accounts found.
                      </td>
                    </tr>
                  ) : (
                    admins.map(admin => (
                      <tr key={admin.id} className="border-t border-gray-50 hover:bg-gray-50">
                        {/* Name + email */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                              admin.role === 'SUPER_ADMIN'
                                ? 'bg-purple-50 border border-purple-200 text-purple-600'
                                : 'bg-blue-50 border border-blue-200 text-blue-600'
                            }`}>
                              {initials(admin.name)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {admin.name}
                                {admin.id === user.id && (
                                  <span className="ml-1.5 text-xs text-gray-300">(you)</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400">{admin.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            admin.role === 'SUPER_ADMIN'
                              ? 'bg-purple-50 text-purple-600 border-purple-200'
                              : 'bg-blue-50 text-blue-600 border-blue-200'
                          }`}>
                            {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            admin.active
                              ? 'bg-green-50 text-green-600 border-green-200'
                              : 'bg-gray-100 text-gray-400 border-gray-200'
                          }`}>
                            {admin.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="px-5 py-3 text-sm text-gray-500">
                          {new Date(admin.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </td>

                        {/* Ticket count */}
                        <td className="px-5 py-3 text-sm text-gray-500">
                          {admin._count?.assignedTickets ?? '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3">
                          {admin.id === user.id ? (
                            <span className="text-xs text-gray-300">—</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEdit(admin)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleActive(admin)}
                                className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                  admin.active
                                    ? 'border-red-200 text-red-400 hover:bg-red-50'
                                    : 'border-green-200 text-green-500 hover:bg-green-50'
                                }`}
                              >
                                {admin.active ? 'Deactivate' : 'Reactivate'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-7 w-full max-w-md">
            <h2 className="text-base font-medium text-gray-900 mb-1">
              {editTarget ? 'Edit admin account' : 'Add new admin'}
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              {editTarget
                ? 'Update name or role. Email cannot be changed.'
                : 'The new admin will be able to log in immediately.'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Full name</label>
                <input
                  type="text" name="name" value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Jane Smith"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</label>
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange}
                  disabled={!!editTarget}
                  placeholder="name@dscacontacting.com"
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                    editTarget
                      ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 bg-white text-gray-900 focus:border-purple-500'
                  }`}
                />
                {editTarget && <p className="text-xs text-gray-300 mt-1">Email cannot be changed after creation.</p>}
              </div>

              {!editTarget && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      name="password" value={form.password}
                      onChange={handleChange}
                      placeholder="Min 8 chars, 1 number, 1 symbol"
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-sm"
                    >
                    {showPw ? (
                    <img src="/show.png" alt="Hide password" className="w-5 h-5" />
                    ) : (
                    <img src="/hidden.png" alt="Show password" className="w-5 h-5" />
                    )}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Role</label>
                <select
                  name="role" value={form.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:border-purple-500"
                >
                  <option value="ADMIN">Admin (IT)</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editTarget ? 'Save changes' : 'Create account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminManagement