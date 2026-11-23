'use strict';
/* ===== Roadmap, What is an image, Fermat, Snell/TIR, Prism ===== */

PAGES.push({
  id: 'roadmap', title: 'Roadmap', group: 'Start', desc: 'The map of the whole course',
  build(root) {
    root.className = 'page single';
    const groups = {};
    PAGES.forEach((p, i) => { if (p.id === 'roadmap') return; (groups[p.group] = groups[p.group] || []).push([p, i]); });
    let h = `<div class="road"><h1>Geometric Optics, seen not just written</h1>
    <p class="lead">Every chapter is a live experiment. <b>Drag</b> the glowing handles, move the sliders, and ask “what happens if…?” before you look. Keys: <kbd>→</kbd>/<kbd>←</kbd> next / previous chapter, <kbd>N</kbd> hide the menu, <kbd>F</kbd> full screen.</p>`;
    for (const g in groups) {
      h += `<h3>${g}</h3><div class="cards">`;
      for (const [p] of groups[g]) h += `<a class="card" href="#/${p.id}"><b>${p.title}</b><span>${p.desc}</span></a>`;
      h += '</div>';
    }
    h += `<h3>Sign conventions used everywhere</h3><div class="note">
    Light travels <b>left → right</b>. Distances are positive when they point <i>along</i> the real light, so for a lens: object distance <i>u</i> &gt; 0 to the left, image distance <i>v</i> &gt; 0 to the right (real image).
    For a mirror the light comes back, so <i>v</i> &gt; 0 means in front of the mirror (real) and <i>v</i> &lt; 0 behind it (virtual). Focal length <i>f</i> &gt; 0 for converging elements (concave mirror, convex lens).
    <br>One equation for everything (thin lens / mirror): $$\\dfrac{1}{u}+\\dfrac{1}{v}=\\dfrac{1}{f}$$ magnification $m=-\\dfrac{v}{u}$, and Newton's form $x\\cdot x'=f^2$ with x, x′ measured from the focal points.</div></div>`;
    root.innerHTML = h;
  }
});

