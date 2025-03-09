
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';

// Create an initialization function that can be called from main.tsx
export const initializeI18n = () => {
  if (i18n.isInitialized) {
    return i18n;
  }

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: {
          translation: enTranslations,
        },
        fr: {
          translation: frTranslations,
        },
        de: {
          translation: deTranslations,
        },
      },
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    });

  return i18n;
};

// Export the i18n instance as the default export for backward compatibility
export default i18n;
