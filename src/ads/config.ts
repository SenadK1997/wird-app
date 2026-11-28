import { Platform } from 'react-native';

/** AdMob ad units for Wird, one AdMob app per platform. These ids are public: they ship inside the app. */
export const AD_UNITS = Platform.select({
  android: {
    appOpen: 'ca-app-pub-9103637559448321/9823485205',
    banner: 'ca-app-pub-9103637559448321/4163964411',
    // "Wird theme unlock": the rewarded ad that unlocks a theme.
    rewarded: 'ca-app-pub-9103637559448321/5631034261',
  },
  default: {
    appOpen: 'ca-app-pub-9103637559448321/8899673971',
    banner: 'ca-app-pub-9103637559448321/2473866423',
    rewarded: 'ca-app-pub-9103637559448321/4285842202',
  },
});

/** The app-open ad is shown at most once in this long, however often the app is opened. */
export const APP_OPEN_INTERVAL_MS = 4 * 60 * 60 * 1000;