/* ---------------------------------------------------------------- */
PAGES.push({
  id: 'image', title: 'What is an image?', group: 'Foundations', desc: 'Why a bare screen shows nothing, a pinhole and a lens show a picture',
  build(root) {
    const L = layout(root, 'What is an image?', `
      <p>Every point of an object sends light in <b>all directions</b>. A screen placed anywhere just collects a mix of every point: a uniform smear, no picture.</p>
      <p>An <b>image</b> is a place where all rays that left <i>one</i> object point meet <i>again at one point</i>. Then each object point maps to its own image point, and the screen shows a picture.</p>
      <ul><li><b>Pinhole:</b> keeps just one thin ray per point. Sharp but dim (and diffraction ruins it if the hole is too small).</li>
      <li><b>Lens / mirror:</b> keeps <i>all</i> rays and bends them so they re-meet. Bright <i>and</i> sharp, but only on one special screen position.</li></ul>
      <p>Why can a lens do this? <b>Fermat:</b> all rays from the object point to the image point have the <i>same optical path length</i>, so they arrive in phase.</p>`);
    const st = { dev: 'none', sx: 8, ap: 1.5 }, F = 4, U = 10;
    const pts = [{ y: 1.5, c: [255, 90, 90] }, { y: 0, c: [90, 255, 130] }, { y: -1.5, c: [100, 150, 255] }];
    const NB = 100;
    const v = new View(L.stage, {
      draw(c, v) {
        v.fit(-13, 15, -5.5, 5.5); v.axis();
        const A = st.dev === 'none' ? 4 : st.ap, N = 33, bins = pts.map(() => new Float32Array(NB * 0 + NB));
        pts.forEach((p, pi) => {
          const col = `rgb(${p.c})`;
          for (let k = 0; k < N; k++) {
            const yi = -A + 2 * A * (k + 0.5) / N, m = (yi - p.y) / U, m2 = st.dev === 'lens' ? m - yi / F : m, yh = yi + m2 * st.sx;
            v.L(-U, p.y, 0, yi, col + '', 1); c.globalAlpha = 1;
            v.L(0, yi, st.sx, yh, col, 1);
          }
          const NS = 800; // dense sampling for the screen brightness, so it does not alias
          for (let k = 0; k < NS; k++) {
            const yi = -A + 2 * A * (k + 0.5) / NS, m = (yi - p.y) / U, yh = yi + (st.dev === 'lens' ? m - yi / F : m) * st.sx;
            const bi = Math.floor((yh + 5) / 10 * NB); if (bi >= 0 && bi < NB) bins[pi][bi] += 2 * A / NS / (10 / NB);
          }
          v.dot(-U, p.y, 5, col);
        });
        v.arrow(-U, -1.5, -U, 1.5, C.obj, 2);
        // device
        if (st.dev === 'lens') { v.lens(0, 3.6, true); c.fillStyle = 'rgba(10,15,31,.85)'; }
        if (st.dev === 'pinhole') { v.L(0, st.ap, 0, 5.3, '#9aa6cf', 6); v.L(0, -st.ap, 0, -5.3, '#9aa6cf', 6); }
        if (st.dev === 'lens' && st.ap < 3.5) { v.L(0, st.ap, 0, 3.6, '#9aa6cf', 6); v.L(0, -st.ap, 0, -3.6, '#9aa6cf', 6); }
        // screen with accumulated light
        const sx0 = v.X(st.sx) - 7;
        for (let b = 0; b < NB; b++) {
          const y0 = -5 + b * 10 / NB; let rgb = [0, 0, 0];
          for (let pi = 0; pi < 3; pi++) for (let q = 0; q < 3; q++) rgb[q] += bins[pi][b] * pts[pi].c[q] / 255;
          rgb = rgb.map(x => Math.round(255 * (1 - Math.exp(-0.55 * x))));
          c.fillStyle = `rgb(${rgb})`; c.fillRect(sx0, v.Y(y0 + 10 / NB), 14, v.s * 10 / NB + 1);
        }
        c.strokeStyle = '#8b97bd'; c.lineWidth = 1; c.strokeRect(sx0, v.Y(5), 14, v.s * 10);
        v.T('screen', st.sx, 5.2, C.dim, 12, 'center'); v.T('object', -U, 2.2, C.obj, 12, 'center');
      }
    });
    v.addHandle({ get: () => [st.sx, -5.2], set: x => { st.sx = clamp(x, 1, 14); sSx.set(st.sx); }, col: '#fff', label: 'drag screen' });
    v.onChange = refresh;
    const sSx = slider(L.ctl, { label: 'Screen position', min: 1, max: 14, step: 0.05, value: st.sx, fmt: x => fmt(x) + ' cm', on: x => { st.sx = x; refresh(); } });
    const sAp = slider(L.ctl, { label: 'Opening radius', min: 0.05, max: 3.5, step: 0.05, value: st.ap, fmt: x => fmt(x) + ' cm', on: x => { st.ap = x; refresh(); } });
    seg(L.ctl, [['none', 'Nothing'], ['pinhole', 'Pinhole'], ['lens', 'Lens (f = 4)']], 'none', k => { st.dev = k; refresh(); });
    button(L.ctl, 'Snap screen to the lens image', () => { st.dev = 'lens'; st.sx = 1 / (1 / F - 1 / U); sSx.set(st.sx); st.ap = 2; sAp.set(2); refresh(); });
    function refresh() {
      const vI = 1 / (1 / F - 1 / U);
      let t = '';
      if (st.dev === 'none') t = '<b>No optics:</b> every screen point receives light from all three object points. Colors mix to a smear. <b>There is no image anywhere.</b>';
      if (st.dev === 'pinhole') t = `<b>Pinhole:</b> one thin pencil of rays per point → three separate spots, <b>inverted</b>. Brightness ∝ (hole area). Try a large hole: sharpness is lost.`;
      if (st.dev === 'lens') t = Math.abs(st.sx - vI) < 0.12 ? '<span class="good">In focus!</span> All rays from each object point re-meet on the screen: bright, sharp, inverted image.'
        : `Lens image forms at v = ${fmt(vI)} cm ($\\frac{1}{v}=\\frac{1}{f}-\\frac{1}{u}$). Your screen is at ${fmt(st.sx)} cm → each point is a <b>blur disc</b> of diameter ≈ ${fmt(2 * st.ap * Math.abs(st.sx - vI) / vI)} cm.`;
      L.out.innerHTML = `<div class="box">${t}</div>`;
      v.render();
    }
    refresh();
  }
});

