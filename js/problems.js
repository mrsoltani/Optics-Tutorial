'use strict';
/* ===== Randomised practice problems (IOAA style) ===== */
const rnd = (a, b, s = 1) => a + s * Math.floor(Math.random() * ((b - a) / s + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const f2 = (x, d = 2) => (+x).toFixed(d);

const PROBS = [
  { topic: 'Mirrors', gen() { const f = rnd(10, 30, 5), u = rnd(f + 5, 70, 5), v = 1 / (1 / f - 1 / u);
    return { q: `A concave mirror has focal length ${f} cm. An object is ${u} cm in front of it. At what distance from the mirror is the image (cm)?`, ans: v, unit: 'cm', sol: `$\\frac{1}{v}=\\frac{1}{f}-\\frac{1}{u}=\\frac{1}{${f}}-\\frac{1}{${u}}$ ⇒ v = ${f2(v)} cm, real, in front of the mirror. $m=-v/u=${f2(-v / u)}$.` }; } },
  { topic: 'Mirrors', gen() { const R = rnd(20, 60, 10), u = rnd(20, 80, 10), f = R / 2, v = u * f / (u + f);
    return { q: `A convex mirror has radius of curvature ${R} cm. An object stands ${u} cm from it. How far <i>behind</i> the mirror does the image appear (cm)?`, ans: v, unit: 'cm', sol: `$f=-R/2=-${R / 2}$ cm. $\\frac{1}{v}=\\frac{1}{f}-\\frac{1}{u}=-\\frac{1}{${R / 2}}-\\frac{1}{${u}}$ ⇒ v = −${f2(v)} cm, i.e. ${f2(v)} cm behind the mirror (virtual).` }; } },
  { topic: 'Mirrors', gen() { const f = rnd(10, 30, 5), k = pick([2, 3, 4, 5]), u = f * (1 + 1 / k);
    return { q: `A concave mirror (f = ${f} cm) must form a real image ${k} times larger than the object. How far from the mirror (cm) should the object be placed?`, ans: u, unit: 'cm', sol: `Real, inverted: $m=-${k}=-v/u \\Rightarrow v=${k}u$. $\\frac{1}{u}+\\frac{1}{${k}u}=\\frac{1}{f} \\Rightarrow u=f\\left(1+\\frac{1}{${k}}\\right)=${f2(u)}$ cm.` }; } },
  { topic: 'Mirrors', gen() { const th = rnd(1, 6), Ldist = pick([2, 3, 4]), d = Ldist * Math.tan(2 * th * rad) * 100;
    return { q: `A laser beam hits a plane mirror and the reflected spot falls on a wall ${Ldist} m away. The mirror is rotated by ${th}° about an axis perpendicular to the beam plane. By how many centimetres does the spot move on the wall? (the wall is perpendicular to the original reflected beam)`, ans: d, unit: 'cm', sol: `Rotating a mirror by θ rotates the reflected ray by $2\\theta=${2 * th}°$. Shift $=L\\tan(2\\theta)=${Ldist}\\cdot\\tan(${2 * th}°)=${f2(d / 100, 4)}$ m = ${f2(d)} cm.` }; } },
  { topic: 'Lenses', gen() { const f = rnd(5, 20, 5), u = rnd(f + 5, 60, 5), v = 1 / (1 / f - 1 / u);
    return { q: `A converging lens has f = ${f} cm. An object is ${u} cm from the lens. Find the image distance (cm).`, ans: v, unit: 'cm', sol: `$\\frac{1}{v}=\\frac{1}{${f}}-\\frac{1}{${u}}$ ⇒ v = ${f2(v)} cm (real, inverted, $m=${f2(-v / u)}$).` }; } },
  { topic: 'Lenses', gen() { const f = rnd(10, 30, 5), u = rnd(20, 60, 10), h = rnd(2, 8, 1), v = u * f / (u + f), hi = h * v / u;
    return { q: `A diverging lens has |f| = ${f} cm. An arrow ${h} cm tall stands ${u} cm from the lens. What is the height of the image (cm)?`, ans: hi, unit: 'cm', sol: `$f=-${f}$ cm: $\\frac{1}{v}=-\\frac{1}{${f}}-\\frac{1}{${u}}$ ⇒ v = −${f2(v)} cm (virtual). $m=-v/u=${f2(v / u, 3)}$, so image height = ${f2(hi)} cm, upright.` }; } },
  { topic: 'Lenses', gen() { const f = rnd(10, 30, 5), x = rnd(10, 50, 10), xp = f * f / x;
    return { q: `Newton’s form: a thin lens has f = ${f} cm. An object is ${x} cm in front of the <i>front focal point</i>. How far behind the <i>back focal point</i> is the image (cm)?`, ans: xp, unit: 'cm', sol: `$x\\cdot x'=f^2 \\Rightarrow x'=${f}^2/${x}=${f2(xp)}$ cm.` }; } },
  { topic: 'Lenses', gen() { const D = pick([100, 120, 150, 200]), e = pick([20, 30, 40, 50]), f = (D * D - e * e) / (4 * D);
    return { q: `An object and a screen are ${D} cm apart. A converging lens placed between them gives a sharp image at two positions, ${e} cm apart (Bessel's method). Find the focal length (cm).`, ans: f, unit: 'cm', sol: `Positions: $u=(D\\mp e)/2$. With $v=D-u$: $f=\\frac{D^2-e^2}{4D}=\\frac{${D}^2-${e}^2}{${4 * D}}=${f2(f)}$ cm.` }; } },
  { topic: 'Lenses', gen() { const n = pick([1.5, 1.6, 1.7, 1.8]), R = rnd(10, 40, 5), f = R / (2 * (n - 1));
    return { q: `A thin symmetric biconvex lens of refractive index ${n} has both surfaces with radius ${R} cm. Find its focal length in air (cm).`, ans: f, unit: 'cm', sol: `$\\frac{1}{f}=(n-1)\\left(\\frac{1}{R_1}-\\frac{1}{R_2}\\right)=${f2(n - 1, 1)}\\left(\\frac{2}{${R}}\\right) \\Rightarrow f=${f2(f)}$ cm.` }; } },
  { topic: 'Lenses', gen() { const [f1, f2_, d] = pick([[20, 30, 10], [15, 10, 5], [30, 30, 20], [12, 24, 6], [40, 20, 10]]), f = f1 * f2_ / (f1 + f2_ - d);
    return { q: `Two thin converging lenses, f₁ = ${f1} cm and f₂ = ${f2_} cm, are ${d} cm apart. What is the focal length of the combination (cm)?`, ans: f, unit: 'cm', sol: `$\\frac{1}{f}=\\frac{1}{f_1}+\\frac{1}{f_2}-\\frac{d}{f_1f_2}=\\frac{1}{${f1}}+\\frac{1}{${f2_}}-\\frac{${d}}{${f1 * f2_}} \\Rightarrow f=${f2(f)}$ cm.` }; } },
  { topic: 'Refraction', gen() { const d = rnd(40, 200, 10), n = 1.33, a = d / n;
    return { q: `A coin lies at the bottom of a pool of water (n = 1.33), ${d} cm deep. Looking straight down, at what apparent depth (cm) does it appear?`, ans: a, unit: 'cm', sol: `Apparent depth $=d/n=${d}/1.33=${f2(a)}$ cm (paraxial rays).` }; } },
  { topic: 'Refraction', gen() { const n = pick([1.33, 1.5, 1.62, 1.8, 2.42]), t = Math.asin(1 / n) * deg;
    return { q: `What is the critical angle (degrees) for light going from a material of index ${n} into air?`, ans: t, unit: '°', sol: `$\\sin\\theta_c=1/n=${f2(1 / n, 4)} \\Rightarrow \\theta_c=${f2(t)}°$.` }; } },
  { topic: 'Refraction', gen() { const n1 = pick([1.48, 1.5, 1.52]), n2 = pick([1.44, 1.46]), t = Math.asin(Math.sqrt(n1 * n1 - n2 * n2)) * deg;
    return { q: `An optical fibre has core index ${n1} and cladding index ${n2}. What is the maximum angle (degrees, from the axis) at which light in air can enter the end face and still be guided by total internal reflection?`, ans: t, unit: '°', sol: `$\\sin\\theta_{max}=\\sqrt{n_1^2-n_2^2}=\\sqrt{${n1}^2-${n2}^2}=${f2(Math.sqrt(n1 * n1 - n2 * n2), 4)} \\Rightarrow \\theta_{max}=${f2(t)}°$.` }; } },
  { topic: 'Refraction', gen() { const A = pick([30, 45, 60]), n = pick([1.5, 1.6, 1.7]), D = 2 * Math.asin(n * Math.sin(A * rad / 2)) * deg - A;
    return { q: `A prism with apex angle ${A}° and refractive index ${n} is used at minimum deviation. What is the deviation (degrees)?`, ans: D, unit: '°', sol: `$\\sin\\frac{A+D}{2}=n\\sin\\frac{A}{2}=${n}\\cdot\\sin ${A / 2}°$ ⇒ $\\frac{A+D}{2}=${f2(Math.asin(n * Math.sin(A * rad / 2)) * deg)}°$ ⇒ D = ${f2(D)}°.` }; } },
  { topic: 'Refraction', gen() { const n = pick([1.5, 1.6]), R = rnd(5, 20, 5), s = n * R / (n - 1);
    return { q: `Parallel light in air enters a glass (n = ${n}) hemisphere through its curved surface of radius ${R} cm. At what distance beyond the vertex (cm) is the paraxial focus, ignoring the flat side?`, ans: s, unit: 'cm', sol: `Single spherical surface: $\\frac{n_1}{s}+\\frac{n_2}{s'}=\\frac{n_2-n_1}{R}$ with $s=\\infty$ ⇒ $s'=\\frac{n_2R}{n_2-n_1}=\\frac{${n}\\cdot${R}}{${f2(n - 1, 1)}}=${f2(s)}$ cm.` }; } },
  { topic: 'Refraction', gen() { const d = pick([2, 3, 5]), n = pick([1.5, 1.6]), dt = d * 1e-3 * (n - 1) / 3e8 * 1e12;
    return { q: `A glass plate (n = ${n}) of thickness ${d} mm is placed in the path of a light beam (normal incidence). By how many picoseconds is the light delayed compared with travelling through the same distance of vacuum? (c = 3×10⁸ m/s)`, ans: dt, unit: 'ps', sol: `Extra optical path $=(n-1)d=${f2((n - 1) * d, 2)}$ mm ⇒ $\\Delta t=(n-1)d/c=${f2(dt)}$ ps.` }; } },
  { topic: 'Instruments', gen() { const f1 = rnd(60, 120, 20), f2v = pick([5, 10, 20]), M = f1 / f2v;
    return { q: `A Keplerian telescope has an objective of focal length ${f1} cm and an eyepiece of focal length ${f2v} cm. What is the magnitude of its angular magnification?`, ans: M, unit: '×', sol: `$M=f_1/f_2=${f1}/${f2v}=${f2(M)}$ (inverted). Tube length $f_1+f_2=${f1 + f2v}$ cm. (See the dedicated <a href="#/telemag">magnification page</a>.)` }; } },
  { topic: 'Instruments', gen() { const f = pick([2.5, 4, 5, 10]), M = 1 + 25 / f;
    return { q: `A simple magnifier with f = ${f} cm is held to the eye and the virtual image is formed at the near point D = 25 cm. What is the angular magnification?`, ans: M, unit: '×', sol: `$M=1+D/f=1+25/${f}=${f2(M)}$. (If the image is at infinity: $M=D/f=${f2(25 / f)}$.)` }; } },
  { topic: 'Instruments', gen() { const D = rnd(5, 40, 5), lam = pick([500, 550, 600]), th = 1.22 * lam * 1e-9 / (D * 1e-2) * 206265;
    return { q: `What is the Rayleigh diffraction limit (in arcseconds) of a telescope of diameter ${D} cm at λ = ${lam} nm? (1 rad = 206265″)`, ans: th, unit: '″', sol: `$\\theta=1.22\\lambda/D=1.22\\cdot${lam}\\times10^{-9}/${D / 100}=${(1.22 * lam * 1e-9 / (D * 1e-2)).toExponential(2)}$ rad = ${f2(th)}″.` }; } },
  { topic: 'Instruments', gen() { const d = rnd(40, 200, 10), P = -100 / d;
    return { q: `A short-sighted person cannot see objects beyond ${d} cm. What power (in dioptres, negative for diverging) must their glasses have (ignore the glasses–eye distance)?`, ans: P, unit: 'D', sol: `The glasses must make an image of a far object ($u=\\infty$) at the far point: $v=-${d}$ cm ⇒ $f=-${d}$ cm ⇒ $P=1/f=${f2(P)}$ D.` }; } },
  { topic: 'Waves', gen() { const lam = pick([500, 550, 600, 650]), d = pick([0.1, 0.2, 0.25, 0.5]), L = pick([1, 1.5, 2]), dy = lam * 1e-9 * L / (d * 1e-3) * 1e3;
    return { q: `In Young’s double-slit experiment the slits are ${d} mm apart, the screen is ${L} m away, and the wavelength is ${lam} nm. What is the fringe spacing (mm)?`, ans: dy, unit: 'mm', sol: `$\\Delta y=\\lambda L/d=${lam}\\times10^{-9}\\cdot${L}/${d}\\times10^{-3}=${f2(dy, 3)}$ mm.` }; } }
];

PAGES.push({
  id: 'problems', title: 'Practice problems', group: 'Practice', desc: 'Randomised numerical questions with worked solutions',
  build(root) {
    root.className = 'page single';
    const topics = ['All', ...new Set(PROBS.map(p => p.topic))];
    let cur = null, score = 0, tried = 0, topic = 'All', solved = false;
    root.innerHTML = `<div class="road prob"><h1>Practice problems</h1><p class="lead">Fresh numbers every time. Draw the ray diagram first, then use the equation. Tolerance 2%.</p>
      <div class="seg" id="tp"></div><div class="box big" id="q"></div>
      <div class="ans"><input id="in" type="number" step="any" placeholder="your answer"><span id="un"></span><button class="btn" id="chk">Check</button><button class="btn" id="sol">Show solution</button><button class="btn" id="nx">New problem ▶</button></div>
      <div id="fb" class="fb"></div><div id="sc" class="score"></div></div>`;
    const seg_ = $('#tp', root);
    topics.forEach(t => { const b = el('button', t === topic ? 'on' : '', t); b.onclick = () => { topic = t; [...seg_.children].forEach(x => x.classList.toggle('on', x.textContent === t)); next(); }; seg_.appendChild(b); });
    function next() {
      const pool = PROBS.filter(p => topic === 'All' || p.topic === topic); const p = pick(pool); cur = p.gen(); solved = false;
      $('#q', root).innerHTML = `<span class="tag">${p.topic}</span> ${cur.q}`; $('#un', root).textContent = cur.unit; $('#in', root).value = ''; $('#fb', root).innerHTML = ''; $('#in', root).focus();
    }
    function show() { $('#fb', root).innerHTML = `<div class="box">${cur.sol}<br><b>Answer: ${f2(cur.ans)} ${cur.unit}</b></div>`; }
    $('#chk', root).onclick = () => {
      const x = parseFloat($('#in', root).value); if (isNaN(x)) return; const ok = Math.abs(x - cur.ans) <= 0.02 * Math.abs(cur.ans) + 0.005;
      if (!solved) { tried++; if (ok) score++; solved = true; }
      $('#fb', root).innerHTML = ok ? '<div class="box good">✔ Correct!</div>' : '<div class="box bad">✘ Not quite. Check the signs and the units, or reveal the solution.</div>';
      $('#sc', root).textContent = `Score: ${score} / ${tried}`; if (ok) show();
    };
    $('#in', root).addEventListener('keydown', e => { if (e.key === 'Enter') $('#chk', root).click(); });
    $('#sol', root).onclick = show; $('#nx', root).onclick = next; next();
  }
});
