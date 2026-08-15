import { useState, useEffect } from 'react'

const IdleWarningModal = ({ visible, onStayLoggedIn, onLogoutNow }) => {
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    if (!visible) {
      setCountdown(60)
      return
    }
    setCountdown(60)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-7 w-full max-w-sm mx-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl mx-auto mb-4">
          ⏱
        </div>
        <h2 className="text-base font-medium text-gray-900 text-center mb-2">
          Are you still there?
        </h2>
        <p className="text-sm text-gray-400 text-center mb-5 leading-relaxed">
          You've been inactive for 19 minutes. You'll be automatically signed out in:
        </p>

        {/* Countdown */}
        <div className="text-center mb-6">
          <span className={`text-4xl font-semibold tabular-nums ${
            countdown <= 10 ? 'text-red-500' : 'text-gray-800'
          }`}>
            {countdown}s
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onLogoutNow}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-all"
          >
            Sign out now
          </button>
          <button
            onClick={onStayLoggedIn}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all"
          >
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  )
}

export default IdleWarningModal