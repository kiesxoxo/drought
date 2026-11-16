import { writable } from 'svelte/store';
import { uuid } from '~helpers/uuidHelper';

const ALERT_DURATION = 5000;

function createAlertStore() {
  const { subscribe, update } = writable([]);

  const remove = (id) =>
    update((state) => state.filter((alert) => alert.id !== id));

  return {
    subscribe,
    remove,
    // action: { label, onclick } adds a button; persistent alerts stay until
    // dismissed
    add: (message, type = 'positive', { action, persistent = false } = {}) =>
      update((state) => {
        const id = uuid();
        if (!persistent) {
          setTimeout(() => {
            remove(id);
          }, ALERT_DURATION);
        }
        return [...state, { id, message, type, action }];
      }),
  };
}
export const alerts = createAlertStore();
