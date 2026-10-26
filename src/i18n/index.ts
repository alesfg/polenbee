import { getLocales } from 'expo-localization';

import { en } from './en';
import { es } from './es';

export type Language = 'en' | 'es';
export type TranslationKey = keyof typeof en;

// English unless the device is set to Spanish.
function detectLanguage(): Language {
  try {
    return getLocales()[0]?.languageCode === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

export const language: Language = detectLanguage();

/** BCP 47 tag for Intl/toLocale* formatting. */
export const locale = language === 'es' ? 'es-ES' : 'en-US';

const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, es };

/** t('key', { name: 'x' }) replaces {name} placeholders. */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let text = dictionaries[language][key] ?? en[key];
  if (params) {
    for (const [k, v] of Object.entries(params)) text = text.split(`{${k}}`).join(String(v));
  }
  return text;
}

export const APP_NAME = t('appName');
