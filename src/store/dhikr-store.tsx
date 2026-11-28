import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useReducer, useState, type ReactNode } from 'react';

import { Accents, THEME_PACKS, type AccentId, type ThemeMode, type ThemePackId } from '@/constants/theme';
import {
  BUILT_IN_FLOWS,
  FREE_COUNTER,
  SUGGESTED_DHIKR,
  type Dhikr,
  type Flow,
  type FlowStep,
} from '@/data/dhikr';
import type { LanguageSetting } from '@/i18n/languages';
import { dayKey } from '@/utils/date';

const STORAGE_KEY = 'dhikr-state-v1';
const BACKUP_MARKER = 'wird-backup';
/** Raised when the app's look changes, so saved settings from the older look are moved over once. */
const THEME_VERSION = 2;

type DayTotals = Record<string, number>;
export type History = Record<string, DayTotals>;

export type Reminder = { id: string; enabled: boolean; hour: number; minute: number };

/**
 * A long-term goal: a number of dhikr from a start day on, e.g. 100,000 salawat. `dhikrId` null
 * counts every dhikr. Progress is read from the history, so hand-added counts count too.
 */
export type PersonalGoal = { id: string; dhikrId: string | null; target: number; start: string };

/** Which lines of the dhikr the counter screen shows. All off leaves a plain counter. */
export type Display = {
  arabic: boolean;
  transliteration: boolean;
  translation: boolean;
  source: boolean;
};

type Settings = {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  keepAwake: boolean;
  display: Display;
  dailyGoalEnabled: boolean;
  dailyGoal: number;
  reminders: Reminder[];
  /** Rotating verse/hadith nudges a few times a day. On by default once notifications are allowed. */
  dhikrRemindersEnabled: boolean;
  /** How many dhikr nudges to send each day (1–3). */
  dhikrRemindersPerDay: number;
  /**
   * App version that last asked to allow notifications, or `null` if none has. Each new version
   * asks once, so people who skipped the question in an older version see it again after updating.
   */
  notificationsAskedVersion: string | null;
  themeMode: ThemeMode;
  accent: AccentId;
  /** A theme from THEME_PACKS in use, or `null` for the classic look (themeMode + accent). */
  themePack: ThemePackId | null;
  /** Themes unlocked with a rewarded ad. They stay unlocked for good. */
  unlockedThemes: ThemePackId[];
  language: LanguageSetting;
  /** False until the welcome screen has been completed once. */
  onboarded: boolean;
  /** Day (`YYYY-MM-DD`) the app last asked for a store rating, or `null` if it never has. */
  reviewAskedOn: string | null;
  /** When the app-open ad was last shown, in milliseconds since 1970. 0 if it never has been. */
  lastAppOpenAdAt: number;
  /** Day the "new version available" question was last shown, or `null`. */
  updateRemindedOn: string | null;
  /** Friday: a morning reminder (salawat, Surah al-Kahf) and the salawat card on the Dhikr tab. */
  jumaEnabled: boolean;
  /** How many salawat to aim for on a Friday. */
  jumaSalawatGoal: number;
  /** A notification when a month and a year are over, to look back at them in History. */
  reviewNotifications: boolean;
  /** A notification at 21:00 on a day without dhikr, while there is a streak to keep. */
  streakReminder: boolean;
};

type State = Settings & {
  custom: Dhikr[];
  customFlows: Flow[];
  favorites: string[];
  selectedId: string;
  /** Taps since the last reset, per dhikr id. */
  counts: Record<string, number>;
  /** Taps per day (`YYYY-MM-DD`), per dhikr id. */
  history: History;
  themeVersion: number;
  /** Progress through a flow, or `null` when counting a single dhikr. */
  sequence: { flowId: string; index: number; count: number } | null;
  /**
   * The last count added by hand (from a tasbih, by heart), so it can be taken back in one go.
   * Cleared by the next tap, reset or change of dhikr.
   */
  lastAdd: { id: string; day: string; amount: number; toCounter: boolean } | null;
  goals: PersonalGoal[];
  /**
   * Streak freezes saved up (at most MAX_FREEZES). One is earned for every 7 days in a row and
   * used by itself on a missed day, so one busy day does not end a long streak.
   */
  streakFreezes: number;
  /** Days (`YYYY-MM-DD`) a freeze covered. They keep a streak going but do not add to it. */
  frozenDays: string[];
  /** Day a freeze was last earned, so the 7th day earns only one. */
  freezeAwardedOn: string | null;
};

