import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import enCommon from '../locales/en/common.json'
import esCommon from '../locales/es/common.json'
import caCommon from '../locales/ca/common.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      es: { common: esCommon },
      ca: { common: caCommon }
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'ca'],
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })

export default i18n
