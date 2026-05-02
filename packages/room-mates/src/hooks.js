/**
 * Lightweight event emitter for session lifecycle hooks.
 *
 * @example
 *   const hooks = createHooks();
 *   hooks.on('peerJoin', (peer) => console.log('joined:', peer));
 *   hooks.emit('peerJoin', { clientId: 1, user: { name: 'A' } });
 */

/**
 * @typedef {(...args: any[]) => void} HookHandler
 */

/**
 * @typedef {object} Hooks
 * @property {(event: string, handler: HookHandler) => void} on
 * @property {(event: string, handler: HookHandler) => void} off
 * @property {(event: string, ...args: any[]) => void} emit
 * @property {() => void} destroy
 */

/**
 * Create a new hook emitter.
 * @returns {Hooks}
 */
export function createHooks() {
  /** @type {Map<string, Set<HookHandler>>} */
  const listeners = new Map();

  return {
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
    },

    off(event, handler) {
      const set = listeners.get(event);
      if (set) {
        set.delete(handler);
        if (set.size === 0) listeners.delete(event);
      }
    },

    emit(event, ...args) {
      const set = listeners.get(event);
      if (set) {
        for (const handler of set) {
          try {
            handler(...args);
          } catch (err) {
            console.error(`[room-mates] hook "${event}" error:`, err);
          }
        }
      }
    },

    destroy() {
      listeners.clear();
    },
  };
}
