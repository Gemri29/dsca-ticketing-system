import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { submitTicket, getLaptops, getDesktops } from '../api/tickets'
import usePageTitle from '../hooks/usePageTitle'

const ISSUE_TYPES = ['Internet Issue', 'Hardware Issue', 'Software Issue', 'New Email', 'Email reset Password', 'Sim Card Request', 'Server Access', ' CCTV Installation', 'Wifi Installation', 'Printer Maintenance', 'Printer Toner', 'Other']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const LandingPage = () => {
  usePageTitle('Submit Ticket')
  const navigate = useNavigate()
  const [laptops, setLaptops] = useState([])
  const [laptopQuery, setLaptopQuery] = useState('')
  const [laptopDropdownOpen, setLaptopDropdownOpen] = useState(false)
  const [selectedLaptop, setSelectedLaptop] = useState(null)
  const [desktops, setDesktops] = useState([])
  const [desktopQuery, setDesktopQuery] = useState('')
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false)
  const [selectedDesktop, setSelectedDesktop] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    siteName: '',
    issueType: '',
    customIssue: '',
    priority: 'MEDIUM',
    attachment: null,
    _trap: ''
  })

  useEffect(() => {
    console.log('Fetching laptops from:', import.meta.env.VITE_API_BASE_URL)
    getLaptops()
      .then(res => {
        console.log('Laptops response:', res)
        setLaptops(res.laptops || [])
      })
      .catch(err => {
        console.error('Laptops fetch error:', err)
        setLaptops([])
      })
    getDesktops()
      .then(res => setDesktops(res.desktops || []))
      .catch(() => setDesktops([]))
  }, [])

  const filteredLaptops = laptops.filter(l =>
    l.assetCode.toLowerCase().includes(laptopQuery.toLowerCase())
  )
  .sort((a, b) => {
    const numA = parseInt(a.assetCode.split('-').pop(), 10);
    const numB = parseInt(b.assetCode.split('-').pop(), 10);

    return numA - numB;
  })

  useEffect(() => {
    if (form.issueType === 'Sim Card Request') {
      setSelectedLaptop(null)
      setSelectedDesktop(null)
      setLaptopQuery('')
      setDesktopQuery('')
    }
  }, [form.issueType])
  
  const filteredDesktops = desktops.filter(d =>
    d.assetCode.toLowerCase().includes(desktopQuery.toLowerCase())
  ).sort((a, b) => {
    const numA = parseInt(a.assetCode.split('-').pop(), 10)
    const numB = parseInt(b.assetCode.split('-').pop(), 10)
    return numA - numB
  })

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'attachment') {
      setForm(prev => ({ ...prev, attachment: files[0] }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (form.issueType !== 'Sim Card Request' && !selectedLaptop && !selectedDesktop) {
      toast.error('Please select a laptop or desktop number.')
      return
    }
    if (!form.siteName.trim()) {
      toast.error('Please enter a site name.')
      return
    }

    const data = new FormData()
    data.append('fullName', form.fullName)
    data.append('email', form.email)
    if (selectedLaptop) data.append('laptopNumber', selectedLaptop)
    if (selectedDesktop) data.append('desktopNumber', selectedDesktop)
    data.append('siteName', form.siteName)
    data.append('issueType', form.issueType)
    data.append('customIssue', form.customIssue)
    data.append('priority', form.priority)
    data.append('_trap', form._trap)
    if (form.attachment) data.append('attachment', form.attachment)

    setSubmitting(true)
    try {
      const res = await submitTicket(data)
      setSubmitted(res.ticketCode)
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        Object.values(errors).forEach(msg => toast.error(msg))
      } else {
        toast.error(err.response?.data?.message || 'Something went wrong.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <nav className="border-b border-gray-200 px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
            DSCA IT Support
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              
            </div>
            <h1 className="text-xl font-medium text-gray-900 mb-2">Ticket submitted!</h1>
            <p className="text-sm text-gray-500 mb-6">
              Your ticket has been received. Check your email for a confirmation with your ticket code and tracking link.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-5 mb-6">
              <p className="text-xs text-blue-400 uppercase tracking-wide mb-1">Your ticket code</p>
              <p className="text-3xl font-semibold text-blue-600">{submitted}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/track')}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Track ticket
              </button>
              <button
                onClick={() => { setSubmitted(null); setForm({ fullName: '', email: '', siteName: '', issueType: '', customIssue: '', priority: 'MEDIUM', attachment: null, _trap: '' }); setSelectedLaptop(null); setSelectedDesktop(null) }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Submit another
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-gray-200 px-8 py-3.5 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
           DSCA IT Support
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-blue-50 border-b border-blue-100 py-10 px-6 text-center">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">IT Support Ticketing</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Submit a request and our IT team will get back to you. No account needed.
        </p>
      </div>

      {/* Main */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Form card */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-7">
          <h2 className="text-base font-medium text-gray-900 mb-1">New support request</h2>
          <p className="text-xs text-gray-400 mb-5">All fields are required unless marked optional.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot */}
            <input type="text" name="_trap" value={form._trap} onChange={handleChange} className="hidden" tabIndex={-1} autoComplete="off" />

            {/* Full name */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Full name</label>
              <input
                type="text" name="fullName" value={form.fullName}
                onChange={handleChange} required
                placeholder="e.g. Juan dela Cruz"
                maxLength={50}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</label>
              <input
                type="email" name="email" value={form.email}
                onChange={handleChange} required
                placeholder="name@dscacontracting.com"
                maxLength={100}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Laptop number combobox */}
            <div className={selectedDesktop ? 'opacity-40 pointer-events-none' : ''}>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Laptop number <span className="text-gray-300 normal-case">(if available)</span></label>
              {selectedLaptop ? (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-blue-700 font-medium flex-1">{selectedLaptop}</span>
                  <button type="button" onClick={() => { setSelectedLaptop(null); setLaptopQuery('') }} className="text-blue-300 hover:text-blue-600 text-xs">✕</button>
                </div>
              ) : (
              <div className={form.issueType === 'Sim Card Request' ? 'opacity-40 pointer-events-none select-none' : ''}>                  <input
                    type="text"
                    value={laptopQuery}
                    onChange={e => { setLaptopQuery(e.target.value); setLaptopDropdownOpen(true) }}
                    onFocus={() => setLaptopDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setLaptopDropdownOpen(false), 150)}
                    placeholder="Type to search e.g. 005"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                  {laptopDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                      {filteredLaptops.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400 text-center">No matching laptop found</div>
                      ) : (
                        filteredLaptops.map(l => (
                          <div
                            key={l.assetCode}
                            onMouseDown={() => { setSelectedLaptop(l.assetCode); setLaptopQuery(''); setLaptopDropdownOpen(false) }}
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center justify-between"
                          >
                            <span>{l.assetCode}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop number combobox */}
            <div className={selectedLaptop ? 'opacity-40 pointer-events-none' : ''}>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Desktop number <span className="text-gray-300 normal-case">(if available)</span></label>
              {selectedDesktop ? (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-blue-700 font-medium flex-1">{selectedDesktop}</span>
                  <button type="button" onClick={() => { setSelectedDesktop(null); setDesktopQuery('') }} className="text-blue-300 hover:text-blue-600 text-xs">✕</button>
                </div>
              ) : (
                <div className={selectedLaptop || form.issueType === 'Sim Card Request' ? 'opacity-40 pointer-events-none select-none' : ''}>
                  <input
                    type="text"
                    value={desktopQuery}
                    onChange={e => { setDesktopQuery(e.target.value); setDesktopDropdownOpen(true) }}
                    onFocus={() => setDesktopDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setDesktopDropdownOpen(false), 150)}
                    placeholder="Type to search e.g. 005"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                  {desktopDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                      {filteredDesktops.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400 text-center">No matching desktop found</div>
                      ) : (
                        filteredDesktops.map(d => (
                          <div
                            key={d.assetCode}
                            onMouseDown={() => { setSelectedDesktop(d.assetCode); setDesktopQuery(''); setDesktopDropdownOpen(false) }}
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                          >
                            {d.assetCode}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Site name */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Site name</label>
              <input
                type="text" name="siteName" value={form.siteName}
                onChange={handleChange} required
                placeholder="e.g. Main Office"
                maxLength={100}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Issue type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Issue type</label>
              <select
                name="issueType" value={form.issueType}
                onChange={handleChange} required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select issue</option>
                {ISSUE_TYPES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>

            {/* Sim Card Request notice */}
            {form.issueType === 'Sim Card Request' && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3.5 py-2.5 text-[12px] text-blue-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Laptop and desktop fields are not required for Sim Card Requests.
              </div>
            )}
            {/* Custom issue */}
            {form.issueType === 'Other' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700 mb-2">⚠️ Please describe your issue below</p>
                <textarea
                  name="customIssue" value={form.customIssue}
                  onChange={handleChange} required
                  placeholder="Describe your issue in detail"
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p} type="button"
                    onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      form.priority === p
                        ? p === 'LOW' ? 'bg-gray-100 text-gray-600 border-gray-300'
                          : p === 'MEDIUM' ? 'bg-yellow-50 text-yellow-600 border-yellow-300'
                          : p === 'HIGH' ? 'bg-orange-50 text-orange-600 border-orange-300'
                          : 'bg-red-50 text-red-500 border-red-300'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Attachment <span className="text-gray-300 normal-case">(optional)</span></label>
              <label className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg py-4 px-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all bg-white">
                <span className="text-xl mb-1 h-10 w-10">
                  <svg> <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="File / Cloud_Upload"> <path id="Vector" d="M12 16V10M12 10L9 12M12 10L15 12M23 15C23 12.7909 21.2091 11 19 11C18.9764 11 18.9532 11.0002 18.9297 11.0006C18.4447 7.60802 15.5267 5 12 5C9.20335 5 6.79019 6.64004 5.66895 9.01082C3.06206 9.18144 1 11.3498 1 13.9999C1 16.7613 3.23858 19.0001 6 19.0001L19 19C21.2091 19 23 17.2091 23 15Z" stroke="#c9c9c9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g></svg> </svg>
                  </span>
                <span className="text-xs text-gray-400">
                  {form.attachment ? form.attachment.name : 'Click to upload — JPG, PNG, PDF · max 5MB'}
                </span>
                <input type="file" name="attachment" onChange={handleChange} accept=".jpg,.jpeg,.png,.pdf" className="hidden" />
              </label>
            </div>

            <button
              type="submit" disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? 'Submitting...' : 'Submit ticket'}
            </button>
          </form>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          {/* Track ticket */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-medium text-gray-900 mb-1">Track my ticket</h2>
            <p className="text-xs text-gray-400 mb-4">Already submitted? Check your ticket status using your email and ticket code.</p>
            <button
              onClick={() => navigate('/track')}
              className="w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              Go to ticket tracker →
            </button>
          </div>

          {/* How it works */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">How it works</h3>
            <div className="space-y-3">
              {[
                'Fill in the form and submit your request.',
                'You\'ll receive a confirmation email with your unique ticket code.',
                'Our IT team reviews and works on your request.',
                'Get an email update when your ticket status changes.'
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-white border border-blue-200 text-blue-600 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-5 text-xs text-gray-300 border-t border-gray-100">
        DSCA IT Support · For urgent issues call the IT helpdesk directly
      </footer>
    </div>
  )
}

export default LandingPage