import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { createContext, use, useEffect, useReducer, useState, type ReactNode } from 'react';

import type { AccentId, ThemeMode } from '@/constants/theme';
import { BUILT_IN_FLOWS, SUGGESTED_DHIKR, type Dhikr, type Flow, type FlowStep } from '@/data/dhikr';
import type { LanguageSetting } from '@/i18n/languages';
import { dayKey } from '@/utils/date';

const STORAGE_KEY = 'dhikr-state-v1';
const BACKUP_MARKER = 'wird-backup';

type DayTotals = Record<string, number>;
export type History = Record<string, DayTotals>;

export type Reminder = { id: string; enabled: boolean; hour: number; minute: number };

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
  themeMode: ThemeMode;
  accent: AccentId;
  language: LanguageSetting;
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
  /** Progress through a flow, or `null` when counting a single dhikr. */
  sequence: { flowId: string; index: number; count: number } | null;
};

type Action =
  | { type: 'hydrate'; state: State }
  | { type: 'increment'; day: string }
  | { type: 'undo'; day: string }
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
  | { type: 'set'; patch: Partial<Settings> };

const initialState: State = {
  custom: [],
  customFlows: [],
  favorites: [],
  selectedId: SUGGESTED_DHIKR[0].id,
  counts: {},
  history: {},
  sequence: null,
  hapticsEnabled: true,
  soundEnabled: false,
  keepAwake: true,
  display: { arabic: true, transliteration: true, translation: true, source: true },
  dailyGoalEnabled: true,
  dailyGoal: 100,
  reminders: [],
  themeMode: 'system',
  accent: 'green',
  language: 'system',
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

function reducer(state: State, action: Action): State {
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
      const id = state.selectedId;
      const count = state.counts[id] ?? 0;
      if (count === 0) return state;
      return {
        ...state,
        counts: { ...state.counts, [id]: count - 1 },
        history: addToDay(state.history, action.day, id, -1),
      };
    }
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
    case 'set':
      return { ...state, ...action.patch };
  }
}

type CustomDhikrInput = Pick<Dhikr, 'title' | 'arabic' | 'target'>;
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
  /** Count the counter is working towards: the flow step's, or the dhikr's own. */
  target: number;
  activeFlow: { flow: Flow; step: number; steps: number; done: boolean } | null;
  history: History;
  todayTotal: number;
  /** Daily goal in taps, or `null` when the goal is switched off. */
  goal: number | null;
  findDhikr: (id: string) => Dhikr | undefined;
  increment: () => void;
  undo: () => void;
  reset: () => void;
  select: (id: string) => void;
  addCustom: (input: CustomDhikrInput) => void;
  updateCustom: (id: string, input: CustomDhikrInput) => void;
  removeCustom: (id: string) => void;
  startFlow: (id: string) => void;
  exitFlow: () => void;
  /** Creates a flow, or replaces the one with the given id. */
  saveFlow: (input: FlowInput, id?: string) => void;
  removeFlow: (id: string) => void;
  toggleFavorite: (id: string) => void;
  /** Changes one or more settings. */
  set: (patch: Partial<Settings>) => void;
  /** Everything the app has saved, as text for a backup file. */
  exportData: () => string;
  /** Replaces everything with a backup. Returns `false` if the text is not a Wird backup. */
  importData: (raw: string) => boolean;
};

const StoreContext = createContext<Store | null>(null);

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

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
      .finally(() => {
        setHydrated(true);
        SplashScreen.hideAsync();
      });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  if (!hydrated) return null;

  const all = [...SUGGESTED_DHIKR, ...state.custom];
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
    reset: () => dispatch({ type: 'reset' }),
    select: (id) => dispatch({ type: 'select', id }),
    addCustom: (input) =>
      dispatch({ type: 'addCustom', dhikr: { ...input, id: newId('custom'), builtIn: false } }),
    updateCustom: (id, input) =>
      dispatch({ type: 'updateCustom', dhikr: { ...input, id, builtIn: false } }),
    removeCustom: (id) => dispatch({ type: 'removeCustom', id }),
    startFlow: (id) => dispatch({ type: 'startFlow', id }),
    exitFlow: () => dispatch({ type: 'exitFlow' }),
    saveFlow: (input, id) =>
      dispatch({ type: 'saveFlow', flow: { ...input, id: id ?? newId('flow'), builtIn: false } }),
    removeFlow: (id) => dispatch({ type: 'removeFlow', id }),
    toggleFavorite: (id) => dispatch({ type: 'toggleFavorite', id }),
    set: (patch) => dispatch({ type: 'set', patch }),
    exportData: () => JSON.stringify({ app: BACKUP_MARKER, version: 1, state }),
    importData: (raw) => {
      try {
        const parsed: unknown = JSON.parse(raw);
        const restored = isRecord(parsed) && parsed.app === BACKUP_MARKER ? normalize(parsed.state) : null;
        if (!restored) return false;
        dispatch({ type: 'hydrate', state: restored });
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

/** Consecutive days with at least one dhikr, ending today (or yesterday if today is still empty). */
export function currentStreak(history: History) {
  const day = new Date();
  if (dayTotal(history[dayKey(day)]) === 0) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (dayTotal(history[dayKey(day)]) > 0) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

/** The longest run of consecutive days with at least one dhikr. */
export function bestStreak(history: History) {
  const days = Object.keys(history)
    .filter((key) => dayTotal(history[key]) > 0)
    .sort();
  let best = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const key of days) {
    const [year, month, date] = key.split('-').map(Number);
    const current = new Date(year, month - 1, date);
    const expected = previous && new Date(previous.getFullYear(), previous.getMonth(), previous.getDate() + 1);
    run = expected && dayKey(expected) === key ? run + 1 : 1;
    best = Math.max(best, run);
    previous = current;
  }
  return best;
}
