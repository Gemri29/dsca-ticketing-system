import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getTicketById, updateTicket, assignTicket } from '../../api/tickets'
import { getAdminUsers } from '../../api/admin'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/Sidebar'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { formatDateTime, formatTimeAgo, isSLABreached } from '../../utils/formatters'
import usePageTitle from '../../hooks/usePageTitle'

const TicketDetail = () => {
  usePageTitle ('Ticket Detail')
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [ticket, setTicket] = useState(null)
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [status, setStatus] = useState('')
  const [remark, setRemark] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [newNote, setNewNote] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketRes, adminsRes] = await Promise.all([
          getTicketById(id),
          user.role === 'SUPER_ADMIN' ? getAdminUsers({ active: true }) : Promise.resolve({ users: [] })
        ])
        const t = ticketRes.ticket
        setTicket(t)
        setStatus(t.status)
        setRemark(t.remark || '')
        setInternalNote(t.internalNote || '')
        setAssignedTo(t.assignedTo || '')
        setAdmins(adminsRes.users || [])
      } catch (err) {
        toast.error('Failed to load ticket.')
        navigate(-1)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateTicket(id, {
        status,
        remark,
        internalNote: internalNote + (newNote.trim() ? '\n' + newNote.trim() : '')
      })
      setTicket(prev => ({ ...prev, ...res.ticket }))
      setInternalNote(res.ticket.internalNote || '')
      setNewNote('')
      toast.success('Ticket updated successfully.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update ticket.')
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async (adminId) => {
    try {
      await assignTicket(id, adminId)
      setAssignedTo(adminId)
      toast.success('Ticket reassigned.')
    } catch (err) {
      toast.error('Failed to reassign ticket.')
    }
  }

  const handleResolve = async () => {
    setSaving(true)
    try {
      const res = await updateTicket(id, {
        status: 'RESOLVED',
        remark,
        internalNote
      })
      setTicket(prev => ({ ...prev, ...res.ticket }))
      setStatus('RESOLVED')
      toast.success('Ticket marked as resolved.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve ticket.')
    } finally {
      setSaving(false)
    }
  }

  const slaBreached = ticket ? isSLABreached(ticket.createdAt, ticket.status) : false

  const statusBtns = [
    { value: 'PENDING', label: 'Pending', active: 'border-orange-400 text-orange-600 bg-orange-50' },
    { value: 'UNRESOLVED', label: 'Unresolved', active: 'border-red-400 text-red-500 bg-red-50' },
    { value: 'RESOLVED', label: 'Resolved', active: 'border-green-400 text-green-600 bg-green-50' }
  ]

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">Loading ticket...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700"
          >
            ← Back
          </button>
          <span className="text-gray-200">/</span>
          <span className="text-sm font-medium text-gray-800">{ticket.ticketCode}</span>
          <div className="ml-auto flex items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {slaBreached && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-500 border border-red-200">
                ⏰ SLA Breach
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* SLA alert */}
          {slaBreached && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3 text-sm text-red-600 mb-5">
              ⚠️ This ticket has exceeded the 48-hour SLA threshold. Immediate attention required.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left col */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Submitter details */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Submitter details</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Full name', value: ticket.fullName },
                    { label: 'Email', value: ticket.email },
                    { label: 'Asset', value: ticket.laptopNumber || ticket.desktopNumber || '—', mono: true },
                    { label: 'Site', value: ticket.siteName || '—' },
                    { label: 'Submitted', value: formatDateTime(ticket.createdAt) },
                    { label: 'Last updated', value: formatDateTime(ticket.updatedAt) }
                  ].map(({ label, value, mono }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className={`text-sm text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
                    </div>
                  ))}
                </div>

                <hr className="my-4 border-gray-100" />

                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Issue details</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Issue type</p>
                    <p className="text-sm text-gray-900">{ticket.issueType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Priority</p>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>
                {ticket.customIssue && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-1">Custom issue</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 break-words whitespace-pre-wrap overflow-hidden">
                    {ticket.customIssue}</p>
                  </div>
                )}
              </div>

              {/* Attachment */}
              {ticket.attachment && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Attachment</h3>
                  <a
                    href={ticket.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 hover:bg-blue-50 hover:border-blue-200 transition-all"
                  >
                    <div className="w-9 h-9 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                      📎
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">View attachment</p>
                      <p className="text-xs text-gray-400">Click to open in new tab</p>
                    </div>
                    <span className="text-blue-500 text-sm">↗</span>
                  </a>
                </div>
              )}

              {/* Activity timeline */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Activity timeline</h3>
                <div className="space-y-4">
                  {[
                    {text: `Ticket submitted by ${ticket.fullName}`, time: ticket.createdAt },
                    ticket.assignedUser && {text: `Assigned to ${ticket.assignedUser.name}`, time: ticket.updatedAt, color: 'bg-blue-50 border-blue-200' },
                    ticket.internalNote && {text: 'Internal note added', time: ticket.updatedAt, color: 'bg-gray-50 border-gray-200' },
                    slaBreached && {text: 'SLA threshold exceeded — 48 hours passed', time: null, color: 'bg-red-50 border-red-200', red: true }
                  ].filter(Boolean).map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-sm flex-shrink-0 ${item.color}`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className={`text-sm ${item.red ? 'text-red-500' : 'text-gray-700'}`}>{item.text}</p>
                        {item.time && <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(item.time)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right col — action panel */}
            <div className="flex flex-col gap-5">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Ticket actions</h3>

                {/* Status */}
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Status</p>
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {statusBtns.map(btn => (
                    <button
                      key={btn.value}
                      onClick={() => setStatus(btn.value)}
                      className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                        status === btn.value ? btn.active : 'border-gray-200 text-gray-400 bg-white hover:border-gray-300'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Assign to (Super Admin only) */}
                {user.role === 'SUPER_ADMIN' && (
                  <>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Assigned to</p>
                    <select
                      value={assignedTo}
                      onChange={e => handleAssign(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:border-blue-500 mb-4"
                    >
                      <option value="">Unassigned</option>
                      {admins.map(a => (
                        <option key={a.id} value={a.id}>{a.name}{a.id === user.id ? ' (you)' : ''}</option>
                      ))}
                    </select>
                  </>
                )}

                <hr className="border-gray-100 mb-4" />

                {/* Internal note */}
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Internal note <span className="normal-case text-gray-300">(admin only)</span>
                </p>
                {internalNote && (
                  <div className="bg-gray-50 border-l-2 border-gray-200 rounded-r-lg px-3 py-2 mb-2 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {internalNote}
                  </div>
                )}
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add a new internal note..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:border-gray-400 resize-none mb-1"
                />
                <p className="text-xs text-gray-300 mb-4">Only visible to admins</p>

                <hr className="border-gray-100 mb-4" />

                {/* Remark */}
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Remark for submitter <span className="normal-case text-gray-300">(optional)</span>
                </p>
                <textarea
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  placeholder="Leave a remark visible to the submitter when resolved..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:border-yellow-400 resize-none mb-1"
                />
                <p className="text-xs text-gray-300 mb-4">Shown to submitter when resolved</p>

                <hr className="border-gray-100 mb-4" />

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 mb-2"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                <button
                  onClick={handleResolve}
                  disabled={saving || status === 'RESOLVED'}
                  className="w-full py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {status === 'RESOLVED' ? '✓ Already resolved' : 'Mark as resolved'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketDetail