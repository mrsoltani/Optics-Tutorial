'use strict';
/* ===== Real (thick) lens with exact Snell tracing, optical bench, diffraction ===== */

function hitSurf(p, d, xv, R) {
  if (!isFinite(R)) { if (Math.abs(d[0]) < 1e-12) return null; const t = (xv - p[0]) / d[0]; return t < 1e-9 ? null : { t, n: [1, 0] }; }
  const cx = xv + R, ax = Math.abs(R), ox = p[0] - cx, oy = p[1];
  const b = ox * d[0] + oy * d[1], cc = ox * ox + oy * oy - R * R, disc = b * b - cc; if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  for (const t of [-b - sq, -b + sq]) {
    if (t < 1e-9) continue; const x = p[0] + t * d[0];
    if (R > 0 ? x <= cx : x >= cx) return { t, n: [(x - cx) / ax, (p[1] + t * d[1]) / ax] };
  }
  return null;
}
const sagOf1 = (xv, r, y) => !isFinite(r) ? xv : xv + r - Math.sign(r) * Math.sqrt(Math.max(0, r * r - y * y));

PAGES.push({
  id: 'lensmaker', title: "Proof: the lensmaker's equation", group: 'Lenses', desc: 'One surface, paraxial Snell, then two surfaces cancel into 1/f',
  build(root) {
    const L = layout(root, "Where $\\dfrac{1}{f}=(n-1)\\left(\\dfrac{1}{R_1}-\\dfrac{1}{R_2}\\right)$ comes from", `
      <p><b>Step 1 — a single spherical surface.</b> A ray leaves the axial object O at height h and hits the surface at P. The <b>normal</b> at P always passes through the centre of curvature C. Three small angles (paraxial: $\\sin\\theta\\approx\\theta$):</p>
      <p style="text-align:center">$$\\alpha=\\dfrac{h}{u}\\ \\text{(ray to axis, object space)}\\qquad \\varphi=\\dfrac{h}{R}\\ \\text{(normal to axis)}\\qquad \\alpha'=\\dfrac{h}{v}\\ \\text{(ray to axis, image space)}$$</p>
      <p>By the exterior-angle rule, $\\theta_1=\\alpha+\\varphi$ (incidence) and $\\theta_2=\\varphi-\\alpha'$ (refraction). Snell's law $n_1\\sin\\theta_1=n_2\\sin\\theta_2$ becomes, paraxially, $n_1(\\alpha+\\varphi)=n_2(\\varphi-\\alpha')$. Substitute and divide by h:</p>
      <p style="text-align:center">$$\\dfrac{n_1}{u}+\\dfrac{n_2}{v}=\\dfrac{n_2-n_1}{R}$$ — exact only as h → 0. For a real (large-h) ray, Snell uses sinθ, not θ: that gap is <b>spherical aberration</b>, visible below.</p>
      <p><b>Step 2 — two surfaces make a lens.</b> Surface 1 ($n_1=1\\to n$) images O to an intermediate point $I_1$. For a <i>thin</i> lens ($t\\to0$), $I_1$ is instantly the object for surface 2 ($n\\to1$), at the same height, so $u_2=-v_1$. Write both surface equations and add — $v_1$ cancels exactly:</p>
      <p style="text-align:center">$$\\dfrac{1}{u}+\\dfrac{n}{v_1}=\\dfrac{n-1}{R_1} \\quad\\text{and}\\quad \\dfrac{n}{-v_1}+\\dfrac{1}{v}=\\dfrac{1-n}{R_2} \\quad\\Longrightarrow\\quad \\dfrac{1}{u}+\\dfrac{1}{v}=(n-1)\\left(\\dfrac{1}{R_1}-\\dfrac{1}{R_2}\\right)=\\dfrac{1}{f}$$</p>`);
    const st = { mode: 'single', u: 10, c: 0.18, n2: 1.5, h: 1.5, N: 11, Hray: 2.3, c1: 0.18, c2: -0.18, n: 1.5, u2: 10, t: 0.5, N2: 9 };

    function singleCalc(R, n2, u, h) {
      const P = [sagOf1(0, R, h), h], normal = norm([P[0] - R, P[1]]);
      const d1 = norm([P[0] + u, P[1]]);
      const d2 = refract(d1, normal, 1, n2);
      let vE = NaN; if (d2 && Math.abs(d2[1]) > 1e-9) vE = P[0] - P[1] / d2[1] * d2[0];
      const th1 = d2 ? Math.acos(clamp(Math.abs(d1[0] * normal[0] + d1[1] * normal[1]), -1, 1)) * deg : NaN;
      const th2 = d2 ? Math.acos(clamp(Math.abs(d2[0] * normal[0] + d2[1] * normal[1]), -1, 1)) * deg : NaN;
      return { P, normal, d1, d2, vE, th1, th2 };
    }
    function vParax1(R, n2, u) { return isFinite(R) ? n2 / ((n2 - 1) / R - 1 / u) : -u * n2; }
    function twoCalc(R1, R2, n, t, u, h) {
      const P1 = [sagOf1(-t / 2, R1, h), h], n1v = norm([P1[0] - (-t / 2 + R1), h]);
      const d1 = norm([P1[0] + u, h]); const dm = refract(d1, n1v, 1, n); if (!dm) return null;
      const hit = hitSurf(P1, dm, t / 2, R2); if (!hit) return null;
      const P2 = [P1[0] + hit.t * dm[0], P1[1] + hit.t * dm[1]];
      const dout = refract(dm, hit.n, n, 1); if (!dout) return null;
      let vE = NaN; if (Math.abs(dout[1]) > 1e-9) vE = P2[0] - P2[1] / dout[1] * dout[0];
      let v1 = NaN; if (Math.abs(dm[1]) > 1e-9) v1 = P1[0] - P1[1] / dm[1] * dm[0];
      return { P1, P2, d1, dm, dout, vE, v1 };
    }
    function fParax2(R1, R2, n, t) { const c1 = 1 / R1, c2 = 1 / R2; return 1 / ((n - 1) * (c1 - c2 + (n - 1) * t * c1 * c2 / n)); }
    const v = new View(L.stage, {
      draw(c, v) {
        if (st.mode === 'single') {
          v.fit(-16, 14, -6.2, 6.2); v.axis();
          const R = st.c === 0 ? Infinity : 1 / st.c, Hray = isFinite(R) ? Math.min(st.Hray, Math.abs(R) * 0.95) : st.Hray;
          v.fillP([[0, -6.2], [16, -6.2], [16, 6.2], [0, 6.2]], `rgba(90,150,255,${0.05 + 0.1 * (st.n2 - 1)})`);
          v.P(linspace(Hray, -Hray, 60).map(y => [sagOf1(0, R, y), y]), C.glassEdge, 3);
          if (isFinite(R)) { v.dot(R, 0, 4, '#b78cff'); v.T('C', R, 0, '#b78cff', 12, 'center', 0, -10); }
          v.dot(-st.u, 0, 6, C.obj); v.T('O', -st.u, 0, C.obj, 13, 'center', 0, -12);
          v.T('n₁ = 1', -14.5, 5.4, C.dim, 13); v.T('n₂ = ' + fmt(st.n2), 13, 5.4, C.dim, 13, 'right');
          const hs = st.Hray <= 0 ? [0] : linspace(-Hray, Hray, st.N);
          const crossings = [];
          for (const hy of hs) {
            const r = singleCalc(R, st.n2, st.u, hy); if (!r.d2) continue; crossings.push(r.vE);
            v.L(-st.u, 0, r.P[0], r.P[1], 'rgba(255,210,63,.45)', 1.1);
            const T = (14 - r.P[0]) / (r.d2[0] || 1e-9); if (T > 0) v.L(r.P[0], r.P[1], r.P[0] + T * r.d2[0], r.P[1] + T * r.d2[1], 'rgba(67,217,255,.55)', 1.1);
          }
          const g = singleCalc(R, st.n2, st.u, clamp(st.h, -Hray, Hray));
          v.ray(-st.u, 0, g.P[0], g.P[1], C.ray, 2.6); if (g.d2) { const T = (14 - g.P[0]) / g.d2[0]; v.ray(g.P[0], g.P[1], g.P[0] + T * g.d2[0], g.P[1] + T * g.d2[1], C.ray2, 2.6); }
          if (isFinite(R)) v.L(g.P[0] - 1.4 * g.normal[0] * Math.sign(R), g.P[1] - 1.4 * g.normal[1] * Math.sign(R), g.P[0] + 2.4 * g.normal[0] * Math.sign(R), g.P[1] + 2.4 * g.normal[1] * Math.sign(R), '#7a86b3', 1.3, [5, 5]);
          const vPar = vParax1(R, st.n2, st.u);
          if (isFinite(g.vE)) { v.dot(g.vE, 0, 5, '#fff'); v.T('exact', g.vE, 0, '#fff', 11, 'center', 0, -14); }
          if (isFinite(vPar)) { v.L(vPar, -0.5, vPar, 0.5, C.img, 2.5); v.T('paraxial v', vPar, 0, C.img, 11, 'center', 0, 20); }
          v.dot(0, 0, 3, '#fff');
        } else {
          v.fit(-16, 14, -6.2, 6.2); v.axis();
          const R1 = st.c1 === 0 ? Infinity : 1 / st.c1, R2 = st.c2 === 0 ? Infinity : 1 / st.c2, t = st.t, n = st.n;
          const Hmax = Math.min(2.6, isFinite(R1) ? Math.abs(R1) * 0.9 : 9, isFinite(R2) ? Math.abs(R2) * 0.9 : 9);
          const body = []; for (const y of linspace(Hmax, -Hmax, 40)) body.push([sagOf1(-t / 2, R1, y), y]); for (const y of linspace(-Hmax, Hmax, 40)) body.push([sagOf1(t / 2, R2, y), y]);
          v.fillP(body, C.glass, C.glassEdge, 2.2);
          v.dot(-st.u2, 0, 6, C.obj); v.T('O', -st.u2, 0, C.obj, 13, 'center', 0, -12);
          const hs2 = linspace(-Hmax, Hmax, st.N2); let v1mark = NaN;
          for (const hy of hs2) {
            const r = twoCalc(R1, R2, n, t, st.u2, hy); if (!r) continue;
            v.L(-st.u2, 0, r.P1[0], r.P1[1], 'rgba(255,210,63,.4)', 1);
            v.L(r.P1[0], r.P1[1], r.P2[0], r.P2[1], 'rgba(255,255,255,.35)', 1);
            const T = (14 - r.P2[0]) / (r.dout[0] || 1e-9); if (T > 0) v.L(r.P2[0], r.P2[1], r.P2[0] + T * r.dout[0], r.P2[1] + T * r.dout[1], 'rgba(67,217,255,.5)', 1);
          }
          const g2 = twoCalc(R1, R2, n, t, st.u2, clamp(0.9, -Hmax, Hmax)) || twoCalc(R1, R2, n, t, st.u2, Hmax * 0.4);
          if (g2) {
            v.ray(-st.u2, 0, g2.P1[0], g2.P1[1], C.ray, 2.4); v.ray(g2.P1[0], g2.P1[1], g2.P2[0], g2.P2[1], '#fff', 2.4);
            if (g2.dout) { const T = (14 - g2.P2[0]) / g2.dout[0]; v.ray(g2.P2[0], g2.P2[1], g2.P2[0] + T * g2.dout[0], g2.P2[1] + T * g2.dout[1], C.ray2, 2.4); }
            if (isFinite(g2.v1)) { v.dot(g2.v1, 0, 5, '#b78cff'); v.T('I₁ (virtual object for surface 2)', g2.v1, 0, '#b78cff', 11, 'center', 0, 20); }
            if (isFinite(g2.vE)) { v.dot(g2.vE, 0, 5, '#fff'); v.T('exact image', g2.vE, 0, '#fff', 11, 'center', 0, -14); }
          }
          const fP = fParax2(R1, R2, n, t), vPar2 = 1 / (1 / fP - 1 / st.u2);
          if (isFinite(vPar2)) { v.L(vPar2, -0.5, vPar2, 0.5, C.img, 2.5); v.T('paraxial v (lensmaker)', vPar2, 0, C.img, 11, 'center', 0, 36); }
        }
      }
    });
    v.onChange = refresh;
    seg(L.ctl, [['single', 'Single surface'], ['two', 'Two surfaces (lens)']], 'single', k => { st.mode = k; build(); refresh(); });
    const dyn = el('div'); L.ctl.appendChild(dyn);
    function build() {
      dyn.innerHTML = '';
      if (st.mode === 'single') {
        slider(dyn, { label: 'Object distance u', min: 2, max: 16, step: 0.1, value: st.u, fmt: x => fmt(x) + ' cm', on: x => { st.u = x; refresh(); } });
        slider(dyn, { label: 'Curvature 1/R', min: -0.5, max: 0.5, step: 0.01, value: st.c, fmt: x => fmt(x) + ' /cm', on: x => { st.c = x; refresh(); } });
        slider(dyn, { label: 'n₂', min: 1.1, max: 2.4, step: 0.01, value: st.n2, on: x => { st.n2 = x; refresh(); } });
        slider(dyn, { label: 'Aperture (max ray height)', min: 0.05, max: 3, step: 0.05, value: st.Hray, fmt: x => fmt(x) + ' cm', on: x => { st.Hray = x; refresh(); } });
        slider(dyn, { label: 'Highlighted ray height h', min: -3, max: 3, step: 0.05, value: st.h, fmt: x => fmt(x) + ' cm', on: x => { st.h = x; refresh(); } });
        slider(dyn, { label: 'Rays in the fan', min: 3, max: 25, step: 2, value: st.N, fmt: x => fmt(x, 0), on: x => { st.N = x; refresh(); } });
        button(dyn, 'Shrink aperture to ~paraxial (watch the gap close)', () => { st.Hray = 0.08; refresh(); });
      } else {
        slider(dyn, { label: 'Object distance u', min: 3, max: 16, step: 0.1, value: st.u2, fmt: x => fmt(x) + ' cm', on: x => { st.u2 = x; refresh(); } });
        slider(dyn, { label: 'Curvature 1/R₁', min: -0.5, max: 0.5, step: 0.01, value: st.c1, fmt: x => fmt(x) + ' /cm', on: x => { st.c1 = x; refresh(); } });
        slider(dyn, { label: 'Curvature 1/R₂', min: -0.5, max: 0.5, step: 0.01, value: st.c2, fmt: x => fmt(x) + ' /cm', on: x => { st.c2 = x; refresh(); } });
        slider(dyn, { label: 'Refractive index n', min: 1.1, max: 2.4, step: 0.01, value: st.n, on: x => { st.n = x; refresh(); } });
        slider(dyn, { label: 'Thickness t  (→ 0: watch v₁ cancel)', min: 0.02, max: 3, step: 0.02, value: st.t, fmt: x => fmt(x) + ' cm', on: x => { st.t = x; refresh(); } });
        slider(dyn, { label: 'Rays in the fan', min: 3, max: 21, step: 2, value: st.N2, fmt: x => fmt(x, 0), on: x => { st.N2 = x; refresh(); } });
        button(dyn, 'Shrink to a thin lens (t → 0)', () => { st.t = 0.02; refresh(); });
      }
    }
    function refresh() {
      v.render();
      if (st.mode === 'single') {
        const R = st.c === 0 ? Infinity : 1 / st.c, Hray = isFinite(R) ? Math.min(st.Hray, Math.abs(R) * 0.95) : st.Hray;
        const g = singleCalc(R, st.n2, st.u, clamp(st.h, -Hray, Hray)), vPar = vParax1(R, st.n2, st.u);
        const hs = linspace(-Hray, Hray, Math.max(st.N, 3)).map(hy => singleCalc(R, st.n2, st.u, hy).vE).filter(isFinite);
        const spread = hs.length ? Math.max(...hs) - Math.min(...hs) : 0;
        L.out.innerHTML = `<div class="box"><div class="row"><span>$\\alpha=h/u$</span><b>${fmt(st.h / st.u * deg, 2)}°</b></div>
         <div class="row"><span>$\\varphi=h/R$</span><b>${isFinite(R) ? fmt(st.h / R * deg, 2) + '°' : '0° (flat)'}</b></div>
         <div class="row"><span>$\\theta_1$ exact (Snell)</span><b>${fmt(g.th1, 2)}°</b></div><div class="row"><span>$\\theta_2$ exact (Snell)</span><b>${fmt(g.th2, 2)}°</b></div>
         <div class="row"><span>$n_1\\sin\\theta_1$ vs $n_2\\sin\\theta_2$</span><b class="good">${fmt(Math.sin(g.th1 * rad), 4)} = ${fmt(st.n2 * Math.sin(g.th2 * rad), 4)}</b></div>
         <div class="row"><span>v exact (ray trace)</span><b>${isFinite(g.vE) ? fmt(g.vE) + ' cm' : '—'}</b></div>
         <div class="row"><span>v paraxial &nbsp;($\\frac{n_1}{u}+\\frac{n_2}{v}=\\frac{n_2-n_1}{R}$)</span><b class="good">${fmt(vPar)} cm</b></div>
         <div class="row"><span>spread across the whole fan</span><b class="${spread < 0.05 ? 'good' : 'bad'}">${fmt(spread, 3)} cm</b></div></div>
         <p class="hint">${spread < 0.05 ? 'Narrow aperture: every ray meets paraxial v — the formula is confirmed.' : 'Wide aperture: rays miss a common point — spherical aberration. The lensmaker formula is a <i>first-order</i> (small h) truth.'}</p>`;
      } else {
        const R1 = st.c1 === 0 ? Infinity : 1 / st.c1, R2 = st.c2 === 0 ? Infinity : 1 / st.c2;
        const fP = fParax2(R1, R2, st.n, st.t), vPar2 = 1 / (1 / fP - 1 / st.u2);
        const g2 = twoCalc(R1, R2, st.n, st.t, st.u2, 0.9) || { v1: NaN, vE: NaN };
        L.out.innerHTML = `<div class="box"><div class="row"><span>$f=1/\\left[(n-1)\\left(\\frac{1}{R_1}-\\frac{1}{R_2}+\\dots\\right)\\right]$</span><b class="good">${fmt(fP)} cm</b></div>
         <div class="row"><span>v paraxial (thin-lens eq.)</span><b>${fmt(vPar2)} cm</b></div>
         <div class="row"><span>v exact (two-surface trace)</span><b>${isFinite(g2.vE) ? fmt(g2.vE) + ' cm' : '—'}</b></div>
         <div class="row"><span>intermediate image $v_1$ (surface 1 alone)</span><b>${isFinite(g2.v1) ? fmt(g2.v1) + ' cm' : '—'}</b></div>
         <div class="row"><span>agreement (exact − paraxial)</span><b class="${Math.abs(g2.vE - vPar2) < 0.15 ? 'good' : 'bad'}">${isFinite(g2.vE) ? fmt(g2.vE - vPar2, 3) + ' cm' : '—'}</b></div></div>
         <p class="hint">v₁ never has to be measured: it cancels algebraically between the two surface equations. As t → 0 the exact trace locks onto the lensmaker prediction.</p>`;
      }
    }
    build(); refresh();
  }
});

