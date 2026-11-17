import { FREE_COUNTER_ID, type CategoryId, type Dhikr, type Flow } from '@/data/dhikr';
import { NAME_MEANINGS } from '@/data/names';
import { useDhikrStore } from '@/store/dhikr-store';

import { ar } from './ar';
import { bn } from './bn';
import { bs } from './bs';
import { de } from './de';
import { en, type Translations, type UiKey } from './en';
import { fr } from './fr';
import { id } from './id';
import { LANGUAGES, resolveLanguage, type LanguageCode } from './languages';
import { ms } from './ms';
import { ru } from './ru';
import { tr } from './tr';
import { ur } from './ur';

const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en,
  bs,
  tr,
  id,
  ms,
  fr,
  de,
  ru,
  bn,
  ar,
  ur,
};

const CATEGORY_KEYS: Record<CategoryId, UiKey> = {
  essentials: 'catEssentials',
  adhkar: 'catAdhkar',
  names: 'catNames',
  sleep: 'catSleep',
  home: 'catHome',
  mosque: 'catMosque',
  food: 'catFood',
  travel: 'catTravel',
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
    meaning: (dhikrId: string): string | undefined =>
      strings.dhikr[dhikrId] ?? NAME_MEANINGS[dhikrId]?.[code],
    /** Name of a dhikr as shown in lists. Only the free counter's name is translated. */
    dhikrTitle: (dhikr: Pick<Dhikr, 'id' | 'title'>) =>
      dhikr.id === FREE_COUNTER_ID ? t('freeCounter') : dhikr.title,
    categoryLabel: (category: CategoryId) => t(CATEGORY_KEYS[category]),
    flowTitle: (flow: Pick<Flow, 'id' | 'title'>) =>
      flow.title ?? (FLOW_KEYS[flow.id] ? t(FLOW_KEYS[flow.id]) : flow.id),
  };
}
