import { Platform } from 'react-native';

/**
 * Value for `useNativeDriver`: phones run these animations off the JavaScript thread, while the
 * web build has no native driver and warns if asked for one.
 */
export const NATIVE_DRIVER = Platform.OS !== 'web';