/* ---------------------------------------------------------------- */
PAGES.push({
  id: 'fermat', title: "Fermat's principle", group: 'Foundations', desc: 'Light takes the stationary optical path: reflection and Snell’s law fall out',
  build(root) {
    const L = layout(root, "Fermat's principle", `
      <p><b>Fermat:</b> between two points light follows the path whose <b>optical path length</b> $\\mathrm{OPL}=\\sum_i n_i l_i$ (= c × travel time) is <i>stationary</i> (usually a minimum).</p>
      <p>Move the point P along the surface. The curve below is OPL(x). Its minimum is where $\\frac{d(\\mathrm{OPL})}{dx}=0$:</p>
      <p style="text-align:center">$$n_1\\sin\\theta_1 = n_2\\sin\\theta_2 \\ \\text{(Snell)}\\qquad\\text{or}\\qquad \\theta_i=\\theta_r\\ \\text{(reflection)}$$</p>
      <p>So Snell's law is <i>not</i> an extra law: it is “$\\frac{d(\\mathrm{OPL})}{dx}=0$”. Mirror trick: for reflection, mirror B to B′; the straight line A→B′ is the shortest path.</p>`);
    const st = { mode: 'refraction', n1: 1, n2: 1.5, A: [-4.5, 3], B: [5, -3], Br: [5, 2.5], px: 1 };
    const Bp = () => st.mode === 'refraction' ? st.B : st.Br, n2e = () => st.mode === 'refraction' ? st.n2 : st.n1;
    const opl = x => { const B = Bp(); return st.n1 * Math.hypot(x - st.A[0], st.A[1]) + n2e() * Math.hypot(B[0] - x, B[1]); };
    function xmin() { let a = -14, b = 14; for (let i = 0; i < 80; i++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (opl(m1) < opl(m2)) b = m2; else a = m1; } return (a + b) / 2; }
    const v = new View(L.stage, {
      flex: 2, draw(c, v) {
        v.fit(-9, 9, -5.2, 5.2);
        const B = Bp(), P = [st.px, 0];
        if (st.mode === 'refraction') v.fillP([[-20, 0], [20, 0], [20, -10], [-20, -10]], `rgba(90,150,255,${0.08 + 0.1 * (st.n2 - 1)})`);
        v.L(-20, 0, 20, 0, st.mode === 'reflection' ? C.mirror : C.glassEdge, st.mode === 'reflection' ? 4 : 2);
        if (st.mode === 'reflection') for (let x = -9; x < 9; x += 0.4) v.L(x, 0, x - 0.25, -0.3, C.mirror, 1);
        v.T('n₁ = ' + fmt(st.n1), -8.8, 4.5, C.dim, 14); if (st.mode === 'refraction') v.T('n₂ = ' + fmt(st.n2), -8.8, -4.6, C.dim, 14);
        if (st.mode === 'reflection') {
          v.L(st.A[0], st.A[1], B[0], -B[1], '#7a86b3', 1.2, [5, 5]); v.dot(B[0], -B[1], 4, '#7a86b3'); v.T("B′ (mirror image)", B[0], -B[1], C.dim, 12, 'left', 8, 4);
          v.L(P[0], 0, B[0], -B[1], '#7a86b3', 1.2, [5, 5]);
        }
        v.L(P[0], -4, P[0], 4, '#6b78a8', 1, [4, 4]);
        v.ray(st.A[0], st.A[1], P[0], 0, C.ray, 3); v.ray(P[0], 0, B[0], B[1], C.ray2, 3);
        const aA = Math.atan2(st.A[1], st.A[0] - P[0]), aB = Math.atan2(B[1], B[0] - P[0]);
        v.arc(P[0], 0, 38, Math.min(aA, Math.PI / 2), Math.max(aA, Math.PI / 2), C.ray);
        const up = B[1] > 0; v.arc(P[0], 0, 46, up ? Math.min(aB, Math.PI / 2) : Math.min(aB, -Math.PI / 2), up ? Math.max(aB, Math.PI / 2) : Math.max(aB, -Math.PI / 2), C.ray2);
        const t1 = Math.atan(Math.abs(st.A[0] - P[0]) / st.A[1]) * deg, t2 = Math.atan(Math.abs(B[0] - P[0]) / Math.abs(B[1])) * deg;
        v.T('θ₁=' + fmt(t1, 1) + '°', P[0], 0, C.ray, 13, 'right', -46, -26);
        v.T((st.mode === 'reflection' ? 'θᵣ=' : 'θ₂=') + fmt(t2, 1) + '°', P[0], 0, C.ray2, 13, 'left', 50, up ? -26 : 34);
        v.dot(st.A[0], st.A[1], 6, C.obj); v.T('A', st.A[0], st.A[1], C.obj, 15, 'left', -4, -12);
        v.dot(B[0], B[1], 6, C.img); v.T('B', B[0], B[1], C.img, 15, 'left', 8, -8);
        v.dot(P[0], 0, 5, '#fff');
      }
    });
    const plot = new View(L.stage, {
      flex: 1, draw(c, v) {
        const W = v.W, H = v.H, m = { l: 46, r: 14, t: 22, b: 30 }, xs = linspace(-10, 10, 200), ys = xs.map(opl), lo = Math.min(...ys), hi = Math.max(...ys);
        const X = x => m.l + (x + 10) / 20 * (W - m.l - m.r), Y = y => H - m.b - (y - lo + 0.6) / (hi - lo + 1.2) * (H - m.t - m.b);
        c.strokeStyle = C.axis; c.lineWidth = 1; c.strokeRect(m.l, m.t, W - m.l - m.r, H - m.t - m.b);
        c.beginPath(); xs.forEach((x, i) => i ? c.lineTo(X(x), Y(ys[i])) : c.moveTo(X(x), Y(ys[i]))); c.strokeStyle = C.ray2; c.lineWidth = 2.5; c.stroke();
        const xm = xmin(); c.fillStyle = C.img; c.beginPath(); c.arc(X(xm), Y(opl(xm)), 5, 0, 7); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(X(st.px), Y(opl(st.px)), 6, 0, 7); c.fill();
        c.fillStyle = C.dim; c.font = '12px Segoe UI'; c.textAlign = 'center'; c.fillText('position x of the point P on the surface', W / 2, H - 8);
        c.save(); c.translate(14, H / 2); c.rotate(-Math.PI / 2); c.fillText('optical path length  Σ n·l', 0, 0); c.restore();
        c.fillStyle = C.img; c.textAlign = 'left'; c.fillText('minimum → the real ray', X(xm) + 8, Y(opl(xm)) + 4);
      }
    });
    v.addHandle({ get: () => [st.A[0], st.A[1]], set: (x, y) => { st.A = [clamp(x, -8.5, 8.5), clamp(y, 0.5, 4.8)]; }, col: C.obj, label: '' });
    v.addHandle({ get: () => Bp(), set: (x, y) => { const b = [clamp(x, -8.5, 8.5), st.mode === 'refraction' ? clamp(y, -4.8, -0.5) : clamp(y, 0.5, 4.8)]; if (st.mode === 'refraction') st.B = b; else st.Br = b; }, col: C.img });
    v.addHandle({ get: () => [st.px, 0], set: x => { st.px = clamp(x, -9, 9); }, col: '#fff', label: 'drag P' });
    plot.cv.addEventListener('pointerdown', e => { const r = plot.cv.getBoundingClientRect(); plot.drag = { set: x => 0 }; plot.drag = null; });
    function dragPlot(e) { if (e.buttons !== 1) return; const r = plot.cv.getBoundingClientRect(); const x = ((e.clientX - r.left) - 46) / (r.width - 60) * 20 - 10; st.px = clamp(x, -9, 9); refresh(); }
    plot.cv.addEventListener('pointermove', dragPlot); plot.cv.addEventListener('pointerdown', dragPlot);
    v.onChange = refresh;
    seg(L.ctl, [['refraction', 'Refraction'], ['reflection', 'Reflection']], 'refraction', k => { st.mode = k; refresh(); });
    slider(L.ctl, { label: 'n₁ (top)', min: 1, max: 2.4, step: 0.01, value: st.n1, on: x => { st.n1 = x; refresh(); } });
    const sn2 = slider(L.ctl, { label: 'n₂ (bottom)', min: 1, max: 2.4, step: 0.01, value: st.n2, on: x => { st.n2 = x; refresh(); } });
    button(L.ctl, 'Snap P to the minimum-OPL point', () => { st.px = xmin(); refresh(); });
    function refresh() {
      const B = Bp(), P = st.px, a1 = (P - st.A[0]) / Math.hypot(P - st.A[0], st.A[1]), a2 = (B[0] - P) / Math.hypot(B[0] - P, B[1]);
      const d = st.n1 * a1 - n2e() * a2, xm = xmin();
      const lab = st.mode === 'refraction' ? ['$n_1\\sin\\theta_1$', '$n_2\\sin\\theta_2$'] : ['$\\sin\\theta_i$', '$\\sin\\theta_r$'];
      L.out.innerHTML = `<div class="box"><div class="row"><span>OPL at P</span><b>${fmt(opl(P), 3)}</b></div>
        <div class="row"><span>minimum OPL</span><b class="good">${fmt(opl(xm), 3)}</b></div>
        <div class="row"><span>${lab[0]}</span><b>${fmt(st.n1 * Math.abs(a1), 4)}</b></div><div class="row"><span>${lab[1]}</span><b>${fmt(n2e() * Math.abs(a2), 4)}</b></div>
        <div class="row"><span>slope $\\frac{d(\\mathrm{OPL})}{dx}$</span><b class="${Math.abs(d) < 0.005 ? 'good' : 'bad'}">${fmt(d, 4)}</b></div></div>
        <p class="hint">${Math.abs(d) < 0.005 ? '✔ Slope = 0: this is the path light really takes, and the two sines match.' : 'Slope ≠ 0: a neighbouring path is faster, so light would not go this way.'}</p>`;
      v.render(); plot.render();
    }
    refresh();
  }
});