PAGES.push({
  id: 'reallens', title: 'Real lens: lensmaker & aberrations', group: 'Lenses', desc: 'Exact Snell tracing through two spherical surfaces',
  build(root) {
    const L = layout(root, 'A real lens, ray by ray', `
      <p>A thin lens is a model. A real lens is two spherical surfaces; every ray obeys Snell’s law at each one.</p>
      <p><b>Lensmaker's equation</b> (thickness t): $$\\dfrac{1}{f} = (n-1)\\left[\\dfrac{1}{R_1}-\\dfrac{1}{R_2}+\\dfrac{(n-1)t}{nR_1R_2}\\right]$$ thin lens: $t\\to0$. Convention: R &gt; 0 when the centre of curvature lies to the right of the surface. (See the full <a href="#/lensmaker">derivation</a>.)</p>
      <ul><li><b>Spherical aberration:</b> marginal rays focus closer than paraxial ones. Bend the lens (plano-convex with the <i>curved side toward the parallel light</i>) and it nearly halves!</li>
      <li><b>Chromatic aberration:</b> n is larger for blue → blue focuses closer. Achromatic doublets cancel it.</li>
      <li>Stopping down (smaller aperture) reduces aberration, at the cost of light and diffraction.</li></ul>`);
    const st = { c1: 0.15, c2: -0.15, n: 1.52, t: 1.0, H: 2.2, N: 15, inf: true, u: 9, chrom: false, D: 0.03 };
    const R = c => c === 0 ? Infinity : 1 / c;
    function sagOf(xv, r, y) { if (!isFinite(r)) return xv; return xv + r - Math.sign(r) * Math.sqrt(r * r - y * y); }
    /* largest semi-diameter for which the two surfaces exist and do not cross */
    const Hphys = () => {
      const r1 = R(st.c1), r2 = R(st.c2); let h = 0;
      for (; h < 3.2; h += 0.02) {
        const y = h + 0.02; if (y >= 0.97 * Math.abs(r1) || y >= 0.97 * Math.abs(r2)) break;
        if (sagOf(-st.t / 2, r1, y) > sagOf(st.t / 2, r2, y) - 0.03) break;
      } return Math.max(h, 0.1);
    };
    const Hm = () => Math.min(st.H, Hphys());
    function trace(p, d, n) {
      const pts = [p.slice()], xs = [-st.t / 2, st.t / 2], Rs = [R(st.c1), R(st.c2)];
      for (let k = 0; k < 2; k++) {
        const h = hitSurf(p, d, xs[k], Rs[k]); if (!h) return { pts, dead: true };
        p = [p[0] + h.t * d[0], p[1] + h.t * d[1]]; if (Math.abs(p[1]) > Hphys() + 1e-9) return { pts, dead: true }; pts.push(p.slice());
        d = refract(d, h.n, k ? n : 1, k ? 1 : n); if (!d) return { pts, dead: true };
      }
      const xc = Math.abs(d[1]) > 1e-9 && d[1] * -p[1] > 0 ? p[0] - p[1] * d[0] / d[1] : NaN;
      return { pts, p, d, xc };
    }
    function launch(y, n) {
      if (st.inf) return trace([-8, y], [1, 0], n);
      return trace([-st.u, 0], norm([-st.t / 2 + st.u, y]), n);
    }
    const nn = lam => nOf(st.n, st.D, lam);
    const v = new View(L.stage, {
      draw(c, v) {
        v.fit(-9, 14, -4.6, 4.6); v.axis(); const Hh = Hphys(), hm = Hm();
        // glass body
        const body = []; for (const y of linspace(Hh, -Hh, 40)) body.push([sagOf(-st.t / 2, R(st.c1), y), y]); for (const y of linspace(-Hh, Hh, 40)) body.push([sagOf(st.t / 2, R(st.c2), y), y]);
        v.fillP(body, C.glass, C.glassEdge, 2.5);
        if (hm < Hh) { v.L(-st.t / 2, hm, -st.t / 2, Hh + 0.4, '#7a86b3', 6); v.L(-st.t / 2, -hm, -st.t / 2, -Hh - 0.4, '#7a86b3', 6); }
        if (!st.inf) { v.dot(-st.u, 0, 6, C.obj); v.T('object', -st.u, 0, C.obj, 13, 'center', 0, -12); }
        const sets = st.chrom ? [[0.45, 'rgb(90,150,255)'], [0.55, 'rgb(90,255,120)'], [0.68, 'rgb(255,80,80)']] : [[0.589, null]];
        c.globalCompositeOperation = st.chrom ? 'lighter' : 'source-over';
        for (const [lam, col0] of sets) {
          const n = nn(lam);
          for (const [i, y] of linspace(-hm, hm, st.chrom ? Math.max(5, st.N | 0) : st.N).entries()) {
            const r = launch(y, n); const f = Math.abs(y) / Math.max(hm, 1e-6), col = col0 || `hsl(${50 - 160 * f}, 95%, 60%)`;
            v.P(r.pts, col, st.chrom ? 1.4 : 1.6); if (r.dead) continue;
            const T = (13 - r.p[0]) / r.d[0]; if (T > 0) v.P([r.p, [r.p[0] + T * r.d[0], r.p[1] + T * r.d[1]]], col, st.chrom ? 1.4 : 1.6);
            if (!st.inf && i === 0 && false) { }
          }
        }
        c.globalCompositeOperation = 'source-over';
        const g = info(); if (isFinite(g.xp)) { v.dot(g.xp, 0, 5, '#fff'); v.T('paraxial focus', g.xp, 0, '#fff', 12, 'center', 0, 22); }
        if (isFinite(g.xm) && Math.abs(g.xm - g.xp) > 0.03) { v.dot(g.xm, 0, 5, C.ray3); v.T('marginal focus', g.xm, 0, C.ray3, 12, 'center', 0, -14); }
      }
    });
    v.onChange = refresh;
    function info() {
      const n = nn(0.589), c1 = st.c1, c2 = st.c2, P = (n - 1) * (c1 - c2 + (n - 1) * st.t * c1 * c2 / n), f = 1 / P;
      const par = launch(0.005, n), mar = launch(Hm(), n);
      const b = nn(0.45), r = nn(0.68), fb = launch(0.005, b), fr = launch(0.005, r);
      return { f, xp: par.xc, xm: mar.xc, xb: fb.xc, xr: fr.xc, n };
    }
    const sc1 = slider(L.ctl, { label: 'Curvature 1/R₁ of the front surface', min: -0.5, max: 0.5, step: 0.01, value: st.c1, fmt: x => fmt(x) + ' /cm ' + (Math.abs(x) < 0.005 ? '(flat)' : '(R=' + fmt(1 / x, 1) + ')'), on: x => { st.c1 = x; refresh(); } });
    const sc2 = slider(L.ctl, { label: 'Curvature 1/R₂ of the back surface', min: -0.5, max: 0.5, step: 0.01, value: st.c2, fmt: x => fmt(x) + ' /cm ' + (Math.abs(x) < 0.005 ? '(flat)' : '(R=' + fmt(1 / x, 1) + ')'), on: x => { st.c2 = x; refresh(); } });
    heading(L.ctl, 'Shapes'); const pr = el('div', 'btnrow'); L.ctl.appendChild(pr);
    const shape = (a, b) => () => { st.c1 = a; st.c2 = b; sc1.set(a); sc2.set(b); refresh(); };
    button(pr, 'Biconvex', shape(0.15, -0.15)); button(pr, 'Plano-convex ▶ curved side first', shape(0.3, 0)); button(pr, 'Plano-convex ▶ flat side first', shape(0, -0.3));
    button(pr, 'Meniscus', shape(0.3, 0.12)); button(pr, 'Biconcave', shape(-0.2, 0.2));
    slider(L.ctl, { label: 'Refractive index n', min: 1.3, max: 2.4, step: 0.01, value: st.n, on: x => { st.n = x; refresh(); } });
    slider(L.ctl, { label: 'Thickness t', min: 0, max: 3, step: 0.05, value: st.t, fmt: x => fmt(x) + ' cm', on: x => { st.t = x; refresh(); } });
    slider(L.ctl, { label: 'Aperture (ray half-height)', min: 0.2, max: 3.2, step: 0.05, value: st.H, fmt: x => fmt(x) + ' cm', on: x => { st.H = x; refresh(); } });
    slider(L.ctl, { label: 'Number of rays', min: 3, max: 41, step: 2, value: st.N, fmt: x => fmt(x, 0), on: x => { st.N = x; refresh(); } });
    check(L.ctl, 'Source at infinity (parallel beam)', true, b => { st.inf = b; refresh(); });
    slider(L.ctl, { label: 'Point source distance (if finite)', min: 3, max: 12, step: 0.1, value: st.u, fmt: x => fmt(x) + ' cm', on: x => { st.u = x; refresh(); } });
    check(L.ctl, 'Chromatic aberration (3 colours)', false, b => { st.chrom = b; refresh(); });
    slider(L.ctl, { label: 'Dispersion strength', min: 0, max: 0.12, step: 0.002, value: st.D, fmt: x => fmt(x, 3), on: x => { st.D = x; refresh(); } });
    function refresh() {
      const g = info(), s = Math.sign(g.f);
      L.out.innerHTML = `<div class="box"><div class="row"><span>f (lensmaker)</span><b class="good">${fmt(g.f)} cm</b></div><div class="row"><span>power</span><b>${fmt(100 / g.f, 1)} D</b></div>
       <div class="row"><span>paraxial focus (traced)</span><b>${isFinite(g.xp) ? 'x = ' + fmt(g.xp) : '—'}</b></div>
       <div class="row"><span>marginal focus</span><b>${isFinite(g.xm) ? 'x = ' + fmt(g.xm) : '—'}</b></div>
       <div class="row"><span>longitudinal spherical aberr.</span><b class="${Math.abs(g.xp - g.xm) > 0.1 ? 'bad' : 'good'}">${isFinite(g.xp - g.xm) ? fmt(g.xp - g.xm) + ' cm' : '—'}</b></div>
       <div class="row"><span>blue–red focal shift</span><b>${isFinite(g.xb - g.xr) ? fmt(g.xr - g.xb) + ' cm' : '—'}</b></div></div>
       <p class="hint">Thin-lens prediction of the focus: ${fmt(g.f)} cm from the lens centre. Compare with the traced paraxial focus.</p>`;
      v.render();
    }
    refresh();
  }
});

