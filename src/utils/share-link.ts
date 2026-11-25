import { SHARE_PAGE_URL } from '@/constants/app-info';
import { MAX_FLOW_STEPS, MAX_TARGET, type Dhikr, type Flow } from '@/data/dhikr';

/**
 * Share links for custom dhikr and flows. Everything is packed into the link itself, so no
 * server is needed: `https://…/add.html#<code>` for people (the page opens the app, or the store
 * if it is not installed) and `wird://add?d=<code>` for the app.
 *
 * The code is base64url of a small JSON object:
 *   dhikr: { v: 1, d: { t: title, tr?: transliteration, ar?: arabic, n: target } }
 *   flow:  { v: 1, f: { t: title, s: [{ b: builtInId, n, t?: name } | { c: dhikr, n }] } }
 * A built-in step's name is only for the web page; the app shows its own text for it.
 */

export type SharedDhikr = Pick<Dhikr, 'title' | 'transliteration' | 'arabic' | 'target'>;
export type SharedFlowStep =
  | { builtInId: string; target: number; name?: string }
  | { dhikr: SharedDhikr; target: number };
export type Shared =
  | { kind: 'dhikr'; dhikr: SharedDhikr }
  | { kind: 'flow'; title: string; steps: SharedFlowStep[] };

const VERSION = 1;
/** Longest text accepted from a link, so a broken or hostile link cannot flood the app. */
const MAX_TEXT = 2000;

type WireDhikr = { t: string; tr?: string; ar?: string; n: number };
type WireStep = { b: string; n: number; t?: string } | { c: WireDhikr; n: number };

const toWire = (d: SharedDhikr): WireDhikr => ({
  t: d.title,
  ...(d.transliteration ? { tr: d.transliteration } : {}),
  ...(d.arabic ? { ar: d.arabic } : {}),
  n: d.target,
});

/** Builds the payload for a custom dhikr. */
export function sharedFromDhikr(dhikr: Dhikr): Shared {
  return { kind: 'dhikr', dhikr: pick(dhikr) };
}

/** Builds the payload for a flow. Built-in steps travel by id, custom ones in full. */
export function sharedFromFlow(flow: Flow, title: string, find: (id: string) => Dhikr | undefined): Shared {
  const steps: SharedFlowStep[] = [];
  for (const step of flow.steps) {
    const dhikr = find(step.dhikrId);
    if (!dhikr) continue;
    steps.push(
      dhikr.builtIn
        ? { builtInId: dhikr.id, target: step.target, name: dhikr.title }
        : { dhikr: pick(dhikr), target: step.target }
    );
  }
  return { kind: 'flow', title, steps };
}

const pick = (d: Dhikr): SharedDhikr => ({
  title: d.title,
  transliteration: d.transliteration,
  arabic: d.arabic,
  target: d.target,
});

export function encodeShared(shared: Shared): string {
  const wire =
    shared.kind === 'dhikr'
      ? { v: VERSION, d: toWire(shared.dhikr) }
      : {
          v: VERSION,
          f: {
            t: shared.title,
            s: shared.steps.map((s): WireStep =>
              'builtInId' in s
                ? { b: s.builtInId, n: s.target, ...(s.name ? { t: s.name } : {}) }
                : { c: toWire(s.dhikr), n: s.target }
            ),
          },
        };
  return toBase64Url(utf8Encode(JSON.stringify(wire)));
}

/** The link to send to people. */
export function shareUrl(shared: Shared) {
  return `${SHARE_PAGE_URL}#${encodeShared(shared)}`;
}

/** Reads a code back. Returns `null` for anything that is not a valid Wird share. */
export function decodeShared(code: string): Shared | null {
  try {
    const raw: unknown = JSON.parse(utf8Decode(fromBase64Url(code)));
    if (!isObject(raw) || raw.v !== VERSION) return null;
    if (isObject(raw.d)) {
      const dhikr = readDhikr(raw.d);
      return dhikr ? { kind: 'dhikr', dhikr } : null;
    }
    if (isObject(raw.f) && Array.isArray(raw.f.s)) {
      const title = text(raw.f.t);
      if (!title) return null;
      const steps: SharedFlowStep[] = [];
      for (const s of raw.f.s.slice(0, MAX_FLOW_STEPS)) {
        if (!isObject(s)) return null;
        const target = count(s.n);
        if (target === null) return null;
        if (typeof s.b === 'string' && s.b.length < 100) steps.push({ builtInId: s.b, target });
        else if (isObject(s.c)) {
          const dhikr = readDhikr(s.c);
          if (!dhikr) return null;
          steps.push({ dhikr, target });
        } else return null;
      }
      return steps.length > 0 ? { kind: 'flow', title, steps } : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Finds the share code in a link that opened the app: `wird://add?d=…`, the web page's
 * `…/add.html#…`, or anything else carrying `d=`. Returns `null` when the link is not a share.
 */
export function shareCodeFromUrl(url: string): string | null {
  const query = url.match(/[?&]d=([A-Za-z0-9_-]+)/);
  if (query) return query[1];
  const hash = url.match(/add(?:\.html)?\/?#([A-Za-z0-9_-]+)/);
  return hash ? hash[1] : null;
}

function readDhikr(raw: Record<string, unknown>): SharedDhikr | null {
  const title = text(raw.t);
  const target = count(raw.n);
  if (!title || target === null) return null;
  return {
    title,
    transliteration: text(raw.tr) || undefined,
    arabic: text(raw.ar) || undefined,
    target,
  };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown) => (typeof value === 'string' ? value.trim().slice(0, MAX_TEXT) : '');

/** A target as the app allows it: a whole number from 0 (endless) to MAX_TARGET. */
function count(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_TARGET
    ? value
    : null;
}

// Plain-JS UTF-8 and base64url, so the same code runs on every phone and in the browser.

function utf8Encode(input: string): number[] {
  const bytes: number[] = [];
  for (const char of input) {
    const cp = char.codePointAt(0)!;
    if (cp < 0x80) bytes.push(cp);
    else if (cp < 0x800) bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
    else if (cp < 0x10000) bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    else
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 63),
        0x80 | ((cp >> 6) & 63),
        0x80 | (cp & 63)
      );
  }
  return bytes;
}

function utf8Decode(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i++];
    let cp: number;
    if (b < 0x80) cp = b;
    else if (b >= 0xf0) cp = ((b & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    else if (b >= 0xe0) cp = ((b & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    else cp = ((b & 31) << 6) | (bytes[i++] & 63);
    out += String.fromCodePoint(cp);
  }
  return out;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function toBase64Url(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63];
    if (i + 1 < bytes.length) out += ALPHABET[(n >> 6) & 63];
    if (i + 2 < bytes.length) out += ALPHABET[n & 63];
  }
  return out;
}

function fromBase64Url(input: string): number[] {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of input) {
    const value = ALPHABET.indexOf(char);
    if (value < 0) throw new Error('bad character');
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 255);
    }
  }
  return bytes;
}
