import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { trackTicket } from '../api/tickets'
import { formatDateTime, formatStatus, formatPriority } from '../utils/formatters'

const STATUS_STYLES = {
  PENDING:    'bg-orange-50 text-orange-600 border border-orange-200',
  UNRESOLVED: 'bg-red-50 text-red-500 border border-red-200',
  RESOLVED:   'bg-green-50 text-green-600 border border-green-200',
}

const PRIORITY_STYLES = {
  LOW:      'bg-gray-50 text-gray-500 border border-gray-200',
  MEDIUM:   'bg-yellow-50 text-yellow-600 border border-yellow-200',
  HIGH:     'bg-orange-50 text-orange-600 border border-orange-200',
  CRITICAL: 'bg-red-50 text-red-500 border border-red-200',
}

const TrackTicket = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', ticketCode: '' })
  const [loading, setLoading] = useState(false)
  const [ticket, setTicket] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email.trim() || !form.ticketCode.trim()) {
      toast.error('Both email and ticket code are required.')
      return
    }
    setLoading(true)
    setTicket(null)
    setNotFound(false)
    try {
      const res = await trackTicket(form.email.trim(), form.ticketCode.trim().toUpperCase())
      setTicket(res.ticket)
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true)
      } else {
        toast.error(err.response?.data?.message || 'Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  const issueDisplay = ticket?.issueType === 'Other' && ticket?.customIssue
    ? `Other — ${ticket.customIssue}`
    : ticket?.issueType

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-gray-200 px-8 py-3.5 flex items-center justify-between sticky top-0 bg-white z-10">
        <button onClick={() => navigate('/')} className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors">
          ← DSCA IT Support
        </button>
        <button
          onClick={() => navigate('/login')}
          className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Admin login ↗
        </button>
      </nav>

      {/* Hero */}
      <div className="bg-blue-50 border-b border-blue-100 py-10 px-6 text-center">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Track My Ticket</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Enter your email and ticket code to check the status of your request.
        </p>
      </div>

      {/* Main */}
      <div className="flex-1 max-w-lg mx-auto w-full px-6 py-10">

        {/* Lookup form */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-7 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</label>
              <input
                type="email" name="email" value={form.email}
                onChange={handleChange} required maxLength={254}
                placeholder="name@dscacontracting.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ticket code</label>
              <input
                type="text" name="ticketCode" value={form.ticketCode}
                onChange={handleChange} required maxLength={10}
                placeholder="e.g. TKT-4821"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Searching...' : 'Check status'}
            </button>
          </form>
        </div>

        {/* Not found */}
        {notFound && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-sm font-medium text-red-600 mb-1">No ticket found</p>
            <p className="text-xs text-red-400">Double-check your email and ticket code and try again.</p>
          </div>
        )}

        {/* Result */}
        {ticket && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-400 uppercase tracking-wide mb-0.5">Ticket code</p>
                <p className="text-xl font-semibold text-blue-600">{ticket.ticketCode}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[ticket.status]}`}>
                {formatStatus(ticket.status)}
              </span>
            </div>

            {/* Details */}
            <div className="px-6 py-5 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Issue</span>
                <span className="text-sm text-gray-800 font-medium text-right max-w-[60%]">{issueDisplay}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Priority</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[ticket.priority]}`}>
                  {formatPriority(ticket.priority)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Submitted</span>
                <span className="text-sm text-gray-700">{formatDateTime(ticket.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Last updated</span>
                <span className="text-sm text-gray-700">{formatDateTime(ticket.updatedAt)}</span>
              </div>
              {ticket.assignedAdminFirstName && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Assigned to</span>
                  <span className="text-sm text-gray-700">{ticket.assignedAdminFirstName}</span>
                </div>
              )}

              {/* Remark — only shown when resolved */}
              {ticket.status === 'RESOLVED' && ticket.remark && (
                <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Remark from IT team</p>
                  <p className="text-sm text-gray-700">{ticket.remark}</p>
                </div>
              )}
            </div>

            <div className="px-6 pb-5">
              <button
                onClick={() => { setTicket(null); setForm({ email: '', ticketCode: '' }) }}
                className="w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Search another ticket
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-5 text-xs text-gray-300 border-t border-gray-100">
        DSCA IT Support · For urgent issues call the IT helpdesk directly
      </footer>
    </div>
  )
}

export default TrackTicket
