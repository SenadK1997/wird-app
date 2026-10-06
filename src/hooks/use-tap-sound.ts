import { useAudioPlayer } from 'expo-audio';

/** Returns a function that plays the tap click from its start. */
export function useTapSound() {
  const player = useAudioPlayer(require('@/assets/sounds/tap.wav'));

  return () => {
    try {
      // Rewind first so quick taps each get a click instead of one long overlapping sound.
      player.seekTo(0);
      player.play();
    } catch {
      // A missing audio device is not worth interrupting the count for.
    }
  };
}
