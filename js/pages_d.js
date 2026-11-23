'use strict';
/* ===== Telescope-specific pages: magnification, field of view, plate scale ===== */

/* paraxial ray-transfer trace of a parallel beam at angle alpha(deg) through an afocal
   two-lens system (objective f_o at x=0, eyepiece f_e at x=d=f_o+f_e) */
function teleTrace(fo, fe, Dobj, alphaDeg, N) {
  const d = fo + fe, s0 = Math.tan(alphaDeg * rad), rays = [];
  for (const yL of linspace(-Dobj / 2, Dobj / 2, Math.max(N, 2))) {
    const s1 = s0 - yL / fo, yE = yL + s1 * d, s2 = s1 - yE / fe;
    rays.push({ yL, s1, yE, s2 });
  }
  return { d, s0, rays, hi: s0 * fo };
}
function mkStars(n, seed) {
  let s = seed; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  return Array.from({ length: n }, () => ({ x: rnd(), y: rnd(), r: 0.4 + rnd() * 1.8, b: 0.35 + rnd() * 0.65 }));
}
function drawStarfield(ctx, W, H, stars) {
  ctx.fillStyle = '#060a16'; ctx.fillRect(0, 0, W, H);
  for (const s of stars) { ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 7); ctx.fillStyle = `rgba(255,255,255,${s.b})`; ctx.fill(); }
}