/* ---------------------------------------------------------------- */
const BENCH = {
  single: { name: 'Single lens', inf: false, obj: { x: -9, h: 1.2 }, alpha: 0, sec: false, el: [{ x: 0, f: 4, ap: 2.2 }], scr: null, view: [-12, 16, -5, 5], note: 'Reference: the thin lens.' },
  combo: { name: 'Two lenses', inf: false, obj: { x: -9, h: 1.2 }, alpha: 0, sec: false, el: [{ x: 0, f: 4, ap: 2.2 }, { x: 5, f: 3, ap: 2.2 }], scr: null, view: [-12, 18, -5, 5], note: 'The image of lens 1 is the object of lens 2. Try moving lens 2 inside / outside the first image.' },
  kepler: { name: 'Keplerian telescope', inf: true, obj: { x: -9, h: 1 }, alpha: 4, sec: true, el: [{ x: 0, f: 8, ap: 2 }, { x: 10, f: 2, ap: 2 }], scr: null, view: [-3, 16, -3.2, 3.2], note: 'Afocal when the lenses are f₁+f₂ apart. Angular magnification $M=-f_1/f_2$ (inverted). See the dedicated telescope-magnification page for the full picture.' },
  galileo: { name: 'Galilean telescope', inf: true, obj: { x: -9, h: 1 }, alpha: 4, sec: true, el: [{ x: 0, f: 8, ap: 2 }, { x: 6, f: -2, ap: 2 }], scr: null, view: [-3, 14, -3.2, 3.2], note: 'Diverging eyepiece: upright image, shorter tube (f₁ − |f₂|).' },
  micro: { name: 'Microscope', inf: false, obj: { x: -1.25, h: 0.25 }, alpha: 0, sec: false, el: [{ x: 0, f: 1, ap: 0.7 }, { x: 8.5, f: 4, ap: 1.5 }], scr: null, view: [-3, 20, -4, 4], note: 'Objective makes a magnified real image; the eyepiece acts as a magnifier on it.' },
  eye: { name: 'Normal eye (relaxed)', inf: true, obj: { x: -9, h: 1 }, alpha: 4, sec: true, el: [{ x: 0, f: 2.4, ap: 0.7 }], scr: { x: 2.4 }, view: [-2.5, 4, -1.8, 1.8], note: 'Simplified eye in air: lens + retina at 2.4 cm. Parallel light is focused exactly on the retina.' },
  myopia: { name: 'Myopic eye', inf: true, obj: { x: -9, h: 1 }, alpha: 4, sec: true, el: [{ x: 0, f: 2.2, ap: 0.7 }], scr: { x: 2.4 }, view: [-2.5, 4, -1.8, 1.8], note: 'Eye too strong: distant objects focus in front of the retina.' },
  myopiaFix: { name: 'Myopic eye + glasses', inf: true, obj: { x: -9, h: 1 }, alpha: 4, sec: true, el: [{ x: -1.2, f: -25.2, ap: 1.1 }, { x: 0, f: 2.2, ap: 0.7 }], scr: { x: 2.4 }, view: [-2.5, 4, -1.8, 1.8], note: 'A diverging lens with f = −(far point) pushes the focus back onto the retina.' }
};

