import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/Sidebar'
import { getTickets } from '../../api/tickets'
import { formatTimeAgo, isSLABreached } from '../../utils/formatters'
import useDarkMode from '../../hooks/useDarkMode'
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  PENDING: 'bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30',
  UNRESOLVED: 'bg-red-50 text-red-500 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30',
  RESOLVED: 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30',
}

const PRIORITY_STYLES = {
  CRITICAL: 'bg-red-50 text-red-500 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30',
  HIGH: 'bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30',
  MEDIUM: 'bg-yellow-50 text-yellow-600 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/30',
  LOW: 'bg-gray-50 text-gray-500 border border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-gray-700',
}

const SITES = ['Moe', 'Dubai Mall', 'ADCB', 'JBR']
const STATUSES = ['PENDING', 'UNRESOLVED', 'RESOLVED']
const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

const PAGE_SIZE = 25

const Inbox = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggle } = useDarkMode()

  const [tickets, setTickets] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: [], priority: [], site: [] })
  const [sortOrder, setSortOrder] = useState('desc')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState({ status: false, priority: false, site: false })
  const [selected, setSelected] = useState(new Set())

  const dropdownRef = useRef(null)

  const activeFilterCount = filters.status.length + filters.priority.length + filters.site.length

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [filters, sortOrder, page])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = {
        sortBy: 'createdAt',
        order: sortOrder,
        page,
        limit: PAGE_SIZE,
      }
      if (filters.status.length === 1) params.status = filters.status[0]
      if (filters.priority.length === 1) params.priority = filters.priority[0]

      const res = await getTickets(params)
      let data = res.tickets

      // Client-side multi-value filter (API only supports single value)
      if (filters.status.length > 1) data = data.filter(t => filters.status.includes(t.status))
      if (filters.priority.length > 1) data = data.filter(t => filters.priority.includes(t.priority))
      if (filters.site.length) data = data.filter(t => filters.site.includes(t.siteName))
      if (search.trim()) {
        const q = search.toLowerCase()
        data = data.filter(t =>
          t.fullName.toLowerCase().includes(q) ||
          t.ticketCode.toLowerCase().includes(q) ||
          (t.laptopNumber || '').toLowerCase().includes(q) ||
          (t.desktopNumber || '').toLowerCase().includes(q) ||
          t.issueType.toLowerCase().includes(q)
        )
      }

      setTickets(data)
      setTotal(res.pagination.total)
    } catch {
      toast.error('Failed to load tickets.')
    } finally {
      setLoading(false)
    }
  }

  // Re-filter client-side on search change without re-fetching
  const displayedTickets = tickets.filter(t => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      t.fullName.toLowerCase().includes(q) ||
      t.ticketCode.toLowerCase().includes(q) ||
      (t.laptopNumber || '').toLowerCase().includes(q) ||
      (t.desktopNumber || '').toLowerCase().includes(q) ||
      t.issueType.toLowerCase().includes(q)
    )
  })

  const toggleFilter = (group, value) => {
    setFilters(prev => {
      const arr = prev[group]
      return {
        ...prev,
        [group]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      }
    })
    setPage(1)
  }

  const removeChip = (group, value) => toggleFilter(group, value)

  const clearAll = () => {
    setFilters({ status: [], priority: [], site: [] })
    setPage(1)
  }

  const toggleGroup = (g) => setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }))

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const clearSelected = () => setSelected(new Set())

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const assetLabel = (t) => t.laptopNumber || t.desktopNumber || '—'

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  const chipLabel = (group, value) => {
    if (group === 'status') return `Status: ${value.charAt(0) + value.slice(1).toLowerCase()}`
    if (group === 'priority') return `Priority: ${value.charAt(0) + value.slice(1).toLowerCase()}`
    return `Site: ${value}`
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f8fa] dark:bg-[#1b1b1b]">
      {/* Topbar */}
      <div className="bg-white dark:bg-[#1b1b1b] border-b border-gray-200 dark:border-gray-800 h-[52px] flex items-center justify-between px-5 flex-shrink-0 pl-16">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-100">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          DSCA IT Support
        </div>
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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

          <span className="text-[13px] text-gray-500 dark:text-gray-400">{user?.name}</span>
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-[11px] font-medium text-blue-600 dark:text-blue-400">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Inbox header */}
          <div className="px-6 pt-5 pb-3.5 bg-[#f7f8fa] dark:bg-[#1b1b1b] border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-baseline gap-2.5 mb-3.5">
              <div className="text-[17px] font-medium text-gray-900 dark:text-gray-100">Inbox</div>
              <div className="text-[13px] text-gray-400 dark:text-gray-500">{total} tickets</div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="flex-1 relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, asset, or issue..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/5 text-[13px] text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500"
                />
              </div>

              {/* Filter button + dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-colors ${
                    activeFilterCount > 0
                      ? 'border-blue-500 text-blue-600 bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:bg-blue-500/10'
                      : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:bg-white/5 dark:hover:bg-white/10'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-medium">
                      {activeFilterCount}
                    </span>
                  )}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-[220px] bg-white dark:bg-[#232323] border border-gray-200 dark:border-gray-700 rounded-[10px] overflow-hidden shadow-lg">
                    {[
                      { key: 'status', label: 'Status', options: STATUSES, display: v => v.charAt(0) + v.slice(1).toLowerCase() },
                      { key: 'priority', label: 'Priority', options: PRIORITIES, display: v => v.charAt(0) + v.slice(1).toLowerCase() },
                      { key: 'site', label: 'Site', options: SITES, display: v => v },
                    ].map(group => (
                      <div key={group.key} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <button
                          onClick={() => toggleGroup(group.key)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          {group.label}
                          <svg
                            className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform ${openGroups[group.key] ? 'rotate-180' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openGroups[group.key] && (
                          <div className="bg-blue-50/30 dark:bg-blue-500/5">
                            {group.options.map(opt => (
                              <label key={opt} className="flex items-center gap-2.5 px-4 py-2 cursor-pointer text-[13px] text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400">
                                <input
                                  type="checkbox"
                                  checked={filters[group.key].includes(opt)}
                                  onChange={() => toggleFilter(group.key, opt)}
                                  className="w-3.5 h-3.5 accent-blue-600 flex-shrink-0"
                                />
                                {group.display(opt)}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="px-3.5 py-2 flex justify-end">
                      <button onClick={clearAll} className="text-[12px] text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 bg-none border-none cursor-pointer">
                        Clear all filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort */}
              <button
                onClick={() => { setSortOrder(o => o === 'desc' ? 'asc' : 'desc'); setPage(1) }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/5 text-[13px] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
              </button>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {['status', 'priority', 'site'].flatMap(group =>
                  filters[group].map(value => (
                    <div key={`${group}-${value}`} className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                      {chipLabel(group, value)}
                      <button onClick={() => removeChip(group, value)} className="text-blue-300 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="bg-[#1e3a5f] text-white px-5 py-2 flex items-center justify-between text-[13px]">
              <span>{selected.size} selected</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded-md bg-white/15 border border-white/20 text-[12px] hover:bg-white/25">Mark resolved</button>
                <button className="px-3 py-1 rounded-md bg-white/15 border border-white/20 text-[12px] hover:bg-white/25">Reassign</button>
                <button onClick={clearSelected} className="px-3 py-1 rounded-md bg-white/15 border border-white/20 text-[12px] hover:bg-white/25">Cancel</button>
              </div>
            </div>
          )}

          {/* Ticket list */}
          <div className="flex-1 bg-white dark:bg-[#1b1b1b] overflow-auto">
            {/* List header (desktop only) */}
            <div className="hidden md:grid px-5 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.03] items-center" style={{ gridTemplateColumns: '24px 2fr 1.3fr 2.2fr 1fr 1fr 1fr 0.8fr' }}>
              <div />
              {['Submitter', 'Asset', 'Issue', 'Site', 'Status', 'Priority', 'Time'].map(h => (
                <div key={h} className="text-[12px] font-medium text-gray-300 dark:text-gray-600 uppercase tracking-[0.04em]">{h}</div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-[13px] text-gray-300 dark:text-gray-600">Loading...</div>
            ) : displayedTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-300 dark:text-gray-600">
                <svg className="w-7 h-7 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-[13px]">No tickets match your filters</p>
              </div>
            ) : (
              displayedTickets.map(ticket => {
                const sla = isSLABreached(ticket.createdAt, ticket.status)
                const unread = !ticket.isReadByMe
                return (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                    className="border-b border-gray-50 dark:border-gray-800 cursor-pointer hover:bg-blue-50/20 dark:hover:bg-blue-500/5 transition-colors"
                  >
                    {/* Desktop row */}
                    <div className={`hidden md:grid px-5 py-3 items-center transition-all duration 150 ${unread ? 'bg-white hover:bg-[#FAFBFC] dark:bg-[#0f0f0f] dark:hover:bg-[#1B1B1B]' : 
                      'bg-[#f2f6fc] hover:bg-[#edf2f8] dark:bg-[#262525] dark:hover:bg-[#2d2d2d]'} hover:relative hover:z-10 hover:shadow-[0_1px_3px_rgba(60,64,67,0.20),0_2px_8px_rgba(60,64,67,0.08)] dark:hover:shadow-[0_1px_3px_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.35)]`}
                      style={{ gridTemplateColumns: '24px 2fr 1.3fr 2.2fr 1fr 1fr 1fr 0.8fr' }}>
                      <div onClick={e => { e.stopPropagation(); toggleSelect(ticket.id) }}>
                        <div className={`w-3.5 h-3.5 rounded border-[1.5px] flex-shrink-0 ${selected.has(ticket.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[13px] truncate ${unread ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-normal text-gray-500 dark:text-gray-400'}`}>{ticket.fullName}</span>
                          {unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                        </div>
                        <div className="text-[11px] text-gray-300 dark:text-gray-600 font-mono">{ticket.ticketCode}</div>
                      </div>
                      <div className="text-[12px] text-gray-500 dark:text-gray-400 font-mono truncate pr-2">{assetLabel(ticket)}</div>
                      <div className="min-w-0">
                        <div className={`text-[12px] truncate pr-2 ${unread ? 'font-semibold text-gray-800 dark:text-gray-200' : 'font-normal text-gray-500 dark:text-gray-400'}`}>{ticket.issueType}</div>
                        {sla && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-full px-1.5 py-0.5 mt-0.5">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            SLA
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-gray-500 dark:text-gray-400 truncate">{ticket.siteName || '—'}</div>
                      <div className="pr-1.5 pl-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_STYLES[ticket.status]}`}>
                          {ticket.status.charAt(0) + ticket.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${PRIORITY_STYLES[ticket.priority]}`}>
                          {ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-300 dark:text-gray-600 ">{formatTimeAgo(ticket.createdAt)}</div>
                    </div>

                    {/* Mobile card — Gmail-style, with select checkbox */}
                    <div className="md:hidden flex items-start gap-3 px-4 py-3">
                      <div onClick={e => { e.stopPropagation(); toggleSelect(ticket.id) }} className="pt-1 flex-shrink-0">
                        <div className={`w-3.5 h-3.5 rounded border-[1.5px] ${selected.has(ticket.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'}`} />
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-[12px] font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">
                        {initials(ticket.fullName)}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + ticket code row */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[13px] truncate ${unread ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-normal text-gray-600 dark:text-gray-400'}`}>
                            {ticket.fullName}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[11px] text-gray-300 dark:text-gray-600 font-mono">{ticket.ticketCode}</span>
                            {unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                          </div>
                        </div>

                        {/* Subject (issue type) */}
                        <div className={`text-[12px] truncate mt-0.5 ${unread ? 'font-semibold text-gray-800 dark:text-gray-200' : 'font-normal text-gray-500 dark:text-gray-400'}`}>
                          {ticket.issueType}
                        </div>

                        {/* Snippet + status/priority badges */}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-[12px] text-gray-400 dark:text-gray-500 truncate">
                            {assetLabel(ticket)} · {ticket.siteName || '—'}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_STYLES[ticket.status]}`}>
                              {ticket.status.charAt(0) + ticket.status.slice(1).toLowerCase()}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${PRIORITY_STYLES[ticket.priority]}`}>
                              {ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase()}
                            </span>
                          </div>
                        </div>

                        {sla && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-red-500 dark:text-red-400">
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            SLA breach
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.03] text-[12px] text-gray-400 dark:text-gray-500">
            <span>Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-2.5 py-1 rounded-md border text-[12px] ${page === p ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Inbox