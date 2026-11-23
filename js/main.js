'use strict';
/* ===== Shell: navigation, routing, keyboard ===== */
(function () {
  const nav = $('#nav'), title = $('#title'), app = $('#app');
  let root = $('#root'), cur = -1;
  function buildNav() {
    nav.innerHTML = '<div class="brand">◐ Optics Studio</div>'; let g = '';
    PAGES.forEach((p, i) => {
      if (p.group !== g) { g = p.group; nav.appendChild(el('div', 'grp', g)); }
      const a = el('a', '', `<span class="num">${i}</span>${p.title}`); a.href = '#/' + p.id; a.dataset.i = i; nav.appendChild(a);
    });
  }
  function renderMath(node) {
    if (!window.renderMathInElement) return;
    try { renderMathInElement(node, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false }); } catch (e) { /* malformed TeX in a dynamic readout: ignore, plain text still shows */ }
  }
  function go(i) {
    i = clamp(i, 0, PAGES.length - 1); cleanups.splice(0).forEach(f => f());
    const root2 = root.cloneNode(false); root.replaceWith(root2); root = root2; window.root = root2; cur = i;
    const p = PAGES[i]; title.textContent = `${i}. ${p.title}`;
    [...nav.querySelectorAll('a')].forEach(a => a.classList.toggle('on', +a.dataset.i === i));
    try { p.build(root2); } catch (e) { root2.innerHTML = '<pre style="color:#ff6b9a;padding:20px">' + e.stack + '</pre>'; console.error(e); }
    renderMath(root2);
    // readouts are regenerated on every slider tick (innerHTML=...); re-typeset math after each change, debounced
    let t = null; const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => renderMath(root2), 50); });
    mo.observe(root2, { childList: true, subtree: true, characterData: true });
    cleanups.push(() => { mo.disconnect(); clearTimeout(t); });
    document.title = p.title + ' – Optics Studio';
  }
  function route() { const [id, arg] = location.hash.replace('#/', '').split('?'); window.pageArg = arg; const i = PAGES.findIndex(p => p.id === id); go(i < 0 ? 0 : i); }
  buildNav();
  const rootRef = () => $('#root');
  window.addEventListener('hashchange', route);
  $('#prev').onclick = () => { location.hash = '#/' + PAGES[clamp(cur - 1, 0, PAGES.length - 1)].id; };
  $('#next').onclick = () => { location.hash = '#/' + PAGES[clamp(cur + 1, 0, PAGES.length - 1)].id; };
  $('#menu').onclick = () => app.classList.toggle('nonav');
  $('#full').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); };
  window.addEventListener('keydown', e => {
    if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && document.activeElement.type !== 'range' && document.activeElement.type !== 'checkbox') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') $('#next').click();
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') $('#prev').click();
    else if (e.key === 'n' || e.key === 'N') $('#menu').click();
    else if (e.key === 'f' || e.key === 'F') $('#full').click();
  });
  route();
})();
