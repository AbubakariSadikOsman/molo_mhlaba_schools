import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaUpdater() {
  useRegisterSW({ immediate: true });
  return null;
}
