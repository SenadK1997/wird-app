import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { AD_UNITS } from './config';

type AdsModule = typeof import('react-native-google-mobile-ads');
type TrackingModule = typeof import('expo-tracking-transparency');

// Expo Go does not contain Google's ad SDK, and loading the library there crashes the app. So it
// is only loaded in a real build; in Expo Go the app simply runs without ads.
const ads: AdsModule | null =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('react-native-google-mobile-ads');
// Loaded the same way, so nothing ad-related is touched in Expo Go.
const tracking: TrackingModule | null = ads
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('expo-tracking-transparency')
  : null;

export const adsSupported = ads !== null;

// Google's sample ads are used in development, and in builds made with the "test-ads" profile
// in eas.json. Tapping real ads while testing can get an AdMob account banned.
const useTestAds = __DEV__ || process.env.EXPO_PUBLIC_TEST_ADS === '1';

const unitId = (unit: keyof typeof AD_UNITS) => {
  if (!ads) return '';
  if (useTestAds) return unit === 'appOpen' ? ads.TestIds.APP_OPEN : ads.TestIds.ADAPTIVE_BANNER;
  return AD_UNITS[unit];
};

/**
 * Everything that has to happen before the first ad is requested: the consent form where the law
 * requires one, Apple's tracking prompt, then starting the SDK. Returns whether ads may be shown.
 */
export async function prepareAds() {
  if (!ads) return false;
  const { AdsConsent, MaxAdContentRating } = ads;

  try {
    await AdsConsent.gatherConsent();
  } catch {
    // Offline, or no consent message set up in AdMob: carry on with whatever is already known.
  }
  const { canRequestAds } = await AdsConsent.getConsentInfo();
  if (!canRequestAds) return false;

  if (Platform.OS === 'ios' && tracking) {
    try {
      // Apple's prompt is only asked for where consent rules allow it, as Google's SDK guide says.
      const gdprApplies = await AdsConsent.getGdprApplies();
      const storageConsent = gdprApplies && (await AdsConsent.getPurposeConsents()).startsWith('1');
      const { status } = await tracking.getTrackingPermissionsAsync();
      if (status === 'undetermined' && (!gdprApplies || storageConsent)) {
        await tracking.requestTrackingPermissionsAsync();
      }
    } catch {
      // The answer only decides whether ads are personalised, so a failure here is not fatal.
    }
  }

  // Ads suitable for general audiences only.
  await ads.default().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.G });
  await ads.default().initialize();
  return true;
}

export type AppOpenHandle = {
  isLoaded: () => boolean;
  /** Shows the ad full screen. Rejects if it cannot be shown. */
  show: () => Promise<void>;
  dispose: () => void;
};

/** Starts loading an app-open ad. The caller decides whether and when to show it. */
export function loadAppOpenAd(): AppOpenHandle | null {
  if (!ads) return null;
  const { AppOpenAd, AdEventType } = ads;

  const ad = AppOpenAd.createForAdRequest(unitId('appOpen'));
  let loaded = false;
  const offLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
    loaded = true;
  });
  const offError = ad.addAdEventListener(AdEventType.ERROR, () => {
    loaded = false;
  });
  ad.load();

  return {
    isLoaded: () => loaded,
    show: async () => {
      await ad.show();
    },
    dispose: () => {
      offLoaded();
      offError();
    },
  };
}

/** A banner as wide as the screen. Calls `onFailed` when there is no ad to show. */
export function BannerView({ onLoaded, onFailed }: { onLoaded: () => void; onFailed: () => void }) {
  if (!ads) return null;
  const { BannerAd, BannerAdSize } = ads;

  return (
    <BannerAd
      unitId={unitId('banner')}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      onAdLoaded={onLoaded}
      onAdFailedToLoad={onFailed}
    />
  );
}

/** Whether the user must be offered a way to change their ad consent (true under GDPR). */
export async function privacyOptionsRequired() {
  if (!ads) return false;
  try {
    const info = await ads.AdsConsent.getConsentInfo();
    return (
      info.privacyOptionsRequirementStatus === ads.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
    );
  } catch {
    return false;
  }
}

export async function showPrivacyOptions() {
  if (!ads) return;
  await ads.AdsConsent.showPrivacyOptionsForm();
}