/* ---------------------------------------------------------------- */
PAGES.push({
  id: 'telemag', title: 'Telescope magnification', group: 'Instruments', desc: 'M = f₀/f_e, the exit pupil, and why the two can’t be chosen independently',
  build(root) {
    const L = layout(root, 'Angular magnification of a telescope', `
      <p>A telescope does not make things bigger — it makes them <b>closer in angle</b>. Starlight arrives as a parallel beam tilted by α. The objective ($f_0$) bends it to a real image at its own focal plane, height $h=f_0\\tan\\alpha$. If the eyepiece ($f_e$) sits exactly $d=f_0+f_e$ away (<b>afocal</b>), that same point leaves the eyepiece as a parallel beam again, now tilted by β.</p>
      <p style="text-align:center">$$M=\\dfrac{\\tan\\beta}{\\tan\\alpha}=-\\dfrac{f_0}{f_e}$$ &nbsp;($f_e>0$ Keplerian, inverted &nbsp;·&nbsp; $f_e<0$ Galilean, upright)</p>
      <p>The <i>same</i> number falls out of the beam's width. The eyepiece re-images the whole objective aperture into a small bright disc behind it, the <b>exit pupil</b>: $D_{ep}=D_0\\cdot f_e/f_0$. Since $M=D_0/D_{ep}$, a high-power eyepiece is unavoidably a small, dim exit pupil — your eye's own pupil (≈ 5–7 mm dark-adapted) sets a practical ceiling on how little $D_{ep}$ should be.</p>`);
    const st = { fo: 8, fe: 2, Dobj: 3.2, alpha: 2.4, N: 9 };
    const v = new View(L.stage, {
      draw(c, v) {
        const fo = st.fo, fe = st.fe, Dobj = st.Dobj, d = fo + fe, tr = teleTrace(fo, fe, Dobj, st.alpha, st.N);
        v.fit(-6.5, d + 11, -4.6, 4.6); v.axis();
        for (const r of tr.rays) v.P([[-6, r.yL - tr.s0 * 6], [0, r.yL], [d, r.yE], [d + 9.5, r.yE + r.s2 * 9.5]], 'rgba(255,210,63,.55)', 1.3);
        v.lens(0, Dobj / 2 * 1.15, true); v.T('objective  f₀ = ' + fmt(fo), 0, -Dobj / 2 * 1.15 - 0.1, C.dim, 12, 'center', 0, 20);
        v.dot(fo, 0, 3, '#7a86b3'); v.dot(-fo, 0, 3, '#7a86b3');
        const apE = clamp(Dobj / 2 * Math.abs(fe) / fo * 1.9, 0.35, 2.5);
        v.lens(d, apE * 1.15, fe > 0); v.T('eyepiece  f_e = ' + fmt(fe), d, -apE * 1.15 - 0.1, C.dim, 12, 'center', 0, 20);
        v.dot(fo, tr.hi, 5, C.img); v.T('real image  h=' + fmt(tr.hi, 3), fo, tr.hi, C.img, 11, 'center', 0, tr.hi >= 0 ? -14 : 18);
        const vep = fe * (fo + fe) / fo, xep = d + vep, Dep = Math.abs(Dobj * fe / fo);
        if (vep > -0.2) {
          const g = c.createRadialGradient(v.X(xep), v.Y(0), 0, v.X(xep), v.Y(0), v.s * Dep * 0.6 + 3);
          g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.5, 'rgba(150,200,255,.55)'); g.addColorStop(1, 'rgba(120,180,255,0)');
          c.fillStyle = g; c.beginPath(); c.arc(v.X(xep), v.Y(0), v.s * Dep / 2 + 3, 0, 7); c.fill();
          v.T('exit pupil  D_ep=' + fmt(Dep, 2), xep, 0, '#fff', 11, 'center', 0, -18 - apE * 5);
        } else v.T('exit pupil is virtual, inside the tube (Galilean)', d + 0.6, -4.0, C.ray3, 12, 'left');
        const r0 = tr.rays[0], r1 = tr.rays[tr.rays.length - 1];
        v.T('α=' + fmt(st.alpha, 2) + '°', -6.3, (r0.yL - tr.s0 * 6 + r1.yL - tr.s0 * 6) / 2, C.ray, 12, 'left');
        v.T('β=' + fmt(Math.atan(r0.s2) * deg, 2) + '°', d + 9.3, (r0.yE + r0.s2 * 9.5 + r1.yE + r1.s2 * 9.5) / 2, C.ray2, 12, 'right', -4, 0);
      }
    });
    v.onChange = refresh;
    const sFo = slider(L.ctl, { label: 'Objective focal length f₀', min: 3, max: 20, step: 0.1, value: st.fo, fmt: x => fmt(x) + ' cm', on: x => { st.fo = x; refresh(); } });
    const sFe = slider(L.ctl, { label: 'Eyepiece focal length f_e  (negative = Galilean)', min: -6, max: 8, step: 0.1, value: st.fe, fmt: x => fmt(x) + ' cm', on: x => { st.fe = Math.abs(x) < 0.15 ? 0.15 * Math.sign(x || 1) : x; refresh(); } });
    slider(L.ctl, { label: 'Objective aperture D₀', min: 0.6, max: 5, step: 0.05, value: st.Dobj, fmt: x => fmt(x) + ' cm', on: x => { st.Dobj = x; refresh(); } });
    slider(L.ctl, { label: 'Star off-axis angle α', min: 0.1, max: 6, step: 0.05, value: st.alpha, fmt: x => fmt(x, 2) + '°', on: x => { st.alpha = x; refresh(); } });
    heading(L.ctl, 'Presets'); const pr = el('div', 'btnrow'); L.ctl.appendChild(pr);
    const setp = (fo, fe) => () => { st.fo = fo; st.fe = fe; sFo.set(fo); sFe.set(fe); refresh(); };
    button(pr, '8" Dob, 10 mm EP', setp(20, 1)); button(pr, 'Small refractor, 25 mm EP', setp(10, 2.5)); button(pr, 'Galilean opera glass', setp(6, -1.5));
    function refresh() {
      v.render(); const fo = st.fo, fe = st.fe, tr = teleTrace(fo, fe, st.Dobj, st.alpha, st.N);
      const Mformula = -fo / fe, Mangles = tr.rays[0].s2 / tr.s0, Dep = Math.abs(st.Dobj * fe / fo), Mpupil = st.Dobj / Dep;
      L.out.innerHTML = `<div class="box"><div class="row"><span>$M=-f_0/f_e$</span><b class="good">${fmt(Mformula, 2)}×</b></div>
       <div class="row"><span>$M=\\tan\\beta/\\tan\\alpha$ (traced)</span><b>${fmt(Mangles, 2)}×</b></div>
       <div class="row"><span>$M=D_0/D_{ep}$</span><b>${fmt(Math.sign(Mformula) * Mpupil, 2)}×</b></div>
       <div class="row"><span>exit pupil $D_{ep}$</span><b>${fmt(Dep, 2)} cm</b></div>
       <div class="row"><span>orientation</span><b>${Mformula < 0 ? 'inverted' : 'upright'}</b></div></div>
       <p class="hint">${Dep > 0.7 ? '$D_{ep}$ &gt; ~0.7 cm: comfortably brighter than your pupil needs.' : '$D_{ep}$ is getting small — the exit beam is narrower than a dark-adapted eye pupil (~0.5–0.7 cm): the view starts to dim.'}</p>`;
    }
    refresh();
  }
});

