import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { testI18n } from './i18n'

type Lang = 'en' | 'es' | 'ca'

export async function renderWithI18n(
  ui: React.ReactElement,
  lang: Lang = 'en',
  options?: Omit<RenderOptions, 'wrapper'>
) {
  localStorage.setItem('i18nextLng', lang)
  if (testI18n.language !== lang) {
    await testI18n.changeLanguage(lang)
  }
  return render(ui, options)
}

