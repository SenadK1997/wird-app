import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdBanner } from '@/components/ad-banner';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { useConfirm } from '@/components/confirm-dialog';
import { DhikrForm, type DhikrFormValues } from '@/components/dhikr-form';
import { FlowForm, type FlowFormValues } from '@/components/flow-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppFonts, BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { CATEGORY_IDS, FREE_COUNTER, type CategoryId, type Dhikr, type Flow } from '@/data/dhikr';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { useDhikrStore } from '@/store/dhikr-store';

type Tab = CategoryId | 'favourites' | 'custom';

/** Arabic longer than this goes on its own line instead of beside the name. */
const LONG_ARABIC = 30;
/** A whole verse is too long for a list row, so the list shows only its opening. */
const ARABIC_PREVIEW_LINES = 3;

// Text symbols rather than an icon set, like the stars. U+FE0E keeps ☀ and ✎ from turning into emoji.
const FLOW_SYMBOLS: Record<string, string> = {
  'after-prayer': '۞',
  morning: '☀︎',
  evening: '☾',
};
const CUSTOM_FLOW_SYMBOL = '↻';

/**
 * Text folded for searching: lower case, without accents or Arabic vowel marks, and with the
 * different alif forms made one, so "subhan", "Subḥān" and "سبحان" all match.
 */
function fold(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[ٱأإآ]/g, 'ا')
    .toLowerCase();
}

