import { setPendingShare } from '@/utils/pending-share';
import { shareCodeFromUrl } from '@/utils/share-link';

/**
 * Every link that opens the app passes through here first. A shared dhikr or flow
 * (`wird://add?d=…`) is parked for the import dialog and the app opens on the Dhikr tab,
 * instead of the router looking for an "add" screen that does not exist.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const code = shareCodeFromUrl(path);
    if (code) {
      setPendingShare(code);
      return '/dhikr';
    }
  } catch {
    // A link the app cannot read just opens the app.
  }
  return path;
}
