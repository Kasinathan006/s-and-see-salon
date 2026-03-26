import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

// Client APIs
export const registerClient = (data) => api.post('/api/clients', data)
export const getClient = (id) => api.get(`/api/clients/${id}`)
export const searchClients = (phone) => api.get(`/api/clients/search?phone=${phone}`)
export const updateClientPhoto = (clientId, photoUrl) => api.put(`/api/clients/${clientId}/photo`, { photo_url: photoUrl })

// Consultation APIs
export const startConsultation = (data) => api.post('/api/consultations', data)
export const getConsultation = (id) => api.get(`/api/consultations/${id}`)
export const updateConsultation = (id, data) => api.put(`/api/consultations/${id}`, data)
export const submitAnswers = (consultationId, data) => api.post(`/api/consultations/${consultationId}/answers`, data)

// AI Chat
export const chatWithAI = (data) => api.post('/api/ai/chat', data)

// Services
export const getServices = (category) => api.get(`/api/services?category=${category || ''}`)

// Appointments
export const createAppointment = (data) => api.post('/api/appointments', data)
export const getAppointments = (clientId) => api.get(`/api/appointments?client_id=${clientId}`)

// Treatment tracking
export const getTreatmentPlan = (id) => api.get(`/api/treatments/${id}`)
export const getClientTreatmentPlan = (clientId) => api.get(`/api/treatments/client/${clientId}`)
export const updateTreatmentProgress = (id, data) => api.put(`/api/treatments/${id}/progress`, data)

// Feedback
export const submitFeedback = (data) => api.post('/api/feedback', data)

// Dashboard Stats
export const getStats = () => api.get('/api/stats')

// Summary PDF
export const generateSummary = (consultationId) => api.get(`/api/consultations/${consultationId}/summary`)

export default api