PAGES.push({
  id: 'bench', title: 'Optical bench: systems & instruments', group: 'Instruments', desc: 'Combine lenses: telescope, microscope, eye, glasses',
  build(root) {
    const L = layout(root, 'Optical bench', `
      <p>Chain thin lenses: the image from one is the object for the next (a <i>virtual object</i> if it lies behind the next lens). Rays are traced with the ray-transfer rule at each lens: $y'=y, \\ \\text{slope}'=\\text{slope}-y/f$.</p>
      <p><b>Two lenses:</b> $\\dfrac{1}{f}=\\dfrac{1}{f_1}+\\dfrac{1}{f_2}-\\dfrac{d}{f_1f_2}$. &nbsp; <b>Afocal</b> (telescope): $d=f_1+f_2$, angular magnification $M=-f_1/f_2$.</p>
      <p><b>Eye:</b> the lens focuses on the retina. Myopia: focus in front → diverging glasses (power $P=-1/\\text{far point}$). Hyperopia: converging.</p>
      <p>Notice <b>vignetting</b>: rays that miss a lens are lost — field of view is limited by apertures.</p>
      <p><b>Why afocal?</b> A relaxed eye's own lens is already shaped to focus <i>parallel</i> rays exactly onto the retina — that is what "relaxed" means; no muscle effort. A telescope is built so $d=f_1+f_2$ exactly, which turns parallel starlight back into a parallel beam. Nudge a lens off that spacing on the <b>Keplerian</b> or <b>Galilean</b> preset and watch the little eye icon: the beam now arrives slightly converging or diverging, and your eye has to <i>accommodate</i> (strain) to pull it into focus — or, pushed far enough, can't focus it at all.</p>`);
    let S = null; const ctl = [];
    const v = new View(L.stage, {
      draw(c, v) {
        const [x0, x1, y0, y1] = S.view; v.fit(x0, x1, y0, y1); v.axis();
        const els = active();
        if (S.scr) { const sx = S.scr.x; v.L(sx, y0 * 0.9, sx, y1 * 0.9, '#c9d3ff', 5); v.T(S.name.includes('eye') || S.name.includes('Eye') || S.name.includes('Myopic') ? 'retina' : 'screen', sx, y1 * 0.9, C.dim, 12, 'center', 0, -6); }
        els.forEach((e, i) => { v.lens(e.x, e.ap * 1.1, e.f > 0); v.T(`L${i + 1}  f=${fmt(e.f, 1)}`, e.x, -e.ap * 1.1, C.dim, 12, 'center', 0, 18); v.dot(e.x + e.f, 0, 3, '#7a86b3'); v.dot(e.x - e.f, 0, 3, '#7a86b3'); });
        if (!els.length) return;
        const bundles = [{ col: C.ray, y: S.obj.h, a: S.alpha }]; if (S.sec) bundles.push({ col: C.ray2, y: 0, a: 0 });
        const xEnd = S.scr && S.scr.x > els[els.length - 1].x ? S.scr.x : x1;
        for (const b of bundles) {
          for (const yy of linspace(-els[0].ap, els[0].ap, 9)) {
            let start, s0;
            if (S.inf) { s0 = Math.tan(b.a * rad * (b.col === C.ray ? 1 : 0)); start = [x0, yy - s0 * (els[0].x - x0)]; }
            else { if (b.col !== C.ray) continue; start = [S.obj.x, S.obj.h]; s0 = (yy - S.obj.h) / (els[0].x - S.obj.x); }
            const pts = [start]; let x = start[0], y = start[1], s = s0, dead = false;
            for (const e of els) {
              if (e.x <= x) continue; const yv = y + s * (e.x - x);
              if (Math.abs(yv) > e.ap) {
                // clipped by the lens mount's own rim, not by flying past it: stop the line exactly at the aperture edge
                const edge = Math.sign(yv) * e.ap, t = Math.abs(s) > 1e-9 ? x + (edge - y) / s : e.x;
                pts.push([t, edge]); dead = true; break;
              }
              pts.push([e.x, yv]); s -= yv / e.f; x = e.x; y = yv;
            }
            if (!dead && xEnd > x) pts.push([xEnd, y + s * (xEnd - x)]);
            v.P(pts, b.col + (dead ? '77' : ''), 1.4);
          }
        }
        if (!S.inf) { v.arrow(S.obj.x, 0, S.obj.x, S.obj.h, C.obj, 4); }
        const g = analyse();
        g.stages.forEach((st, i) => { if (!isFinite(st.x)) return; const last = i === g.stages.length - 1 && !g.afocal; v.arrow(st.x, 0, st.x, st.h, last ? C.img : '#b78cff', last ? 3.5 : 2, last ? null : [4, 4]); v.T(last ? 'final image' : 'image ' + (i + 1), st.x, st.h, last ? C.img : '#b78cff', 12, 'center', 0, st.h > 0 ? -8 : 16); });
        // telescope presets (afocal-by-design, no built-in retina of their own): show the *observer's*
        // eye right behind the eyepiece, so students see directly why the output must be parallel
        if (S.inf && S.sec && !S.scr && els.length) {
          const lastEl = els[els.length - 1], ex = Math.min(lastEl.x + 2.1, x1 - 0.7);
          const state = !isFinite(g.feff) || Math.abs(g.feff) > 300 ? 'relaxed' : Math.abs(g.feff) > 25 ? 'strain' : 'cant';
          v.eye(ex, 0.55, state);
          const msg = { relaxed: 'relaxed eye ✓ no accommodation', strain: 'eye must strain to focus', cant: "too close — can't focus" }[state];
          v.T(msg, ex, 0, { relaxed: C.img, strain: C.ray, cant: C.ray3 }[state], 11, 'center', 0, 32);
        }
      }
    });
    function active() { return ctl.filter(c => c.on.get()).map(c => ({ x: c.x.get(), f: c.f.get(), ap: c.ap })).sort((a, b) => a.x - b.x); }
    function analyse() {
      const els = active(), stages = []; let afocal = false;
      if (!els.length) return { stages, afocal, feff: NaN };
      let xo, ho, k0 = 0;
      if (S.inf) { xo = els[0].x + els[0].f; ho = Math.tan(S.alpha * rad) * els[0].f; stages.push({ x: xo, h: ho }); k0 = 1; } else { xo = S.obj.x; ho = S.obj.h; }
      for (let i = k0; i < els.length; i++) {
        const e = els[i], u = e.x - xo; if (Math.abs(u - e.f) < 1e-6) { afocal = true; break; }
        const vv = 1 / (1 / e.f - 1 / u); xo = e.x + vv; ho *= -vv / u; stages.push({ x: xo, h: ho });
      }
      let y = 1, s = 0, x = els[0].x; for (const e of els) { y += s * (e.x - x); x = e.x; s -= y / e.f; }
      const feff = Math.abs(s) < 1e-9 ? Infinity : -1 / s;
      return { stages, afocal, feff, bfd: Math.abs(s) < 1e-9 ? NaN : -y / s, last: els[els.length - 1] };
    }
    /* controls */
    seg(L.ctl, Object.entries(BENCH).map(([k, p]) => [k, p.name]), 'single', k => load(k));
    const dyn = el('div'); L.ctl.appendChild(dyn);
    const note = el('p', 'hint'); L.ctl.appendChild(note);
    let sObj, sAl, sScr, sScrOn;
    function load(key) {
      S = JSON.parse(JSON.stringify(BENCH[key])); dyn.innerHTML = ''; ctl.length = 0; note.textContent = S.note;
      if (S.inf) sAl = slider(dyn, { label: 'Direction of the source (slope angle)', min: -8, max: 8, step: 0.1, value: S.alpha, fmt: x => fmt(x, 1) + '°', on: x => { S.alpha = x; refresh(); } });
      else sObj = slider(dyn, { label: 'Object position x', min: -14, max: -0.3, step: 0.05, value: S.obj.x, fmt: x => fmt(x) + ' cm', on: x => { S.obj.x = x; refresh(); } });
      for (let i = 0; i < 3; i++) {
        const e = S.el[i]; const box = el('div', 'lensbox'); dyn.appendChild(box);
        const on = check(box, 'Lens ' + (i + 1), !!e, () => refresh());
        const f = slider(box, { label: 'f', min: -30, max: 30, step: 0.1, value: e ? e.f : 5, fmt: x => fmt(x, 1) + ' cm', on: refresh });
        const x = slider(box, { label: 'position', min: -4, max: 16, step: 0.05, value: e ? e.x : 3 + i * 3, fmt: x => fmt(x, 2) + ' cm', on: refresh });
        ctl.push({ on, f, x, ap: e ? e.ap : 2 });
      }
      v.handles.length = 0;
      ctl.forEach(c => v.addHandle({ hidden: () => !c.on.get(), get: () => [c.x.get(), c.ap * 1.1 + 0.3], set: (xx) => { if (c.on.get()) { c.x.set(clamp(xx, -4, 16)); } }, col: '#fff', label: '' }));
      if (!S.inf) v.addHandle({ get: () => [S.obj.x, S.obj.h], set: (xx, yy) => { S.obj.x = clamp(xx, -14, -0.3); S.obj.h = clamp(yy, -2.5, 2.5) || 0.1; sObj.set(S.obj.x); }, col: C.obj, label: 'object' });
      v.fit(...S.view); refresh();
    }
    function refresh() {
      if (S.scr) S.scr.x = S.scr.x; const g = analyse(); const last = g.stages[g.stages.length - 1];
      let rows = '';
      if (!active().length) rows = '<div class="row"><span>no lens active</span><b></b></div>';
      else {
        rows += `<div class="row"><span>system focal length</span><b class="good">${isFinite(g.feff) ? fmt(g.feff) + ' cm' : '∞ (afocal)'}</b></div>`;
        if (g.afocal || !last || !isFinite(last.x)) rows += `<div class="row"><span>final image</span><b>at infinity</b></div>`;
        else rows += `<div class="row"><span>final image</span><b>x = ${fmt(last.x)} cm, h = ${fmt(last.h)} cm</b></div>`;
        const els = active();
        if (S.inf && els.length === 2 && Math.abs(els[1].x - els[0].x - els[0].f - els[1].f) < 0.05) rows += `<div class="row"><span>angular magnification</span><b class="good">${fmt(-els[0].f / els[1].f)}×</b></div>`;
        if (S.scr) rows += `<div class="row"><span>${/eye|Eye|Myopic/.test(S.name) ? 'retina' : 'screen'} at</span><b>${fmt(S.scr.x)} cm</b></div>`;
        if (S.scr && last && isFinite(last.x)) rows += `<div class="row"><span>focus error (image − screen)</span><b class="${Math.abs(last.x - S.scr.x) < 0.04 ? 'good' : 'bad'}">${fmt(last.x - S.scr.x, 2)} cm</b></div>`;
      }
      L.out.innerHTML = `<div class="box">${rows}</div>`; v.render();
    }
    v.onChange = refresh; load(BENCH[window.pageArg] ? window.pageArg : 'single');
  }
});

