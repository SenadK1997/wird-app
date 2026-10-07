// The web build has no ads. This stand-in keeps Google's ad library out of it altogether.

export const adsSupported = false;

export async function prepareAds() {
  return false;
}

export type AppOpenHandle = {
  isLoaded: () => boolean;
  show: () => Promise<void>;
  dispose: () => void;
};

export function loadAppOpenAd(): AppOpenHandle | null {
  return null;
}

export function BannerView(_props: { onLoaded: () => void; onFailed: () => void }) {
  return null;
}

export async function privacyOptionsRequired() {
  return false;
}

export async function showPrivacyOptions() {}
