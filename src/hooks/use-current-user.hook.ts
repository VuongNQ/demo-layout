import { useSyncExternalStore } from 'react';

// Fake current-user store, editable from the dev panel so the permission
// gate and menu visibility can be demoed live without a backend.
export type DemoUser = {
  name: string;
  permissions: string[];
};

const ALL_DEMO_PERMISSIONS = ['demo:view', 'demo:create', 'demo:edit'] as const;

let state: DemoUser = {
  name: 'Người dùng demo',
  permissions: [...ALL_DEMO_PERMISSIONS]
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setDemoPermissions(permissions: string[]) {
  state = { ...state, permissions };
  emit();
}

export function useCurrentUser(): DemoUser {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state
  );
}

export { ALL_DEMO_PERMISSIONS };
