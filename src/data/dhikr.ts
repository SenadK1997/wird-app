export type Dhikr = {
  id: string;
  /** Name shown in lists: the transliteration, shortened for long duas. */
  title: string;
  /** Full transliteration, where `title` is a shortened one. */
  transliteration?: string;
  arabic?: string;
  target: number;
  builtIn: boolean;
  /** Collection a built-in dhikr belongs to. Custom dhikr have none. */
  category?: CategoryId;
  /** Where the wording comes from, e.g. a hadith number or a Quran verse. */
  source?: string;
};

export const CATEGORY_IDS = [
  'essentials',
  'adhkar',
  'protection',
  'rizq',
  'forgiveness',
  'hardship',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type FlowStep = { dhikrId: string; target: number };

/** Several dhikr counted one after another, moving on automatically. */
export type Flow = {
  id: string;
  /** Name typed by the user. Built-in flows are named through the translations instead. */
  title?: string;
  steps: FlowStep[];
  builtIn: boolean;
};

const builtIn = (dhikr: Omit<Dhikr, 'builtIn'>): Dhikr => ({ ...dhikr, builtIn: true });

// Meanings live in src/i18n, keyed by id, so they follow the app language.
export const SUGGESTED_DHIKR: Dhikr[] = [
  builtIn({
    id: 'subhanallah',
    title: 'SubhanAllah',
    arabic: 'سُبْحَانَ اللهِ',
    target: 33,
    category: 'essentials',
    source: 'Muslim 596',
  }),
  builtIn({
    id: 'alhamdulillah',
    title: 'Alhamdulillah',
    arabic: 'الْحَمْدُ لِلّٰهِ',
    target: 33,
    category: 'essentials',
    source: 'Muslim 596',
  }),
  builtIn({
    id: 'allahu-akbar',
    title: 'Allahu Akbar',
    arabic: 'اللهُ أَكْبَرُ',
    target: 34,
    category: 'essentials',
    source: 'Muslim 596',
  }),
  builtIn({
    id: 'la-ilaha-illallah',
    title: 'La ilaha illallah',
    arabic: 'لَا إِلٰهَ إِلَّا اللهُ',
    target: 100,
    category: 'essentials',
    source: 'Tirmidhi 3383',
  }),
  builtIn({
    id: 'astaghfirullah',
    title: 'Astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللهَ',
    target: 100,
    category: 'essentials',
    source: 'Muslim 2702',
  }),
  builtIn({
    id: 'salawat',
    title: "Allahumma salli 'ala Muhammad",
    arabic: 'اللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ',
    target: 100,
    category: 'essentials',
    source: 'Muslim 408',
  }),
  builtIn({
    id: 'subhanallahi-wa-bihamdihi',
    title: 'SubhanAllahi wa bihamdihi',
    arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ',
    target: 100,
    category: 'essentials',
    source: 'Muslim 2692',
  }),
  builtIn({
    id: 'la-hawla',
    title: 'La hawla wa la quwwata illa billah',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',
    target: 100,
    category: 'essentials',
    source: 'Bukhari 6384',
  }),

  builtIn({
    id: 'ayat-al-kursi',
    title: 'Ayat al-Kursi',
    transliteration:
      "Allahu la ilaha illa Huwal-Hayyul-Qayyum, la ta'khudhuhu sinatun wa la nawm, lahu ma fis-samawati wa ma fil-ard, man dhal-ladhi yashfa'u 'indahu illa bi-idhnih, ya'lamu ma bayna aydihim wa ma khalfahum, wa la yuhituna bi shay'in min 'ilmihi illa bima sha', wasi'a kursiyyuhus-samawati wal-ard, wa la ya'uduhu hifzuhuma, wa Huwal-'Aliyyul-'Azim",
    arabic:
      'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    target: 1,
    category: 'adhkar',
    source: 'Quran 2:255',
  }),
  builtIn({
    id: 'al-ikhlas',
    title: 'Surah Al-Ikhlas',
    transliteration:
      'Qul Huwallahu Ahad. Allahus-Samad. Lam yalid wa lam yulad. Wa lam yakun lahu kufuwan ahad.',
    arabic:
      'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
    target: 3,
    category: 'adhkar',
    source: 'Quran 112 · Abu Dawud 5082',
  }),
  builtIn({
    id: 'al-falaq',
    title: 'Surah Al-Falaq',
    transliteration:
      "Qul a'udhu bi Rabbil-falaq. Min sharri ma khalaq. Wa min sharri ghasiqin idha waqab. Wa min sharrin-naffathati fil-'uqad. Wa min sharri hasidin idha hasad.",
    arabic:
      'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
    target: 3,
    category: 'adhkar',
    source: 'Quran 113 · Abu Dawud 5082',
  }),
  builtIn({
    id: 'an-nas',
    title: 'Surah An-Nas',
    transliteration:
      "Qul a'udhu bi Rabbin-nas. Malikin-nas. Ilahin-nas. Min sharril-waswasil-khannas. Alladhi yuwaswisu fi sudurin-nas. Minal-jinnati wan-nas.",
    arabic:
      'قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ',
    target: 3,
    category: 'adhkar',
    source: 'Quran 114 · Abu Dawud 5082',
  }),
  builtIn({
    id: 'bika-asbahna',
    title: 'Allahumma bika asbahna',
    transliteration:
      'Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu, wa ilaykal-masir',
    arabic:
      'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ',
    target: 1,
    category: 'adhkar',
    source: 'Tirmidhi 3391',
  }),
  builtIn({
    id: 'bika-amsayna',
    title: 'Allahumma bika amsayna',
    transliteration:
      'Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namutu, wa ilaykan-nushur',
    arabic:
      'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
    target: 1,
    category: 'adhkar',
    source: 'Tirmidhi 3391',
  }),
  builtIn({
    id: 'radina-billah',
    title: 'Radina billahi Rabba',
    transliteration: 'Radina billahi Rabban, wa bil-Islami dinan, wa bi Muhammadin rasula',
    arabic: 'رَضِينَا بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ رَسُولًا',
    target: 3,
    category: 'adhkar',
    source: 'Abu Dawud 5072',
  }),

  builtIn({
    id: 'bismillah-protection',
    title: 'Bismillahil-ladhi la yadurru',
    transliteration:
      "Bismillahil-ladhi la yadurru ma'a ismihi shay'un fil-ardi wa la fis-sama'i, wa Huwas-Sami'ul-'Alim",
    arabic:
      'بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    target: 3,
    category: 'protection',
    source: 'Abu Dawud 5088',
  }),
  builtIn({
    id: 'audhu-bikalimatillah',
    title: "A'udhu bi kalimatillahit-tammat",
    transliteration: "A'udhu bi kalimatillahit-tammati min sharri ma khalaq",
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    target: 3,
    category: 'protection',
    source: 'Muslim 2708',
  }),
  builtIn({
    id: 'hasbiyallah',
    title: 'Hasbiyallahu la ilaha illa Huwa',
    transliteration:
      "Hasbiyallahu la ilaha illa Huwa, 'alayhi tawakkaltu, wa Huwa Rabbul-'Arshil-'Azim",
    arabic:
      'حَسْبِيَ اللهُ لَا إِلٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    target: 7,
    category: 'protection',
    source: 'Abu Dawud 5081',
  }),

  builtIn({
    id: 'rizqan-tayyiban',
    title: "Allahumma inni as'aluka 'ilman nafi'an",
    transliteration:
      "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan",
    arabic: 'اللّٰهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا',
    target: 3,
    category: 'rizq',
    source: 'Ibn Majah 925',
  }),
  builtIn({
    id: 'ikfini-bihalalik',
    title: "Allahummak-fini bi halalika 'an haramik",
    transliteration:
      "Allahummak-fini bi halalika 'an haramik, wa aghnini bi fadlika 'amman siwak",
    arabic: 'اللّٰهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
    target: 3,
    category: 'rizq',
    source: 'Tirmidhi 3563',
  }),
  builtIn({
    id: 'rabbi-inni-faqir',
    title: 'Rabbi inni lima anzalta ilayya min khayrin faqir',
    arabic: 'رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ',
    target: 3,
    category: 'rizq',
    source: 'Quran 28:24',
  }),

  builtIn({
    id: 'astaghfirullah-wa-atubu',
    title: 'Astaghfirullaha wa atubu ilayh',
    arabic: 'أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ',
    target: 100,
    category: 'forgiveness',
    source: 'Bukhari 6307',
  }),
  builtIn({
    id: 'rabbighfir-li',
    title: "Rabbighfir li wa tub 'alayya",
    transliteration: "Rabbighfir li wa tub 'alayya, innaka Antat-Tawwabur-Rahim",
    arabic: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
    target: 100,
    category: 'forgiveness',
    source: 'Abu Dawud 1516',
  }),
  builtIn({
    id: 'sayyid-al-istighfar',
    title: 'Sayyid al-Istighfar',
    transliteration:
      "Allahumma Anta Rabbi, la ilaha illa Anta, khalaqtani wa ana 'abduk, wa ana 'ala 'ahdika wa wa'dika mas-tata't, a'udhu bika min sharri ma sana't, abu'u laka bi ni'matika 'alayya, wa abu'u laka bi dhanbi, faghfir li, fa innahu la yaghfirudh-dhunuba illa Ant",
    arabic:
      'اللَّهُمَّ أَنْتَ رَبِّي، لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    target: 1,
    category: 'forgiveness',
    source: 'Bukhari 6306',
  }),

  builtIn({
    id: 'dua-yunus',
    title: 'La ilaha illa Anta, subhanaka',
    transliteration: 'La ilaha illa Anta, subhanaka, inni kuntu minaz-zalimin',
    arabic: 'لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    target: 33,
    category: 'hardship',
    source: 'Quran 21:87',
  }),
  builtIn({
    id: 'hasbunallah',
    title: "Hasbunallahu wa ni'mal wakil",
    arabic: 'حَسْبُنَا اللهُ وَنِعْمَ الْوَكِيلُ',
    target: 33,
    category: 'hardship',
    source: 'Quran 3:173',
  }),
  builtIn({
    id: 'ya-hayyu-ya-qayyum',
    title: 'Ya Hayyu ya Qayyum, bi rahmatika astaghith',
    arabic: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
    target: 33,
    category: 'hardship',
    source: 'Tirmidhi 3524',
  }),
];

export const FREE_COUNTER_ID = 'free';

/**
 * A plain counter: no text and no target, it just counts up. A target of 0 means "endless".
 * Its name comes from the translations.
 */
export const FREE_COUNTER: Dhikr = { id: FREE_COUNTER_ID, title: 'Free counter', target: 0, builtIn: true };

export const BUILT_IN_FLOWS: Flow[] = [
  {
    id: 'after-prayer',
    builtIn: true,
    steps: [
      { dhikrId: 'subhanallah', target: 33 },
      { dhikrId: 'alhamdulillah', target: 33 },
      { dhikrId: 'allahu-akbar', target: 34 },
    ],
  },
  {
    id: 'morning',
    builtIn: true,
    steps: [
      { dhikrId: 'ayat-al-kursi', target: 1 },
      { dhikrId: 'al-ikhlas', target: 3 },
      { dhikrId: 'al-falaq', target: 3 },
      { dhikrId: 'an-nas', target: 3 },
      { dhikrId: 'sayyid-al-istighfar', target: 1 },
      { dhikrId: 'bika-asbahna', target: 1 },
      { dhikrId: 'radina-billah', target: 3 },
      { dhikrId: 'bismillah-protection', target: 3 },
      { dhikrId: 'hasbiyallah', target: 7 },
      { dhikrId: 'subhanallahi-wa-bihamdihi', target: 100 },
    ],
  },
  {
    id: 'evening',
    builtIn: true,
    steps: [
      { dhikrId: 'ayat-al-kursi', target: 1 },
      { dhikrId: 'al-ikhlas', target: 3 },
      { dhikrId: 'al-falaq', target: 3 },
      { dhikrId: 'an-nas', target: 3 },
      { dhikrId: 'sayyid-al-istighfar', target: 1 },
      { dhikrId: 'bika-amsayna', target: 1 },
      { dhikrId: 'radina-billah', target: 3 },
      { dhikrId: 'bismillah-protection', target: 3 },
      { dhikrId: 'audhu-bikalimatillah', target: 3 },
      { dhikrId: 'hasbiyallah', target: 7 },
      { dhikrId: 'subhanallahi-wa-bihamdihi', target: 100 },
    ],
  },
];

export const MAX_TARGET = 100000;
export const MAX_DAILY_GOAL = 100000;
export const MAX_FLOW_STEPS = 20;
export const MAX_REMINDERS = 5;
