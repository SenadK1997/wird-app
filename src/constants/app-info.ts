/** Who makes the app, shown on the About page. */
export const COMPANY = 'Kenyro';
export const BUILDERS = 'Senad Kurtovic & Kenan Balija';

/** Shown on the About page and in the privacy policy. Leave empty to hide the contact line. */
export const CONTACT_EMAIL = 'senad.okt97@gmail.com';

/**
 * The numeric id App Store Connect gives the app (the digits after "id" in its store link).
 * While empty, "Rate Wird" uses the system rating prompt and sharing sends no link.
 */
export const APP_STORE_ID = '';

/** Turns on the advertising section of the privacy policy. Set to true when ads ship. */
export const ADS_ENABLED = true;

/** Public pages, served by GitHub Pages from the docs folder. Apple asks for both addresses. */
export const SUPPORT_URL = 'https://senadk1997.github.io/wird-app/';
export const PRIVACY_URL = 'https://senadk1997.github.io/wird-app/privacy.html';

/** Date of the last change to the privacy policy text. */
export const PRIVACY_UPDATED = '7 October 2026';

export const appStoreLink = APP_STORE_ID ? `https://apps.apple.com/app/id${APP_STORE_ID}` : '';
