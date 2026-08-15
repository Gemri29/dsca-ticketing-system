import { useState, useEffect } from 'react'
import { getAnalytics } from '../../api/admin'
import Sidebar from '../../components/Sidebar'
import toast from 'react-hot-toast'

const StatCard = ({ label, value, sub, subUp, icon }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-lg">{icon}</span>
    </div>
    <div className="text-2xl font-semibold text-gray-900 mb-1">{value}</div>
    {sub && (
      <div className={`text-xs ${subUp ? 'text-green-500' : 'text-red-400'}`}>{sub}</div>
    )}
  </div>
)

const BarChart = ({ title, data, colorClass }) => {
  const max = Math.max(...Object.values(data), 1)
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-800 mb-4">{title}</h3>
      <div className="space-y-3">
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className="flex items-center gap-3">
            <div className="w-24 text-xs text-gray-500 text-right flex-shrink-0 truncate">{key}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${colorClass}`}
                style={{ width: `${(val / max) * 100}%` }}
              />
            </div>
            <div className="w-8 text-xs text-gray-400 text-right">{val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const DonutChart = ({ title, data }) => {
  const colors = ['#7c3aed', '#a78bfa', '#2563eb', '#60a5fa', '#e5e7eb']
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  let offset = 0
  const radius = 32
  const circumference = 2 * Math.PI * radius

  const slices = Object.entries(data).map(([key, val], i) => {
    const pct = total ? val / total : 0
    const dash = pct * circumference
    const slice = { key, val, color: colors[i % colors.length], dash, offset }
    offset += dash
    return slice
  })

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-800 mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="14" />
          {slices.map(s => (
            <circle
              key={s.key}
              cx="45" cy="45" r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${s.dash} ${circumference - s.dash}`}
              strokeDashoffset={-s.offset}
              transform="rotate(-90 45 45)"
            />
          ))}
          <text x="45" y="49" textAnchor="middle" fontSize="11" fontWeight="500" fill="#1a1a1a">{total}</text>
        </svg>
        <div className="flex flex-col gap-2 flex-1">
          {slices.map(s => (
            <div key={s.key} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="text-gray-500 flex-1">{s.key}</span>
              <span className="font-medium text-gray-800">{s.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const Analytics = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('30')

  useEffect(() => {
    fetchAnalytics()
  }, [range])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const from = new Date()
      from.setDate(from.getDate() - parseInt(range))
      const res = await getAnalytics({ from: from.toISOString(), to: new Date().toISOString() })
      setData(res.analytics)
    } catch (err) {
      toast.error('Failed to load analytics.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 pl-14">
          <div>
            <h1 className="text-base font-medium text-gray-900">Analytics</h1>
            <p className="text-xs text-gray-400">System-wide ticket metrics and admin performance.</p>
          </div>
          <select
            value={range}
            onChange={e => setRange(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:border-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">All time</option>
          </select>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <p className="text-sm text-gray-400">Loading analytics...</p>
            </div>
          ) : !data ? null : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Total tickets" value={data.totalTickets} />
                <StatCard label="Resolved" value={data.byStatus?.RESOLVED || 0}
                  sub={data.totalTickets ? `${Math.round((data.byStatus?.RESOLVED || 0) / data.totalTickets * 100)}% resolution rate` : null}
                  subUp={true}
                />
                <StatCard label="Avg. resolution" value={`${data.avgResolutionTimeHours}h`} />
                <StatCard label="SLA breaches" value={data.slaBreaches}
                  sub={data.slaBreaches > 0 ? 'Tickets past 48h threshold' : 'All within SLA'}
                  subUp={data.slaBreaches === 0}
                />
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-2 gap-5">
                <BarChart
                  title="Tickets by site"
                  data={data.bySiteLocation || {}}
                  colorClass="bg-purple-500"
                />
                <DonutChart
                  title="Tickets by issue type"
                  data={data.byIssueType || {}}
                />
                <BarChart
                  title="Tickets by status"
                  data={data.byStatus || {}}
                  colorClass="bg-green-500"
                />
                <BarChart
                  title="Tickets by priority"
                  data={data.byPriority || {}}
                  colorClass="bg-orange-400"
                />
              </div>

              {/* Admin performance table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-800">Admin performance</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Admin', 'Assigned', 'Resolved', 'Avg. time', 'Resolution rate'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.adminPerformance || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-sm text-gray-400 py-8">No admin data available.</td>
                      </tr>
                    ) : (
                      data.adminPerformance.map(admin => {
                        const rate = admin.assigned > 0
                          ? Math.round((admin.resolved / admin.assigned) * 100)
                          : 0
                        const initials = admin.adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        return (
                          <tr key={admin.adminId} className="border-t border-gray-50 hover:bg-gray-50">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-medium text-blue-600">
                                  {initials}
                                </div>
                                <span className="text-sm text-gray-800">{admin.adminName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm text-gray-600">{admin.assigned}</td>
                            <td className="px-5 py-3 text-sm text-gray-600">{admin.resolved}</td>
                            <td className="px-5 py-3 text-sm text-gray-600">{admin.avgResolutionTimeHours}h</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${rate}%` }} />
                                </div>
                                <span className="text-sm text-gray-600">{rate}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics