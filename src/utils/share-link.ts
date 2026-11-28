import { SHARE_PAGE_URL } from '@/constants/app-info';
import { MAX_FLOW_STEPS, MAX_TARGET, type Dhikr, type Flow } from '@/data/dhikr';
import { idFromShareCode, shareCode } from '@/data/share-codes';

/**
 * Share links for custom dhikr and flows. Everything is packed into the link itself, so no
 * server is needed: `https://…/add.html#<code>` for people (the page opens the app, or the store
 * if it is not installed) and `wird://add?d=<code>` for the app.
 *
 * Version 2 (from 1.0.5) keeps links short: the code is "2" followed by base64url of a compact
 * text, packed so each Arabic letter takes one byte instead of two (see `pack`). The text is
 * fields joined by U+001F:
 *   dhikr: d, title, transliteration, arabic, target
 *   flow:  f, title, then per step either "b<code>:<target>" for a built-in dhikr (its two-
 *          character code from SHARE_CODES) or "c" followed by five more fields: title,
 *          transliteration, arabic, the dhikr's own target, and the step's target.
 * Version 1 (1.0.4) was base64url of JSON and is still read, so old links keep working.
 */

export type SharedDhikr = Pick<Dhikr, 'title' | 'transliteration' | 'arabic' | 'target'>;
export type SharedFlowStep = { builtInId: string; target: number } | { dhikr: SharedDhikr; target: number };
export type Shared =
  | { kind: 'dhikr'; dhikr: SharedDhikr }
  | { kind: 'flow'; title: string; steps: SharedFlowStep[] };

/** Longest text accepted from a link, so a broken or hostile link cannot flood the app. */
const MAX_TEXT = 2000;
const SEP = '\u001f';

/** Builds the payload for a custom dhikr. */
export function sharedFromDhikr(dhikr: Dhikr): Shared {
  return { kind: 'dhikr', dhikr: pick(dhikr) };
}

/** Builds the payload for a flow. Built-in steps travel as a short code, custom ones in full. */
export function sharedFromFlow(flow: Flow, title: string, find: (id: string) => Dhikr | undefined): Shared {
  const steps: SharedFlowStep[] = [];
  for (const step of flow.steps) {
    const dhikr = find(step.dhikrId);
    if (!dhikr) continue;
    steps.push(
      dhikr.builtIn && shareCode(dhikr.id)
        ? { builtInId: dhikr.id, target: step.target }
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

// Separators are not allowed inside a field.
const clean = (text: string | undefined) => (text ?? '').split(SEP).join(' ');
const dhikrFields = (d: SharedDhikr) => [clean(d.title), clean(d.transliteration), clean(d.arabic), String(d.target)];

export function encodeShared(shared: Shared): string {
  const fields =
    shared.kind === 'dhikr'
      ? ['d', ...dhikrFields(shared.dhikr)]
      : [
          'f',
          clean(shared.title),
          ...shared.steps.flatMap((s) =>
            'builtInId' in s
              ? [`b${shareCode(s.builtInId)}:${s.target}`]
              : ['c', ...dhikrFields(s.dhikr), String(s.target)]
          ),
        ];
  return `2${toBase64Url(pack(fields.join(SEP)))}`;
}

/** The link to send to people. */
export function shareUrl(shared: Shared) {
  return `${SHARE_PAGE_URL}#${encodeShared(shared)}`;
}

/** Reads a code back. Returns `null` for anything that is not a valid Wird share. */
export function decodeShared(code: string): Shared | null {
  try {
    if (code.startsWith('2')) return decodeV2(unpack(fromBase64Url(code.slice(1))));
    return decodeV1(utf8Decode(fromBase64Url(code)));
  } catch {
    return null;
  }
}

function decodeV2(text: string): Shared | null {
  const f = text.split(SEP);
  const dhikrAt = (i: number) =>
    readDhikr({ t: f[i], tr: f[i + 1], ar: f[i + 2], n: whole(f[i + 3]) });
  if (f[0] === 'd') {
    const dhikr = dhikrAt(1);
    return dhikr ? { kind: 'dhikr', dhikr } : null;
  }
  if (f[0] !== 'f') return null;
  const title = text2(f[1]);
  if (!title) return null;
  const steps: SharedFlowStep[] = [];
  for (let i = 2; i < f.length && steps.length < MAX_FLOW_STEPS; ) {
    if (f[i].startsWith('b')) {
      const [code, n] = f[i].slice(1).split(':');
      const target = count(whole(n));
      if (target === null) return null;
      // A dhikr added in a newer version is unknown here: that step is left out, not the link.
      const id = idFromShareCode(code);
      if (id) steps.push({ builtInId: id, target });
      i += 1;
    } else if (f[i] === 'c') {
      const dhikr = dhikrAt(i + 1);
      const target = count(whole(f[i + 5]));
      if (!dhikr || target === null) return null;
      steps.push({ dhikr, target });
      i += 6;
    } else return null;
  }
  return steps.length > 0 ? { kind: 'flow', title, steps } : null;
}

/** Links from 1.0.4: JSON with "v": 1. */
function decodeV1(json: string): Shared | null {
  const raw: unknown = JSON.parse(json);
  if (!isObject(raw) || raw.v !== 1) return null;
  if (isObject(raw.d)) {
    const dhikr = readDhikr(raw.d);
    return dhikr ? { kind: 'dhikr', dhikr } : null;
  }
  if (isObject(raw.f) && Array.isArray(raw.f.s)) {
    const title = text2(raw.f.t);
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
  const title = text2(raw.t);
  const target = count(raw.n);
  if (!title || target === null) return null;
  return {
    title,
    transliteration: text2(raw.tr) || undefined,
    arabic: text2(raw.ar) || undefined,
    target,
  };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text2 = (value: unknown) => (typeof value === 'string' ? value.trim().slice(0, MAX_TEXT) : '');

/** A field that must be a number: digits only, so an empty field is not read as 0. */
const whole = (field: string | undefined) => (field !== undefined && /^[0-9]+$/.test(field) ? Number(field) : NaN);

/** A target as the app allows it: a whole number from 0 (endless) to MAX_TARGET. */
function count(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_TARGET
    ? value
    : null;
}

// Packing: ASCII stays one byte (0x00–0x7F), the Arabic block U+0600–U+067E becomes one byte
// (0x80–0xFE), and anything else (č, ž, ۝, emoji…) is 0xFF followed by its UTF-8 bytes. Arabic
// text with its vowel marks is almost all in that block, so it takes half the space of UTF-8.
// docs/add.html decodes the same way.

const ARABIC = 0x0600;

function pack(text: string): number[] {
  const bytes: number[] = [];
  for (const char of text) {
    const cp = char.codePointAt(0)!;
    if (cp < 0x80) bytes.push(cp);
    else if (cp >= ARABIC && cp <= ARABIC + 0x7e) bytes.push(0x80 + (cp - ARABIC));
    else bytes.push(0xff, ...utf8Encode(char));
  }
  return bytes;
}

function unpack(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i++];
    if (b < 0x80) out += String.fromCharCode(b);
    else if (b < 0xff) out += String.fromCharCode(ARABIC + (b - 0x80));
    else {
      // One UTF-8 character follows; its first byte says how long it is.
      const lead = bytes[i];
      const size = lead >= 0xf0 ? 4 : lead >= 0xe0 ? 3 : 2;
      out += utf8Decode(bytes.slice(i, i + size));
      i += size;
    }
  }
  return out;
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
