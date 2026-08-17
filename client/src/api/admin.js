import axios from 'axios'

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  withCredentials: true
})

export const getAdminUsers = async (params) => {
  const res = await API.get('/admin/users', { params })
  return res.data
}

export const createAdminUser = async (data) => {
  const res = await API.post('/admin/users', data)
  return res.data
}

export const updateAdminUser = async (id, data) => {
  const res = await API.patch(`/admin/users/${id}`, data)
  return res.data
}

export const getAnalytics = async (params) => {
  const res = await API.get('/admin/analytics', { params })
  return res.data
}