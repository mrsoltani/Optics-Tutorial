'use strict';
/* ===== Core: utilities, canvas View, controls, optics math ===== */
const C = {
  bg: '#0a0f1f', grid: '#141d38', axis: '#52628f', text: '#e6ebff', dim: '#93a0cb',
  ray: '#ffd23f', ray2: '#43d9ff', ray3: '#ff6b9a', ray4: '#9cff6b', obj: '#ff9f43', img: '#5cffb0',
  glass: 'rgba(110,170,255,0.16)', glassEdge: '#7fb4ff', mirror: '#cfd8ff'
};
const rad = Math.PI / 180, deg = 180 / Math.PI;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const $ = (s, r = document) => r.querySelector(s);
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function fmt(x, d = 2) { if (!isFinite(x)) return '∞'; if (Math.abs(x) < 0.5 * Math.pow(10, -d)) x = 0; return x.toFixed(d); }
const PAGES = [];
const cleanups = [];
function loop(fn) { let on = true; const f = t => { if (!on) return; fn(t); requestAnimationFrame(f); }; requestAnimationFrame(f); cleanups.push(() => { on = false; }); }
const linspace = (a, b, n) => n === 1 ? [(a + b) / 2] : Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
const norm = d => { const l = Math.hypot(d[0], d[1]); return [d[0] / l, d[1] / l]; };

/* ----- optics math ----- */
function refract(d, n, n1, n2) {
  let c = -(d[0] * n[0] + d[1] * n[1]);
  if (c < 0) { n = [-n[0], -n[1]]; c = -c; }
  const r = n1 / n2, k = 1 - r * r * (1 - c * c);
  if (k < 0) return null;
  const q = r * c - Math.sqrt(k);
  return [r * d[0] + q * n[0], r * d[1] + q * n[1]];
}
function reflect(d, n) { const k = 2 * (d[0] * n[0] + d[1] * n[1]); return [d[0] - k * n[0], d[1] - k * n[1]]; }
/* Cauchy-like dispersion: n at 589 nm is n0, D controls the spread. lambda in micrometres */
const nOf = (n0, D, lam) => n0 + D * (0.5893 * 0.5893 / (lam * lam) - 1);
function wl2rgb(nm) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else if (nm <= 780) { r = 1; }
  let f = 1; if (nm < 420) f = 0.3 + 0.7 * (nm - 380) / 40; else if (nm > 700) f = 0.3 + 0.7 * (780 - nm) / 80;
  const s = v => Math.round(255 * Math.pow(Math.max(0, v) * f, 0.8));
  return `rgb(${s(r)},${s(g)},${s(b)})`;
}
function J1(x) {
  const ax = Math.abs(x);
  if (ax < 8) {
    const y = x * x;
    const a1 = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.48260 + y * (-30.16036606))))));
    const a2 = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y))));
    return a1 / a2;
  }
  const z = 8 / ax, y = z * z, xx = ax - 2.356194491;
  const a1 = 1 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * (-0.240337019e-6))));
  const a2 = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
  const ans = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * a1 - z * Math.sin(xx) * a2);
  return x < 0 ? -ans : ans;
}
const airy = x => Math.abs(x) < 1e-6 ? 1 : Math.pow(2 * J1(x) / x, 2);

