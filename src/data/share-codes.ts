/**
 * Short codes for built-in dhikr in share links: a dhikr's code is its position in this list,
 * written in base 36 with two characters ("00", "01", …). Links already sent depend on these
 * positions, so the list is append-only: never reorder or remove an entry, only add new built-in
 * dhikr at the end. docs/add.html has a copy of this list to show the names.
 */
export const SHARE_CODES: readonly string[] = [
  'subhanallah', 'alhamdulillah', 'allahu-akbar', 'la-ilaha-illallah',
  'astaghfirullah', 'salawat', 'subhanallahi-wa-bihamdihi', 'la-hawla',
  'ayat-al-kursi', 'al-ikhlas', 'al-falaq', 'an-nas',
  'bika-asbahna', 'bika-amsayna', 'radina-billah', 'bismillah-protection',
  'audhu-bikalimatillah', 'hasbiyallah', 'rizqan-tayyiban', 'ikfini-bihalalik',
  'rabbi-inni-faqir', 'astaghfirullah-wa-atubu', 'rabbighfir-li', 'sayyid-al-istighfar',
  'dua-yunus', 'hasbunallah', 'ya-hayyu-ya-qayyum', 'bismika-amutu',
  'bismika-rabbi', 'qini-adhabak', 'ahyana', 'leaving-home',
  'entering-home', 'entering-mosque', 'leaving-mosque', 'before-eating',
  'forgot-bismillah', 'after-eating', 'travel-dua', 'travel-birr',
  'returning-travel', 'name-ar-rahman', 'name-ar-rahim', 'name-al-malik',
  'name-al-quddus', 'name-as-salam', 'name-al-mumin', 'name-al-muhaymin',
  'name-al-aziz', 'name-al-jabbar', 'name-al-mutakabbir', 'name-al-khaliq',
  'name-al-bari', 'name-al-musawwir', 'name-al-ghaffar', 'name-al-qahhar',
  'name-al-wahhab', 'name-ar-razzaq', 'name-al-fattah', 'name-al-alim',
  'name-al-qabid', 'name-al-basit', 'name-al-khafid', 'name-ar-rafi',
  'name-al-muizz', 'name-al-mudhill', 'name-as-sami', 'name-al-basir',
  'name-al-hakam', 'name-al-adl', 'name-al-latif', 'name-al-khabir',
  'name-al-halim', 'name-al-azim', 'name-al-ghafur', 'name-ash-shakur',
  'name-al-aliyy', 'name-al-kabir', 'name-al-hafiz', 'name-al-muqit',
  'name-al-hasib', 'name-al-jalil', 'name-al-karim', 'name-ar-raqib',
  'name-al-mujib', 'name-al-wasi', 'name-al-hakim', 'name-al-wadud',
  'name-al-majid', 'name-al-baith', 'name-ash-shahid', 'name-al-haqq',
  'name-al-wakil', 'name-al-qawiyy', 'name-al-matin', 'name-al-waliyy',
  'name-al-hamid', 'name-al-muhsi', 'name-al-mubdi', 'name-al-muid',
  'name-al-muhyi', 'name-al-mumit', 'name-al-hayy', 'name-al-qayyum',
  'name-al-wajid', 'name-al-majid-2', 'name-al-wahid', 'name-al-ahad',
  'name-as-samad', 'name-al-qadir', 'name-al-muqtadir', 'name-al-muqaddim',
  'name-al-muakhkhir', 'name-al-awwal', 'name-al-akhir', 'name-az-zahir',
  'name-al-batin', 'name-al-wali', 'name-al-mutaali', 'name-al-barr',
  'name-at-tawwab', 'name-al-muntaqim', 'name-al-afuww', 'name-ar-rauf',
  'name-malik-al-mulk', 'name-dhul-jalali-wal-ikram', 'name-al-muqsit', 'name-al-jami',
  'name-al-ghaniyy', 'name-al-mughni', 'name-al-mani', 'name-ad-darr',
  'name-an-nafi', 'name-an-nur', 'name-al-hadi', 'name-al-badi',
  'name-al-baqi', 'name-al-warith', 'name-ar-rashid', 'name-as-sabur',
];

/** The two-character code of a built-in dhikr, or null if it has none. */
export function shareCode(id: string): string | null {
  const index = SHARE_CODES.indexOf(id);
  return index < 0 ? null : index.toString(36).padStart(2, '0');
}

/** The built-in dhikr id for a code, or null for an unknown code. */
export function idFromShareCode(code: string): string | null {
  const index = Number.parseInt(code, 36);
  return /^[0-9a-z]{2}$/.test(code) && index < SHARE_CODES.length ? SHARE_CODES[index] : null;
}
