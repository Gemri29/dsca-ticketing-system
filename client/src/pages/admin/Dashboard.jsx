import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/Sidebar'
import { getTickets } from '../../api/tickets'
import { formatTimeAgo, isSLABreached } from '../../utils/formatters'

const STATUS_FILTERS = ['PENDING', 'UNRESOLVED', 'RESOLVED']

const PRIORITY_STYLES = {
  CRITICAL: 'bg-red-50 text-red-500 border border-red-200',
  HIGH: 'bg-orange-50 text-orange-600 border border-orange-200',
  MEDIUM: 'bg-yellow-50 text-yellow-600 border border-yellow-200',
  LOW: 'bg-gray-50 text-gray-500 border border-gray-200',
}

const STAT_CONFIG = {
  PENDING: { label: 'Pending', numColor: 'text-orange-500', iconBg: 'bg-orange-50 text-orange-500' },
  UNRESOLVED: { label: 'Unresolved', numColor: 'text-red-500', iconBg: 'bg-red-50 text-red-500' },
  RESOLVED: { label: 'Resolved', numColor: 'text-green-600', iconBg: 'bg-green-50 text-green-600' },
}

const STAT_ICONS = {
  PENDING: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  UNRESOLVED: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  RESOLVED: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialStatus = searchParams.get('status')?.toUpperCase() || 'PENDING'
  const [activeFilter, setActiveFilter] = useState(
    STATUS_FILTERS.includes(initialStatus) ? initialStatus : 'PENDING'
  )
  const [tickets, setTickets] = useState([])
  const [counts, setCounts] = useState({ PENDING: 0, UNRESOLVED: 0, RESOLVED: 0 })
  const [loading, setLoading] = useState(true)

  // Fetch counts for all statuses
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [p, u, r] = await Promise.all([
          getTickets({ status: 'PENDING', limit: 1 }),
          getTickets({ status: 'UNRESOLVED', limit: 1 }),
          getTickets({ status: 'RESOLVED', limit: 1 }),
        ])
        setCounts({
          PENDING: p.pagination.total,
          UNRESOLVED: u.pagination.total,
          RESOLVED: r.pagination.total,
        })
      } catch {
        // counts stay 0
      }
    }
    fetchCounts()
  }, [])

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true)
      try {
        const res = await getTickets({ status: activeFilter, limit: 25, sortBy: 'createdAt', order: 'desc' })
        setTickets(res.tickets)
      } catch {
        setTickets([])
      } finally {
        setLoading(false)
      }
    }
    fetchTickets()
  }, [activeFilter])
  useEffect(() => {
    const status = searchParams.get('status')?.toUpperCase()
    if (status && STATUS_FILTERS.includes(status)) {
      setActiveFilter(status)
    }
  }, [searchParams])

  const setFilter = (status) => {
    setActiveFilter(status)
    setSearchParams({ status: status.toLowerCase() })
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
  const firstName = user?.name?.split(' ')[0] || 'there'

  const sidebarCounts = {
    pending: counts.PENDING,
    unresolved: counts.UNRESOLVED,
    resolved: counts.RESOLVED,
  }

  const assetLabel = (t) => t.laptopNumber || t.desktopNumber || '—'

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f8fa]">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 h-[52px] flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          DSCA IT Support
        </div>
        <div className="flex items-center gap-3">
          <button className="relative text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
          </button>
          <span className="text-[13px] text-gray-500">{user?.name}</span>
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[11px] font-medium text-blue-600">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar counts={sidebarCounts} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header + stat cards */}
          <div className="px-6 pt-5 pb-0 bg-[#f7f8fa]">
            <div className="text-[17px] font-medium text-gray-900 mb-0.5">Dashboard</div>
            <div className="text-[13px] text-gray-400 mb-4">{today} · Welcome back, {firstName}</div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {STATUS_FILTERS.map(status => {
                const cfg = STAT_CONFIG[status]
                const isActive = activeFilter === status
                return (
                  <div
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`bg-white border rounded-[10px] px-4 py-3.5 cursor-pointer transition-all ${
                      isActive ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.04em]">{cfg.label}</span>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.iconBg}`}>
                        {STAT_ICONS[status]}
                      </div>
                    </div>
                    <div className={`text-[22px] font-medium ${cfg.numColor}`}>{counts[status]}</div>
                  </div>
                )
              })}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1.5">
              {STATUS_FILTERS.map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-[18px] py-[7px] rounded-t-lg text-[13px] font-medium border border-b-0 transition-colors ${
                    activeFilter === status
                      ? 'bg-white text-blue-600 border-blue-100'
                      : 'bg-gray-100 text-gray-400 border-gray-200 hover:text-gray-600'
                  }`}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket list */}
          <div className="flex-1 bg-white border-t border-gray-200 overflow-auto">
            {/* List header */}
            <div className="grid gap-0 px-5 py-2.5 border-b border-gray-100 bg-gray-50" style={{ gridTemplateColumns: '2fr 1.4fr 2.5fr 1fr 1fr', minWidth: 0 }}>
              {['Submitter', 'Asset', 'Issue', 'Priority', 'Time'].map(h => (
                <div key={h} className="text-[11px] font-medium text-gray-300 uppercase tracking-[0.04em] min-w-0">{h}</div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-[13px] text-gray-300">Loading...</div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-[13px]">No {activeFilter.toLowerCase()} tickets</p>
              </div>
            ) : (
              tickets.map(ticket => {
                const sla = isSLABreached(ticket.createdAt, ticket.status)
                return (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                    className="grid gap-0 px-5 py-3 border-b border-gray-50 cursor-pointer hover:bg-blue-50/30 items-center transition-colors"
                    style={{ gridTemplateColumns: '2fr 1.4fr 2.5fr 1fr 1fr', minWidth: 0 }}
                  >
                    <div className="text-[13px] text-gray-800 font-medium truncate pr-2 min-w-0">{ticket.fullName}</div>
                    <div className="text-[12px] text-gray-500 font-mono truncate pr-2 min-w-0">{assetLabel(ticket)}</div>
                    <div className="pr-2 min-w-0 overflow-hidden">
                      <div className="text-[12px] text-gray-500 truncate">{ticket.issueType}{ticket.customIssue ? ` — ${ticket.customIssue}` : ''}</div>
                      {sla && (
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-red-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          SLA breach
                        </div>
                      )}
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${PRIORITY_STYLES[ticket.priority]}`}>
                        {ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-300">{formatTimeAgo(ticket.createdAt)}</div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
