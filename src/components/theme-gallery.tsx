import { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAdsReady } from '@/ads/ads-provider';
import { adsSupported, showRewardedAd } from '@/ads/sdk';
import { Button } from '@/components/button';
import { ThemePattern } from '@/components/theme-pattern';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  Accents,
  AppFonts,
  Colors,
  Spacing,
  THEME_PACK_IDS,
  THEME_PACKS,
  type Palette,
  type ThemePackId,
} from '@/constants/theme';
import { SUGGESTED_DHIKR } from '@/data/dhikr';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import type { UiKey } from '@/i18n/en';
import { useDhikrStore } from '@/store/dhikr-store';

/** The preview shows the app's own, verified Subhanallah, never retyped Arabic. */
const PREVIEW_ARABIC = SUGGESTED_DHIKR.find((d) => d.id === 'subhanallah')?.arabic ?? '';

const NAMES: Record<ThemePackId, UiKey> = {
  kiswa: 'themeKiswa',
  madinah: 'themeMadinah',
  midnight: 'themeMidnight',
  fanous: 'themeFanous',
  sand: 'themeSand',
  marble: 'themeMarble',
  andalus: 'themeAndalus',
};

const BLURBS: Record<ThemePackId, UiKey> = {
  kiswa: 'themeKiswaHint',
  madinah: 'themeMadinahHint',
  midnight: 'themeMidnightHint',
  fanous: 'themeFanousHint',
  sand: 'themeSandHint',
  marble: 'themeMarbleHint',
  andalus: 'themeAndalusHint',
};

/**
 * The themes in Settings: the free classic look, and themes unlocked once with a short rewarded
 * ad. A locked theme opens a full preview first, so nobody watches an ad for a look they have
 * not seen.
 */
export function ThemeGallery() {
  const theme = useTheme();
  const { t } = useI18n();
  const { themePack, unlockedThemes, accent, set } = useDhikrStore();
  const [previewing, setPreviewing] = useState<ThemePackId | null>(null);

  // The classic look as it opens by default: dark teal, in the chosen accent.
  const classic: Palette = { ...Colors.dark, ...Accents[accent].dark };

  const pick = (id: ThemePackId) => {
    if (unlockedThemes.includes(id)) set({ themePack: id });
    else setPreviewing(id);
  };

  return (
    <View style={styles.grid}>
      <Tile
        label={t('themeClassic')}
        palette={classic}
        selected={themePack === null}
        onPress={() => set({ themePack: null })}
        borderColor={theme.accent}
      />
      {THEME_PACK_IDS.map((id) => (
        <Tile
          key={id}
          pack={id}
          label={t(NAMES[id])}
          palette={THEME_PACKS[id].colors}
          selected={themePack === id}
          locked={!unlockedThemes.includes(id)}
          lockLabel={t('oneAd')}
          onPress={() => pick(id)}
          borderColor={theme.accent}
        />
      ))}
      <UnlockDialog pack={previewing} onClose={() => setPreviewing(null)} />
    </View>
  );
}

type TileProps = {
  label: string;
  palette: Palette;
  pack?: ThemePackId;
  selected: boolean;
  locked?: boolean;
  lockLabel?: string;
  borderColor: string;
  onPress: () => void;
};

/** A small picture of the theme: its background, pattern, and a ring in its accent. */
function Tile({ label, palette, pack, selected, locked, lockLabel, borderColor, onPress }: TileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={locked ? `${label}, ${lockLabel}` : label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.tilePress, pressed && styles.pressed]}>
      <View
        style={[
          styles.tile,
          { backgroundColor: palette.background, borderColor: selected ? borderColor : palette.border },
          selected && styles.tileSelected,
        ]}>
        {pack ? <ThemePattern pack={pack} /> : null}
        <View style={[styles.miniRing, { borderColor: palette.backgroundSelected }]}>
          <View style={[styles.miniArc, { borderTopColor: palette.accent, borderRightColor: palette.accent }]} />
        </View>
        {locked ? (
          <View style={[styles.badge, { backgroundColor: palette.accent }]}>
            <Text style={[styles.badgeText, { color: palette.onAccent }]}>▶ {lockLabel}</Text>
          </View>
        ) : selected ? (
          <View style={[styles.badge, { backgroundColor: palette.accent }]}>
            <Text style={[styles.badgeText, { color: palette.onAccent }]}>✓</Text>
          </View>
        ) : null}
      </View>
      <ThemedText type="small" style={styles.tileLabel} numberOfLines={2}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

type Status = 'idle' | 'loading' | 'closed' | 'unavailable';

