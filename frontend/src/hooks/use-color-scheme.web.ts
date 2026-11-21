import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

function subscribe(onChange: () => void) {
  return Appearance.addChangeListener(onChange).remove;
}

export function useColorScheme() {
  return useSyncExternalStore(subscribe, Appearance.getColorScheme, () => 'light' as const);
}
