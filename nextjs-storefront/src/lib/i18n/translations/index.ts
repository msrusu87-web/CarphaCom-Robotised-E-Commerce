// Translation system index
// Default: English (en), Available: English, Romanian

import en from './en'
import ro from './ro'

export const translations = {
  en,
  ro,
}

export const defaultLocale = 'en'

// Helper function to get translation by key
export function t(key: string, locale: string = 'en'): string {
  const keys = key.split('.')
  let value: any = translations[locale as keyof typeof translations] || translations.en
  
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) {
      // Fallback to English
      let fallback: any = translations.en
      for (const fk of keys) {
        fallback = fallback?.[fk]
        if (fallback === undefined) return key
      }
      return fallback
    }
  }
  
  return value
}

export default translations