/** A full preview of a locked theme, and the button that unlocks it with one rewarded ad. */
function UnlockDialog({ pack, onClose }: { pack: ThemePackId | null; onClose: () => void }) {
  const { t, formatNumber } = useI18n();
  const { unlockedThemes, set } = useDhikrStore();
  const adsReady = useAdsReady();
  const [status, setStatus] = useState<Status>('idle');
  // Set at once on the first tap, so a quick second tap cannot start a second ad.
  const busy = useRef(false);

  const close = () => {
    if (status === 'loading') return;
    setStatus('idle');
    onClose();
  };

  const unlock = async () => {
    if (!pack || busy.current) return;
    // Phones need the ad SDK running (consent settled); the web preview has no ads at all.
    if (adsSupported && !adsReady) return setStatus('unavailable');
    busy.current = true;
    setStatus('loading');
    const result = await showRewardedAd();
    busy.current = false;
    if (result === 'earned') {
      set({ unlockedThemes: [...new Set([...unlockedThemes, pack])], themePack: pack });
      setStatus('idle');
      onClose();
    } else setStatus(result);
  };

  const palette = pack ? THEME_PACKS[pack].colors : null;

  return (
    <Modal visible={pack !== null} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={t('cancel')}>
        <Pressable onPress={() => {}}>
          {pack && palette ? (
            <ThemedView style={styles.dialog}>
              {/* A small counter screen, drawn in the theme's own colours. */}
              <View style={[styles.preview, { backgroundColor: palette.background, borderColor: palette.border }]}>
                <ThemePattern pack={pack} />
                <Text style={[styles.previewArabic, { color: palette.text }]}>{PREVIEW_ARABIC}</Text>
                <View style={[styles.previewRing, { borderColor: palette.backgroundSelected }]}>
                  <View
                    style={[
                      styles.previewArc,
                      { borderTopColor: palette.accent, borderRightColor: palette.accent, borderBottomColor: palette.accent },
                    ]}
                  />
                  <Text style={[styles.previewCount, { color: palette.accent }]}>{formatNumber(21)}</Text>
                  <Text style={[styles.previewOf, { color: palette.textSecondary }]}>{t('ofTarget', { n: 33 })}</Text>
                </View>
                <View style={styles.previewButtons}>
                  <View style={[styles.previewButton, { backgroundColor: palette.backgroundElement }]}>
                    <Text style={[styles.previewButtonText, { color: palette.text }]}>{t('undo')}</Text>
                  </View>
                  <View style={[styles.previewButton, { backgroundColor: palette.accent }]}>
                    <Text style={[styles.previewButtonText, { color: palette.onAccent }]}>+ {t('add')}</Text>
                  </View>
                </View>
              </View>

              <ThemedText type="smallBold" style={styles.title}>
                {t(NAMES[pack])}
              </ThemedText>
              <ThemedText themeColor="textSecondary">{t(BLURBS[pack])}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('unlockHint')}
              </ThemedText>
              {status === 'closed' || status === 'unavailable' ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {t(status === 'closed' ? 'adNotFinished' : 'adUnavailable')}
                </ThemedText>
              ) : null}

              <View style={styles.buttons}>
                <Button label={t('cancel')} onPress={close} style={styles.flex} disabled={status === 'loading'} />
                {status === 'loading' ? (
                  <View style={[styles.flex, styles.loading]}>
                    <ActivityIndicator />
                  </View>
                ) : (
                  <Button label={`▶ ${t('unlockTheme')}`} onPress={unlock} variant="primary" style={styles.flex} />
                )}
              </View>
            </ThemedView>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const TILE = 92;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  tilePress: {
    width: TILE,
    alignItems: 'center',
    gap: Spacing.one,
  },
  tile: {
    width: TILE,
    height: TILE * 1.3,
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileSelected: {
    borderWidth: 2.5,
  },
  tileLabel: {
    textAlign: 'center',
  },
  miniRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 5,
  },
  miniArc: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 23,
    borderWidth: 5,
    borderColor: 'transparent',
  },
  badge: {
    position: 'absolute',
    bottom: Spacing.one,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: AppFonts.bold,
    fontSize: 11,
  },
  pressed: {
    opacity: 0.7,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    minWidth: 280,
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  preview: {
    height: 300,
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  previewArabic: {
    fontFamily: AppFonts.arabic,
    fontSize: 32,
    lineHeight: 54,
    writingDirection: 'rtl',
  },
  previewRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewArc: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 65,
    borderWidth: 8,
    borderColor: 'transparent',
  },
  previewCount: {
    fontFamily: AppFonts.bold,
    fontSize: 38,
    lineHeight: 44,
  },
  previewOf: {
    fontFamily: AppFonts.regular,
    fontSize: 12,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 'auto',
  },
  previewButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  previewButtonText: {
    fontFamily: AppFonts.bold,
    fontSize: 12,
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
