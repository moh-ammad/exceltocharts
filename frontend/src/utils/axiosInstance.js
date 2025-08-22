import axios from 'axios'
import { BASE_URL } from './apisPaths'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 🔥 Necessary for sending cookies
})

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error

    if (response) {
      switch (response.status) {
        case 401:
          window.location.href = '/login'
          break
        case 500:
          console.error('Server error. Please try again later.')
          break
        default:
          console.error('API Error:', response.statusText)
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timed out.')
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
