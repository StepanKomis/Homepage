import axios from 'axios'
import type { Service } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

export const apiService = {
  async getAllServices(): Promise<Service[]> {
    const { data } = await apiClient.get('/v1/status')
    return data.services
  },

  async getService(id: string): Promise<Service> {
    const { data } = await apiClient.get(`/v1/services/${id}`)
    return data.service
  },

  async getConfig() {
    const { data } = await apiClient.get('/v1/config')
    return data
  },

  async testIntegration(serviceId: string) {
    const { data } = await apiClient.post('/v1/integration/test', {
      service_id: serviceId,
    })
    return data
  },
}
