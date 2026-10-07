/** AdMob ad units for Wird (iOS). These ids are public: they ship inside the app. */
export const AD_UNITS = {
  appOpen: 'ca-app-pub-9103637559448321/8899673971',
  banner: 'ca-app-pub-9103637559448321/2473866423',
} as const;

/** The app-open ad is shown at most once in this long, however often the app is opened. */
export const APP_OPEN_INTERVAL_MS = 4 * 60 * 60 * 1000;
