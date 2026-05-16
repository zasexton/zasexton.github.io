/* ---------------------------------------------------------------
   chrome.js — shared site chrome injected on every page.
   Reads `data-sheet` and `data-layer` from <body>, builds:
     • top status bar (with live XY)
     • right command palette (with active link)
     • bottom command prompt
     • tweaks panel
   Persists palette + grid state across pages via localStorage.
--------------------------------------------------------------- */
(function(){
  const SHEET = document.body.dataset.sheet || '01';
  const LAYER = document.body.dataset.layer || 'HOME';

  const NAV = [
    { n: '01', label: 'HOME',      href: 'index.html'        },
    { n: '02', label: 'PROFILE',   href: 'profile.html'      },
    { n: '03', label: 'PARTS',     href: 'capabilities.html' },
    { n: '04', label: 'WORK',      href: 'work.html'         },
    { n: '05', label: 'REVISIONS', href: 'revisions.html'    },
    { n: '06', label: 'PROJECTS',  href: 'projects.html'     },
    { n: '07', label: 'CONTACT',   href: 'contact.html'      }
  ];

  // ---------- read persisted state ----------
  const LS_PAL = 'zs.palette';
  const LS_GRD = 'zs.grid';
  const LS_SHG = 'zs.sheetgrid';
  const root = document.documentElement;

  const palette = localStorage.getItem(LS_PAL) || 'classic';
  const grid    = localStorage.getItem(LS_GRD) || 'on';
  const sheetgrid = localStorage.getItem(LS_SHG) || 'off';

  if (palette !== 'classic') root.setAttribute('data-palette', palette);
  root.setAttribute('data-grid', grid);

  // ---------- apply sheetgrid to any .sheet elements on the page ----------
  function applySheetgrid(v){
    document.querySelectorAll('.sheet').forEach(s => s.dataset.grid = v);
  }
  applySheetgrid(sheetgrid);

  // ---------- top status bar ----------
  const statusbar = document.createElement('header');
  statusbar.className = 'statusbar';
  statusbar.setAttribute('aria-label', 'Status');
  statusbar.innerHTML = `
    <div class="cell"><span class="k">FILE</span><span class="v">PORTFOLIO.DWG</span></div>
    <div class="cell"><span class="k">LAYER</span><span class="v" id="layerName">${LAYER}</span></div>
    <div class="cell"><span class="k">SNAP</span><span class="v on">ON</span></div>
    <div class="cell"><span class="k">ORTHO</span><span class="v on">ON</span></div>
    <div class="cell"><span class="k">GRID</span><span class="v ${grid==='on'?'on':'off'}" id="gridState">${grid.toUpperCase()}</span></div>
    <div class="cell flex"></div>
    <div class="cell right"><span class="k">UNITS</span><span class="v">MM</span></div>
    <div class="cell right" aria-live="off"><span class="k">XY</span><span class="v" id="coords">0000.00, 0000.00</span></div>
  `;
  document.body.insertBefore(statusbar, document.body.firstChild);

  // ---------- right command palette ----------
  const aside = document.createElement('aside');
  aside.className = 'palette';
  aside.setAttribute('aria-label', 'Site navigation');
  aside.innerHTML = `
    <div class="palette__brand">
      <div class="name">ZACHARY SEXTON</div>
      <div class="sub">// COMPUTATIONAL SCI.</div>
    </div>

    <div class="palette__title">— DRAWING SHEETS —</div>
    <ul class="palette__menu" id="navMenu">
      ${NAV.map(item => `
        <li><a href="${item.href}" class="${item.n === SHEET ? 'is-active' : ''}">
          <span>${item.label}</span><span class="num">${item.n}</span>
        </a></li>`).join('')}
    </ul>

    <div class="palette__divider"></div>

    <div class="palette__title">— LAYERS —</div>
    <div class="palette__layers">
      <div class="row cyan">    <span class="swatch"></span><span class="label">FLOW</span>      <span class="vis">ON</span></div>
      <div class="row red">     <span class="swatch"></span><span class="label">THERMAL</span>   <span class="vis">ON</span></div>
      <div class="row yellow">  <span class="swatch"></span><span class="label">STRUCT</span>    <span class="vis">ON</span></div>
      <div class="row magenta"> <span class="swatch"></span><span class="label">TRANSPORT</span> <span class="vis">ON</span></div>
      <div class="row green">   <span class="swatch"></span><span class="label">BIOMECH</span>   <span class="vis">ON</span></div>
      <div class="row white">   <span class="swatch"></span><span class="label">DIM</span>       <span class="vis">ON</span></div>
    </div>

    <div class="palette__foot">
      REV. 2026.05<br>
      SCALE 1:1<br>
      SHEET ${SHEET} / 07
    </div>
  `;
  document.body.appendChild(aside);

  // ---------- bottom command prompt ----------
  const cmdbar = document.createElement('footer');
  cmdbar.className = 'cmdbar';
  cmdbar.setAttribute('aria-label', 'Command prompt');
  cmdbar.innerHTML = `
    <span class="prompt">Command:</span>
    <span id="cmd">_</span>
    <span class="caret"></span>
    <span class="hint">
      <kbd>←</kbd><kbd>→</kbd> sheets &nbsp; • &nbsp;
      <kbd>T</kbd> tweaks &nbsp; • &nbsp;
      <kbd>G</kbd> grid
    </span>
  `;
  document.body.appendChild(cmdbar);

  // ---------- tweaks panel ----------
  const tweaks = document.createElement('div');
  tweaks.className = 'tweaks';
  tweaks.id = 'tweaks';
  const isOn = (k, v) => k === v ? 'is-on' : '';
  tweaks.innerHTML = `
    <div class="tweaks__head">
      <span>— TWEAKS —</span>
      <button id="tweaksClose" aria-label="Close tweaks">×</button>
    </div>
    <div class="tweaks__body">
      <div class="tweaks__row">
        <label>PALETTE</label>
        <div class="tweaks__seg" data-key="palette">
          <button data-val="classic"  class="${isOn(palette,'classic')}">CLASSIC</button>
          <button data-val="blueprint" class="${isOn(palette,'blueprint')}">BLUE</button>
          <button data-val="mono"     class="${isOn(palette,'mono')}">MONO</button>
        </div>
      </div>
      <div class="tweaks__row">
        <label>GRID</label>
        <div class="tweaks__seg" data-key="grid">
          <button data-val="on"  class="${isOn(grid,'on')}">ON</button>
          <button data-val="off" class="${isOn(grid,'off')}">OFF</button>
        </div>
      </div>
      <div class="tweaks__row">
        <label>SHEET GRID</label>
        <div class="tweaks__seg" data-key="sheetgrid">
          <button data-val="off" class="${isOn(sheetgrid,'off')}">OFF</button>
          <button data-val="on"  class="${isOn(sheetgrid,'on')}">ON</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(tweaks);

  // ---------- behavior ----------
  // live coords
  const out = document.getElementById('coords');
  window.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = window.innerHeight - e.clientY;
    out.textContent =
      String(x).padStart(4, '0') + '.00, ' +
      String(y).padStart(4, '0') + '.00';
  }, { passive: true });

  // tweaks open/close + toolbar protocol
  const closeBtn = document.getElementById('tweaksClose');
  window.addEventListener('message', (e) => {
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.type === '__activate_edit_mode')   tweaks.classList.add('is-open');
    if (e.data.type === '__deactivate_edit_mode') tweaks.classList.remove('is-open');
  });
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch(_) {}

  closeBtn.addEventListener('click', () => {
    tweaks.classList.remove('is-open');
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch(_) {}
  });

  function applyPalette(val) {
    if (val === 'classic') root.removeAttribute('data-palette');
    else root.setAttribute('data-palette', val);
    localStorage.setItem(LS_PAL, val);
  }
  function applyGrid(val) {
    root.setAttribute('data-grid', val);
    const el = document.getElementById('gridState');
    el.textContent = val.toUpperCase();
    el.classList.toggle('on',  val === 'on');
    el.classList.toggle('off', val === 'off');
    localStorage.setItem(LS_GRD, val);
  }
  function applySG(val) {
    applySheetgrid(val);
    localStorage.setItem(LS_SHG, val);
  }

  document.querySelectorAll('.tweaks__seg').forEach(seg => {
    const key = seg.dataset.key;
    seg.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-val]');
      if (!btn) return;
      seg.querySelectorAll('button').forEach(b => b.classList.toggle('is-on', b === btn));
      const v = btn.dataset.val;
      if (key === 'palette')   applyPalette(v);
      if (key === 'grid')      applyGrid(v);
      if (key === 'sheetgrid') applySG(v);
    });
  });

  // keyboard shortcuts: T = tweaks, G = grid, ← → = prev/next sheet
  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input,textarea')) return;
    if (e.key === 't' || e.key === 'T') {
      tweaks.classList.toggle('is-open');
    }
    if (e.key === 'g' || e.key === 'G') {
      applyGrid(root.getAttribute('data-grid') === 'off' ? 'on' : 'off');
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const idx = NAV.findIndex(n => n.n === SHEET);
      if (idx < 0) return;
      const next = e.key === 'ArrowRight'
        ? NAV[Math.min(NAV.length - 1, idx + 1)]
        : NAV[Math.max(0, idx - 1)];
      if (next && next.n !== SHEET) location.href = next.href;
    }
  });
})();