/* ---------------------------------------------------------------- */
PAGES.push({
  id: 'fov', title: 'Field of view', group: 'Instruments', desc: 'True vs. apparent field of view: TFOV = AFOV/M, set by the eyepiece field stop',
  build(root) {
    const L = layout(root, 'True field of view vs. apparent field of view', `
      <p>Every eyepiece has a metal ring at its internal focal plane, the <b>field stop</b> — whatever falls outside it is simply not relayed to your eye. The telescope’s objective places the sky’s real image exactly there (afocal system), so the field stop is what crops the sky.</p>
      <p>Looking <i>through</i> the eyepiece, that stop appears to span the eyepiece’s <b>apparent field of view</b> (AFOV, a spec of the eyepiece design, 40°–110°). On the sky it actually spans a much smaller <b>true field of view</b> (TFOV):</p>
      <p style="text-align:center">$$\\mathrm{TFOV}=\\dfrac{\\mathrm{AFOV}}{M}=\\mathrm{AFOV}\\cdot\\dfrac{f_e}{f_0}$$</p>
      <p>Bigger magnification always shrinks the true field — you trade a wider look at the sky for a closer look at one piece of it.</p>`);
    const st = { fo: 10, fe: 2, afov: 50, cmp: 'moon' };
    const stars = mkStars(140, 7);
    const sky = miniCanvas(L.stage, { draw: (sctx, sst) => drawSky(sctx, sst) });
    const v = new View(L.stage, {
      flex: 1.3,
      draw(c, v) {
        const fo = st.fo, fe = st.fe, d = fo + fe, M = fo / fe, afovR = st.afov * rad;
        const fieldStop = 2 * fe * Math.tan(afovR / 2); // diameter at the shared focal plane
        v.fit(-6.5, d + 9, -4.8, 4.8); v.axis();
        const tfovEdge = (afovR / 2) / M; // small-angle TFOV half-angle, same formula as the readout: TFOV = AFOV/M
        const N = 7;
        for (const f of linspace(-1, 1, N)) {
          const alpha = tfovEdge * f * deg, tr = teleTrace(fo, fe, 1.4, alpha, 3);
          const r = tr.rays[1] || tr.rays[0];
          v.L(-6, r.yL - tr.s0 * 6, 0, r.yL, `rgba(255,210,63,${0.25 + 0.5 * (1 - Math.abs(f))})`, 1.1);
          v.L(0, r.yL, d, r.yE, 'rgba(255,255,255,.3)', 1);
          v.L(d, r.yE, d + 8, r.yE + r.s2 * 8, `rgba(67,217,255,${0.25 + 0.5 * (1 - Math.abs(f))})`, 1.1);
        }
        v.lens(0, 1.6, true); v.T('objective', 0, -1.9, C.dim, 12, 'center', 0, 18);
        v.lens(d, Math.max(0.5, fieldStop / 2 * 0.6 + 0.4), fe > 0); v.T('eyepiece', d, -(Math.max(0.5, fieldStop / 2 * 0.6 + 0.4)) - 0.1, C.dim, 12, 'center', 0, 18);
        v.L(fo, -fieldStop / 2, fo, fieldStop / 2, '#ff9f43', 4); v.T('field stop  ⌀' + fmt(fieldStop, 2), fo, fieldStop / 2, '#ff9f43', 11, 'center', 0, -10);
        v.T('TFOV=' + fmt(tfovEdge * deg * 2, 2) + '°', -6.3, 4.5, C.ray, 12, 'left');
        v.T('AFOV=' + fmt(st.afov, 0) + '°', d + 8, 4.5, C.ray2, 12, 'right');
      }
    });
    function drawSky(sctx, sst) {
      const W = sst.W, H = sst.H;
      const fo = st.fo, fe = st.fe, tfov = st.afov * fe / fo; // degrees
      const refs = { none: 0, moon: 0.52, jupiter: 0.0083, pleiades: 1.8 };
      const ref = refs[st.cmp], win = Math.max(tfov, ref) * 1.5 + 0.05;
      drawStarfield(sctx, W, H, stars);
      const cx = W / 2, cy = H / 2, pxPerDeg = Math.min(W, H) / win;
      sctx.beginPath(); sctx.arc(cx, cy, tfov / 2 * pxPerDeg, 0, 7); sctx.strokeStyle = C.ray; sctx.lineWidth = 2; sctx.setLineDash([6, 5]); sctx.stroke(); sctx.setLineDash([]);
      sctx.fillStyle = C.ray; sctx.font = '12px Segoe UI'; sctx.textAlign = 'center'; sctx.fillText('your true field of view (' + fmt(tfov * 60, 1) + ' arcmin)', cx, cy + tfov / 2 * pxPerDeg + 16);
      if (ref > 0) {
        sctx.beginPath(); sctx.arc(cx, cy, ref / 2 * pxPerDeg, 0, 7);
        sctx.fillStyle = 'rgba(255,255,255,.12)'; sctx.fill(); sctx.strokeStyle = '#ffd23f'; sctx.lineWidth = 1.4; sctx.stroke();
        sctx.fillStyle = '#ffd23f'; sctx.fillText({ moon: 'full Moon, 31′', jupiter: 'Jupiter, 40″', pleiades: 'Pleiades core, ~1.8°' }[st.cmp], cx, cy - ref / 2 * pxPerDeg - 8);
      }
      sctx.strokeStyle = '#4a5684'; sctx.strokeRect(0, 0, W, H);
    }
    v.onChange = refresh;
    slider(L.ctl, { label: 'Objective focal length f₀', min: 3, max: 25, step: 0.1, value: st.fo, fmt: x => fmt(x) + ' cm', on: x => { st.fo = x; refresh(); } });
    slider(L.ctl, { label: 'Eyepiece focal length f_e', min: 0.5, max: 8, step: 0.05, value: st.fe, fmt: x => fmt(x) + ' cm', on: x => { st.fe = x; refresh(); } });
    slider(L.ctl, { label: 'Eyepiece apparent FOV (its spec)', min: 30, max: 110, step: 1, value: st.afov, fmt: x => fmt(x, 0) + '°', on: x => { st.afov = x; refresh(); } });
    seg(L.ctl, [['moon', 'Compare: full Moon'], ['pleiades', 'Pleiades'], ['jupiter', 'Jupiter'], ['none', 'none']], 'moon', k => { st.cmp = k; refresh(); });
    function refresh() {
      v.render(); sky.redraw();
      const fo = st.fo, fe = st.fe, M = fo / fe, tfov = st.afov / M;
      L.out.innerHTML = `<div class="box"><div class="row"><span>magnification $M=f_0/f_e$</span><b>${fmt(M, 2)}×</b></div>
       <div class="row"><span>$\\mathrm{TFOV}=\\mathrm{AFOV}/M$</span><b class="good">${fmt(tfov, 3)}° = ${fmt(tfov * 60, 2)}′</b></div>
       <div class="row"><span>field stop diameter at focal plane</span><b>${fmt(2 * fe * Math.tan(st.afov * rad / 2), 3)} cm</b></div></div>
       <p class="hint">Fixed eyepiece, bigger $f_0$ ⇒ bigger M ⇒ smaller TFOV. Fixed telescope, swapping to a longer-$f_e$ eyepiece lowers M and widens the true field.</p>`;
    }
    refresh();
  }
});

