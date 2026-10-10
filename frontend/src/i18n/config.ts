import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import cs from './locales/cs.json'

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : null
const initial = stored || (navigator.language.startsWith('cs') ? 'cs' : 'en')

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    cs: { translation: cs },
  },
  lng: initial,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (lng) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem('lang', lng)
  document.documentElement.lang = lng
})

export default i18n
