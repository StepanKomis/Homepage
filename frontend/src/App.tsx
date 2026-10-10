import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDashboardStore } from './store/dashboard'
import Dashboard from './pages/Dashboard'
import { apiService } from './services/api'
import './App.css'

function App() {
  const { i18n } = useTranslation()
  const { setServices, setLoading, setError } = useDashboardStore()

  useEffect(() => {
    const tz = import.meta.env.VITE_TZ || 'Europe/Prague'
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true)
        const services = await apiService.getAllServices()
        setServices(services)
        setError(null)
      } catch (err) {
        console.error('Failed to load services:', err)
        setError('Failed to load services')
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [setServices, setLoading, setError])

  return <Dashboard />
}

export default App
