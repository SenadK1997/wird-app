import { ADS_ENABLED, COMPANY } from '@/constants/app-info';

type Section = { title: string; body: string };

/** The privacy policy, in English. It describes what the app does today; keep it in step with the code. */
export const PRIVACY_SECTIONS: Section[] = [
  {
    title: 'Summary',
    body: `Wird is made by ${COMPANY}. The app works without an account and we do not collect, store or sell personal information about you.`,
  },
  {
    title: 'What stays on your device',
    body: 'Your counts, history, daily goal, favourites, custom dhikr, flows and settings are saved only on your device. We cannot see them. They are removed when you delete the app.',
  },
  {
    title: 'Backups',
    body: 'A backup file is created only when you choose "Export backup", and it is saved or sent wherever you choose. We never receive a copy.',
  },
  {
    title: 'Reminders',
    body: 'Reminders are scheduled on your device by the phone itself. Turning them on does not send any information to us.',
  },
  {
    title: 'Sharing',
    body: 'When you share your progress or the app, the text or image goes only to the app you pick in the share sheet.',
  },
  ...(ADS_ENABLED
    ? [
        {
          title: 'Advertising',
          body: 'Wird shows ads provided by Google AdMob. To show and measure ads, Google may collect information such as your device\'s advertising identifier, approximate location derived from your IP address, and how you interact with ads. You can limit ad tracking in your phone\'s privacy settings. Google explains how it uses this information at policies.google.com/technologies/partner-sites.',
        },
      ]
    : []),
  {
    title: 'Children',
    body: 'Wird does not knowingly collect personal information from anyone, including children.',
  },
  {
    title: 'Changes',
    body: 'If this policy changes, the new version will appear here with a new date.',
  },
];
