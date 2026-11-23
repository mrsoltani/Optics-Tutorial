'use strict';
/* ===== Conic mirrors (perfect imaging), spherical mirrors, thin lenses ===== */

PAGES.push({
  id: 'conics', title: 'Why mirrors focus: conics', group: 'Mirrors', desc: 'Equal optical path ⇒ perfect imaging: ellipse and parabola',
  build(root) {
    const L = layout(root, 'Why do all rays meet at one point?', `
      <p>Light from a point source reaches the image point along many paths. They all meet <b>in phase</b> only if every path has the <b>same optical length</b>.</p>
      <p><b>Ellipse:</b> $|F_1P|+|PF_2|=2a$ for every point P. So a mirror shaped as an ellipse images F₁ <i>perfectly</i> onto F₂ — with no approximation at all.</p>
      <p><b>Parabola:</b> the second focus is at infinity; a parallel beam (source at ∞) is focused perfectly, but only if it comes <i>along the axis</i>. Tilt it and you get <b>coma</b>.</p>
      <p>A <b>sphere</b> is the e → 0 ellipse (both foci merge at C): that is why spheres focus only near the axis (paraxial) – and why telescopes use paraboloids.</p>`);
    const st = { mode: 'ellipse', e: 0.7, N: 17, phi: 35, alpha: 0, a: 6, f: 3 };
    const Hm = 5.5;
    function ellipse() {
      const a = st.a, e = st.e, c = e * a, b = a * Math.sqrt(1 - e * e), F1 = [-c, 0], F2 = [c, 0], rays = [];
      const mk = phi => { const r = a * (1 - e * e) / (1 - e * Math.cos(phi)), P = [F1[0] + r * Math.cos(phi), r * Math.sin(phi)], dIn = [Math.cos(phi), Math.sin(phi)], n = norm([P[0] / (a * a), P[1] / (b * b)]); return { P, dIn, dOut: reflect(dIn, n), len: r + Math.hypot(P[0] - F2[0], P[1] - F2[1]), a1: r }; };
      for (let k = 0; k < st.N; k++) rays.push(mk(-Math.PI + 2 * Math.PI * (k + 0.5) / st.N));
      return { a, b, c, F1, F2, rays, sel: mk(st.phi * rad) };
    }
    function parab() {
      const f = st.f, al = st.alpha * rad, d = [Math.cos(al), Math.sin(al)], perp = [-d[1], d[0]], F = [-f, 0], rays = [];
      for (const s of linspace(-Hm + 0.1, Hm - 0.1, st.N)) {
        const o = [-14 * d[0] + s * perp[0], -14 * d[1] + s * perp[1]], qa = d[1] * d[1] / (4 * f), qb = d[0] + 2 * o[1] * d[1] / (4 * f), qc = o[0] + o[1] * o[1] / (4 * f);
        let t; if (Math.abs(qa) < 1e-12) t = -qc / qb; else { const disc = qb * qb - 4 * qa * qc; if (disc < 0) continue; const r1 = (-qb - Math.sqrt(disc)) / (2 * qa), r2 = (-qb + Math.sqrt(disc)) / (2 * qa); t = Math.min(...[r1, r2].filter(x => x > 0)); }
        if (!isFinite(t)) continue; const P = [o[0] + t * d[0], o[1] + t * d[1]]; if (Math.abs(P[1]) > Hm) continue;
        const n = norm([1, P[1] / (2 * f)]);
        rays.push({ o, P, dOut: reflect(d, n), len: t + Math.hypot(P[0] - F[0], P[1] - F[1]) });
      }
      return { F, rays };
    }
    const v = new View(L.stage, {
      draw(c, v) {
        if (st.mode === 'ellipse') {
          v.fit(-9.5, 9.5, -6.6, 6.6); v.axis(); const E = ellipse();
          v.P(linspace(0, 2 * Math.PI, 200).map(t => [E.a * Math.cos(t), E.b * Math.sin(t)]), C.mirror, 3);
          for (const r of E.rays) { v.L(E.F1[0], E.F1[1], r.P[0], r.P[1], 'rgba(255,210,63,.55)', 1.2); v.L(r.P[0], r.P[1], E.F2[0], E.F2[1], 'rgba(67,217,255,.55)', 1.2); }
          const s = E.sel; v.ray(E.F1[0], E.F1[1], s.P[0], s.P[1], C.ray, 3.5); v.ray(s.P[0], s.P[1], E.F2[0], E.F2[1], C.ray2, 3.5); v.dot(s.P[0], s.P[1], 5, '#fff');
          v.dot(E.F1[0], E.F1[1], 6, C.obj); v.T('F₁ (source)', E.F1[0], E.F1[1], C.obj, 13, 'center', 0, 20);
          v.dot(E.F2[0], E.F2[1], 6, C.img); v.T('F₂ (image)', E.F2[0], E.F2[1], C.img, 13, 'center', 0, 20);
        } else {
          v.fit(-15, 3, -7, 7); v.axis(); const Pb = parab(); const al = st.alpha * rad;
          v.P(linspace(-Hm, Hm, 80).map(y => [-y * y / (4 * st.f), y]), C.mirror, 3);
          for (const r of Pb.rays) {
            v.L(r.o[0], r.o[1], r.P[0], r.P[1], 'rgba(255,210,63,.6)', 1.2);
            const t = (-16 - r.P[0]) / (r.dOut[0] || -1e-9); v.L(r.P[0], r.P[1], r.P[0] + r.dOut[0] * Math.min(t, 12), r.P[1] + r.dOut[1] * Math.min(t, 12), 'rgba(67,217,255,.65)', 1.2);
          }
          v.dot(Pb.F[0], Pb.F[1], 6, C.img); v.T('F', Pb.F[0], Pb.F[1], C.img, 14, 'center', 0, 22);
          v.T('beam from infinity, tilt α = ' + fmt(st.alpha, 1) + '°', -14.5, 6.3, C.dim, 13);
        }
      }
    });
    v.onChange = refresh;
    seg(L.ctl, [['ellipse', 'Ellipse (two foci)'], ['parab', 'Parabola (source at ∞)']], 'ellipse', k => { st.mode = k; build(); refresh(); });
    const dyn = el('div'); L.ctl.appendChild(dyn);
    let sE, sP, sA;
    function build() {
      dyn.innerHTML = '';
      slider(dyn, { label: 'Number of rays', min: 3, max: 41, step: 2, value: st.N, fmt: x => fmt(x, 0), on: x => { st.N = x; refresh(); } });
      if (st.mode === 'ellipse') {
        slider(dyn, { label: 'Eccentricity e  (0 = circle, →1 = parabola)', min: 0, max: 0.97, step: 0.01, value: st.e, on: x => { st.e = x; refresh(); } });
        slider(dyn, { label: 'Highlighted ray angle', min: -179, max: 179, step: 1, value: st.phi, fmt: x => fmt(x, 0) + '°', on: x => { st.phi = x; refresh(); } });
      } else slider(dyn, { label: 'Tilt of incoming beam α', min: 0, max: 12, step: 0.1, value: st.alpha, fmt: x => fmt(x, 1) + '°', on: x => { st.alpha = x; refresh(); } });
    }
    function refresh() {
      if (st.mode === 'ellipse') {
        const E = ellipse(), ls = E.rays.slice(0, 6).map(r => r.len), mx = Math.max(...E.rays.map(r => r.len)), mn = Math.min(...E.rays.map(r => r.len));
        L.out.innerHTML = `<div class="box"><div class="row"><span>highlighted: |F₁P|</span><b>${fmt(E.sel.a1, 3)}</b></div><div class="row"><span>|PF₂|</span><b>${fmt(E.sel.len - E.sel.a1, 3)}</b></div>
        <div class="row"><span>sum = optical path</span><b class="good">${fmt(E.sel.len, 4)}</b></div><div class="row"><span>2a (should equal)</span><b>${fmt(2 * E.a, 4)}</b></div>
        <div class="row"><span>spread over all rays</span><b class="good">${(mx - mn).toExponential(1)}</b></div></div>
        <p class="hint">Every ray has exactly the same path length → perfect, aberration-free image. Push e → 0: foci merge at the centre (sphere: the point imaging itself).</p>`;
      } else {
        const P = parab(), ls = P.rays.map(r => r.len), sp = Math.max(...ls) - Math.min(...ls);
        L.out.innerHTML = `<div class="box"><div class="row"><span>path: plane wave → mirror → F</span><b>${fmt(ls[0], 3)}</b></div>
        <div class="row"><span>spread between rays</span><b class="${sp < 1e-6 ? 'good' : 'bad'}">${sp < 1e-9 ? '0 (perfect)' : fmt(sp, 3)}</b></div></div>
        <p class="hint">${sp < 1e-6 ? 'On axis: every path is identical, so a parabola focuses a plane wave perfectly.' : 'Off axis the paths differ: rays no longer arrive in phase at one point — this is <b>coma</b>.'}</p>`;
      }
      v.render();
    }
    build(); refresh();
  }
});

