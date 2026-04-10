import i18next from 'i18next'
import enCommon from '../locales/en/common.json'
import esCommon from '../locales/es/common.json'
import caCommon from '../locales/ca/common.json'

export const testI18n = i18next.createInstance()

void testI18n.init({
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en', 'es', 'ca'],
  defaultNS: 'common',
  ns: ['common'],
  resources: {
    en: { common: enCommon },
    es: { common: esCommon },
    ca: { common: caCommon }
  },
  interpolation: {
    escapeValue: false
  }
})

