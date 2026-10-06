import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const FILE_NAME = 'wird-backup.json';

/** Writes the backup to a file and opens the share sheet so the user can save or send it. */
export async function saveBackup(json: string) {
  const file = new File(Paths.cache, FILE_NAME);
  file.create({ overwrite: true });
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
}

/** Lets the user pick a backup file. Returns its text, or `null` if they cancelled. */
export async function pickBackup() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  return new File(result.assets[0].uri).text();
}
