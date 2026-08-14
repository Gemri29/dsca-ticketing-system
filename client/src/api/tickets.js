import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  withCredentials: true
})

export const submitTicket = async (formData) => {
  const res = await API.post('/tickets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export const trackTicket = async (email, ticketCode) => {
  const res = await API.get('/tickets/track', {
    params: { email, ticketCode }
  })
  return res.data
}

export const getLaptops = async () => {
  const res = await API.get('/tickets/laptops')
  return res.data
}

export const getDesktops = async () => {
  const res = await API.get('/tickets/desktops')
  return res.data
}

export const getTickets = async (params) => {
  const res = await API.get('/tickets', { params })
  return res.data
}

export const getTicketById = async (id) => {
  const res = await API.get(`/tickets/${id}`)
  return res.data
}

export const updateTicket = async (id, data) => {
  const res = await API.patch(`/tickets/${id}`, data)
  return res.data
}

export const assignTicket = async (id, adminId) => {
  const res = await API.patch(`/tickets/${id}/assign`, { adminId })
  return res.data
}