type Action =
  | { type: 'hydrate'; state: State }
  | { type: 'increment'; day: string }
  | { type: 'undo'; day: string }
  | { type: 'addCount'; id: string; day: string; amount: number; toCounter: boolean }
  | { type: 'undoAdd' }
  | { type: 'reset' }
  | { type: 'select'; id: string }
  | { type: 'addCustom'; dhikr: Dhikr }
  | { type: 'updateCustom'; dhikr: Dhikr }
  | { type: 'removeCustom'; id: string }
  | { type: 'startFlow'; id: string }
  | { type: 'exitFlow' }
  | { type: 'saveFlow'; flow: Flow }
  | { type: 'removeFlow'; id: string }
  | { type: 'toggleFavorite'; id: string }
  | { type: 'spendFreezes'; days: string[] }
  | { type: 'awardFreeze'; day: string }
  | { type: 'refundFreezes'; days: string[] }
  | { type: 'saveGoal'; goal: PersonalGoal }
  | { type: 'removeGoal'; id: string }
  | { type: 'set'; patch: Partial<Settings> };

const initialState: State = {
  custom: [],
  customFlows: [],
  favorites: [],
  selectedId: SUGGESTED_DHIKR[0].id,
  counts: {},
  history: {},
  sequence: null,
  lastAdd: null,
  goals: [],
  streakFreezes: 0,
  frozenDays: [],
  freezeAwardedOn: null,
  hapticsEnabled: true,
  soundEnabled: false,
  keepAwake: true,
  display: { arabic: true, transliteration: true, translation: true, source: true },
  dailyGoalEnabled: true,
  dailyGoal: 100,
  reminders: [],
  dhikrRemindersEnabled: true,
  dhikrRemindersPerDay: 3,
  notificationsAskedVersion: null,
  themeMode: 'dark',
  accent: 'gold',
  themePack: null,
  unlockedThemes: [],
  themeVersion: THEME_VERSION,
  language: 'system',
  onboarded: false,
  reviewAskedOn: null,
  lastAppOpenAdAt: 0,
  updateRemindedOn: null,
  jumaEnabled: true,
  jumaSalawatGoal: 100,
  reviewNotifications: true,
  streakReminder: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Fills in anything missing from data saved by an older version of the app. */
function normalize(saved: unknown): State | null {
  if (!isRecord(saved) || !isRecord(saved.counts) || !isRecord(saved.history)) return null;
  const state = { ...initialState, ...saved } as State & { reminder?: Omit<Reminder, 'id'> };

  state.display = { ...initialState.display, ...(isRecord(saved.display) ? saved.display : {}) };
  // The first version had a single reminder and only the after-prayer flow.
  if (!Array.isArray(saved.reminders)) {
    state.reminders = state.reminder ? [{ ...state.reminder, id: 'reminder-1' }] : [];
  }
  delete state.reminder;
  if (!Array.isArray(saved.goals)) state.goals = [];
  state.frozenDays = Array.isArray(saved.frozenDays)
    ? saved.frozenDays.filter((day): day is string => typeof day === 'string')
    : [];
  state.streakFreezes =
    typeof saved.streakFreezes === 'number' && Number.isFinite(saved.streakFreezes)
      ? Math.min(MAX_FREEZES, Math.max(0, Math.floor(saved.streakFreezes)))
      : 0;
  if (typeof saved.freezeAwardedOn !== 'string') state.freezeAwardedOn = null;
  // Own keys only: `in` would also accept names like "constructor" from a damaged backup.
  state.unlockedThemes = Array.isArray(saved.unlockedThemes)
    ? saved.unlockedThemes.filter(
        (id): id is ThemePackId =>
          typeof id === 'string' && Object.prototype.hasOwnProperty.call(THEME_PACKS, id)
      )
    : [];
  // A theme that is gone or was never unlocked falls back to the classic look.
  if (state.themePack && !state.unlockedThemes.includes(state.themePack)) state.themePack = null;
  // Settings saved under the earlier cream-and-green look start out in the new one.
  if (saved.themeVersion !== THEME_VERSION || !(state.accent in Accents)) {
    state.themeMode = 'dark';
    state.accent = 'gold';
    state.themeVersion = THEME_VERSION;
  }
  if (state.sequence && !state.sequence.flowId) {
    state.sequence = { ...state.sequence, flowId: 'after-prayer' };
  }
  return state;
}

function addToDay(history: History, day: string, id: string, delta: number) {
  const totals = history[day] ?? {};
  return { ...history, [day]: { ...totals, [id]: Math.max(0, (totals[id] ?? 0) + delta) } };
}

function findFlow(state: State, id: string) {
  return [...BUILT_IN_FLOWS, ...state.customFlows].find((flow) => flow.id === id);
}

/** Takes back the last hand-added count in full. */
function undoLastAdd(state: State): State {
  const add = state.lastAdd;
  if (!add) return state;
  return {
    ...state,
    counts: add.toCounter
      ? { ...state.counts, [add.id]: Math.max(0, (state.counts[add.id] ?? 0) - add.amount) }
      : state.counts,
    history: addToDay(state.history, add.day, add.id, -add.amount),
    lastAdd: null,
  };
}

function reducer(current: State, action: Action): State {
  // Anything done on the counter after a hand-added count means Undo is about taps again.
  const state =
    current.lastAdd && ['increment', 'reset', 'select', 'startFlow'].includes(action.type)
      ? { ...current, lastAdd: null }
      : current;
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'increment': {
      if (state.sequence) {
        const flow = findFlow(state, state.sequence.flowId);
        if (!flow) return { ...state, sequence: null };
        const { index, count } = state.sequence;
        const step = flow.steps[index];
        const isLast = index === flow.steps.length - 1;
        if (isLast && count >= step.target) return state;
        const stepDone = count + 1 >= step.target;
        return {
          ...state,
          // Finishing a step moves straight on to the next dhikr; the last one stays full.
          sequence:
            stepDone && !isLast
              ? { flowId: flow.id, index: index + 1, count: 0 }
              : { flowId: flow.id, index, count: count + 1 },
          history: addToDay(state.history, action.day, step.dhikrId, 1),
        };
      }
      const id = state.selectedId;
      return {
        ...state,
        counts: { ...state.counts, [id]: (state.counts[id] ?? 0) + 1 },
        history: addToDay(state.history, action.day, id, 1),
      };
    }
    case 'undo': {
      if (state.sequence) {
        const flow = findFlow(state, state.sequence.flowId);
        if (!flow) return { ...state, sequence: null };
        const { index, count } = state.sequence;
        if (count > 0) {
          return {
            ...state,
            sequence: { flowId: flow.id, index, count: count - 1 },
            history: addToDay(state.history, action.day, flow.steps[index].dhikrId, -1),
          };
        }
        if (index === 0) return state;
        // At the start of a step, undo takes back the tap that finished the previous one.
        const previous = flow.steps[index - 1];
        return {
          ...state,
          sequence: { flowId: flow.id, index: index - 1, count: previous.target - 1 },
          history: addToDay(state.history, action.day, previous.dhikrId, -1),
        };
      }
      // Right after adding by hand, Undo takes the whole added count back.
      if (state.lastAdd?.toCounter && state.lastAdd.id === state.selectedId) return undoLastAdd(state);
      const id = state.selectedId;
      const count = state.counts[id] ?? 0;
      if (count === 0) return state;
      return {
        ...state,
        counts: { ...state.counts, [id]: count - 1 },
        history: addToDay(state.history, action.day, id, -1),
      };
    }
    case 'addCount': {
      // Dhikr counted elsewhere (a tasbih, by heart), for any day and any dhikr.
      if (action.amount <= 0) return state;
      const { id, day, amount, toCounter } = action;
      return {
        ...state,
        counts: toCounter ? { ...state.counts, [id]: (state.counts[id] ?? 0) + amount } : state.counts,
        history: addToDay(state.history, day, id, amount),
        lastAdd: { id, day, amount, toCounter },
      };
    }
    case 'undoAdd':
      return undoLastAdd(state);
    case 'reset':
      if (state.sequence) return { ...state, sequence: { ...state.sequence, index: 0, count: 0 } };
      return { ...state, counts: { ...state.counts, [state.selectedId]: 0 } };
    case 'select':
      return { ...state, selectedId: action.id, sequence: null };
    case 'addCustom':
      return { ...state, custom: [...state.custom, action.dhikr] };
    case 'updateCustom':
      return {
        ...state,
        custom: state.custom.map((d) => (d.id === action.dhikr.id ? action.dhikr : d)),
      };
    case 'removeCustom': {
      const { [action.id]: _removed, ...counts } = state.counts;
      // Flows lose the deleted dhikr's steps, and a flow left with no steps goes too.
      const customFlows = state.customFlows
        .map((flow) => ({ ...flow, steps: flow.steps.filter((s) => s.dhikrId !== action.id) }))
        .filter((flow) => flow.steps.length > 0);
      const flowChanged = state.customFlows.some(
        (flow) => flow.id === state.sequence?.flowId && flow.steps.some((s) => s.dhikrId === action.id)
      );
      return {
        ...state,
        custom: state.custom.filter((d) => d.id !== action.id),
        customFlows,
        favorites: state.favorites.filter((id) => id !== action.id),
        counts,
        sequence: flowChanged ? null : state.sequence,
        selectedId: state.selectedId === action.id ? SUGGESTED_DHIKR[0].id : state.selectedId,
      };
    }
    case 'startFlow':
      return { ...state, sequence: { flowId: action.id, index: 0, count: 0 } };
    case 'exitFlow':
      return { ...state, sequence: null };
    case 'saveFlow': {
      const exists = state.customFlows.some((flow) => flow.id === action.flow.id);
      return {
        ...state,
        customFlows: exists
          ? state.customFlows.map((flow) => (flow.id === action.flow.id ? action.flow : flow))
          : [...state.customFlows, action.flow],
        // An edited flow may have different steps, so a run in progress cannot continue.
        sequence: state.sequence?.flowId === action.flow.id ? null : state.sequence,
      };
    }
    case 'removeFlow':
      return {
        ...state,
        customFlows: state.customFlows.filter((flow) => flow.id !== action.id),
        sequence: state.sequence?.flowId === action.id ? null : state.sequence,
      };
    case 'toggleFavorite':
      return {
        ...state,
        favorites: state.favorites.includes(action.id)
          ? state.favorites.filter((id) => id !== action.id)
          : [...state.favorites, action.id],
      };
    case 'spendFreezes':
      return {
        ...state,
        streakFreezes: Math.max(0, state.streakFreezes - action.days.length),
        // Kept for good: a past best streak may run across them (one per missed day, so few).
        frozenDays: [...state.frozenDays, ...action.days],
      };
    case 'refundFreezes':
      return {
        ...state,
        frozenDays: state.frozenDays.filter((day) => !action.days.includes(day)),
        streakFreezes: Math.min(MAX_FREEZES, state.streakFreezes + action.days.length),
      };
    case 'awardFreeze':
      return {
        ...state,
        streakFreezes: Math.min(MAX_FREEZES, state.streakFreezes + 1),
        freezeAwardedOn: action.day,
      };
    case 'saveGoal': {
      const exists = state.goals.some((goal) => goal.id === action.goal.id);
      return {
        ...state,
        goals: exists
          ? state.goals.map((goal) => (goal.id === action.goal.id ? action.goal : goal))
          : [...state.goals, action.goal],
      };
    }
    case 'removeGoal':
      return { ...state, goals: state.goals.filter((goal) => goal.id !== action.id) };
    case 'set':
      return { ...state, ...action.patch };
  }
}