export default function DhikrScreen() {
  const theme = useTheme();
  const confirm = useConfirm();
  const { t, categoryLabel, flowTitle, formatNumber, meaning } = useI18n();
  const {
    suggested,
    custom,
    flows,
    favorites,
    selectedId,
    activeFlow,
    findDhikr,
    select,
    startFlow,
    saveFlow,
    removeFlow,
    toggleFavorite,
    addCustom,
    updateCustom,
    removeCustom,
  } = useDhikrStore();
  const [tab, setTab] = useState<Tab>(() => {
    const current = selectedId ? findDhikr(selectedId) : undefined;
    if (!current || current.id === FREE_COUNTER.id) return 'essentials';
    return current.category ?? 'custom';
  });
  const [query, setQuery] = useState('');
  const [dhikrFormVisible, setDhikrFormVisible] = useState(false);
  const [editingDhikr, setEditingDhikr] = useState<Dhikr | undefined>(undefined);
  const [flowFormVisible, setFlowFormVisible] = useState(false);
  const [editingFlow, setEditingFlow] = useState<Flow | undefined>(undefined);

  const openDhikrForm = (dhikr?: Dhikr) => {
    setEditingDhikr(dhikr);
    setDhikrFormVisible(true);
  };

  const openFlowForm = (flow?: Flow) => {
    setEditingFlow(flow);
    setFlowFormVisible(true);
  };

  const handleSelect = (dhikr: Dhikr) => {
    select(dhikr.id);
    router.navigate('/');
  };

  const handleStartFlow = (flow: Flow) => {
    startFlow(flow.id);
    router.navigate('/');
  };

  const handleSubmitDhikr = (values: DhikrFormValues) => {
    if (editingDhikr) updateCustom(editingDhikr.id, values);
    else addCustom(values);
    setDhikrFormVisible(false);
  };

  const handleSubmitFlow = (values: FlowFormValues) => {
    saveFlow(values, editingFlow?.id);
    setFlowFormVisible(false);
  };

  const handleDeleteDhikr = (dhikr: Dhikr) => {
    confirm({
      title: t('deleteDhikrTitle'),
      message: t('deleteDhikrMessage', { title: dhikr.title }),
      actionLabel: t('delete'),
      onConfirm: () => removeCustom(dhikr.id),
    });
  };

  const handleDeleteFlow = (flow: Flow) => {
    confirm({
      title: t('deleteFlowTitle'),
      message: t('deleteFlowMessage', { title: flowTitle(flow) }),
      actionLabel: t('delete'),
      onConfirm: () => removeFlow(flow.id),
    });
  };

  const openTab = (next: Tab) => {
    setQuery('');
    setTab(next);
  };

  const all = [...suggested, ...custom];
  const favouriteList = all.filter((d) => favorites.includes(d.id));
  const search = fold(query.trim());
  const searching = search.length > 0;

  const list = searching
    ? all.filter((d) =>
        [d.title, d.transliteration, d.arabic, meaning(d.id)].some(
          (field) => field && fold(field).includes(search)
        )
      )
    : tab === 'custom'
      ? custom
      : tab === 'favourites'
        ? favouriteList
        : suggested.filter((d) => d.category === tab);

  const listTitle =
    tab === 'custom' ? t('myDhikr') : tab === 'favourites' ? t('favourites') : categoryLabel(tab);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle" style={styles.padded}>
            {t('tabDhikr')}
          </ThemedText>

          <View style={styles.padded}>
            <View
              style={[
                styles.search,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <ThemedText themeColor="textSecondary" style={styles.searchIcon}>
                ⌕
              </ThemedText>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('searchDhikr')}
                placeholderTextColor={theme.textSecondary}
                autoCorrect={false}
                returnKeyType="search"
                style={[styles.searchInput, { color: theme.text }]}
              />
              {searching ? (
                <Pressable
                  onPress={() => setQuery('')}
                  accessibilityRole="button"
                  accessibilityLabel={t('clearSearch')}
                  hitSlop={Spacing.two}>
                  <ThemedText themeColor="textSecondary" style={styles.searchIcon}>
                    ✕
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>

          {searching ? null : (
            <>
              <View style={[styles.padded, styles.tiles]}>
                <Tile
                  symbol="∞"
                  label={t('freeCounter')}
                  selected={selectedId === FREE_COUNTER.id}
                  onPress={() => handleSelect(FREE_COUNTER)}
                />
                <Tile
                  symbol="★"
                  label={t('favourites')}
                  count={favouriteList.length}
                  selected={tab === 'favourites'}
                  onPress={() => openTab('favourites')}
                />
                <Tile
                  symbol={'✎︎'}
                  label={t('myDhikr')}
                  count={custom.length}
                  selected={tab === 'custom'}
                  onPress={() => openTab('custom')}
                />
              </View>

              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                {t('flows')}
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}>
                {flows.map((flow) => {
                  const active = activeFlow?.flow.id === flow.id;
                  return (
                    <View
                      key={flow.id}
                      style={[
                        styles.flowCard,
                        {
                          backgroundColor: theme.backgroundElement,
                          borderColor: active ? theme.accent : theme.border,
                        },
                      ]}>
                      <Pressable
                        onPress={() => handleStartFlow(flow)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        style={({ pressed }) => [styles.flowCardMain, pressed && styles.pressed]}>
                        <ThemedText style={[styles.flowSymbol, { color: theme.accent }]}>
                          {FLOW_SYMBOLS[flow.id] ?? CUSTOM_FLOW_SYMBOL}
                        </ThemedText>
                        <ThemedText type="smallBold" numberOfLines={2}>
                          {flowTitle(flow)}
                        </ThemedText>
                        {active && activeFlow ? (
                          <ThemedText type="small" style={{ color: theme.accent }}>
                            ▶ {formatNumber(activeFlow.step)} / {formatNumber(activeFlow.steps)}
                          </ThemedText>
                        ) : (
                          <ThemedText type="small" themeColor="textSecondary">
                            {t('stepsCount', { n: flow.steps.length })}
                          </ThemedText>
                        )}
                      </Pressable>
                      {flow.builtIn ? null : (
                        <View style={styles.rowActions}>
                          <Pressable
                            onPress={() => openFlowForm(flow)}
                            accessibilityRole="button"
                            hitSlop={Spacing.two}>
                            <ThemedText type="smallBold" style={{ color: theme.accent }}>
                              {t('edit')}
                            </ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteFlow(flow)}
                            accessibilityRole="button"
                            hitSlop={Spacing.two}>
                            <ThemedText type="smallBold" style={{ color: theme.danger }}>
                              {t('delete')}
                            </ThemedText>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}
                <Pressable
                  onPress={() => openFlowForm()}
                  accessibilityRole="button"
                  style={({ pressed }) => pressed && styles.pressed}>
                  <View style={[styles.flowCard, styles.newFlowCard, { borderColor: theme.border }]}>
                    <ThemedText type="smallBold" style={{ color: theme.accent }}>
                      + {t('newFlow')}
                    </ThemedText>
                  </View>
                </Pressable>
              </ScrollView>

              {/* Every category is visible at once, wrapping onto a few lines. */}
              <View style={[styles.padded, styles.chips]}>
                {CATEGORY_IDS.map((category) => (
                  <Chip
                    key={category}
                    label={categoryLabel(category)}
                    selected={tab === category}
                    onPress={() => openTab(category)}
                  />
                ))}
              </View>
            </>
          )}

          <View style={[styles.padded, styles.list]}>
            {searching ? null : (
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.listLabel}>
                {listTitle} · {formatNumber(list.length)}
              </ThemedText>
            )}
            {searching && list.length === 0 ? (
              <ThemedText themeColor="textSecondary">{t('noResults')}</ThemedText>
            ) : null}
            {!searching && tab === 'custom' && custom.length === 0 ? (
              <ThemedText themeColor="textSecondary">{t('noCustom')}</ThemedText>
            ) : null}
            {!searching && tab === 'favourites' && list.length === 0 ? (
              <ThemedText themeColor="textSecondary">{t('noFavourites')}</ThemedText>
            ) : null}
            {list.map((dhikr) => (
              <DhikrRow
                key={dhikr.id}
                dhikr={dhikr}
                selected={dhikr.id === selectedId}
                favourite={favorites.includes(dhikr.id)}
                onPress={() => handleSelect(dhikr)}
                onToggleFavourite={() => toggleFavorite(dhikr.id)}
                onEdit={dhikr.builtIn ? undefined : () => openDhikrForm(dhikr)}
                onDelete={dhikr.builtIn ? undefined : () => handleDeleteDhikr(dhikr)}
              />
            ))}

            {!searching && tab === 'custom' ? (
              <Button label={t('addCustom')} onPress={() => openDhikrForm()} />
            ) : null}
          </View>
        </ScrollView>
        <AdBanner />
      </SafeAreaView>

      <DhikrForm
        visible={dhikrFormVisible}
        editing={editingDhikr}
        onSubmit={handleSubmitDhikr}
        onClose={() => setDhikrFormVisible(false)}
      />
      <FlowForm
        visible={flowFormVisible}
        editing={editingFlow}
        onSubmit={handleSubmitFlow}
        onClose={() => setFlowFormVisible(false)}
      />
    </ThemedView>
  );
}

type TileProps = {
  symbol: string;
  label: string;
  count?: number;
  selected: boolean;
  onPress: () => void;
};

/** One of the three shortcuts at the top: free counter, favourites, your own dhikr. */
function Tile({ symbol, label, count, selected, onPress }: TileProps) {
  const theme = useTheme();
  const { formatNumber } = useI18n();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.tilePress, pressed && styles.pressed]}>
      <ThemedView
        type="backgroundElement"
        style={[styles.tile, { borderColor: selected ? theme.accent : 'transparent' }]}>
        <ThemedText style={[styles.tileSymbol, { color: theme.accent }]}>{symbol}</ThemedText>
        <ThemedText type="small" style={styles.tileLabel} numberOfLines={2}>
          {label}
          {count !== undefined ? ` · ${formatNumber(count)}` : ''}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

type DhikrRowProps = {
  dhikr: Dhikr;
  selected: boolean;
  favourite: boolean;
  onPress: () => void;
  onToggleFavourite: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

function DhikrRow({
  dhikr,
  selected,
  favourite,
  onPress,
  onToggleFavourite,
  onEdit,
  onDelete,
}: DhikrRowProps) {
  const theme = useTheme();
  const { t, meaning, formatNumber } = useI18n();
  const stacked = (dhikr.arabic?.length ?? 0) > LONG_ARABIC;
  // Custom dhikr have no translation, so their own text is previewed in its place.
  const subtitle = meaning(dhikr.id) ?? (dhikr.builtIn ? undefined : dhikr.transliteration);

  const star = (
    <Pressable
      onPress={onToggleFavourite}
      accessibilityRole="button"
      accessibilityLabel={t(favourite ? 'removeFavourite' : 'addFavourite')}
      accessibilityState={{ selected: favourite }}
      hitSlop={Spacing.three}>
      <ThemedText style={[styles.star, { color: favourite ? theme.accent : theme.textSecondary }]}>
        {favourite ? '★' : '☆'}
      </ThemedText>
    </Pressable>
  );

  return (
    <ThemedView
      type={selected ? 'backgroundSelected' : 'backgroundElement'}
      style={[styles.row, selected && { borderColor: theme.accent }]}>
      <View style={styles.rowTop}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          style={({ pressed }) => [
            stacked ? styles.rowStacked : styles.rowMain,
            pressed && styles.pressed,
          ]}>
          {stacked ? (
            <ThemedText style={styles.rowArabicStacked} numberOfLines={ARABIC_PREVIEW_LINES}>
              {dhikr.arabic}
            </ThemedText>
          ) : null}
          <View style={styles.rowText}>
            <View style={styles.titleLine}>
              <ThemedText type="smallBold" style={styles.title}>
                {dhikr.title}
              </ThemedText>
              {selected ? (
                <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                  <ThemedText type="small" style={[styles.badgeText, { color: theme.onAccent }]}>
                    {t('counting')}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            {subtitle ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={ARABIC_PREVIEW_LINES}>
                {subtitle}
              </ThemedText>
            ) : null}
            <ThemedText type="small" themeColor="textSecondary">
              {formatNumber(dhikr.target)}×{dhikr.source ? ` · ${dhikr.source}` : ''}
            </ThemedText>
          </View>
          {dhikr.arabic && !stacked ? (
            <ThemedText style={styles.rowArabic} numberOfLines={2}>
              {dhikr.arabic}
            </ThemedText>
          ) : null}
        </Pressable>
        {star}
      </View>

      {onEdit && onDelete ? (
        <View style={styles.rowActions}>
          <Pressable onPress={onEdit} accessibilityRole="button" hitSlop={Spacing.two}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              {t('edit')}
            </ThemedText>
          </Pressable>
          <Pressable onPress={onDelete} accessibilityRole="button" hitSlop={Spacing.two}>
            <ThemedText type="smallBold" style={{ color: theme.danger }}>
              {t('delete')}
            </ThemedText>
          </Pressable>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    paddingTop: TopTabInset + Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  padded: {
    paddingHorizontal: Spacing.four,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 44,
  },
  searchIcon: {
    fontSize: 18,
    lineHeight: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tilePress: {
    flex: 1,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    borderRadius: Spacing.three,
    borderWidth: 2,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  tileSymbol: {
    fontSize: 20,
    lineHeight: 26,
  },
  tileLabel: {
    textAlign: 'center',
  },
  sectionLabel: {
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.four,
    marginBottom: -Spacing.two,
  },
  carousel: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  flowCard: {
    width: 150,
    minHeight: 96,
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  flowCardMain: {
    flexGrow: 1,
    gap: Spacing.half,
  },
  flowSymbol: {
    fontSize: 18,
    lineHeight: 24,
  },
  newFlowCard: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  listLabel: {
    textTransform: 'uppercase',
  },
  row: {
    borderRadius: Spacing.three,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowStacked: {
    flex: 1,
    gap: Spacing.two,
  },
  rowText: {
    flexShrink: 1,
    flexGrow: 1,
    gap: Spacing.half,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  title: {
    flexShrink: 1,
  },
  badge: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 18,
  },
  rowArabic: {
    fontFamily: AppFonts.arabic,
    fontSize: 22,
    lineHeight: 38,
    textAlign: 'right',
    writingDirection: 'rtl',
    flexShrink: 0,
    maxWidth: '58%',
  },
  rowArabicStacked: {
    fontFamily: AppFonts.arabic,
    fontSize: 22,
    lineHeight: 40,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  star: {
    fontSize: 22,
    lineHeight: 26,
  },
  pressed: {
    opacity: 0.7,
  },
});