/* ---------------------------------------------------------------- */
PAGES.push({
  id: 'snell', title: "Snell's law & total reflection", group: 'Foundations', desc: 'Refraction, Fresnel reflectance, critical angle, wavefronts',
  build(root) {
    const L = layout(root, "Snell's law & total internal reflection", `
      <p style="text-align:center">$$n_1\\sin\\theta_1 = n_2\\sin\\theta_2$$</p>
      <p>Frequency stays constant; speed $v=c/n$ and wavelength $\\lambda=\\lambda_0/n$ shrink in a denser medium. The wavefronts must stay joined along the surface, so they <i>turn</i>: turn on “wavefronts” to see why.</p>
      <ul><li>Into a denser medium: ray bends <b>toward</b> the normal.</li>
      <li>Out of a denser medium ($n_1>n_2$): beyond the <b>critical angle</b> $\\theta_c=\\arcsin(n_2/n_1)$ there is no refracted ray → <b>total internal reflection</b> (optical fibres, prisms, diamonds).</li>
      <li>The reflected fraction grows with angle (Fresnel). At <b>Brewster's angle</b> $\\tan\\theta=n_2/n_1$ the p-polarised reflection vanishes.</li></ul>`);
    const st = { n1: 1, n2: 1.5, th: 40, wave: false };
    const v = new View(L.stage, {
      draw(c, v) {
        v.fit(-7, 7, -5.2, 5.2);
        const t1 = st.th * rad, s2 = st.n1 * Math.sin(t1) / st.n2, tir = s2 > 1, t2 = tir ? 0 : Math.asin(s2);
        v.fillP([[-20, 0], [20, 0], [20, -20], [-20, -20]], `rgba(90,150,255,${0.06 + 0.12 * (st.n2 - 1)})`);
        v.fillP([[-20, 0], [20, 0], [20, 20], [-20, 20]], `rgba(90,150,255,${0.06 * (st.n1 - 1)})`);
        v.L(-20, 0, 20, 0, C.glassEdge, 2); v.L(0, -4.8, 0, 4.8, '#5d6a99', 1, [5, 5]);
        const d1 = [Math.sin(t1), -Math.cos(t1)], d2 = [Math.sin(t2), -Math.cos(t2)];
        if (st.wave) {
          const lam = 1, ph = (performance.now() / 2200) % 1;
          for (const [reg, d, n, ok] of [[1, d1, st.n1, true], [-1, d2, st.n2, !tir]]) {
            if (!ok) continue; c.save(); c.beginPath(); c.rect(0, reg > 0 ? 0 : v.Y(0), v.W, reg > 0 ? v.Y(0) : v.H); c.clip();
            const t = [d[1] * -1, d[0]]; // perpendicular
            for (let m = -40; m < 40; m++) { const s = (m + ph) * lam / n, p0 = [s * d[0], s * d[1]]; v.L(p0[0] - 30 * t[0], p0[1] - 30 * t[1], p0[0] + 30 * t[0], p0[1] + 30 * t[1], 'rgba(255,255,255,.28)', 1.3); }
            c.restore();
          }
        }
        const Lr = 5, S = [-Lr * d1[0], -Lr * d1[1]];
        // Fresnel
        const ci = Math.cos(t1), ct = Math.cos(t2);
        const R = tir ? 1 : (Math.pow((st.n1 * ci - st.n2 * ct) / (st.n1 * ci + st.n2 * ct), 2) + Math.pow((st.n1 * ct - st.n2 * ci) / (st.n1 * ct + st.n2 * ci), 2)) / 2;
        v.ray(S[0], S[1], 0, 0, C.ray, 3.5);
        v.ray(0, 0, Lr * d1[0], Lr * -d1[1], C.ray3, 1 + 3 * Math.sqrt(R), null, true);
        if (!tir) v.ray(0, 0, Lr * d2[0], Lr * d2[1], C.ray2, 1 + 3 * Math.sqrt(1 - R));
        else v.T('TOTAL INTERNAL REFLECTION', 0, -2.5, C.ray3, 15, 'center', 0, 0, true);
        if (st.n1 > st.n2) { const tc = Math.asin(st.n2 / st.n1); v.L(0, 0, -Lr * Math.sin(tc), Lr * Math.cos(tc), '#b78cff', 1.2, [4, 4]); v.T('θc=' + fmt(tc * deg, 1) + '°', -Lr * Math.sin(tc), Lr * Math.cos(tc), '#b78cff', 12, 'right', -4, -4); }
        v.arc(0, 0, 44, Math.PI / 2, Math.PI / 2 + t1, C.ray); v.T('θ₁=' + fmt(st.th, 1) + '°', 0, 0, C.ray, 13, 'right', -52, -40);
        if (!tir) { v.arc(0, 0, 54, -Math.PI / 2, -Math.PI / 2 + t2, C.ray2); v.T('θ₂=' + fmt(t2 * deg, 1) + '°', 0, 0, C.ray2, 13, 'left', 62, 52); }
        v.T('n₁ = ' + fmt(st.n1), -6.8, 4.5, C.dim, 14); v.T('n₂ = ' + fmt(st.n2), -6.8, -4.6, C.dim, 14);
        v.T('reflected ' + fmt(R * 100, 1) + '%', 6.8, 4.5, C.ray3, 13, 'right'); v.T('transmitted ' + fmt((1 - R) * 100, 1) + '%', 6.8, -4.6, C.ray2, 13, 'right');
      }
    });
    const sT = slider(L.ctl, { label: 'Angle of incidence θ₁', min: 0, max: 89.5, step: 0.1, value: st.th, fmt: x => fmt(x, 1) + '°', on: x => { st.th = x; refresh(); } });
    const s1 = slider(L.ctl, { label: 'n₁', min: 1, max: 2.5, step: 0.01, value: st.n1, on: x => { st.n1 = x; refresh(); } });
    const s2 = slider(L.ctl, { label: 'n₂', min: 1, max: 2.5, step: 0.01, value: st.n2, on: x => { st.n2 = x; refresh(); } });
    const pre = (a, b) => () => { st.n1 = a; st.n2 = b; s1.set(a); s2.set(b); refresh(); };
    heading(L.ctl, 'Presets'); const pr = el('div', 'btnrow'); L.ctl.appendChild(pr);
    button(pr, 'air → water', pre(1, 1.33)); button(pr, 'water → air', pre(1.33, 1)); button(pr, 'glass → air', pre(1.5, 1)); button(pr, 'diamond → air', pre(2.42, 1)); button(pr, 'air → glass', pre(1, 1.5));
    check(L.ctl, 'Show wavefronts (animated)', false, b => { st.wave = b; });
    loop(() => { if (st.wave) v.render(); });
    function refresh() {
      const t1 = st.th * rad, s = st.n1 * Math.sin(t1) / st.n2, tir = s > 1;
      L.out.innerHTML = `<div class="box"><div class="row"><span>$n_1\\sin\\theta_1$</span><b>${fmt(st.n1 * Math.sin(t1), 4)}</b></div>
      <div class="row"><span>$n_2\\sin\\theta_2$</span><b>${tir ? 'impossible (>n₂)' : fmt(st.n2 * s, 4)}</b></div>
      <div class="row"><span>critical angle $\\theta_c=\\arcsin(n_2/n_1)$</span><b>${st.n1 > st.n2 ? fmt(Math.asin(st.n2 / st.n1) * deg, 2) + '°' : 'none (n₁ ≤ n₂)'}</b></div>
      <div class="row"><span>Brewster angle $\\arctan(n_2/n_1)$</span><b>${fmt(Math.atan(st.n2 / st.n1) * deg, 2)}°</b></div>
      <div class="row"><span>speed in medium 1 / 2</span><b>${fmt(1 / st.n1, 2)}c / ${fmt(1 / st.n2, 2)}c</b></div></div>`;
      v.render();
    }
    refresh();
  }
});

