/**
 * Cursors plugin for room-mates.
 *
 * Renders coloured dots for remote peers' cursors, a local cursor dot,
 * and optional sparkle-on-click effects.  All behaviour from the original
 * d6 `cursors.js` is preserved and made configurable.
 *
 * @example
 *   import { createSession } from 'room-mates';
 *   import { cursorsPlugin } from 'room-mates/plugins/cursors';
 *
 *   const session = createSession({
 *     room: 'my-room',
 *     plugins: [cursorsPlugin({ maxVisible: 8 })],
 *   });
 *   session.start();
 */

/**
 * @typedef {object} CursorsOptions
 * @property {number}   [throttleMs=50]          - Min ms between awareness updates
 * @property {number}   [maxVisible=8]           - Max remote cursors shown at once
 * @property {number}   [fadeDurationMs=1000]    - CSS fade-out duration
 * @property {number}   [idleTimeoutMs=5000]     - Idle time before cursor fades (before fade duration)
 * @property {number}   [disconnectTimeoutMs=30000] - Idle time before cursor is removed entirely
 * @property {string[]} [colors]                 - Pool of cursor colours
 * @property {boolean}  [localCursor=true]       - Show a dot following the local mouse
 * @property {boolean}  [sparkles=true]          - Enable click-sparkle effects
 * @property {boolean}  [injectStyles=true]      - Auto-inject default CSS
 * @property {boolean}  [debug=false]            - Show debug labels on cursors
 * @property {boolean}  [fiesta=false]           - Show ALL peers, ignore idle/disconnect filtering
 * @property {string}   [containerParent]        - CSS selector for the container parent (default: document.body)
 */

const DEFAULT_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635',
  '#34d399', '#22d3ee', '#60a5fa', '#a78bfa',
  '#e879f9', '#fb7185',
];

const DEFAULT_CSS = `
#remote-cursors {
  position: absolute; top: 0; left: 0;
  width: 0; height: 0; pointer-events: none;
  z-index: 9999; overflow: visible;
}
[data-reduce-motion="true"] #remote-cursors { display: none; }
[data-cursors="off"] #remote-cursors { display: none; }
[data-cursors="on"] #remote-cursors { display: block; }
.remote-cursor {
  position: absolute; top: 0; left: 0;
  width: 16px; height: 16px; border-radius: 50%;
  transition: transform 50ms linear, opacity var(--cursor-fade-duration, 2.5s) ease-out;
  will-change: transform, opacity; pointer-events: none;
}
#local-cursor {
  position: fixed; width: 24px; height: 24px; border-radius: 50%;
  background: hsl(218, 53%, 81%, 0.8); box-shadow: 0 0 8px #9ca3af80;
  pointer-events: none; z-index: 10000;
  transform: translate(-18px, -18px); will-change: left, top;
}
.cursor-sparkle {
  position: absolute; width: 5px; height: 5px; border-radius: 50%;
  pointer-events: none; animation: sparkle-burst 0.5s ease-out forwards;
}
[data-reduce-motion="true"] .cursor-sparkle { display: none; }
@keyframes sparkle-burst {
  0%   { opacity: 1; transform: translate(0,0) scale(1); }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0); }
}
html, html *, html *:hover, html *:active {
  cursor: none !important;
}
@media (max-width: 767px) {
  #remote-cursors, #local-cursor { display: none; }
  html, html *, html *:hover, html *:active { cursor: auto !important; }
}
.cursor-debug {
  display: none; position: absolute; top: 16px; left: 4px;
  font-size: 10px; font-family: monospace; line-height: 1.2;
  white-space: nowrap; pointer-events: none;
}
`;

/**
 * Create a cursors plugin initializer.
 *
 * @param {CursorsOptions} [options]
 * @returns {(ctx: import('../session.js').PluginContext) => () => void}
 */
