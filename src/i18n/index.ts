import { FREE_COUNTER_ID, type CategoryId, type Dhikr, type Flow } from '@/data/dhikr';
import { useDhikrStore } from '@/store/dhikr-store';

import { ar } from './ar';
import { bs } from './bs';
import { en, type Translations, type UiKey } from './en';
import { id } from './id';
import { LANGUAGES, resolveLanguage, type LanguageCode } from './languages';
import { tr } from './tr';
import { ur } from './ur';

const TRANSLATIONS: Record<LanguageCode, Translations> = { en, bs, tr, id, ar, ur };

const CATEGORY_KEYS: Record<CategoryId, UiKey> = {
  essentials: 'catEssentials',
  adhkar: 'catAdhkar',
  protection: 'catProtection',
  rizq: 'catRizq',
  forgiveness: 'catForgiveness',
  hardship: 'catHardship',
};

const FLOW_KEYS: Record<string, UiKey> = {
  'after-prayer': 'flowAfterPrayer',
  morning: 'flowMorning',
  evening: 'flowEvening',
};

type Params = Record<string, string | number>;

export type Translate = (key: UiKey, params?: Params) => string;

/** Strings and formatting for the language chosen in Settings. */
export function useI18n() {
  const { language } = useDhikrStore();
  const code = resolveLanguage(language);
  const strings = TRANSLATIONS[code];
  // Western digits in every language, so counts look the same as the big number on the ring.
  const locale = `${code}-u-nu-latn`;

  const formatNumber = (value: number) => value.toLocaleString(locale);

  const t: Translate = (key, params) =>
    strings.ui[key].replace(/\{(\w+)\}/g, (_, name: string) => {
      const value = params?.[name];
      return typeof value === 'number' ? formatNumber(value) : (value ?? '');
    });

  return {
    t,
    code,
    locale,
    rtl: LANGUAGES.some((l) => l.code === code && l.rtl),
    formatNumber,
    /** Meaning of a built-in dhikr in the current language, if there is one. */
    meaning: (dhikrId: string): string | undefined => strings.dhikr[dhikrId],
    /** Name of a dhikr as shown in lists. Only the free counter's name is translated. */
    dhikrTitle: (dhikr: Pick<Dhikr, 'id' | 'title'>) =>
      dhikr.id === FREE_COUNTER_ID ? t('freeCounter') : dhikr.title,
    categoryLabel: (category: CategoryId) => t(CATEGORY_KEYS[category]),
    flowTitle: (flow: Pick<Flow, 'id' | 'title'>) =>
      flow.title ?? (FLOW_KEYS[flow.id] ? t(FLOW_KEYS[flow.id]) : flow.id),
  };
}
