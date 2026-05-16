import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { de } from './de'
import { en } from './en'

const savedLang = localStorage.getItem('lang') ?? 'de'

i18n.use(initReactI18next).init({
  resources: { de, en },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
