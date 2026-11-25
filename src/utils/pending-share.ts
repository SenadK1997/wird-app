/**
 * A share link that opened the app, waiting for the import dialog. Links arrive before React has
 * mounted (a cold start) or while it runs, so they are parked here and the dialog picks them up.
 */
let pending: string | null = null;
const listeners = new Set<(code: string) => void>();

export function setPendingShare(code: string) {
  pending = code;
  listeners.forEach((listener) => listener(code));
}

/** Takes the waiting code, if any, so it is shown only once. */
export function takePendingShare() {
  const code = pending;
  pending = null;
  return code;
}

export function onPendingShare(listener: (code: string) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
