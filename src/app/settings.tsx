import { useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { useConfirm } from '@/components/confirm-dialog';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  Accents,
  BottomTabInset,
  MaxContentWidth,
  Spacing,
  TopTabInset,
  type AccentId,
  type ThemeMode,
} from '@/constants/theme';
import { MAX_DAILY_GOAL, MAX_REMINDERS } from '@/data/dhikr';
import { useScheme, useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import type { UiKey } from '@/i18n/en';
import { LANGUAGES } from '@/i18n/languages';
import { useDhikrStore, type Reminder } from '@/store/dhikr-store';
import { pickBackup, saveBackup } from '@/utils/backup';
import { formatTime } from '@/utils/date';
import { remindersSupported, syncReminders } from '@/utils/reminder';

const GOAL_PRESETS = [100, 300, 500, 1000];
const MINUTE_STEP = 5;

const THEME_MODES: { mode: ThemeMode; label: UiKey }[] = [
  { mode: 'system', label: 'followPhone' },
  { mode: 'light', label: 'themeLight' },
  { mode: 'dark', label: 'themeDark' },
];

const ACCENT_LABELS: Record<AccentId, UiKey> = {
  green: 'accentGreen',
  blue: 'accentBlue',
  gold: 'accentGold',
  plum: 'accentPlum',
};

export default function SettingsScreen() {
  const theme = useTheme();
  const scheme = useScheme();
  const confirm = useConfirm();
  const { t, locale } = useI18n();
  const {
    language,
    themeMode,
    accent,
    display,
    dailyGoalEnabled,
    dailyGoal,
    reminders,
    hapticsEnabled,
    soundEnabled,
    keepAwake,
    set,
    exportData,
    importData,
  } = useDhikrStore();
  // What is being typed for the goal; `null` shows the saved goal.
  const [goalDraft, setGoalDraft] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const goalText = goalDraft ?? String(dailyGoal);
  const goalValid = /^\d+$/.test(goalText) && Number(goalText) >= 1 && Number(goalText) <= MAX_DAILY_GOAL;
  const notificationText = { title: t('notificationTitle'), body: t('notificationBody') };

  const handleGoalText = (text: string) => {
    const digits = text.replace(/\D/g, '');
    setGoalDraft(digits);
    const goal = Number(digits);
    if (digits && goal >= 1 && goal <= MAX_DAILY_GOAL) set({ dailyGoal: goal });
  };

  const handleGoalPreset = (goal: number) => {
    setGoalDraft(null);
    set({ dailyGoal: goal });
  };

  // Reminders only change in the app once the phone has accepted the new schedule.
  const applyReminders = async (next: Reminder[]) => {
    setReminderError(null);
    try {
      if (await syncReminders(next, notificationText)) set({ reminders: next });
      else setReminderError(t('errorNotifications'));
    } catch {
      setReminderError(t('errorReminder'));
    }
  };

  const updateReminder = (id: string, patch: Partial<Reminder>) =>
    applyReminders(reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const shiftReminder = (reminder: Reminder, minutes: number) => {
    const total = (reminder.hour * 60 + reminder.minute + minutes + 1440) % 1440;
    updateReminder(reminder.id, { hour: Math.floor(total / 60), minute: total % 60 });
  };

  const addReminder = () => {
    // Ids are "reminder-<n>"; the next one is one past the highest in use.
    const highest = Math.max(0, ...reminders.map((r) => Number(r.id.split('-')[1]) || 0));
    applyReminders([
      ...reminders,
      { id: `reminder-${highest + 1}`, enabled: true, hour: 20, minute: 0 },
    ]);
  };

  const handleExport = async () => {
    setBackupStatus(null);
    try {
      await saveBackup(exportData());
    } catch {
      setBackupStatus(t('backupFailed'));
    }
  };

  const restore = async (raw: string) => {
    if (!importData(raw)) {
      setBackupStatus(t('restoreInvalid'));
      return;
    }
    setGoalDraft(null);
    setBackupStatus(t('restoreDone'));
    // The backup may hold reminders this phone has not scheduled yet.
    try {
      const restored: Reminder[] = JSON.parse(raw).state.reminders ?? [];
      if (!(await syncReminders(restored, notificationText))) {
        set({ reminders: restored.map((r) => ({ ...r, enabled: false })) });
      }
    } catch {
      // Reminders can be switched on again by hand.
    }
  };

  const handleRestore = async () => {
    setBackupStatus(null);
    try {
      const raw = await pickBackup();
      if (raw === null) return;
      confirm({
        title: t('restoreTitle'),
        message: t('restoreMessage'),
        actionLabel: t('restoreAction'),
        onConfirm: () => restore(raw),
      });
    } catch {
      setBackupStatus(t('restoreInvalid'));
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle">{t('tabSettings')}</ThemedText>

          <Section title={t('language')}>
            <View style={styles.chips}>
              <Chip
                label={t('followPhone')}
                selected={language === 'system'}
                onPress={() => set({ language: 'system' })}
              />
              {LANGUAGES.map((option) => (
                <Chip
                  key={option.code}
                  label={option.name}
                  selected={language === option.code}
                  onPress={() => set({ language: option.code })}
                />
              ))}
            </View>
          </Section>

          <Section title={t('appearance')}>
            <ThemedText type="smallBold">{t('theme')}</ThemedText>
            <View style={styles.chips}>
              {THEME_MODES.map(({ mode, label }) => (
                <Chip
                  key={mode}
                  label={t(label)}
                  selected={themeMode === mode}
                  onPress={() => set({ themeMode: mode })}
                />
              ))}
            </View>
            <ThemedText type="smallBold">{t('accentColour')}</ThemedText>
            <View style={styles.chips}>
              {(Object.keys(Accents) as AccentId[]).map((id) => (
                <Pressable
                  key={id}
                  onPress={() => set({ accent: id })}
                  accessibilityRole="button"
                  accessibilityLabel={t(ACCENT_LABELS[id])}
                  accessibilityState={{ selected: accent === id }}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: Accents[id][scheme].accent },
                      accent === id && { borderColor: theme.text },
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title={t('counterDisplay')}>
            <SwitchRow
              label={t('showArabic')}
              hint={t('showArabicHint')}
              value={display.arabic}
              onValueChange={(arabic) => set({ display: { ...display, arabic } })}
            />
            <SwitchRow
              label={t('showTransliteration')}
              hint={t('showTransliterationHint')}
              value={display.transliteration}
              onValueChange={(transliteration) => set({ display: { ...display, transliteration } })}
            />
            <SwitchRow
              label={t('showTranslation')}
              hint={t('showTranslationHint')}
              value={display.translation}
              onValueChange={(translation) => set({ display: { ...display, translation } })}
            />
            <SwitchRow
              label={t('showSource')}
              hint={t('showSourceHint')}
              value={display.source}
              onValueChange={(source) => set({ display: { ...display, source } })}
            />
            <ThemedText type="small" themeColor="textSecondary">
              {t('plainHint')}
            </ThemedText>
          </Section>

          <Section title={t('dailyGoal')}>
            <SwitchRow
              label={t('dailyGoal')}
              hint={t('dailyGoalHint')}
              value={dailyGoalEnabled}
              onValueChange={(enabled) => set({ dailyGoalEnabled: enabled })}
            />
            {dailyGoalEnabled ? (
              <>
                <TextInput
                  accessibilityLabel={`${t('dailyGoal')} (${t('count')})`}
                  value={goalText}
                  onChangeText={handleGoalText}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                />
                {goalValid ? null : (
                  <ThemedText type="small" style={{ color: theme.danger }}>
                    {t('errorGoal', { max: MAX_DAILY_GOAL })}
                  </ThemedText>
                )}
                <View style={styles.chips}>
                  {GOAL_PRESETS.map((goal) => (
                    <Chip
                      key={goal}
                      label={goal.toLocaleString(locale)}
                      selected={dailyGoal === goal}
                      onPress={() => handleGoalPreset(goal)}
                    />
                  ))}
                </View>
              </>
            ) : null}
          </Section>

          <Section title={t('reminders')}>
            {remindersSupported ? (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('remindersHint')}
                </ThemedText>
                {reminders.map((reminder) => (
                  <View key={reminder.id} style={styles.reminder}>
                    <SwitchRow
                      label={t('reminderLabel', {
                        time: formatTime(reminder.hour, reminder.minute, locale),
                      })}
                      value={reminder.enabled}
                      onValueChange={(enabled) => updateReminder(reminder.id, { enabled })}
                    />
                    <View style={styles.timeRow}>
                      <StepButton
                        label={`−1 ${t('hourShort')}`}
                        onPress={() => shiftReminder(reminder, -60)}
                      />
                      <StepButton
                        label={`−${MINUTE_STEP} ${t('minuteShort')}`}
                        onPress={() => shiftReminder(reminder, -MINUTE_STEP)}
                      />
                      <StepButton
                        label={`+${MINUTE_STEP} ${t('minuteShort')}`}
                        onPress={() => shiftReminder(reminder, MINUTE_STEP)}
                      />
                      <StepButton
                        label={`+1 ${t('hourShort')}`}
                        onPress={() => shiftReminder(reminder, 60)}
                      />
                      <Pressable
                        onPress={() => applyReminders(reminders.filter((r) => r.id !== reminder.id))}
                        accessibilityRole="button"
                        hitSlop={Spacing.two}>
                        <ThemedText type="smallBold" style={{ color: theme.danger }}>
                          {t('remove')}
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ))}
                {reminderError ? (
                  <ThemedText type="small" style={{ color: theme.danger }}>
                    {reminderError}
                  </ThemedText>
                ) : null}
                {reminders.length < MAX_REMINDERS ? (
                  <Button label={t('addReminder')} onPress={addReminder} />
                ) : null}
              </>
            ) : (
              <ThemedText themeColor="textSecondary">{t('remindersWeb')}</ThemedText>
            )}
          </Section>

          <Section title={t('counterSection')}>
            <SwitchRow
              label={t('vibration')}
              hint={t('vibrationHint')}
              value={hapticsEnabled}
              onValueChange={(enabled) => set({ hapticsEnabled: enabled })}
            />
            <SwitchRow
              label={t('tapSound')}
              hint={t('tapSoundHint')}
              value={soundEnabled}
              onValueChange={(enabled) => set({ soundEnabled: enabled })}
            />
            <SwitchRow
              label={t('keepScreenOn')}
              hint={t('keepScreenOnHint')}
              value={keepAwake}
              onValueChange={(enabled) => set({ keepAwake: enabled })}
            />
          </Section>

          <Section title={t('backup')}>
            <ThemedText type="small" themeColor="textSecondary">
              {t('backupHint')}
            </ThemedText>
            <View style={styles.backupButtons}>
              <Button label={t('exportBackup')} onPress={handleExport} style={styles.backupButton} />
              <Button label={t('restoreBackup')} onPress={handleRestore} style={styles.backupButton} />
            </View>
            {backupStatus ? <ThemedText type="small">{backupStatus}</ThemedText> : null}
          </Section>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
        {title}
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.card}>
        {children}
      </ThemedView>
    </>
  );
}

type SwitchRowProps = {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function SwitchRow({ label, hint, value, onValueChange }: SwitchRowProps) {
  const theme = useTheme();
  // The web switch has its own "on" thumb colour, which would clash with the chosen accent.
  const webProps = Platform.OS === 'web' ? { activeThumbColor: theme.onAccent } : null;

  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {hint ? (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.accent }}
        {...webProps}
      />
    </View>
  );
}

function StepButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundSelected" style={styles.stepButton}>
        <ThemedText type="smallBold">{label}</ThemedText>
      </ThemedView>
    </Pressable>
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
    paddingHorizontal: Spacing.four,
    paddingTop: TopTabInset + Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    marginTop: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  switchText: {
    flex: 1,
    gap: Spacing.half,
  },
  input: {
    fontSize: 20,
    fontWeight: 700,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  reminder: {
    gap: Spacing.two,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
  },
  backupButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  backupButton: {
    flexGrow: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