/* ----- canvas View with world coordinates, handles ----- */
class View {
  constructor(parent, opts = {}) {
    this.cv = el('canvas', 'cv'); if (opts.flex) this.cv.style.flexGrow = opts.flex;
    parent.appendChild(this.cv);
    this.ctx = this.cv.getContext('2d');
    this.s = 40; this.cx = 0; this.cy = 0; this.W = 300; this.H = 150; this.d = 1;
    this.drawFn = opts.draw; this.handles = []; this.drag = null; this.onChange = null;
    const ro = new ResizeObserver(() => this.resize()); ro.observe(this.cv); cleanups.push(() => ro.disconnect());
    const cv = this.cv;
    cv.addEventListener('pointerdown', e => { const h = this.pick(e); if (h) { this.drag = h; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; e.preventDefault(); } });
    cv.addEventListener('pointermove', e => {
      if (this.drag) { const [px, py] = this.pt(e); this.drag.set(this.ix(px), this.iy(py)); (this.onChange || (() => this.render()))(); }
      else cv.style.cursor = this.pick(e) ? 'grab' : 'default';
    });
    const up = () => { this.drag = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }
  pt(e) { const r = this.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  pick(e) {
    const [px, py] = this.pt(e); let best = null, bd = 18;
    for (const h of this.handles) { if (h.hidden && h.hidden()) continue; const [x, y] = h.get(); const d = Math.hypot(this.X(x) - px, this.Y(y) - py); if (d < bd) { bd = d; best = h; } }
    return best;
  }
  addHandle(h) { this.handles.push(h); return h; }
  resize() {
    const r = this.cv.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
    this.d = window.devicePixelRatio || 1; this.W = r.width; this.H = r.height;
    this.cv.width = Math.round(r.width * this.d); this.cv.height = Math.round(r.height * this.d); this.render();
  }
  X(x) { return this.W / 2 + (x - this.cx) * this.s; } Y(y) { return this.H / 2 - (y - this.cy) * this.s; }
  ix(px) { return (px - this.W / 2) / this.s + this.cx; } iy(py) { return -(py - this.H / 2) / this.s + this.cy; }
  fit(x0, x1, y0, y1) { this.s = Math.min(this.W / (x1 - x0), this.H / (y1 - y0)); this.cx = (x0 + x1) / 2; this.cy = (y0 + y1) / 2; }
  render() {
    const c = this.ctx; c.setTransform(this.d, 0, 0, this.d, 0, 0);
    c.fillStyle = C.bg; c.fillRect(0, 0, this.W, this.H); c.lineCap = 'round'; c.lineJoin = 'round';
    if (this.drawFn) this.drawFn(c, this);
    for (const h of this.handles) {
      if (h.hidden && h.hidden()) continue;
      const [x, y] = h.get(), px = this.X(x), py = this.Y(y);
      c.beginPath(); c.arc(px, py, 8, 0, 7); c.fillStyle = (h.col || '#fff') + '55'; c.fill(); c.lineWidth = 2; c.strokeStyle = h.col || '#fff'; c.stroke();
      c.beginPath(); c.arc(px, py, 2.5, 0, 7); c.fillStyle = h.col || '#fff'; c.fill();
      if (h.label) { c.fillStyle = C.dim; c.font = '12px Segoe UI'; c.textAlign = 'left'; c.fillText(h.label, px + 12, py + 20); }
    }
  }
  /* drawing helpers, world coordinates */
  L(x1, y1, x2, y2, col = C.ray, w = 2, dash) {
    const c = this.ctx; c.beginPath(); c.moveTo(this.X(x1), this.Y(y1)); c.lineTo(this.X(x2), this.Y(y2));
    c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]);
  }
  /* ray with a direction chevron at its midpoint */
  ray(x1, y1, x2, y2, col = C.ray, w = 2, dash, arrow = true) {
    this.L(x1, y1, x2, y2, col, w, dash);
    if (!arrow) return;
    const c = this.ctx, ax = this.X(x1), ay = this.Y(y1), bx = this.X(x2), by = this.Y(y2), len = Math.hypot(bx - ax, by - ay);
    if (len < 60) return; const a = Math.atan2(by - ay, bx - ax), mx = (ax + bx) / 2, my = (ay + by) / 2;
    c.beginPath(); c.moveTo(mx - 7 * Math.cos(a - 0.45), my - 7 * Math.sin(a - 0.45)); c.lineTo(mx, my); c.lineTo(mx - 7 * Math.cos(a + 0.45), my - 7 * Math.sin(a + 0.45));
    c.strokeStyle = col; c.lineWidth = w; c.setLineDash([]); c.stroke();
  }
  P(pts, col = C.ray, w = 2, dash) {
    const c = this.ctx; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(this.X(p[0]), this.Y(p[1])) : c.moveTo(this.X(p[0]), this.Y(p[1])));
    c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]);
  }
  fillP(pts, fill, stroke, w = 2) {
    const c = this.ctx; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(this.X(p[0]), this.Y(p[1])) : c.moveTo(this.X(p[0]), this.Y(p[1]))); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = w; c.stroke(); }
  }
  dot(x, y, r = 4, col = '#fff') { const c = this.ctx; c.beginPath(); c.arc(this.X(x), this.Y(y), r, 0, 7); c.fillStyle = col; c.fill(); }
  T(str, x, y, col = C.text, size = 13, align = 'left', dx = 0, dy = 0, bold = false) {
    const c = this.ctx; c.fillStyle = col; c.font = (bold ? 'bold ' : '') + size + 'px Segoe UI, sans-serif'; c.textAlign = align; c.fillText(str, this.X(x) + dx, this.Y(y) + dy);
  }
  arrow(x1, y1, x2, y2, col = C.obj, w = 3, dash) {
    this.L(x1, y1, x2, y2, col, w, dash);
    const c = this.ctx, ax = this.X(x1), ay = this.Y(y1), bx = this.X(x2), by = this.Y(y2), a = Math.atan2(by - ay, bx - ax), h = 11;
    if (Math.hypot(bx - ax, by - ay) < 4) return;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - h * Math.cos(a - 0.4), by - h * Math.sin(a - 0.4)); c.lineTo(bx - h * Math.cos(a + 0.4), by - h * Math.sin(a + 0.4)); c.closePath(); c.fillStyle = col; c.fill();
  }
  arc(x, y, rpx, a1, a2, col = C.dim, w = 1.5) { const c = this.ctx; c.beginPath(); c.arc(this.X(x), this.Y(y), rpx, -a1, -a2, true); c.strokeStyle = col; c.lineWidth = w; c.stroke(); }
  grid(step = 1) {
    const c = this.ctx; c.strokeStyle = C.grid; c.lineWidth = 1; c.beginPath();
    for (let x = Math.ceil(this.ix(0) / step) * step; x < this.ix(this.W); x += step) { c.moveTo(this.X(x), 0); c.lineTo(this.X(x), this.H); }
    for (let y = Math.ceil(this.iy(this.H) / step) * step; y < this.iy(0); y += step) { c.moveTo(0, this.Y(y)); c.lineTo(this.W, this.Y(y)); }
    c.stroke();
  }
  axis(y = 0, col = C.axis) { this.L(this.ix(0), y, this.ix(this.W), y, col, 1.2, [6, 5]); }
  /* draws a lens glyph at x, half height h */
  lens(x, h, conv = true, col = C.glassEdge) {
    const c = this.ctx, X = this.X(x), Yt = this.Y(h), Yb = this.Y(-h), w = 0.16 * this.s * (h > 1 ? 1.4 : 1), W0 = conv ? 0 : 0.18 * this.s;
    c.beginPath();
    if (conv) { c.moveTo(X, Yt); c.quadraticCurveTo(X + 2 * w, this.Y(0), X, Yb); c.quadraticCurveTo(X - 2 * w, this.Y(0), X, Yt); }
    else { c.moveTo(X - W0, Yt); c.lineTo(X + W0, Yt); c.quadraticCurveTo(X + W0 - 2 * w * 0.7, this.Y(0), X + W0, Yb); c.lineTo(X - W0, Yb); c.quadraticCurveTo(X - W0 + 2 * w * 0.7, this.Y(0), X - W0, Yt); }
    c.fillStyle = C.glass; c.fill(); c.strokeStyle = col; c.lineWidth = 2; c.stroke();
  }
  /* a simple side-view eye glyph, pupil glow colour tells you whether it can relax onto this beam */
  eye(x, h, state) {
    const c = this.ctx, X = this.X(x), Y0 = this.Y(0), r = h * this.s;
    const col = { relaxed: C.img, strain: C.ray, cant: C.ray3 }[state] || C.dim;
    c.beginPath(); c.moveTo(X - r * 1.15, Y0); c.quadraticCurveTo(X, Y0 - r * 1.1, X + r * 1.15, Y0);
    c.quadraticCurveTo(X, Y0 + r * 1.1, X - r * 1.15, Y0); c.closePath();
    c.fillStyle = 'rgba(255,255,255,.06)'; c.fill(); c.strokeStyle = '#8b97bd'; c.lineWidth = 1.5; c.stroke();
    const g = c.createRadialGradient(X, Y0, 0, X, Y0, r * 0.5);
    g.addColorStop(0, col); g.addColorStop(1, col + '22');
    c.beginPath(); c.arc(X, Y0, r * 0.46, 0, 7); c.fillStyle = g; c.fill();
    c.beginPath(); c.arc(X, Y0, r * 0.16, 0, 7); c.fillStyle = '#060a16'; c.fill();
  }
}

