import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import { resources } from './resources';

export type AppLanguage = 'vi' | 'en';
export const LANGUAGE_STORAGE_KEY = 'hds-admin-next:ui-language:v1';

function validLanguage(value: string | null | undefined): value is AppLanguage {
  return value === 'vi' || value === 'en';
}

function readInitialLanguage(): AppLanguage {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return validLanguage(stored) ? stored : 'vi';
  } catch {
    return 'vi';
  }
}

export const i18nReady = i18n.use(initReactI18next).init({
  resources,
  lng: readInitialLanguage(),
  fallbackLng: 'vi',
  supportedLngs: ['vi', 'en'],
  load: 'languageOnly',
  ns: ['common', 'navigation', 'claude', 'chatgpt', 'compare', 'validation'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  react: { useSuspense: false }
});

function syncDocumentLanguage(language: string) {
  const selected = validLanguage(language) ? language : 'vi';
  if (typeof document !== 'undefined') {
    document.documentElement.lang = selected;
    document.title = i18n.t('common:documentTitle', { lng: selected });
  }
  dayjs.locale(selected);
}

i18n.on('languageChanged', syncDocumentLanguage);
i18nReady.then(() => syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language));

export async function setAppLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Keep the selected language in i18next memory when storage is unavailable.
  }
}

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return validLanguage(value);
}

export { i18n };