export function cursorsPlugin(options = {}) {
  const {
    throttleMs = 50,
    maxVisible = 8,
    fadeDurationMs = 1000,
    idleTimeoutMs = 5000,
    disconnectTimeoutMs = 30000,
    colors = DEFAULT_COLORS,
    localCursor: showLocalCursor = true,
    sparkles: showSparkles = true,
    injectStyles = true,
    debug: initialDebug = false,
    fiesta: initialFiesta = false,
    containerParent,
  } = options;

  return function init(ctx) {
    const { awareness, hooks } = ctx;

    const IDLE_TIMEOUT = idleTimeoutMs + fadeDurationMs;
    const DISCONNECT_TIMEOUT = disconnectTimeoutMs;

    let DEBUG = initialDebug;
    let FIESTA = initialFiesta;

    // Honour URL params as overrides
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('debug')) DEBUG = true;
      if (params.has('fiesta')) FIESTA = true;
    }

    // --- CSS injection ---
    /** @type {HTMLStyleElement | null} */
    let styleEl = null;
    if (injectStyles && typeof document !== 'undefined') {
      styleEl = document.createElement('style');
      styleEl.setAttribute('data-room-mates', 'cursors');
      styleEl.textContent = DEFAULT_CSS;
      document.head.appendChild(styleEl);
    }

    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--cursor-fade-duration', fadeDurationMs + 'ms');
    }

    // --- Reduce-motion tracking ---
    let reduceMotion = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    let shouldRender = true;

    function onReduceMotion(e) { reduceMotion = !!e.detail; }
    function onToggleCursors(e) { setShouldRender(!!e.detail); }
    if (typeof window !== 'undefined') {
      window.addEventListener('reduce-motion', onReduceMotion);
      window.addEventListener('toggle-cursors', onToggleCursors);
    }

    // --- Assign random colour to local user ---
    const color = awareness.getLocalState()?.user?.color
      || colors[Math.floor(Math.random() * colors.length)];
    awareness.setLocalStateField('user', {
      ...(awareness.getLocalState()?.user || {}),
      color,
    });

    // --- DOM containers ---
    const parentEl = containerParent
      ? document.querySelector(containerParent) || document.body
      : document.body;

    /** @type {HTMLDivElement | null} */
    let container = null;

    function ensureContainer() {
      if (container) return;
      container = document.createElement('div');
      container.id = 'remote-cursors';
      parentEl.appendChild(container);
    }

    function removeContainer() {
      if (container) { container.remove(); container = null; }
    }

    function setShouldRender(value) {
      if (value === shouldRender) return;
      shouldRender = value;
      if (shouldRender) { ensureContainer(); renderCursors(); }
      else { removeContainer(); cursorEls.clear(); }
    }

    if (shouldRender) ensureContainer();

    // --- Local cursor dot ---
    /** @type {HTMLDivElement | null} */
    let localCursorEl = null;

    if (showLocalCursor) {
      localCursorEl = document.createElement('div');
      localCursorEl.id = 'local-cursor';
      document.body.appendChild(localCursorEl);
    }

    // --- Sparkle container ---
    /** @type {HTMLDivElement | null} */
    let sparkleContainer = null;
    if (showSparkles) {
      sparkleContainer = document.createElement('div');
      sparkleContainer.id = 'sparkle-container';
      sparkleContainer.style.cssText =
        'position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;z-index:9999;overflow:visible;';
      document.body.appendChild(sparkleContainer);
    }

    // --- Peer cursor state ---
    /** @type {Map<number, HTMLDivElement>} */
    const cursorEls = new Map();
    /** @type {Map<number, number>} */
    const lastSeenSparkle = new Map();
    /** @type {Map<number, {x:number,y:number}>} */
    const peerLastPos = new Map();
    /** @type {Map<number, number>} */
    const peerLastMove = new Map();
    /** @type {Set<number>} */
    const peerFading = new Set();
    /** @type {Map<number, HTMLDivElement>} */
    const debugEls = new Map();

    function getOrCreateCursor(clientId, peerColor) {
      if (!shouldRender || !container) return null;
      if (cursorEls.has(clientId)) return cursorEls.get(clientId);
      const el = document.createElement('div');
      el.className = 'remote-cursor';
      el.style.background = peerColor;
      el.style.boxShadow = `0 0 8px ${peerColor}80`;
      if (DEBUG && !FIESTA) {
        const dbg = document.createElement('div');
        dbg.className = 'cursor-debug';
        dbg.style.color = peerColor;
        dbg.style.display = 'block';
        el.appendChild(dbg);
        debugEls.set(clientId, dbg);
      }
      container.appendChild(el);
      cursorEls.set(clientId, el);
      return el;
    }

    function removeCursor(clientId) {
      if (!shouldRender || !container) return;
      const el = cursorEls.get(clientId);
      if (el) { el.remove(); cursorEls.delete(clientId); debugEls.delete(clientId); }
    }

    function isInNoCursorsZone(x, y) {
      const els = document.elementsFromPoint(x, y);
      return els.some(el => el.closest('.no-cursors'));
    }

    // Sender-side fade based on initial viewport height
    const VIEWPORT_LIMIT_Y = window.innerHeight;
    const FADE_START_Y = VIEWPORT_LIMIT_Y * 0.8;
    function localFadeOpacity(pageY) {
      if (pageY <= FADE_START_Y) return 1;
      if (pageY >= VIEWPORT_LIMIT_Y) return 0;
      return 1 - (pageY - FADE_START_Y) / (VIEWPORT_LIMIT_Y - FADE_START_Y);
    }

    function emitSparkles(x, y, sparkleColor) {
      if (!sparkleContainer) return;
      const count = 8;
      for (let i = 0; i < count; i++) {
        const spark = document.createElement('div');
        spark.className = 'cursor-sparkle';
        spark.style.left = x + 'px';
        spark.style.top = y + 'px';
        spark.style.background = sparkleColor;
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const dist = 20 + Math.random() * 30;
        spark.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        spark.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        sparkleContainer.appendChild(spark);
        const cleanup = () => { if (spark.parentNode) spark.remove(); };
        spark.addEventListener('animationend', cleanup);
        setTimeout(cleanup, 700);
      }
    }

    // --- Render loop ---
    function renderCursors() {
      if (!shouldRender || !container) return;
      const states = awareness.getStates();
      const now = Date.now();

      // Remove orphaned cursors
      for (const id of cursorEls.keys()) {
        if (!states.has(id)) removeCursor(id);
      }

      // Update movement timestamps
      states.forEach((s, clientId) => {
        if (clientId === awareness.clientID || !s.cursor) return;
        const prev = peerLastPos.get(clientId);
        if (!prev || prev.x !== s.cursor.x || prev.y !== s.cursor.y) {
          peerLastPos.set(clientId, { x: s.cursor.x, y: s.cursor.y });
          peerLastMove.set(clientId, now);
        }
      });

      // Classify peers
      const activePeers = [];
      const fadingPeers = [];
      states.forEach((s, clientId) => {
        if (clientId === awareness.clientID || !s.cursor || !s.user) return;
        if (FIESTA) { activePeers.push(clientId); return; }
        const lastMove = peerLastMove.get(clientId) || 0;
        const idle = now - lastMove;
        if (idle >= DISCONNECT_TIMEOUT + fadeDurationMs) {
          peerLastPos.delete(clientId); peerLastMove.delete(clientId);
          lastSeenSparkle.delete(clientId); return;
        }
        if (idle >= IDLE_TIMEOUT + fadeDurationMs) return;
        if (idle >= IDLE_TIMEOUT) { fadingPeers.push(clientId); return; }
        activePeers.push(clientId);
      });

      const visibleSet = new Set(FIESTA ? activePeers : activePeers.slice(0, maxVisible));
      const fadingSet = new Set(fadingPeers);

      states.forEach((s, clientId) => {
        if (clientId === awareness.clientID) return;
        if (!visibleSet.has(clientId) && !fadingSet.has(clientId)) {
          removeCursor(clientId); peerFading.delete(clientId); return;
        }
        const el = getOrCreateCursor(clientId, s.user.color);
        if (!el) return;
        el.style.transform = `translate(${s.cursor.x}px, ${s.cursor.y}px)`;

        // Fiesta: show disconnected peers as squares
        if (FIESTA) {
          const lastMove = peerLastMove.get(clientId) || 0;
          el.style.borderRadius = (now - lastMove >= DISCONNECT_TIMEOUT) ? '0' : '50%';
        }

        if (fadingSet.has(clientId)) {
          if (!peerFading.has(clientId)) {
            peerFading.add(clientId);
            el.style.transition = `transform 50ms linear, opacity var(--cursor-fade-duration, 2.5s) ease-out`;
            el.style.opacity = '0';
          }
        } else {
          if (peerFading.has(clientId)) {
            el.style.transition = 'transform 50ms linear, opacity 250ms ease-in';
          }
          peerFading.delete(clientId);
          const remoteOpacity = typeof s.cursor.a === 'number' ? s.cursor.a : 1;
          el.style.opacity = String(remoteOpacity);
          const screenX = s.cursor.x;
          const screenY = s.cursor.y - window.scrollY;
          if (isInNoCursorsZone(screenX, screenY)) el.style.opacity = '0';
        }

        // Remote sparkles
        if (s.sparkle) {
          const prev = lastSeenSparkle.get(clientId) || 0;
          if (s.sparkle.t > prev) {
            lastSeenSparkle.set(clientId, s.sparkle.t);
            emitSparkles(s.sparkle.x, s.sparkle.y, s.user.color);
          }
        }

        // Debug labels
        if (DEBUG) {
          const dbg = debugEls.get(clientId);
          if (dbg) {
            const lastMove = peerLastMove.get(clientId) || now;
            const idle = now - lastMove;
            const timeLeft = Math.max(0, Math.ceil((IDLE_TIMEOUT + fadeDurationMs - idle) / 1000));
            dbg.textContent = `${timeLeft}s · ${Math.round(s.cursor.x)},${Math.round(s.cursor.y)}`;
          }
        }
      });
    }

    // --- Awareness listener ---
    awareness.on('change', renderCursors);

    // --- Tick timer for idle/fade updates ---
    const TICK_MS = 200;
    let tickTimer = null;
    function startTick() { if (tickTimer == null) tickTimer = setInterval(renderCursors, TICK_MS); }
    function stopTick() { if (tickTimer != null) { clearInterval(tickTimer); tickTimer = null; } }
    awareness.on('change', () => {
      const hasPeers = Array.from(awareness.getStates().keys()).some(id => id !== awareness.clientID);
      if (hasPeers) startTick(); else stopTick();
    });

    // --- Click sparkles ---
    const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, label, [role="button"], [tabindex]';
    function onDocClick(e) {
      const isInteractive = e.target.closest(INTERACTIVE_SELECTOR);
      const t = Date.now();
      awareness.setLocalStateField('sparkle', { x: e.pageX, y: e.pageY, t });
      setTimeout(() => {
        const s = awareness.getLocalState();
        if (s?.sparkle?.t === t) awareness.setLocalStateField('sparkle', null);
      }, 200);
      if (!isInteractive && !reduceMotion && showSparkles) {
        emitSparkles(e.pageX, e.pageY, colors[Math.floor(Math.random() * colors.length)]);
      }
    }
    document.addEventListener('click', onDocClick);

    // --- Mouse tracking ---
    let lastUpdate = 0;
    function onMouseMove(e) {
      if (localCursorEl) {
        localCursorEl.style.left = e.clientX + 'px';
        localCursorEl.style.top = e.clientY + 'px';
      }
      const now = Date.now();
      if (!DEBUG && !FIESTA && now - lastUpdate < throttleMs) return;
      lastUpdate = now;
      awareness.setLocalStateField('cursor', {
        x: e.pageX,
        y: e.pageY,
        a: localFadeOpacity(e.pageY),
      });
    }
    function onMouseLeave() {
      awareness.setLocalStateField('cursor', null);
      if (localCursorEl) localCursorEl.style.display = 'none';
    }
    function onMouseEnter() {
      if (localCursorEl) localCursorEl.style.display = '';
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // --- Session end: freeze cursors ---
    function onSessionEnd() {
      stopTick();
      awareness.off('change', renderCursors);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', onDocClick);
    }
    hooks.on('sessionEnd', onSessionEnd);

    // --- Cleanup ---
    return function cleanup() {
      stopTick();
      awareness.off('change', renderCursors);
      hooks.off('sessionEnd', onSessionEnd);

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('click', onDocClick);
      if (typeof window !== 'undefined') {
        window.removeEventListener('reduce-motion', onReduceMotion);
        window.removeEventListener('toggle-cursors', onToggleCursors);
      }

      removeContainer();
      if (localCursorEl) { localCursorEl.remove(); localCursorEl = null; }
      if (sparkleContainer) { sparkleContainer.remove(); sparkleContainer = null; }
      if (styleEl) { styleEl.remove(); styleEl = null; }

      cursorEls.clear();
      debugEls.clear();
      peerLastPos.clear();
      peerLastMove.clear();
      peerFading.clear();
      lastSeenSparkle.clear();
    };
  };
}
