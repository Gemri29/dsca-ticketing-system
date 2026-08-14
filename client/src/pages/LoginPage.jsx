import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login } from '../api/auth'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email.trim() || !form.password) {
      toast.error('Email and password are required.')
      return
    }
    setSubmitting(true)
    try {
      const res = await login(form.email.trim(), form.password)
      setUser(res.user)
      navigate('/admin/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[15px] font-medium text-gray-800">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          DSCA IT Support
        </div>
        <Link to="/" className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to landing page
        </Link>
      </div>

      {/* Center card */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white border border-gray-200 rounded-2xl px-8 py-9 w-full max-w-[380px]">
          {/* Icon */}
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-5">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <div className="text-[18px] font-medium text-gray-900 mb-1">Admin portal</div>
          <div className="text-[13px] text-gray-400 mb-5 leading-relaxed">Sign in to manage and resolve IT support tickets.</div>

          {/* Role badge */}
          <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-full text-[11px] font-medium px-2.5 py-1 mb-5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            IT staff and super admins only
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-4">
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@dscacontracting.com"
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-900 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Rate limit warning */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5 mb-4">
              <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[12px] text-amber-700 leading-relaxed">10 failed attempts will lock this account for 15 minutes.</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-[14px] font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-4"
            >
              {submitting ? 'Signing in...' : 'Sign in ↗'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-2.5 mb-4">
            <hr className="flex-1 border-gray-100" />
            <span className="text-[11px] text-gray-300">secured by</span>
            <hr className="flex-1 border-gray-100" />
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2.5 bg-blue-50/50 border border-blue-100 rounded-lg px-3.5 py-3">
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-[12px] text-gray-500 leading-relaxed">Sessions are protected with JWT stored in HttpOnly cookies. All connections are encrypted via HTTPS.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-5 text-[12px] text-gray-300 bg-[#f7f8fa]">
        DSCA IT Support · Admin access only · Unauthorized access is prohibited
      </div>
    </div>
  )
}

export default LoginPage
