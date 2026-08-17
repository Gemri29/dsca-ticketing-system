import axios from 'axios'

const API = axios.create({
  baseURL: `${import.meta.env.API_BASE_URL}/api`,
  withCredentials: true
})

export const login = async (email, password) => {
  const res = await API.post('/auth/login', { email, password })
  return res.data
}

export const logout = async () => {
  const res = await API.post('/auth/logout')
  return res.data
}

export const getMe = async () => {
  const res = await API.get('/auth/me')
  return res.data
}

export const updateMe = async (data) => {
  const res = await API.patch('/auth/me', data)
  return res.data
}