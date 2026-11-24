// The app is portrait only, so Android assumes it needs a device with a portrait screen and Play
// hides it from devices that report none (some TVs, Chromebooks, Android XR). Declaring the feature
// as not required keeps the app portrait while letting Play offer it on every device.
const { withAndroidManifest } = require('expo/config-plugins');

const FEATURE = 'android.hardware.screen.portrait';

module.exports = function withOptionalPortrait(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const features = (manifest['uses-feature'] ??= []);
    const existing = features.find((feature) => feature.$['android:name'] === FEATURE);
    if (existing) {
      existing.$['android:required'] = 'false';
    } else {
      features.push({ $: { 'android:name': FEATURE, 'android:required': 'false' } });
    }
    return config;
  });
};
