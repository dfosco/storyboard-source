import { jsx as tt } from "react/jsx-runtime";
import St, { useRef as F, useState as et, useEffect as nt, Children as Ct, useCallback as Nt } from "react";
var ft = { dragStart: !0 }, gt = { delay: 0, distance: 3 };
function Tt(t, e = {}) {
  let n, a, { bounds: s, axis: i = "both", gpuAcceleration: c = !0, legacyTranslate: w = !1, transform: A, applyUserSelectHack: b = !0, disabled: T = !1, ignoreMultitouch: y = !1, recomputeBounds: g = ft, grid: C, threshold: S = gt, position: p, cancel: h, handle: I, defaultClass: u = "neodrag", defaultClassDragging: D = "neodrag-dragging", defaultClassDragged: X = "neodrag-dragged", defaultPosition: m = { x: 0, y: 0 }, onDragStart: o, onDrag: M, onDragEnd: q } = e, L = !1, N = !1, J = 0, Y = !1, f = !1, R = 0, H = 0, k = 0, G = 0, rt = 0, ot = 0, { x: z, y: W } = p ? { x: (p == null ? void 0 : p.x) ?? 0, y: (p == null ? void 0 : p.y) ?? 0 } : m;
  ct(z, W);
  let _, U, j, at, st, yt = "", At = !!p;
  g = { ...ft, ...g }, S = { ...gt, ...S ?? {} };
  let K = /* @__PURE__ */ new Set();
  function vt(r) {
    L && !N && f && Y && st && (N = !0, (function(l) {
      ut("neodrag:start", o, l);
    })(r), O.add(D), b && (yt = it.userSelect, it.userSelect = "none"));
  }
  const it = document.body.style, O = t.classList;
  function ct(r = R, l = H) {
    if (!A) {
      if (w) {
        let x = `${+r}px, ${+l}px`;
        return P(t, "transform", c ? `translate3d(${x}, 0)` : `translate(${x})`);
      }
      return P(t, "translate", `${+r}px ${+l}px`);
    }
    const v = A({ offsetX: r, offsetY: l, rootNode: t });
    pt(v) && P(t, "transform", v);
  }
  function ut(r, l, v) {
    const x = /* @__PURE__ */ (function(E) {
      return { offsetX: R, offsetY: H, rootNode: t, currentNode: st, event: E };
    })(v);
    t.dispatchEvent(new CustomEvent(r, { detail: x })), l == null || l(x);
  }
  const Z = addEventListener, lt = new AbortController(), dt = { signal: lt.signal, capture: !1 };
  function xt() {
    let r = t.offsetWidth / U.width;
    return isNaN(r) && (r = 1), r;
  }
  return P(t, "touch-action", "none"), Z("pointerdown", ((r) => {
    if (T || r.button === 2) return;
    if (K.add(r.pointerId), y && K.size > 1) return r.preventDefault();
    if (g.dragStart && (_ = mt(s, t)), pt(I) && pt(h) && I === h) throw new Error("`handle` selector can't be same as `cancel` selector");
    if (O.add(u), j = (function(d, $) {
      if (!d) return [$];
      if (ht(d)) return [d];
      if (Array.isArray(d)) return d;
      const B = $.querySelectorAll(d);
      if (B === null) throw new Error("Selector passed for `handle` option should be child of the element on which the action is applied");
      return Array.from(B.values());
    })(I, t), at = (function(d, $) {
      if (!d) return [];
      if (ht(d)) return [d];
      if (Array.isArray(d)) return d;
      const B = $.querySelectorAll(d);
      if (B === null) throw new Error("Selector passed for `cancel` option should be child of the element on which the action is applied");
      return Array.from(B.values());
    })(h, t), n = /(both|x)/.test(i), a = /(both|y)/.test(i), Et(at, j)) throw new Error("Element being dragged can't be a child of the element on which `cancel` is applied");
    const l = r.composedPath()[0];
    if (!j.some(((d) => {
      var $;
      return d.contains(l) || (($ = d.shadowRoot) == null ? void 0 : $.contains(l));
    })) || Et(at, [l])) return;
    st = j.length === 1 ? t : j.find(((d) => d.contains(l))), L = !0, J = Date.now(), S.delay || (Y = !0), U = t.getBoundingClientRect();
    const { clientX: v, clientY: x } = r, E = xt();
    n && (k = v - z / E), a && (G = x - W / E), _ && (rt = v - U.left, ot = x - U.top);
  }), dt), Z("pointermove", ((r) => {
    if (!L || y && K.size > 1) return;
    if (!N) {
      if (Y || Date.now() - J >= S.delay && (Y = !0, vt(r)), !f) {
        const E = r.clientX - k, d = r.clientY - G;
        Math.sqrt(E ** 2 + d ** 2) >= S.distance && (f = !0, vt(r));
      }
      if (!N) return;
    }
    g.drag && (_ = mt(s, t)), r.preventDefault(), U = t.getBoundingClientRect();
    let l = r.clientX, v = r.clientY;
    const x = xt();
    if (_) {
      const E = { left: _.left + rt, top: _.top + ot, right: _.right + rt - U.width, bottom: _.bottom + ot - U.height };
      l = bt(l, E.left, E.right), v = bt(v, E.top, E.bottom);
    }
    if (Array.isArray(C)) {
      let [E, d] = C;
      if (isNaN(+E) || E < 0) throw new Error("1st argument of `grid` must be a valid positive number");
      if (isNaN(+d) || d < 0) throw new Error("2nd argument of `grid` must be a valid positive number");
      let $ = l - k, B = v - G;
      [$, B] = It([E / x, d / x], $, B), l = k + $, v = G + B;
    }
    n && (R = Math.round((l - k) * x)), a && (H = Math.round((v - G) * x)), z = R, W = H, ut("neodrag", M, r), ct();
  }), dt), Z("pointerup", ((r) => {
    K.delete(r.pointerId), L && (N && (Z("click", ((l) => l.stopPropagation()), { once: !0, signal: lt.signal, capture: !0 }), g.dragEnd && (_ = mt(s, t)), O.remove(D), O.add(X), b && (it.userSelect = yt), ut("neodrag:end", q, r), n && (k = R), a && (G = H)), L = !1, N = !1, Y = !1, f = !1);
  }), dt), { destroy: () => lt.abort(), update: (r) => {
    var v, x;
    i = r.axis || "both", T = r.disabled ?? !1, y = r.ignoreMultitouch ?? !1, I = r.handle, s = r.bounds, g = r.recomputeBounds ?? ft, h = r.cancel, b = r.applyUserSelectHack ?? !0, C = r.grid, c = r.gpuAcceleration ?? !0, w = r.legacyTranslate ?? !1, A = r.transform, S = { ...gt, ...r.threshold ?? {} };
    const l = O.contains(X);
    O.remove(u, X), u = r.defaultClass ?? "neodrag", D = r.defaultClassDragging ?? "neodrag-dragging", X = r.defaultClassDragged ?? "neodrag-dragged", O.add(u), l && O.add(X), At && (z = R = ((v = r.position) == null ? void 0 : v.x) ?? R, W = H = ((x = r.position) == null ? void 0 : x.y) ?? H, ct());
  } };
}
var bt = (t, e, n) => Math.min(Math.max(t, e), n), pt = (t) => typeof t == "string", It = ([t, e], n, a) => {
  const s = (i, c) => c === 0 ? 0 : Math.ceil(i / c) * c;
  return [s(n, t), s(a, e)];
}, Et = (t, e) => t.some(((n) => e.some(((a) => n.contains(a)))));
function mt(t, e) {
  if (t === void 0) return;
  if (ht(t)) return t.getBoundingClientRect();
  if (typeof t == "object") {
    const { top: a = 0, left: s = 0, right: i = 0, bottom: c = 0 } = t;
    return { top: a, right: window.innerWidth - i, bottom: window.innerHeight - c, left: s };
  }
  if (t === "parent") return e.parentNode.getBoundingClientRect();
  const n = document.querySelector(t);
  if (n === null) throw new Error("The selector provided for bound doesn't exists in the document.");
  return n.getBoundingClientRect();
}
var P = (t, e, n) => t.style.setProperty(e, n), ht = (t) => t instanceof HTMLElement;
function V(t) {
  return t == null || typeof t == "string" || t instanceof HTMLElement ? t : "current" in t ? t.current : Array.isArray(t) ? t.map(((e) => e instanceof HTMLElement ? e : e.current)) : void 0;
}
function Lt(t, e = {}) {
  const n = F(), [a, s] = et(!1), [i, c] = et();
  let { onDragStart: w, onDrag: A, onDragEnd: b, handle: T, cancel: y } = e, g = V(T), C = V(y);
  function S(u, D) {
    c(u), D == null || D(u);
  }
  function p(u) {
    s(!0), S(u, w);
  }
  function h(u) {
    S(u, A);
  }
  function I(u) {
    s(!1), S(u, b);
  }
  return nt((() => {
    if (typeof window > "u") return;
    const u = t.current;
    if (!u) return;
    ({ onDragStart: w, onDrag: A, onDragEnd: b } = e);
    const { update: D, destroy: X } = Tt(u, { ...e, handle: g, cancel: C, onDragStart: p, onDrag: h, onDragEnd: I });
    return n.current = D, X;
  }), []), nt((() => {
    var u;
    (u = n.current) == null || u.call(n, { ...e, handle: V(T), cancel: V(y), onDragStart: p, onDrag: h, onDragEnd: I });
  }), [e]), { isDragging: a, dragState: i };
}
const Q = "tiny-canvas-queue";
function Dt() {
  const t = localStorage.getItem(Q);
  if (!t) return [];
  try {
    const e = JSON.parse(t);
    return Array.isArray(e) ? e : [];
  } catch {
    return localStorage.setItem(Q, JSON.stringify([])), [];
  }
}
const Rt = (t) => {
  if (!t) return null;
  let e = null;
  const n = (a) => {
    if (a.props && a.props.id) {
      e = a.props.id;
      return;
    }
    a.props && a.props.children && St.Children.forEach(a.props.children, n);
  };
  return n(t), e;
};
function $t(t) {
  let e = 5381;
  for (let n = 0; n < t.length; n++)
    e = (e << 5) + e + t.charCodeAt(n) >>> 0;
  return e.toString(16).padStart(8, "0");
}
function Mt(t) {
  var i;
  if (t == null || typeof t == "boolean") return "";
  if (typeof t == "string" || typeof t == "number") return "#text";
  const e = t.type, n = typeof e == "function" ? e.displayName || e.name || "Anonymous" : typeof e == "string" ? e : "Fragment", a = (i = t.props) == null ? void 0 : i.children;
  if (a == null) return n;
  const s = [];
  return St.Children.forEach(a, (c) => {
    const w = Mt(c);
    w && s.push(w);
  }), s.length ? `${n}(${s.join(",")})` : n;
}
const Xt = (t, e) => {
  const n = Mt(t);
  return `tc-${$t(n)}-${e}`;
}, Jt = (t) => {
  try {
    return Dt().reduce((a, s) => (a[s.id] = { id: s.id, x: s.x, y: s.y }, a), {})[t] || { x: 0, y: 0 };
  } catch (e) {
    return console.error("Error getting saved coordinates:", e), { x: 0, y: 0 };
  }
}, jt = () => {
  try {
    localStorage.getItem(Q) || localStorage.setItem(Q, JSON.stringify([]));
  } catch (t) {
    console.error("LocalStorage is not available:", t);
  }
}, Yt = (t, e, n) => {
  try {
    const a = Dt(), s = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-"), i = { id: t, x: e, y: n, time: s }, c = a.findIndex((w) => w.id === t);
    c >= 0 ? a[c] = i : a.push(i), localStorage.setItem(Q, JSON.stringify(a));
  } catch (a) {
    console.error("Error saving drag position:", a);
  }
}, qt = 250, wt = 4, Ht = 150, _t = 8;
function Bt({ children: t, dragId: e, initialPosition: n, onDragStart: a, onDrag: s, onDragEnd: i, handle: c, snapGrid: w, locked: A = !1, boundaryPad: b = 0 }) {
  const T = F(null), y = n || { x: 0, y: 0 }, g = F(y), C = F(!1), S = F({
    timer: null,
    startX: 0,
    startY: 0,
    delayMet: !1,
    distanceMet: !1,
    active: !1,
    lastEvent: null
  }), [p, h] = et(y), [I, u] = et(y);
  n && (n.x !== I.x || n.y !== I.y) && (u(n), h(n)), nt(() => {
    const m = T.current;
    if (m && e && (y.x !== 0 || y.y !== 0)) {
      m.classList.add("tc-on-translation");
      const o = setTimeout(() => {
        m.classList.remove("tc-on-translation");
      }, qt * 4);
      return () => {
        clearTimeout(o);
      };
    }
  }, [e, y.x, y.y]), nt(() => {
    const m = T.current;
    if (!m || !c || A) return;
    const o = S.current;
    let M = null;
    function q(f) {
      if (!(f.target instanceof Element)) return !1;
      const R = f.target.closest(c);
      return R != null && m.contains(R);
    }
    function L(f) {
      if (f === M) {
        M = null;
        return;
      }
      q(f) && (f.stopImmediatePropagation(), o.active = !0, o.delayMet = !1, o.distanceMet = !1, o.startX = f.clientX, o.startY = f.clientY, o.target = f.target, o.pointerId = f.pointerId, o.button = f.button, o.pointerType = f.pointerType, clearTimeout(o.timer), o.timer = setTimeout(() => {
        o.delayMet = !0, N();
      }, Ht));
    }
    function N() {
      if (o.delayMet && o.distanceMet && o.active && o.target) {
        const f = new PointerEvent("pointerdown", {
          bubbles: !0,
          cancelable: !0,
          pointerId: o.pointerId,
          clientX: o.startX,
          clientY: o.startY,
          button: o.button,
          pointerType: o.pointerType
        });
        M = f, o.target.dispatchEvent(f), o.target = null;
      }
    }
    function J(f) {
      if (!o.active || o.distanceMet) return;
      const R = f.clientX - o.startX, H = f.clientY - o.startY;
      Math.hypot(R, H) >= _t && (o.distanceMet = !0, N());
    }
    function Y() {
      clearTimeout(o.timer), o.active = !1, o.target = null;
    }
    return m.addEventListener("pointerdown", L, !0), document.addEventListener("pointermove", J), document.addEventListener("pointerup", Y), document.addEventListener("pointercancel", Y), () => {
      m.removeEventListener("pointerdown", L, !0), document.removeEventListener("pointermove", J), document.removeEventListener("pointerup", Y), document.removeEventListener("pointercancel", Y), clearTimeout(o.timer);
    };
  }, [c, A]);
  const { isDragging: D } = Lt(T, {
    axis: "both",
    grid: w,
    defaultClass: "tc-drag",
    defaultClassDragging: "tc-on",
    defaultClassDragged: "tc-off",
    applyUserSelectHack: !0,
    disabled: A,
    ...c ? { handle: c } : {},
    position: { x: p.x, y: p.y },
    // Clamp in the transform callback so neodrag never paints a
    // negative position — avoids the one-frame flicker that happens
    // when clamping only in onDrag (React re-render lag).
    transform: ({ offsetX: m, offsetY: o }) => {
      const M = Math.max(b, m), q = Math.max(b, o);
      return `translate3d(${M}px, ${q}px, 0)`;
    },
    onDragStart: () => {
      g.current = p, C.current = !1, a == null || a(e, p);
    },
    onDrag: ({ offsetX: m, offsetY: o }) => {
      const M = m - g.current.x, q = o - g.current.y, L = Math.hypot(M, q);
      !C.current && L >= wt && (C.current = !0);
      const N = { x: Math.max(b, m), y: Math.max(b, o) };
      h(N), s == null || s(e, N);
    },
    onDragEnd: (m) => {
      const o = Math.max(b, m.offsetX), M = Math.max(b, m.offsetY);
      h({ x: o, y: M });
      const q = o - g.current.x, L = M - g.current.y;
      (C.current || Math.hypot(q, L) >= wt) && (e && Yt(e, o, M), i == null || i(e, { x: o, y: M }));
    }
  });
  return /* @__PURE__ */ tt(
    "article",
    {
      ref: T,
      style: {
        cursor: A ? void 0 : c ? D ? "grabbing" : void 0 : D ? "grabbing" : "grab",
        transform: `translate3d(${p.x}px, ${p.y}px, 0)`
      },
      children: /* @__PURE__ */ tt("div", { className: "tc-draggable-inner", children: t })
    }
  );
}
function Ot(t, e = 0) {
  var s, i;
  const n = Number((s = t == null ? void 0 : t.props) == null ? void 0 : s["data-tc-x"]), a = Number((i = t == null ? void 0 : t.props) == null ? void 0 : i["data-tc-y"]);
  return Number.isFinite(n) && Number.isFinite(a) ? { x: Math.max(e, n), y: Math.max(e, a) } : null;
}
function Ut(t) {
  var e;
  return ((e = t == null ? void 0 : t.props) == null ? void 0 : e["data-tc-handle"]) || null;
}
function Ft({
  children: t,
  dotted: e = !1,
  grid: n = !1,
  gridSize: a,
  snapGrid: s,
  colorMode: i = "auto",
  locked: c = !1,
  boundaryPad: w,
  onDragStart: A,
  onDrag: b,
  onDragEnd: T
}) {
  const y = e || n, g = a, C = w ?? a ?? 0, S = g && g < 16 ? 1 : 2, p = g ? {
    "--tc-grid-size": `${g}px`,
    "--tc-grid-offset": `${g / -2}px`,
    "--tc-dot-radius": `${S}px`
  } : void 0;
  return /* @__PURE__ */ tt(
    "main",
    {
      className: "tc-canvas",
      "data-dotted": y || void 0,
      "data-locked": c || void 0,
      "data-color-mode": i !== "auto" ? i : void 0,
      style: p,
      children: Ct.map(t, (h, I) => {
        const u = Rt(h) ?? Xt(h, I), D = Ot(h, C), X = Ut(h);
        return /* @__PURE__ */ tt(
          Bt,
          {
            gridSize: a,
            snapGrid: s,
            dragId: u,
            initialPosition: D,
            onDragStart: A,
            onDrag: b,
            onDragEnd: T,
            handle: X,
            locked: c,
            boundaryPad: C,
            children: h
          },
          u
        );
      })
    }
  );
}
function Qt({ reload: t = !1 } = {}) {
  return Nt(() => {
    try {
      localStorage.removeItem("tiny-canvas-queue");
    } catch (e) {
      console.error("Error clearing canvas state:", e);
    }
    t && window.location.reload();
  }, [t]);
}
export {
  Ft as Canvas,
  Bt as Draggable,
  Rt as findDragId,
  Xt as generateDragId,
  Jt as getQueue,
  jt as refreshStorage,
  Yt as saveDrag,
  Qt as useResetCanvas
};