type CustomDhikrInput = Pick<Dhikr, 'title' | 'transliteration' | 'arabic' | 'target'>;
type FlowInput = { title: string; steps: FlowStep[] };

type Store = Settings & {
  suggested: Dhikr[];
  custom: Dhikr[];
  /** Built-in flows followed by the user's own. */
  flows: Flow[];
  favorites: string[];
  /** The dhikr on the counter: the current flow step, or the one picked from the list. */
  selected: Dhikr;
  /** Id of the dhikr picked from the list, or `null` while a flow is running. */
  selectedId: string | null;
  /** Taps on the dhikr on the counter since the last reset. */
  count: number;
  /** Count the counter is working towards: the flow step's, or the dhikr's own. 0 means endless. */
  target: number;
  activeFlow: { flow: Flow; step: number; steps: number; done: boolean } | null;
  history: History;
  /** The last count added by hand, while it can still be taken back in one go. */
  lastAdd: State['lastAdd'];
  todayTotal: number;
  /** Daily goal in taps, or `null` when the goal is switched off. */
  goal: number | null;
  findDhikr: (id: string) => Dhikr | undefined;
  increment: () => void;
  undo: () => void;
  /**
   * Adds dhikr counted elsewhere (a tasbih, by heart). Defaults to today and the dhikr on the
   * counter. When it is today's count of the dhikr on the counter, the counter goes up too.
   */
  addCount: (amount: number, options?: { day?: string; dhikrId?: string }) => void;
  /** Takes back the last hand-added count in full (see `lastAdd`). */
  undoAdd: () => void;
  reset: () => void;
  select: (id: string) => void;
  /** Adds a custom dhikr and returns its id. */
  addCustom: (input: CustomDhikrInput) => string;
  updateCustom: (id: string, input: CustomDhikrInput) => void;
  removeCustom: (id: string) => void;
  startFlow: (id: string) => void;
  exitFlow: () => void;
  /** Creates a flow, or replaces the one with the given id. */
  saveFlow: (input: FlowInput, id?: string) => string;
  removeFlow: (id: string) => void;
  toggleFavorite: (id: string) => void;
  goals: PersonalGoal[];
  streakFreezes: number;
  frozenDays: string[];
  freezeAwardedOn: string | null;
  /** Covers missed days with saved freezes (see StreakKeeper). */
  spendFreezes: (days: string[]) => void;
  awardFreeze: (day: string) => void;
  /** Gives back freezes spent on days that turned out to have dhikr (added later by hand). */
  refundFreezes: (days: string[]) => void;
  /** Creates a personal goal, or replaces the one with the given id. */
  saveGoal: (input: Omit<PersonalGoal, 'id'>, id?: string) => void;
  removeGoal: (id: string) => void;
  /** Changes one or more settings. */
  set: (patch: Partial<Settings>) => void;
  /** Everything the app has saved, as text for a backup file. */
  exportData: () => string;
  /** Replaces everything with a backup. Returns `false` if the text is not a Wird backup. */
  importData: (raw: string) => boolean;
};