/* A plain (non-world-coordinate) canvas strip — e.g. a sky view or a pixel-grid zoom panel —
   whose backing buffer always matches its actual displayed CSS size. Without this, a canvas with
   a fixed intrinsic width stretched by CSS width:100% renders circles as ellipses and blurs text
   at any width other than the one it was authored for; this makes every size responsive. */
function miniCanvas(parent, opts = {}) {
  const cv = el('canvas', 'cv img' + (opts.cls ? ' ' + opts.cls : ''));
  parent.appendChild(cv);
  const ctx = cv.getContext('2d');
  const st = { W: 360, H: 150, d: 1 };
  function paint() { if (opts.draw) { ctx.setTransform(st.d, 0, 0, st.d, 0, 0); opts.draw(ctx, st); } }
  function resize() {
    const r = cv.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
    st.d = window.devicePixelRatio || 1; st.W = r.width; st.H = r.height;
    cv.width = Math.round(r.width * st.d); cv.height = Math.round(r.height * st.d);
    paint();
  }
  const ro = new ResizeObserver(resize); ro.observe(cv); cleanups.push(() => ro.disconnect());
  return { cv, ctx, st, redraw: paint };
}

/* ----- controls ----- */
function slider(parent, o) {
  const row = el('div', 'ctl'), top = el('div', 'ctl-h'), lab = el('span', '', o.label), val = el('b'), inp = el('input');
  inp.type = 'range'; inp.min = o.min; inp.max = o.max; inp.step = o.step || 0.01; inp.value = o.value;
  const f = o.fmt || (v => fmt(v, 2));
  const upd = () => { val.textContent = f(+inp.value); };
  inp.addEventListener('input', () => { upd(); o.on && o.on(+inp.value); });
  inp.addEventListener('change', () => inp.blur());
  top.append(lab, val); row.append(top, inp); parent.appendChild(row); upd();
  return { get: () => +inp.value, set: v => { inp.value = v; upd(); }, el: row, inp };
}
function seg(parent, opts, value, on) {
  const box = el('div', 'seg'); const btns = {};
  for (const [k, label] of opts) { const b = el('button', k === value ? 'on' : '', label); b.onclick = () => { set(k); on(k); }; box.appendChild(b); btns[k] = b; }
  const set = k => { for (const j in btns) btns[j].classList.toggle('on', j === k); };
  parent.appendChild(box); return { set, el: box };
}
function check(parent, label, value, on) {
  const l = el('label', 'chk'), i = el('input'); i.type = 'checkbox'; i.checked = value;
  i.onchange = () => on(i.checked); l.append(i, document.createTextNode(' ' + label)); parent.appendChild(l);
  return { set: v => { i.checked = v; }, get: () => i.checked };
}
function button(parent, label, on) { const b = el('button', 'btn', label); b.onclick = on; parent.appendChild(b); return b; }
function heading(parent, t) { parent.appendChild(el('div', 'sub', t)); }
function layout(root, title, theory) {
  root.className = 'page';
  const stage = el('div', 'stage'); const side = el('aside', 'side');
  side.innerHTML = `<h2>${title}</h2>`;
  const ctl = el('div', 'controls'), out = el('div', 'readout'), th = el('details', 'theory'); th.open = true;
  th.innerHTML = `<summary>Key ideas</summary>${theory}`;
  side.append(ctl, out, th); root.append(stage, side);
  return { stage, ctl, out };
}