/* ---------------------------------------------------------------- */
PAGES.push({
  id: 'platescale', title: 'Plate scale: the 1/f theorem', group: 'Instruments', desc: 'arcsec on the sky ↔ mm on the detector: 206265/f — the IOAA workhorse formula',
  build(root) {
    const L = layout(root, 'Plate scale — angle on the sky, distance on the focal plane', `
      <p>A single lens or mirror of focal length f turns an angle θ on the sky into a real, measurable distance s on the focal plane: $s=f\\tan\\theta\\approx f\\theta$ (θ in radians, small-angle). Flip it around and you get the number every observational problem needs:</p>
      <p style="text-align:center">$$P = \\dfrac{206265}{f(\\mathrm{mm})}\\ \\left[\\tfrac{''}{\\mathrm{mm}}\\right]$$ (206265 = arcsec in a radian)</p>
      <p>Multiply by a sensor's pixel pitch to get arcsec/pixel, or by its full width to get the field of view it captures — exactly the same $1/f$ relation, just re-scaled.</p>`);
    const st = { f: 1000, theta: 600, pitch: 5.5, nx: 20, ny: 14, unit: 'arcsec' };
    const toRad = (val, unit) => unit === 'arcsec' ? val / 206265 : unit === 'arcmin' ? val / 3437.75 : val * rad;
    const v = new View(L.stage, {
      flex: 1.2,
      draw(c, v) {
        // schematic is drawn at a fixed, exaggerated scale (real plate-scale angles/separations are
        // far too small to see) — the real numbers, at the real f, live in the readout and the zoom panel
        const fV = 8, half = 5 * rad; v.fit(-9, fV + 4.5, -5, 5); v.axis();
        v.lens(0, 2.4, true); v.T('f = ' + fmt(st.f, 0) + ' mm', 0, -2.6, C.dim, 12, 'center', 0, 18);
        for (const [sgn, col] of [[1, C.ray], [-1, C.ray2]]) {
          const a = sgn * half;
          for (const yL of linspace(-2.2, 2.2, 7)) { const s1 = Math.tan(a) - yL / fV; v.L(-8, yL - Math.tan(a) * 8, 0, yL, col + 'aa', 1); v.L(0, yL, fV, yL + s1 * fV, col, 1.4); }
        }
        const sV = fV * 2 * Math.tan(half);
        v.L(fV, -sV / 2 - 0.6, fV, sV / 2 + 0.6, '#c9d3ff', 4); v.T('focal plane', fV, sV / 2 + 0.6, C.dim, 12, 'center', 0, -10);
        v.dot(fV, sV / 2, 4, C.ray); v.dot(fV, -sV / 2, 4, C.ray2);
        v.T('θ=' + fmt(st.theta, 0) + ' ' + st.unit, -8.6, 2.6, '#fff', 12, 'left');
        v.T('(angle drawn exaggerated — see numbers →)', fV, -sV / 2 - 0.9, C.dim, 11, 'center');
      }
    });
    const zoom = miniCanvas(L.stage, { draw: (zctx, zst) => drawZoom(zctx, zst) });
    function drawZoom(zctx, zst) {
      const thetaRad = toRad(st.theta, st.unit), s_mm = st.f * Math.tan(thetaRad); // mm, small separations
      const pitch_mm = st.pitch / 1000, W = zst.W, H = zst.H;
      const span_mm = Math.max(Math.abs(s_mm) * 1.6, pitch_mm * 6);
      const px = x_mm => W / 2 + x_mm / span_mm * W * 0.42;
      zctx.fillStyle = '#060a16'; zctx.fillRect(0, 0, W, H);
      zctx.strokeStyle = 'rgba(120,140,200,.35)'; zctx.lineWidth = 1;
      // if pixels are too fine to draw individually (sub-pixel spacing on screen), only draw every Nth
      // gridline so the panel reads as a sparse grid instead of a solid blur
      const onePxOnScreen = (pitch_mm / span_mm) * W * 0.42;
      const stride = Math.max(1, Math.ceil(3 / Math.max(onePxOnScreen, 1e-6)));
      for (let x = Math.floor(-span_mm / pitch_mm / stride) * stride; x <= span_mm / pitch_mm; x += stride) { zctx.beginPath(); zctx.moveTo(px(x * pitch_mm), 0); zctx.lineTo(px(x * pitch_mm), H); zctx.stroke(); }
      zctx.strokeStyle = 'rgba(120,140,200,.5)'; zctx.strokeRect(0, 0, W, H);
      zctx.beginPath(); zctx.arc(px(s_mm / 2), H / 2, 6, 0, 7); zctx.fillStyle = wl2rgb(600); zctx.fill();
      zctx.beginPath(); zctx.arc(px(-s_mm / 2), H / 2, 6, 0, 7); zctx.fillStyle = wl2rgb(480); zctx.fill();
      zctx.fillStyle = '#93a0cb'; zctx.font = '12px Segoe UI'; zctx.textAlign = 'center';
      zctx.fillText('separation on the chip: ' + fmt(Math.abs(s_mm), 4) + ' mm  =  ' + fmt(Math.abs(s_mm) / pitch_mm, 2) + ' px  (pixel pitch ' + fmt(st.pitch, 1) + ' µm)', W / 2, H - 10);
    }
    v.onChange = refresh;
    seg(L.ctl, [['arcsec', 'θ in arcsec'], ['arcmin', 'θ in arcmin'], ['deg', 'θ in degrees']], 'arcsec', k => { st.unit = k; st.theta = k === 'arcsec' ? 600 : k === 'arcmin' ? 10 : 0.17; sTh.set(st.theta); refresh(); });
    const sTh = slider(L.ctl, { label: 'Angular separation θ', min: 1, max: 1800, step: 1, value: st.theta, fmt: x => fmt(x, 0) + ' ' + st.unit, on: x => { st.theta = x; refresh(); } });
    const sf = slider(L.ctl, { label: 'Focal length f', min: 50, max: 10000, step: 10, value: st.f, fmt: x => fmt(x, 0) + ' mm', on: x => { st.f = x; refresh(); } });
    slider(L.ctl, { label: 'Pixel pitch', min: 1, max: 25, step: 0.1, value: st.pitch, fmt: x => fmt(x, 1) + ' µm', on: x => { st.pitch = x; refresh(); } });
    slider(L.ctl, { label: 'Sensor width (pixels)', min: 500, max: 9000, step: 10, value: 4000, fmt: x => fmt(x, 0) + ' px', on: x => { st.sensorPx = x; refresh(); } });
    heading(L.ctl, 'Presets'); const pr = el('div', 'btnrow'); L.ctl.appendChild(pr);
    const setf = fv => () => { st.f = fv; sf.set(fv); refresh(); };
    button(pr, '50 mm camera lens', setf(50)); button(pr, '8" f/5 Newtonian (f=1000mm)', setf(1000)); button(pr, '1 m research telescope (f=10 m)', setf(10000));
    function refresh() {
      v.render(); zoom.redraw();
      const thetaRad = toRad(st.theta, st.unit), s_mm = st.f * Math.tan(thetaRad), s_approx = st.f * thetaRad;
      const P = 206265 / st.f, arcsecPerPx = P * st.pitch / 1000, sensorPx = st.sensorPx || 4000, fovDeg = P * sensorPx * (st.pitch / 1000) / 3600;
      L.out.innerHTML = `<div class="box"><div class="row"><span>$s=f\\tan\\theta$ (exact)</span><b class="good">${fmt(s_mm, 5)} mm</b></div>
       <div class="row"><span>$s\\approx f\\theta$ (small-angle)</span><b>${fmt(s_approx, 5)} mm</b></div>
       <div class="row"><span>plate scale $P=206265/f$</span><b class="good">${fmt(P, 3)} ″/mm</b></div>
       <div class="row"><span>arcsec per pixel</span><b class="good">${fmt(arcsecPerPx, 3)} ″/px</b></div>
       <div class="row"><span>sensor field of view (${fmt(sensorPx, 0)} px wide)</span><b>${fmt(fovDeg, 3)}° = ${fmt(fovDeg * 60, 1)}′</b></div></div>
       <p class="hint">This is the formula behind almost every IOAA data-analysis question: a star trail of x mm on a plate of focal length f mm drifted x·P arcseconds across the sky.</p>`;
    }
    st.sensorPx = 4000; refresh();
  }
});