const StoreContext = createContext<Store | null>(null);

// The counter keeps ids apart when several are made in the same millisecond (importing a flow).
let idCounter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(idCounter++).toString(36)}`;

export function DhikrStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const saved = raw ? normalize(JSON.parse(raw)) : null;
        if (saved) dispatch({ type: 'hydrate', state: saved });
      })
      .catch(() => {
        // Unreadable saved data: start fresh rather than block the app.
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  if (!hydrated) return null;

  const all = [FREE_COUNTER, ...SUGGESTED_DHIKR, ...state.custom];
  const findDhikr = (id: string) => all.find((d) => d.id === id);
  const picked = findDhikr(state.selectedId) ?? SUGGESTED_DHIKR[0];

  const flow = state.sequence ? findFlow(state, state.sequence.flowId) : undefined;
  const step = flow && state.sequence ? flow.steps[state.sequence.index] : undefined;
  const stepDhikr = step && findDhikr(step.dhikrId);
  // A flow whose step can no longer be resolved falls back to the picked dhikr.
  const running = flow && step && stepDhikr && state.sequence ? state.sequence : null;

  const selected = running && stepDhikr ? stepDhikr : picked;
  const target = running && step ? step.target : picked.target;
  const count = running ? running.count : (state.counts[picked.id] ?? 0);

  const store: Store = {
    ...state,
    suggested: SUGGESTED_DHIKR,
    flows: [...BUILT_IN_FLOWS, ...state.customFlows],
    selected,
    selectedId: running ? null : picked.id,
    count,
    target,
    activeFlow:
      running && flow
        ? {
            flow,
            step: running.index + 1,
            steps: flow.steps.length,
            done: running.index === flow.steps.length - 1 && running.count >= target,
          }
        : null,
    todayTotal: dayTotal(state.history[dayKey()]),
    goal: state.dailyGoalEnabled ? state.dailyGoal : null,
    findDhikr,
    increment: () => dispatch({ type: 'increment', day: dayKey() }),
    undo: () => dispatch({ type: 'undo', day: dayKey() }),
    addCount: (amount, options = {}) => {
      const day = options.day ?? dayKey();
      // During a flow there is no single dhikr on the counter, so one must be named.
      const id = options.dhikrId ?? (state.sequence ? null : state.selectedId);
      if (!id) return;
      const toCounter = !state.sequence && id === state.selectedId && day === dayKey();
      dispatch({ type: 'addCount', id, day, amount, toCounter });
    },
    undoAdd: () => dispatch({ type: 'undoAdd' }),
    reset: () => dispatch({ type: 'reset' }),
    select: (id) => dispatch({ type: 'select', id }),
    addCustom: (input) => {
      const id = newId('custom');
      dispatch({ type: 'addCustom', dhikr: { ...input, id, builtIn: false } });
      return id;
    },
    updateCustom: (id, input) =>
      dispatch({ type: 'updateCustom', dhikr: { ...input, id, builtIn: false } }),
    removeCustom: (id) => dispatch({ type: 'removeCustom', id }),
    startFlow: (id) => dispatch({ type: 'startFlow', id }),
    exitFlow: () => dispatch({ type: 'exitFlow' }),
    saveFlow: (input, id) => {
      const flowId = id ?? newId('flow');
      dispatch({ type: 'saveFlow', flow: { ...input, id: flowId, builtIn: false } });
      return flowId;
    },
    removeFlow: (id) => dispatch({ type: 'removeFlow', id }),
    toggleFavorite: (id) => dispatch({ type: 'toggleFavorite', id }),
    spendFreezes: (days) => dispatch({ type: 'spendFreezes', days }),
    awardFreeze: (day) => dispatch({ type: 'awardFreeze', day }),
    refundFreezes: (days) => dispatch({ type: 'refundFreezes', days }),
    saveGoal: (input, id) => dispatch({ type: 'saveGoal', goal: { ...input, id: id ?? newId('goal') } }),
    removeGoal: (id) => dispatch({ type: 'removeGoal', id }),
    set: (patch) => dispatch({ type: 'set', patch }),
    exportData: () => JSON.stringify({ app: BACKUP_MARKER, version: 1, state }),
    importData: (raw) => {
      try {
        const parsed: unknown = JSON.parse(raw);
        const restored = isRecord(parsed) && parsed.app === BACKUP_MARKER ? normalize(parsed.state) : null;
        if (!restored) return false;
        // Someone restoring a backup has used the app before, so skip the welcome screen.
        dispatch({ type: 'hydrate', state: { ...restored, onboarded: true } });
        return true;
      } catch {
        return false;
      }
    },
  };

  return <StoreContext value={store}>{children}</StoreContext>;
}

export function useDhikrStore() {
  const store = use(StoreContext);
  if (!store) throw new Error('useDhikrStore must be used inside DhikrStoreProvider');
  return store;
}

export function dayTotal(totals: DayTotals | undefined) {
  return Object.values(totals ?? {}).reduce((sum, n) => sum + n, 0);
}

/** Most freezes that can be saved up. */
export const MAX_FREEZES = 2;

/**
 * Consecutive days with at least one dhikr, ending today (or yesterday if today is still empty).
 * A frozen day keeps the run going without adding to it.
 */
export function currentStreak(history: History, frozen: string[] = []) {
  const day = new Date();
  if (dayTotal(history[dayKey(day)]) === 0) day.setDate(day.getDate() - 1);
  let streak = 0;
  for (;;) {
    const key = dayKey(day);
    if (dayTotal(history[key]) > 0) streak++;
    else if (!frozen.includes(key)) break;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

/** The longest run of consecutive days with at least one dhikr; frozen days bridge a run. */
export function bestStreak(history: History, frozen: string[] = []) {
  const real = new Set(Object.keys(history).filter((key) => dayTotal(history[key]) > 0));
  const days = [...new Set([...real, ...frozen])].sort();
  let best = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const key of days) {
    const [year, month, date] = key.split('-').map(Number);
    const current = new Date(year, month - 1, date);
    const expected = previous && new Date(previous.getFullYear(), previous.getMonth(), previous.getDate() + 1);
    const counts = real.has(key) ? 1 : 0;
    run = expected && dayKey(expected) === key ? run + counts : counts;
    best = Math.max(best, run);
    previous = current;
  }
  return best;
}
