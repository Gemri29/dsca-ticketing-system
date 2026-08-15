import { useState, useCallback } from 'react'
import { getTickets } from '../api/tickets'

const useTickets = (defaultParams = {}) => {
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTickets = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getTickets({ ...defaultParams, ...params })
      setTickets(res.tickets || [])
      setPagination(res.pagination || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets.')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { tickets, pagination, loading, error, fetchTickets }
}

export default useTickets