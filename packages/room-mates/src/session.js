/**
 * Session factory for room-mates.
 *
 * Manages a Y.js document, a y-webrtc provider, an Awareness instance,
 * and plugin lifecycle.
 *
 * @module room-mates/session
 */

import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { createHooks } from './hooks.js';

/**
 * @typedef {object} PluginContext
 * @property {import('yjs').Awareness} awareness
 * @property {import('./hooks.js').Hooks} hooks
 */

/**
 * @typedef {(ctx: PluginContext) => (() => void)} Plugin
 */

/**
 * @typedef {object} SessionOptions
 * @property {string} room                               - Room name for WebRTC signaling
 * @property {{ color?: string, [key: string]: any }} [user] - Local user metadata
 * @property {Plugin[]} [plugins]                        - Plugin initializers
 */

/**
 * @typedef {object} Session
 * @property {() => void} start   - Connect to the room and initialise plugins
 * @property {() => void} destroy - Tear down plugins, disconnect, and clean up
 */

/**
 * Create a realtime session.
 *
 * @param {SessionOptions} options
 * @returns {Session}
 *
 * @example
 *   const session = createSession({
 *     room: 'my-room',
 *     user: { color: '#f87171' },
 *     plugins: [cursorsPlugin({ maxVisible: 8 })],
 *   });
 *   session.start();
 *   window.addEventListener('beforeunload', () => session.destroy());
 */
export function createSession({ room, user = {}, plugins = [] }) {
  const doc = new Y.Doc();
  const hooks = createHooks();

  /** @type {WebrtcProvider | null} */
  let provider = null;
  /** @type {Array<() => void>} */
  let cleanupFns = [];
  let started = false;

  return {
    start() {
      if (started) return;
      started = true;

      provider = new WebrtcProvider(room, doc);
      const { awareness } = provider;

      if (user && Object.keys(user).length > 0) {
        awareness.setLocalStateField('user', user);
      }

      for (const plugin of plugins) {
        const cleanup = plugin({ awareness, hooks });
        if (typeof cleanup === 'function') cleanupFns.push(cleanup);
      }
    },

    destroy() {
      hooks.emit('sessionEnd');

      for (const fn of cleanupFns) fn();
      cleanupFns = [];

      if (provider) {
        provider.destroy();
        provider = null;
      }

      doc.destroy();
      hooks.destroy();
    },
  };
}
