import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
          { refreshToken }
        )
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export const listingsApi = {
  getAll: (params: Record<string, any>) => api.get('/api/listings', { params }),
  getOne: (id: string) => api.get(`/api/listings/${id}`),
  create: (data: any) => api.post('/api/listings', data),
  update: (id: string, data: any) => api.put(`/api/listings/${id}`, data),
  delete: (id: string) => api.delete(`/api/listings/${id}`),
  getMy: () => api.get('/api/listings/my'),
  save: (id: string) => api.post(`/api/listings/${id}/save`),
  unsave: (id: string) => api.delete(`/api/listings/${id}/save`),
  getSaved: () => api.get('/api/listings/saved'),
  markSold: (id: string) => api.post(`/api/listings/${id}/sold`),
  uploadImages: (formData: FormData) => api.post('/api/upload/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const authApi = {
  register: (data: any) => api.post('/api/auth/register', data),
  login: (data: any) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me'),
  forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/api/auth/reset-password', data),
}

export const paymentsApi = {
  getSubscription: () => api.get('/api/payments/subscription'),
  createCheckout: (plan: 'basic' | 'premium') => api.post('/api/payments/checkout', { plan }),
  createSubscription: (data: any) => api.post('/api/payments/subscription', data),
  cancelSubscription: () => api.delete('/api/payments/subscription'),
  createBoost: (listingId: string, data: any) => api.post(`/api/payments/boost/${listingId}`, data),
  getPortalUrl: () => api.get('/api/payments/portal'),
}

export const referralApi = {
  getStats: () => api.get('/api/referral/stats'),
  getLink: () => api.get('/api/referral/link'),
}

export const messagesApi = {
  getConversations: () => api.get('/api/messages/conversations'),
  getMessages: (listingId: string, withUser: string) => api.get(`/api/messages/${listingId}`, { params: { withUser } }),
  send: (data: any) => api.post('/api/messages', data),
}
