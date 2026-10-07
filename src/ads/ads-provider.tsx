import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';

import { useDhikrStore } from '@/store/dhikr-store';

import { APP_OPEN_INTERVAL_MS } from './config';
import { adsSupported, loadAppOpenAd, prepareAds, type AppOpenHandle } from './sdk';

/** Whether consent is settled and the ad SDK is running, so banners may load. */
const AdsReadyContext = createContext(false);

type AdsProviderProps = {
  /** True once the launch sequence has finished and the app itself is on screen. */
  launched: boolean;
  children: ReactNode;
};

/**
 * Runs the app's advertising: one app-open ad right after the launch sequence, at most once every
 * few hours and never on someone's first visit, and after that only banners.
 */
export function AdsProvider({ launched, children }: AdsProviderProps) {
  const { onboarded, lastAppOpenAdAt, set } = useDhikrStore();
  const [ready, setReady] = useState(false);
  // As they were when the app started: a first-time visitor gets no app-open ad this session.
  const [returning] = useState(onboarded);
  const [lastShownAtStart] = useState(lastAppOpenAdAt);
  const appOpen = useRef<AppOpenHandle | null>(null);
  const launchedRef = useRef(launched);

  useEffect(() => {
    launchedRef.current = launched;
  }, [launched]);

  // Consent and SDK start-up. New users reach this after the welcome screen, so the prompts
  // come once they have seen the app, not before.
  useEffect(() => {
    if (!adsSupported || !onboarded) return;
    let cancelled = false;
    prepareAds()
      .then((allowed) => {
        if (cancelled || !allowed) return;
        setReady(true);
        const due = Date.now() - lastShownAtStart > APP_OPEN_INTERVAL_MS;
        // Only worth loading while the launch sequence is still playing: the ad is never
        // shown late, on top of someone already using the app.
        if (returning && due && !launchedRef.current) appOpen.current = loadAppOpenAd();
      })
      .catch(() => {
        // No ads this session.
      });
    return () => {
      cancelled = true;
    };
  }, [onboarded, returning, lastShownAtStart]);

  // The moment the launch sequence ends: show the app-open ad if it is ready, otherwise drop it.
  useEffect(() => {
    if (!launched) return;
    const ad = appOpen.current;
    appOpen.current = null;
    if (!ad) return;
    if (ad.isLoaded()) {
      ad.show()
        .then(() => set({ lastAppOpenAdAt: Date.now() }))
        .catch(() => {});
    }
    ad.dispose();
  }, [launched, set]);

  return <AdsReadyContext value={ready}>{children}</AdsReadyContext>;
}

export function useAdsReady() {
  return use(AdsReadyContext);
}
