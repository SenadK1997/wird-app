import { getLocales } from 'expo-localization';

export const LANGUAGES = [
  { code: 'en', name: 'English', rtl: false },
  { code: 'bs', name: 'Bosanski', rtl: false },
  { code: 'tr', name: 'Türkçe', rtl: false },
  { code: 'id', name: 'Bahasa Indonesia', rtl: false },
  { code: 'ar', name: 'العربية', rtl: true },
  { code: 'ur', name: 'اردو', rtl: true },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
/** `system` follows the phone's language where the app has it, and English otherwise. */
export type LanguageSetting = LanguageCode | 'system';

// Croatian and Serbian speakers read Bosnian more easily than English.
const ALIASES: Record<string, LanguageCode> = { hr: 'bs', sr: 'bs' };

export function resolveLanguage(setting: LanguageSetting): LanguageCode {
  if (setting !== 'system') return setting;
  const device = getLocales()[0]?.languageCode ?? 'en';
  const match = LANGUAGES.find((language) => language.code === device);
  return match?.code ?? ALIASES[device] ?? 'en';
}