/* ---------------------------------------------------------------- */
PAGES.push({
  id: 'waves', title: 'Waves: diffraction & resolution', group: 'Instruments', desc: 'Airy disc, Rayleigh criterion, slits — the real limit of every telescope',
  build(root) {
    const L = layout(root, 'Where ray optics ends', `
      <p>Light is a wave, so even a perfect lens cannot make a point image. A circular aperture of diameter D gives the <b>Airy pattern</b>: central disc radius $$\\theta = 1.22\\dfrac{\\lambda}{D}$$</p>
      <p><b>Rayleigh criterion:</b> two stars are just resolved when the centre of one falls on the first dark ring of the other: $\\theta_{min}=1.22\\lambda/D$. Bigger telescopes see finer detail — and also collect more light $\\propto D^2$.</p>
      <p><b>Young's double slit:</b> fringe spacing $\\Delta y=\\lambda L/d$; each slit's own diffraction (width a) forms an envelope $\\mathrm{sinc}^2(\\pi a\\sin\\theta/\\lambda)$. Intensity: $$I=I_0\\cos^2\\!\\left(\\dfrac{\\pi d\\sin\\theta}{\\lambda}\\right)\\mathrm{sinc}^2\\!\\left(\\dfrac{\\pi a\\sin\\theta}{\\lambda}\\right)$$</p>
      <p>Condition for rays being a good model: $a\\gg\\lambda$. Here you see what happens when it fails.</p>`);
    const st = { mode: 'airy', lam: 550, D: 10, sep: 1.4, a: 20, d: 100 };
    const small = miniCanvas(L.stage, { draw: (sctx, sst) => drawSmall(sctx, sst) });
    function drawSmall(sctx, sst) {
      const iw = Math.max(1, Math.round(sst.W * sst.d)), ih = Math.max(1, Math.round(sst.H * sst.d));
      if (st.mode === 'airy') {
        const lam = st.lam * 1e-9, D = st.D * 1e-2, th0 = 1.22 * lam / D * 206265, span = Math.max(4 * th0, st.sep * 1.8);
        const f = th => { const x = Math.PI * D * th / 206265 / lam; return airy(x); };
        const img = sctx.createImageData(iw, ih), sp = span * 0.9;
        for (let j = 0; j < ih; j++) for (let i = 0; i < iw; i++) {
          const x = (i / iw - 0.5) * 2 * sp, y = (j / ih - 0.5) * 2 * sp * ih / iw;
          const r1 = Math.hypot(x - st.sep / 2, y), r2 = Math.hypot(x + st.sep / 2, y);
          const I = f(r1) + f(r2), g = Math.min(1, Math.pow(I, 0.45)), k = (j * iw + i) * 4;
          img.data[k] = 255 * g; img.data[k + 1] = 240 * g; img.data[k + 2] = 200 * g * 0.9 + 30 * g; img.data[k + 3] = 255;
        }
        sctx.putImageData(img, 0, 0);
      } else {
        const lam = st.lam * 1e-9, a = st.a * 1e-6, d = (st.mode === 'single' ? 0 : st.d * 1e-6), Ls = 1;
        const ymax = Math.max(0.03, 8 * lam * Ls / (st.mode === 'single' ? a : Math.min(a * 2, d)) * 0.5), ymm = Math.min(ymax, 0.06);
        const Ifn = y => { const s = Math.sin(Math.atan(y / Ls)), be = Math.PI * a * s / lam, de = Math.PI * d * s / lam, sinc = Math.abs(be) < 1e-9 ? 1 : Math.sin(be) / be; return sinc * sinc * (d ? Math.cos(de) ** 2 : 1); };
        const col = wl2rgb(st.lam), rgb = col.match(/\d+/g).map(Number), buf = sctx.createImageData(iw, ih);
        for (let j = 0; j < ih; j++) for (let i = 0; i < iw; i++) {
          const y = (i / iw - 0.5) * 2 * ymm, I = Ifn(y), g = Math.pow(I, 0.6), k = (j * iw + i) * 4;
          buf.data[k] = rgb[0] * g; buf.data[k + 1] = rgb[1] * g; buf.data[k + 2] = rgb[2] * g; buf.data[k + 3] = 255;
        }
        sctx.putImageData(buf, 0, 0);
      }
    }
    const v = new View(L.stage, {
      flex: 1.6, draw(c, v) {
        const W = v.W, H = v.H, m = { l: 52, r: 16, t: 20, b: 36 }; let xs, ys, xl, thR = 0;
        if (st.mode === 'airy') {
          const lam = st.lam * 1e-9, D = st.D * 1e-2, th0 = 1.22 * lam / D * 206265, span = Math.max(4 * th0, st.sep * 1.8);
          xs = linspace(-span, span, 500).map(x => x); const f = th => { const x = Math.PI * D * th / 206265 / lam; return airy(x); };
          const s1 = xs.map(x => f(x - st.sep / 2)), s2 = xs.map(x => f(x + st.sep / 2)); ys = s1.map((q, i) => q + s2[i]);
          const X = x => m.l + (x + span) / (2 * span) * (W - m.l - m.r), Y = y => H - m.b - y / 2.1 * (H - m.t - m.b);
          c.strokeStyle = C.axis; c.strokeRect(m.l, m.t, W - m.l - m.r, H - m.t - m.b);
          const plot = (arr, col, w) => { c.beginPath(); arr.forEach((y, i) => i ? c.lineTo(X(xs[i]), Y(y)) : c.moveTo(X(xs[i]), Y(y))); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
          plot(s1, 'rgba(255,210,63,.55)', 1.5); plot(s2, 'rgba(255,110,160,.55)', 1.5); plot(ys, '#fff', 2.5);
          c.setLineDash([5, 5]); c.strokeStyle = C.img; c.beginPath(); c.moveTo(X(-th0 / 2 * 0), Y(0)); c.stroke(); c.setLineDash([]);
          c.fillStyle = C.dim; c.font = '12px Segoe UI'; c.textAlign = 'center'; c.fillText('angle on the sky (arcsec)', W / 2, H - 8);
          for (let t = -Math.floor(span); t <= span; t += span > 8 ? 2 : span > 3 ? 1 : 0.5) { c.fillText(fmt(t, 1), X(t), H - m.b + 14); }
          // Rayleigh marker
          c.fillStyle = C.img; c.textAlign = 'left'; c.fillText(`Rayleigh limit 1.22λ/D = ${fmt(th0, 3)}″`, m.l + 8, m.t + 14);
          const mid = ys[250]; const peak = Math.max(...ys); const dip = mid / peak;
          this.dip = dip; this.th0 = th0;
          c.fillStyle = dip < 0.735 ? C.img : C.ray3; c.fillText(dip < 0.98 ? (dip < 0.735 ? 'RESOLVED  (dip to ' + fmt(dip * 100, 0) + '%)' : 'barely/not resolved  (dip ' + fmt(dip * 100, 0) + '%)') : 'NOT resolved: one blob', m.l + 8, m.t + 32);
        } else {
          const lam = st.lam * 1e-9, a = st.a * 1e-6, d = (st.mode === 'single' ? 0 : st.d * 1e-6), Ls = 1; const ymax = Math.max(0.03, 8 * lam * Ls / (st.mode === 'single' ? a : Math.min(a * 2, d)) * 0.5);
          const ymm = Math.min(ymax, 0.06); xs = linspace(-ymm, ymm, 800);
          const Ifn = y => { const s = Math.sin(Math.atan(y / Ls)), be = Math.PI * a * s / lam, de = Math.PI * d * s / lam, sinc = Math.abs(be) < 1e-9 ? 1 : Math.sin(be) / be; return sinc * sinc * (d ? Math.cos(de) ** 2 : 1); };
          ys = xs.map(Ifn);
          const X = x => m.l + (x + ymm) / (2 * ymm) * (W - m.l - m.r), Y = y => H - m.b - y * (H - m.t - m.b) * 0.95;
          c.strokeStyle = C.axis; c.strokeRect(m.l, m.t, W - m.l - m.r, H - m.t - m.b);
          c.beginPath(); ys.forEach((y, i) => i ? c.lineTo(X(xs[i]), Y(y)) : c.moveTo(X(xs[i]), Y(y))); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
          c.fillStyle = C.dim; c.font = '12px Segoe UI'; c.textAlign = 'center'; c.fillText('position on a screen 1 m away (mm)', W / 2, H - 8);
          for (let t = -Math.floor(ymm * 1000 / 10) * 10; t <= ymm * 1000; t += 10) c.fillText(t, X(t / 1000), H - m.b + 14);
        }
        small.redraw();
      }
    });
    seg(L.ctl, [['airy', 'Circular aperture (stars)'], ['single', 'Single slit'], ['double', 'Double slit']], 'airy', k => { st.mode = k; build(); refresh(); });
    const dyn = el('div'); L.ctl.appendChild(dyn);
    function build() {
      dyn.innerHTML = '';
      slider(dyn, { label: 'Wavelength', min: 400, max: 700, step: 5, value: st.lam, fmt: x => fmt(x, 0) + ' nm', on: x => { st.lam = x; refresh(); } });
      if (st.mode === 'airy') {
        slider(dyn, { label: 'Telescope diameter D', min: 1, max: 100, step: 0.5, value: st.D, fmt: x => fmt(x, 1) + ' cm', on: x => { st.D = x; refresh(); } });
        slider(dyn, { label: 'Angular separation of two stars', min: 0.05, max: 6, step: 0.01, value: st.sep, fmt: x => fmt(x, 2) + '″', on: x => { st.sep = x; refresh(); } });
        button(dyn, 'Put the stars exactly at the Rayleigh limit', () => { st.sep = 1.22 * st.lam * 1e-9 / (st.D * 1e-2) * 206265; build(); refresh(); });
      } else {
        slider(dyn, { label: 'Slit width a', min: 5, max: 100, step: 1, value: st.a, fmt: x => fmt(x, 0) + ' µm', on: x => { st.a = x; refresh(); } });
        if (st.mode === 'double') slider(dyn, { label: 'Slit separation d', min: 20, max: 400, step: 5, value: st.d, fmt: x => fmt(x, 0) + ' µm', on: x => { st.d = x; refresh(); } });
      }
    }
    function refresh() {
      v.render();
      if (st.mode === 'airy') L.out.innerHTML = `<div class="box"><div class="row"><span>Rayleigh limit $1.22\\lambda/D$</span><b class="good">${fmt(1.22 * st.lam * 1e-9 / (st.D * 1e-2) * 206265, 3)}″</b></div>
        <div class="row"><span>separation</span><b>${fmt(st.sep, 2)}″</b></div><div class="row"><span>light-gathering $\\propto D^2$</span><b>${fmt(Math.pow(st.D / 7, 2), 1)}× a 7 cm scope</b></div></div>
        <p class="hint">The Hubble (D = 2.4 m) resolves ≈ 0.05″; a 10 cm amateur scope ≈ 1.4″ — if the atmosphere ("seeing", ~1″) doesn't blur it first.</p>`;
      else { const lam = st.lam * 1e-9, a = st.a * 1e-6;
        L.out.innerHTML = `<div class="box"><div class="row"><span>central max. width $2\\lambda L/a$</span><b>${fmt(2 * lam / a * 1000, 1)} mm</b></div>${st.mode === 'double' ? `<div class="row"><span>fringe spacing $\\lambda L/d$</span><b class="good">${fmt(lam / (st.d * 1e-6) * 1000, 2)} mm</b></div><div class="row"><span>fringes in central max ≈</span><b>${fmt(2 * st.d / st.a, 1)}</b></div>` : ''}</div>`; }
    }
    build(); refresh();
  }
});
