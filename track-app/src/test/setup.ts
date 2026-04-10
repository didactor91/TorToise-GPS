import '@testing-library/jest-dom/vitest'
import React from 'react'
import { beforeEach, vi } from 'vitest'
import { testI18n } from './i18n'

vi.mock('react-i18next', async () => {
  return {
    useTranslation: () => ({
      t: testI18n.t.bind(testI18n),
      i18n: testI18n
    }),
    I18nextProvider: ({ children }: { children: React.ReactNode }) => children
  }
})

beforeEach(async () => {
  localStorage.setItem('i18nextLng', 'en')
  if (testI18n.language !== 'en') {
    await testI18n.changeLanguage('en')
  }
})
