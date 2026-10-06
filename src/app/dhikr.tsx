import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdSlot } from '@/components/ad-slot';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { useConfirm } from '@/components/confirm-dialog';
import { DhikrForm, type DhikrFormValues } from '@/components/dhikr-form';
import { FlowForm, type FlowFormValues } from '@/components/flow-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { CATEGORY_IDS, type CategoryId, type Dhikr, type Flow } from '@/data/dhikr';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { useDhikrStore } from '@/store/dhikr-store';

type Tab = CategoryId | 'favourites' | 'custom';

/** Arabic longer than this goes on its own line instead of beside the name. */
const LONG_ARABIC = 30;
/** A whole verse is too long for a list row, so the list shows only its opening. */
const ARABIC_PREVIEW_LINES = 3;

export default function DhikrScreen() {
  const theme = useTheme();
  const confirm = useConfirm();
  const { t, categoryLabel, flowTitle } = useI18n();
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
    if (!current) return 'essentials';
    return current.category ?? 'custom';
  });
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

  const all = [...suggested, ...custom];
  const list =
    tab === 'custom'
      ? custom
      : tab === 'favourites'
        ? all.filter((d) => favorites.includes(d.id))
        : suggested.filter((d) => d.category === tab);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle" style={styles.padded}>
            {t('tabDhikr')}
          </ThemedText>

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
                    { backgroundColor: theme.accent, borderColor: active ? theme.text : theme.accent },
                  ]}>
                  <Pressable
                    onPress={() => handleStartFlow(flow)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.flowCardMain, pressed && styles.pressed]}>
                    <ThemedText type="smallBold" style={{ color: theme.onAccent }} numberOfLines={2}>
                      {flowTitle(flow)}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.onAccent }}>
                      {t('stepsCount', { n: flow.steps.length })}
                    </ThemedText>
                  </Pressable>
                  {flow.builtIn ? null : (
                    <View style={styles.rowActions}>
                      <Pressable
                        onPress={() => openFlowForm(flow)}
                        accessibilityRole="button"
                        hitSlop={Spacing.two}>
                        <ThemedText type="smallBold" style={[styles.link, { color: theme.onAccent }]}>
                          {t('edit')}
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteFlow(flow)}
                        accessibilityRole="button"
                        hitSlop={Spacing.two}>
                        <ThemedText type="smallBold" style={[styles.link, { color: theme.onAccent }]}>
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
              <ThemedView
                type="backgroundElement"
                style={[styles.flowCard, styles.newFlowCard, { borderColor: theme.backgroundSelected }]}>
                <ThemedText type="smallBold" style={{ color: theme.accent }}>
                  + {t('newFlow')}
                </ThemedText>
              </ThemedView>
            </Pressable>
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}>
            <Chip
              label={`★ ${t('favourites')}`}
              selected={tab === 'favourites'}
              onPress={() => setTab('favourites')}
            />
            {CATEGORY_IDS.map((category) => (
              <Chip
                key={category}
                label={categoryLabel(category)}
                selected={tab === category}
                onPress={() => setTab(category)}
              />
            ))}
            <Chip label={t('myDhikr')} selected={tab === 'custom'} onPress={() => setTab('custom')} />
          </ScrollView>

          <View style={[styles.padded, styles.list]}>
            {tab === 'custom' && custom.length === 0 ? (
              <ThemedText themeColor="textSecondary">{t('noCustom')}</ThemedText>
            ) : null}
            {tab === 'favourites' && list.length === 0 ? (
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

            {tab === 'custom' ? (
              <Button label={t('addCustom')} onPress={() => openDhikrForm()} />
            ) : null}

            <AdSlot />
          </View>
        </ScrollView>
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
  const { t, meaning } = useI18n();
  const stacked = (dhikr.arabic?.length ?? 0) > LONG_ARABIC;
  const translation = meaning(dhikr.id);

  return (
    <ThemedView
      type={selected ? 'backgroundSelected' : 'backgroundElement'}
      style={[styles.row, selected && { borderColor: theme.accent }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={({ pressed }) => [stacked ? styles.rowStacked : styles.rowMain, pressed && styles.pressed]}>
        {stacked ? (
          <ThemedText style={styles.rowArabicStacked} numberOfLines={ARABIC_PREVIEW_LINES}>
            {dhikr.arabic}
          </ThemedText>
        ) : null}
        <View style={styles.rowText}>
          <ThemedText type="smallBold">{dhikr.title}</ThemedText>
          {translation ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={ARABIC_PREVIEW_LINES}>
              {translation}
            </ThemedText>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary">
            {t('target', { n: dhikr.target })}
            {dhikr.source ? ` · ${dhikr.source}` : ''}
          </ThemedText>
        </View>
        {dhikr.arabic && !stacked ? (
          <ThemedText style={styles.rowArabic} numberOfLines={2}>
            {dhikr.arabic}
          </ThemedText>
        ) : null}
      </Pressable>

      <View style={styles.rowActions}>
        <Pressable
          onPress={onToggleFavourite}
          accessibilityRole="button"
          accessibilityLabel={t(favourite ? 'removeFavourite' : 'addFavourite')}
          accessibilityState={{ selected: favourite }}
          hitSlop={Spacing.two}>
          <ThemedText style={[styles.star, { color: favourite ? theme.accent : theme.textSecondary }]}>
            {favourite ? '★' : '☆'}
          </ThemedText>
        </Pressable>
        {onEdit && onDelete ? (
          <>
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
          </>
        ) : null}
      </View>
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
    width: 168,
    minHeight: 88,
    borderRadius: Spacing.three,
    borderWidth: 2,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  flowCardMain: {
    flexGrow: 1,
    gap: Spacing.half,
  },
  newFlowCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    textDecorationLine: 'underline',
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    borderRadius: Spacing.three,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowStacked: {
    gap: Spacing.two,
  },
  rowText: {
    flexShrink: 1,
    flexGrow: 1,
    gap: Spacing.half,
  },
  rowArabic: {
    fontSize: 22,
    lineHeight: 38,
    textAlign: 'right',
    writingDirection: 'rtl',
    flexShrink: 1,
    maxWidth: '50%',
  },
  rowArabicStacked: {
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