/* ---------------------------------------------------------------- */
PAGES.push({
  id: 'prism', title: 'Prism & dispersion', group: 'Foundations', desc: 'Minimum deviation, measuring n, and why white light splits',
  build(root) {
    const L = layout(root, 'Prism & dispersion', `
      <p>Two refractions: $\\sin\\theta_1=n\\sin\\theta_2$, then $\\theta_3=A-\\theta_2$, $\\sin\\theta_4=n\\sin\\theta_3$. Deviation $D=\\theta_1+\\theta_4-A$.</p>
      <p>D has a <b>minimum</b> when the ray passes symmetrically ($\\theta_1=\\theta_4$). Then:</p>
      <p style="text-align:center">$$n = \\dfrac{\\sin\\!\\left(\\dfrac{A+D_{min}}{2}\\right)}{\\sin\\!\\left(\\dfrac{A}{2}\\right)}$$</p>
      <p>This is how real refractive indices are measured. For a thin prism $D\\approx(n-1)A$.</p>
      <p>n depends on wavelength ($n_{blue}>n_{red}$) → blue bends more → <b>dispersion</b>. Same effect makes rainbows, and chromatic aberration in lenses. Increase the dispersion slider to exaggerate it.</p>`);
    const st = { A: 60, n0: 1.55, D: 0.03, th: 50, white: true };
    const H = 6;
    const poly = () => { const b = H * Math.tan(st.A * rad / 2); return [[-b, 0], [b, 0], [0, H]]; };
    function trace(n) {
      const P = poly(); const e = (i) => [P[(i + 1) % 3][0] - P[i][0], P[(i + 1) % 3][1] - P[i][1]];
      const outN = i => { const q = e(i), l = Math.hypot(q[0], q[1]); return [q[1] / l, -q[0] / l]; };
      const mid = [(P[2][0] + P[0][0]) / 2, (P[2][1] + P[0][1]) / 2], nin = outN(2).map(x => -x);
      const a0 = Math.atan2(nin[1], nin[0]) + st.th * rad, d0 = [Math.cos(a0), Math.sin(a0)];
      let p = [mid[0] - 6 * d0[0], mid[1] - 6 * d0[1]], d = d0.slice(), inside = false; const pts = [p.slice()];
      for (let k = 0; k < 8; k++) {
        let best = null;
        for (let i = 0; i < 3; i++) {
          const a = P[i], q = e(i), den = d[0] * q[1] - d[1] * q[0]; if (Math.abs(den) < 1e-12) continue;
          const wx = a[0] - p[0], wy = a[1] - p[1], t = (wx * q[1] - wy * q[0]) / den, s = (wx * d[1] - wy * d[0]) / den;
          if (t > 1e-6 && s >= 0 && s <= 1 && (!best || t < best.t)) best = { t, i };
        }
        if (!best) break;
        p = [p[0] + best.t * d[0], p[1] + best.t * d[1]]; pts.push(p.slice());
        const nr = outN(best.i), nd = refract(d, nr, inside ? n : 1, inside ? 1 : n);
        if (nd) { d = nd; inside = !inside; } else d = reflect(d, nr);
      }
      pts.push([p[0] + 14 * d[0], p[1] + 14 * d[1]]);
      let dev = Math.atan2(d0[1], d0[0]) - Math.atan2(d[1], d[0]); dev = Math.atan2(Math.sin(dev), Math.cos(dev));
      return { pts, dev: dev * deg, inside };
    }
    const analytic = (th, n) => { const t2 = Math.asin(Math.sin(th * rad) / n), t3 = st.A * rad - t2, s = n * Math.sin(t3); if (s > 1 || t3 < 0 && false) return NaN; return th + Math.asin(s) * deg - st.A; };
    const v = new View(L.stage, {
      flex: 2, draw(c, v) {
        v.fit(-8, 15, -3, 8);
        const P = poly(); v.fillP(P, 'rgba(110,170,255,.18)', C.glassEdge, 2);
        v.T('A = ' + fmt(st.A, 0) + '°', 0, H - 0.9, C.dim, 13, 'center');
        c.globalCompositeOperation = st.white ? 'lighter' : 'source-over';
        const lams = st.white ? [0.40, 0.44, 0.48, 0.52, 0.56, 0.60, 0.64, 0.70] : [0.589];
        let first = true;
        for (const lam of lams) {
          const col = st.white ? wl2rgb(lam * 1000) : C.ray, r = trace(nOf(st.n0, st.D, lam));
          v.P(r.pts.slice(0, 2), st.white ? 'rgba(255,255,255,.45)' : C.ray, 2.5);
          v.P(r.pts.slice(1), col, st.white ? 2 : 3);
        }
        c.globalCompositeOperation = 'source-over';
        const r0 = trace(nOf(st.n0, st.D, 0.589)); const q = r0.pts;
        v.dot(q[0][0], q[0][1], 4, '#fff');
      }
    });
    const plot = new View(L.stage, {
      flex: 1, draw(c, v) {
        const W = v.W, Hh = v.H, m = { l: 46, r: 14, t: 18, b: 30 }; const xs = linspace(25, 89, 200);
        const n = nOf(st.n0, st.D, 0.589), ys = xs.map(x => analytic(x, n)), ok = ys.filter(isFinite), lo = Math.min(...ok) - 3, hi = Math.max(...ok) + 3;
        const X = x => m.l + (x - 25) / 64 * (W - m.l - m.r), Y = y => Hh - m.b - (y - lo) / (hi - lo) * (Hh - m.t - m.b);
        c.strokeStyle = C.axis; c.lineWidth = 1; c.strokeRect(m.l, m.t, W - m.l - m.r, Hh - m.t - m.b);
        c.beginPath(); let pen = false; xs.forEach((x, i) => { if (!isFinite(ys[i])) { pen = false; return; } pen ? c.lineTo(X(x), Y(ys[i])) : c.moveTo(X(x), Y(ys[i])); pen = true; }); c.strokeStyle = C.ray2; c.lineWidth = 2.5; c.stroke();
        const Dm = 2 * Math.asin(Math.min(1, n * Math.sin(st.A * rad / 2))) * deg - st.A, thm = Math.asin(n * Math.sin(st.A * rad / 2)) * deg;
        c.fillStyle = C.img; c.beginPath(); c.arc(X(thm), Y(Dm), 5, 0, 7); c.fill();
        const cur = analytic(st.th, n); if (isFinite(cur)) { c.fillStyle = '#fff'; c.beginPath(); c.arc(X(st.th), Y(cur), 6, 0, 7); c.fill(); }
        c.fillStyle = C.dim; c.font = '12px Segoe UI'; c.textAlign = 'center'; c.fillText('angle of incidence θ₁ (°)', W / 2, Hh - 8);
        c.save(); c.translate(14, Hh / 2); c.rotate(-Math.PI / 2); c.fillText('deviation D (°)', 0, 0); c.restore();
        c.fillStyle = C.img; c.textAlign = 'left'; c.fillText('D_min = ' + fmt(Dm, 1) + '°', X(thm) + 8, Y(Dm) + 16);
      }
    });
    v.onChange = refresh;
    seg(L.ctl, [['white', 'White light'], ['mono', 'Single color']], 'white', k => { st.white = k === 'white'; refresh(); });
    slider(L.ctl, { label: 'Apex angle A', min: 20, max: 90, step: 1, value: st.A, fmt: x => fmt(x, 0) + '°', on: x => { st.A = x; refresh(); } });
    slider(L.ctl, { label: 'Refractive index n (yellow)', min: 1.2, max: 2, step: 0.01, value: st.n0, on: x => { st.n0 = x; refresh(); } });
    slider(L.ctl, { label: 'Dispersion strength', min: 0, max: 0.12, step: 0.002, value: st.D, fmt: x => fmt(x, 3), on: x => { st.D = x; refresh(); } });
    const sth = slider(L.ctl, { label: 'Angle of incidence θ₁', min: 25, max: 89, step: 0.1, value: st.th, fmt: x => fmt(x, 1) + '°', on: x => { st.th = x; refresh(); } });
    button(L.ctl, 'Set to minimum deviation', () => { const n = nOf(st.n0, st.D, 0.589); st.th = Math.asin(Math.min(1, n * Math.sin(st.A * rad / 2))) * deg; sth.set(st.th); refresh(); });
    function refresh() {
      const n = nOf(st.n0, st.D, 0.589), r = trace(n), Dm = 2 * Math.asin(Math.min(1, n * Math.sin(st.A * rad / 2))) * deg - st.A;
      const rb = trace(nOf(st.n0, st.D, 0.42)), rr = trace(nOf(st.n0, st.D, 0.68));
      L.out.innerHTML = `<div class="box"><div class="row"><span>deviation D (traced)</span><b>${fmt(r.dev, 2)}°</b></div>
       <div class="row"><span>$D_{min}$ (formula)</span><b class="good">${fmt(Dm, 2)}°</b></div>
       <div class="row"><span>n from $D_{min}$</span><b>${fmt(Math.sin((st.A + Dm) * rad / 2) / Math.sin(st.A * rad / 2), 3)}</b></div>
       <div class="row"><span>thin-prism $(n-1)A$</span><b>${fmt((n - 1) * st.A, 2)}°</b></div>
       <div class="row"><span>violet–red angular spread</span><b>${fmt(rb.dev - rr.dev, 2)}°</b></div></div>`;
      v.render(); plot.render();
    }
    refresh();
  }
});
