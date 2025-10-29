import axios from 'axios'
import type {
  AxiosError,
  AxiosRequestHeaders,
  InternalAxiosRequestConfig,
} from 'axios'
import { API_BASE_URL } from '../config/env'

interface ErrorWithMessage {
  message?: string
}

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('access_token')
    if (token) {
      const headers = (config.headers || {}) as AxiosRequestHeaders
      headers.Authorization = `Bearer ${token}`
      config.headers = headers
    }
  }

  return config
})

request.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<ErrorWithMessage>) => {
    return Promise.reject(error.response?.data || { message: error.message })
  },
)

export default request
