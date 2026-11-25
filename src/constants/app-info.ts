import { Platform } from 'react-native';

/** Who makes the app, shown on the About page. */
export const COMPANY = 'Kenyro';
export const BUILDERS = 'Senad Kurtovic & Kenan Balija';

/** Shown on the About page and in the privacy policy. Leave empty to hide the contact line. */
export const CONTACT_EMAIL = 'senad.okt97@gmail.com';

/** The numeric id App Store Connect gives the app (the digits after "id" in its store link). */
export const APP_STORE_ID = '6819874614';

/** Turns on the advertising section of the privacy policy. Set to true when ads ship. */
export const ADS_ENABLED = true;

/** Public pages, served by GitHub Pages from the docs folder. Apple asks for both addresses. */
export const SUPPORT_URL = 'https://senadk1997.github.io/wird-app/';
export const PRIVACY_URL = 'https://senadk1997.github.io/wird-app/privacy.html';
/** Page a shared dhikr or flow link opens. It shows the dhikr and opens it in the app. */
export const SHARE_PAGE_URL = 'https://senadk1997.github.io/wird-app/add.html';
/**
 * The newest version in the stores, per platform. Edited by hand after each release goes live,
 * so the app can tell people on an older version that an update is waiting.
 */
export const VERSION_URL = 'https://senadk1997.github.io/wird-app/version.json';

/** Date of the last change to the privacy policy text. */
export const PRIVACY_UPDATED = '7 October 2026';

export const appStoreLink = `https://apps.apple.com/app/id${APP_STORE_ID}`;
export const playStoreLink = 'https://play.google.com/store/apps/details?id=com.kenyro.wird';
/** The store page for the phone the app is running on. */
export const storeLink = Platform.OS === 'android' ? playStoreLink : appStoreLink;