/* ---------------------------------------------------------------- */
PAGES.push({
  id: 'mirrors', title: 'Mirrors', group: 'Mirrors', desc: 'Plane, concave, convex: principal rays, image, Newton, spherical aberration',
  build(root) {
    const L = layout(root, 'Plane, concave and convex mirrors', `
      <p><b>Mirror equation:</b> $$\\dfrac{1}{u}+\\dfrac{1}{v}=\\dfrac{1}{f},\\quad f=\\dfrac{R}{2}$$ &nbsp; $m=-\\dfrac{v}{u}$ (negative = inverted).</p>
      <p><b>Newton's form:</b> measure from the focal point: $x=u-f,\\ x'=v-f \\Rightarrow x\\cdot x'=f^2$. Far simpler for many problems.</p>
      <p><b>Three easy rays</b> from the arrow tip: ① parallel → through F, ② through F → parallel, ③ through C → straight back. (④ to the vertex → equal angle.) Any two locate the image; <i>all</i> other rays go there too.</p>
      <ul><li>Concave: object beyond F → real, inverted image. Inside F → virtual, upright, magnified.</li>
      <li>Convex: always virtual, upright, smaller. Plane: virtual, same size, v = −u.</li></ul>
      <p>Switch the surface model to <b>Spherical (exact)</b> and increase the mirror size: rays no longer meet at a point — <b>spherical aberration</b>. A <b>parabola</b> fixes it for the on-axis point.</p>`);
    const st = { type: 'concave', f: 3, u: 7, h: 1.5, model: 'ideal', prin: true, fan: true, N: 11, Hm: 2.6, newton: false };
    if (window.pageArg === 'sphere') Object.assign(st, { model: 'sphere', u: 14, Hm: 2.8, prin: false });
    const fs = () => st.type === 'concave' ? st.f : st.type === 'convex' ? -st.f : Infinity;
    function calc() {
      const f = fs(); let u = st.u; if (isFinite(f) && Math.abs(u - f) < 0.02) u = f + 0.02; if (isFinite(f) && Math.abs(u - 2 * f) < 0.005) u += 0.01;
      const v = isFinite(f) ? 1 / (1 / f - 1 / u) : -u; return { f, u, v, m: -v / u };
    }
    function sag(y) {
      const f = fs(); if (!isFinite(f) || st.model === 'ideal' && false) return 0;
      if (st.model === 'parab') return -y * y / (4 * f);
      const R = 2 * f, yy = Math.min(Math.abs(y), Math.abs(R) * 0.999); return -R + Math.sign(R) * Math.sqrt(R * R - yy * yy);
    }
    function surfN(y) { const f = fs(); if (!isFinite(f)) return [1, 0]; if (st.model === 'parab') return norm([1, y / (2 * f)]); const R = 2 * f; return norm([sag(y) + R, y]); }
    const v = new View(L.stage, {
      draw(c, v) {
        v.fit(-16, 6, -6.4, 6.4); const k = calc(), f = k.f, u = k.u, h = st.h, I = [-k.v, k.m * h], real = k.v > 0;
        const Hm = isFinite(f) ? Math.min(st.Hm, Math.abs(2 * f) * 0.95) : st.Hm, tip = [-u, h];
        v.axis();
        // mirror: drawn with a solid opaque backing (a real mirror is not a bare line) so no
        // ray — real or a virtual-image construction line — can ever read as passing through the glass
        const curvePts = linspace(Hm, -Hm, 60).map(y => [st.model === 'ideal' ? 0 : sag(y), y]);
        const backX = Math.max(0, ...curvePts.map(p => p[0])) + 0.5;
        v.fillP([...curvePts, [backX, -Hm], [backX, Hm]], '#141b33', C.mirror, 3.5);
        for (let y = -Hm; y <= Hm; y += 0.35) { const x0 = st.model === 'ideal' ? 0 : sag(y); v.L(x0, y, x0 + 0.28, y + 0.28, 'rgba(207,216,255,.5)', 1.2); }
        // F, C
        if (isFinite(f)) {
          v.dot(-f, 0, 4, '#fff'); v.T('F', -f, 0, '#fff', 13, 'center', 0, 20); v.dot(-2 * f, 0, 4, '#b78cff'); v.T('C', -2 * f, 0, '#b78cff', 13, 'center', 0, 20);
        }
        // ideal image-direction helper
        const dirIdeal = S => real ? norm([I[0] - S[0], I[1] - S[1]]) : norm([S[0] - I[0], S[1] - I[1]]);
        // fan of rays
        if (st.fan) {
          for (const y of linspace(-Hm, Hm, st.N)) {
            const S = [st.model === 'ideal' && isFinite(f) ? 0 : sag(y), y]; const din = norm([S[0] - tip[0], S[1] - tip[1]]);
            let dr; if (st.model === 'ideal' && isFinite(f)) dr = dirIdeal(S); else dr = reflect(din, surfN(y));
            v.ray(tip[0], tip[1], S[0], S[1], 'rgba(255,210,63,.55)', 1.2, null, false);
            const T = dr[0] < -1e-6 ? (-16 - S[0]) / dr[0] : 25;
            v.L(S[0], S[1], S[0] + dr[0] * T, S[1] + dr[1] * T, 'rgba(67,217,255,.7)', 1.3);
            const back = real && isFinite(f) ? 0 : Math.hypot(S[0] - I[0], S[1] - I[1]) + 0.3; if (back) v.L(S[0], S[1], S[0] - dr[0] * back, S[1] - dr[1] * back, 'rgba(67,217,255,.45)', 1, [4, 4]);
          }
        }
        // principal rays (ideal, drawn to the mirror plane)
        if (st.prin) {
          const R = [];
          if (isFinite(f)) {
            R.push({ H: [0, h], d: [-Math.abs(f), -Math.sign(f) * h], col: C.ray3 });
            R.push({ H: [0, -f * h / (u - f)], d: [-1, 0], col: C.ray4 });
            R.push({ H: [0, -2 * f * h / (u - 2 * f)], d: [1, 1], col: '#b78cff', back: true });
          } else R.push({ H: [0, h], d: [-1, 0], col: C.ray3 });
          R.push({ H: [0, 0], d: [-u, -h], col: '#ffffff' });
          for (const r of R) {
            const Hh = r.H; let d = norm(r.d);
            if (r.back) { d = norm([tip[0] - Hh[0], tip[1] - Hh[1]]); }
            v.ray(tip[0], tip[1], Hh[0], Hh[1], r.col, 2.2);
            const T = d[0] < -1e-6 ? (-16 - Hh[0]) / d[0] : 25; v.ray(Hh[0], Hh[1], Hh[0] + d[0] * Math.min(T, 40), Hh[1] + d[1] * Math.min(T, 40), r.col, 2.2);
            if (!real || !isFinite(f)) v.L(Hh[0], Hh[1], I[0], I[1], r.col, 1.4, [5, 5]);
            if (r.back) {/*retrace*/ }
          }
        }
        // object and image
        v.arrow(-u, 0, -u, h, C.obj, 4); v.T('object', -u, h, C.obj, 13, 'center', 0, h > 0 ? -10 : 18);
        v.arrow(I[0], 0, I[0], I[1], C.img, 4, real ? null : [6, 4]); v.T(real ? 'real image' : 'virtual image', I[0], I[1], C.img, 13, 'center', 0, I[1] > 0 ? -10 : 18);
        if (st.newton && isFinite(f)) {
          v.arrow(-f, -0.9, -u, -0.9, C.obj, 1.6); v.T('x = u − f = ' + fmt(u - f), (-f - u) / 2, -0.9, C.obj, 12, 'center', 0, 16);
          v.arrow(-f, -1.9, I[0], -1.9, C.img, 1.6); v.T("x′ = v − f = " + fmt(k.v - f), (-f + I[0]) / 2, -1.9, C.img, 12, 'center', 0, 16);
        }
      }
    });
    v.addHandle({ get: () => [-st.u, st.h], set: (x, y) => { st.u = clamp(-x, 0.6, 14); st.h = Math.abs(y) < 0.25 ? 0.25 : clamp(y, -3.5, 3.5); sU.set(st.u); }, col: C.obj, label: 'drag the object' });
    v.onChange = refresh;
    seg(L.ctl, [['concave', 'Concave'], ['convex', 'Convex'], ['plane', 'Plane']], 'concave', k => { st.type = k; refresh(); });
    slider(L.ctl, { label: 'Focal length |f|  (R = 2f)', min: 1, max: 6, step: 0.05, value: st.f, fmt: x => fmt(x) + ' cm', on: x => { st.f = x; refresh(); } });
    const sU = slider(L.ctl, { label: 'Object distance u', min: 0.6, max: 14, step: 0.05, value: st.u, fmt: x => fmt(x) + ' cm', on: x => { st.u = x; refresh(); } });
    seg(L.ctl, [['ideal', 'Ideal'], ['sphere', 'Spherical (exact)'], ['parab', 'Parabolic']], 'ideal', k => { st.model = k; refresh(); });
    slider(L.ctl, { label: 'Mirror half-size (aperture)', min: 0.5, max: 5, step: 0.05, value: st.Hm, fmt: x => fmt(x) + ' cm', on: x => { st.Hm = x; refresh(); } });
    slider(L.ctl, { label: 'Rays in the fan', min: 3, max: 41, step: 2, value: st.N, fmt: x => fmt(x, 0), on: x => { st.N = x; refresh(); } });
    check(L.ctl, 'Principal rays', true, b => { st.prin = b; refresh(); }); check(L.ctl, 'Fan of rays', true, b => { st.fan = b; refresh(); }); check(L.ctl, 'Show Newton distances x, x′', false, b => { st.newton = b; refresh(); });
    function refresh() {
      const k = calc(), f = k.f, real = k.v > 0;
      const desc = (isFinite(f) ? (real ? 'real' : 'virtual') : 'virtual') + ', ' + (k.m < 0 ? 'inverted' : 'upright') + ', ' + (Math.abs(k.m) > 1.001 ? 'magnified' : Math.abs(k.m) < 0.999 ? 'diminished' : 'same size');
      L.out.innerHTML = `<div class="box"><div class="row"><span>f</span><b>${fmt(f)} cm</b></div><div class="row"><span>u</span><b>${fmt(k.u)} cm</b></div>
       <div class="row"><span>v &nbsp;($\\frac{1}{u}+\\frac{1}{v}=\\frac{1}{f}$)</span><b class="good">${fmt(k.v)} cm</b></div><div class="row"><span>$m=-v/u$</span><b>${fmt(k.m)}</b></div>
       <div class="row"><span>image</span><b>${desc}</b></div>
       ${isFinite(f) ? `<div class="row"><span>Newton $x\\cdot x'$ vs $f^2$</span><b>${fmt((k.u - f) * (k.v - f))} vs ${fmt(f * f)}</b></div>` : ''}</div>
       ${st.model === 'sphere' && isFinite(f) ? '<p class="hint">Exact spherical surface: look at the marginal rays — they cross the axis closer to the mirror than the central ones.</p>' : ''}`;
      v.render();
    }
    refresh();
  }
});

/* ---------------------------------------------------------------- */
PAGES.push({
  id: 'lens', title: 'Thin lenses', group: 'Lenses', desc: 'Converging and diverging lenses, screen, blur, aperture',
  build(root) {
    const L = layout(root, 'Thin lenses', `
      <p>Same equation as mirrors, but the light goes <i>through</i>: $\\frac{1}{u}+\\frac{1}{v}=\\frac{1}{f}$, &nbsp; $m=-v/u$, &nbsp; $x\\cdot x'=f^2$ (x from the front focus, x′ from the back focus).</p>
      <p><b>Principal rays:</b> ① parallel → through the far focus; ② through the near focus → parallel; ③ through the centre → undeviated.</p>
      <p>Move the <b>screen</b>: only at $x=v$ is the image sharp; elsewhere each point becomes a disc of diameter $\\approx D\\cdot\\frac{|s-v|}{v}$. That is exactly <b>depth of field</b> and <b>focusing</b> a camera.</p>
      <p><b>Cover half the lens</b> (aperture slider): the image does not disappear and is not cut in half — it just becomes <i>dimmer</i>, because every point still sends rays through the visible part.</p>
      <ul><li>Converging, u &gt; f: real inverted. u &lt; f: virtual upright magnifier.</li><li>Diverging: always virtual, upright, reduced.</li><li>Real object + real image have distance ≥ 4f.</li></ul>`);
    const st = { type: 'conv', f: 4, u: 9, h: 1.5, A: 3, N: 13, prin: true, fan: true, scr: false, sx: 8, newton: false };
    const fs = () => st.type === 'conv' ? st.f : -st.f;
    function calc() { const f = fs(); let u = st.u; if (Math.abs(u - f) < 0.02) u = f + 0.02; const v = 1 / (1 / f - 1 / u); return { f, u, v, m: -v / u }; }
    let blur = 0;
    const v = new View(L.stage, {
      draw(c, v) {
        v.fit(-15, 17, -6.2, 6.2); const k = calc(), f = k.f, u = k.u, h = st.h, I = [k.v, k.m * h], real = k.v > 0, tip = [-u, h], HL = 4.6;
        v.axis(); v.lens(0, HL, st.type === 'conv'); v.T('F', -f, 0, '#fff', 13, 'center', 0, 20); v.dot(-f, 0, 4, '#fff'); v.dot(f, 0, 4, '#fff'); v.T("F′", f, 0, '#fff', 13, 'center', 0, 20);
        if (st.A < HL) { v.L(0, st.A, 0, HL, '#7a86b3', 7); v.L(0, -st.A, 0, -HL, '#7a86b3', 7); }
        const xEnd = st.scr ? st.sx : 17; let hits = [];
        if (st.fan) {
          for (const y of linspace(-st.A, st.A, st.N)) {
            const S = [0, y], dr = real ? norm([I[0] - S[0], I[1] - S[1]]) : norm([S[0] - I[0], S[1] - I[1]]);
            v.L(tip[0], tip[1], 0, y, 'rgba(255,210,63,.55)', 1.2); const T = (xEnd - 0) / dr[0];
            v.L(0, y, xEnd, y + dr[1] * T, 'rgba(67,217,255,.7)', 1.3); hits.push(y + dr[1] * T);
            if (!real) v.L(0, y, I[0], I[1], 'rgba(67,217,255,.45)', 1, [4, 4]);
          }
        }
        if (st.prin) {
          const R = [{ H: [0, h], d: [Math.abs(f), -Math.sign(f) * h], col: C.ray3, ext: [f, 0] }, { H: [0, -f * h / (u - f)], d: [1, 0], col: C.ray4, ext: [-f, 0] }, { H: [0, 0], d: [u, -h], col: '#fff' }];
          for (const r of R) {
            const d = norm(r.d); v.ray(tip[0], tip[1], r.H[0], r.H[1], r.col, 2.2);
            if (r.ext && f < 0 && r.col === C.ray3) v.L(r.H[0], r.H[1], f, 0, r.col, 1.3, [5, 5]);
            if (r.ext && f < 0 && r.col === C.ray4) v.L(r.H[0], r.H[1], -f, 0, r.col, 1.3, [5, 5]);
            v.ray(r.H[0], r.H[1], r.H[0] + d[0] * 40, r.H[1] + d[1] * 40, r.col, 2.2);
            if (!real) v.L(r.H[0], r.H[1], I[0], I[1], r.col, 1.4, [5, 5]);
          }
        }
        v.arrow(-u, 0, -u, h, C.obj, 4); v.T('object', -u, h, C.obj, 13, 'center', 0, h > 0 ? -10 : 18);
        v.arrow(I[0], 0, I[0], I[1], C.img, 4, real ? null : [6, 4]); v.T(real ? 'real image' : 'virtual image', I[0], I[1], C.img, 13, 'center', 0, I[1] > 0 ? -10 : 18);
        if (st.scr) {
          c.fillStyle = 'rgba(200,210,255,.35)'; c.fillRect(v.X(st.sx) - 4, v.Y(5.6), 8, v.s * 11.2); v.T('screen', st.sx, 5.8, C.dim, 12, 'center');
          if (hits.length) { const a = Math.min(...hits), b = Math.max(...hits); blur = b - a; v.L(st.sx, a, st.sx, b, '#fff', 5); }
        }
        if (st.newton) {
          v.arrow(-f, -1.0, -u, -1.0, C.obj, 1.6); v.T('x = ' + fmt(u - f), (-f - u) / 2, -1.0, C.obj, 12, 'center', 0, 16);
          if (real) { v.arrow(f, -1.0, I[0], -1.0, C.img, 1.6); v.T("x′ = " + fmt(k.v - f), (f + I[0]) / 2, -1.0, C.img, 12, 'center', 0, 16); }
        }
      }
    });
    v.addHandle({ get: () => [-st.u, st.h], set: (x, y) => { st.u = clamp(-x, 0.6, 14); st.h = Math.abs(y) < 0.25 ? 0.25 : clamp(y, -3.5, 3.5); sU.set(st.u); }, col: C.obj, label: 'drag the object' });
    v.addHandle({ hidden: () => !st.scr, get: () => [st.sx, -5.4], set: x => { if (st.scr) { st.sx = clamp(x, 1, 16); sS.set(st.sx); } }, col: '#fff', label: 'screen' });
    v.onChange = refresh;
    seg(L.ctl, [['conv', 'Converging (convex)'], ['div', 'Diverging (concave)']], 'conv', k => { st.type = k; refresh(); });
    slider(L.ctl, { label: 'Focal length |f|', min: 1, max: 8, step: 0.05, value: st.f, fmt: x => fmt(x) + ' cm', on: x => { st.f = x; refresh(); } });
    const sU = slider(L.ctl, { label: 'Object distance u', min: 0.6, max: 14, step: 0.05, value: st.u, fmt: x => fmt(x) + ' cm', on: x => { st.u = x; refresh(); } });
    slider(L.ctl, { label: 'Lens aperture (half-size)', min: 0.3, max: 4.5, step: 0.05, value: st.A, fmt: x => fmt(x) + ' cm', on: x => { st.A = x; refresh(); } });
    slider(L.ctl, { label: 'Rays in the fan', min: 3, max: 41, step: 2, value: st.N, fmt: x => fmt(x, 0), on: x => { st.N = x; refresh(); } });
    check(L.ctl, 'Principal rays', true, b => { st.prin = b; refresh(); }); check(L.ctl, 'Fan of rays', true, b => { st.fan = b; refresh(); });
    check(L.ctl, 'Show Newton distances', false, b => { st.newton = b; refresh(); });
    check(L.ctl, 'Place a screen', false, b => { st.scr = b; refresh(); });
    const sS = slider(L.ctl, { label: 'Screen position', min: 1, max: 16, step: 0.05, value: st.sx, fmt: x => fmt(x) + ' cm', on: x => { st.sx = x; refresh(); } });
    button(L.ctl, 'Snap screen to the image', () => { const k = calc(); if (k.v > 0) { st.scr = true; st.sx = clamp(k.v, 1, 16); sS.set(st.sx); } refresh(); });
    function refresh() {
      v.render(); const k = calc(), f = k.f, real = k.v > 0;
      const desc = (real ? 'real' : 'virtual') + ', ' + (k.m < 0 ? 'inverted' : 'upright') + ', ' + (Math.abs(k.m) > 1.001 ? 'magnified' : Math.abs(k.m) < 0.999 ? 'diminished' : 'same size');
      L.out.innerHTML = `<div class="box"><div class="row"><span>f</span><b>${fmt(f)} cm</b></div><div class="row"><span>power $1/f$</span><b>${fmt(100 / f, 1)} D</b></div>
       <div class="row"><span>v</span><b class="good">${fmt(k.v)} cm</b></div><div class="row"><span>$m=-v/u$</span><b>${fmt(k.m)}</b></div><div class="row"><span>image</span><b>${desc}</b></div>
       <div class="row"><span>Newton $x\\cdot x'$ vs $f^2$</span><b>${fmt((k.u - f) * (k.v - f))} vs ${fmt(f * f)}</b></div>
       ${st.scr ? `<div class="row"><span>blur spot on screen</span><b class="${blur < 0.1 ? 'good' : 'bad'}">${fmt(blur)} cm</b></div>` : ''}</div>`;
    }
    refresh();
  }
});
