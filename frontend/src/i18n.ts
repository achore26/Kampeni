import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Swahili is default per build philosophy
i18n.use(initReactI18next).init({
  lng: 'sw',
  fallbackLng: 'en',
  resources: {
    sw: { translation: {} },
    en: { translation: {} },
  },
  interpolation: { escapeValue: false },
})

export default i18n
