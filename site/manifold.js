/* ---------------------------------------------------------------
   manifold.js — animated tensor field on a deforming saddle.
   Surface:  z = (a/2) · (x² − y²),  a = cos(ωt)  ∈ [−1, 1]
   • a = +1 : saddle (positive curvature along x, negative along y)
   • a =  0 : flat plane
   • a = −1 : inverted saddle
   Hessian = diag(+a, −a).  Principal directions stay along x and y
   throughout; their magnitudes (and the surface they lie on) breathe.
--------------------------------------------------------------- */
(function(){
  const svg = document.getElementById('iso-svg');
  if (!svg) return;

  const NS = 'http://www.w3.org/2000/svg';
  const cx = 300, cy = 270, S = 105;
  const C30 = Math.cos(Math.PI/6), S30 = Math.sin(Math.PI/6);
  const proj = (x,y,z) => [ cx + (x - y) * C30 * S, cy + (x + y) * S30 * S - z * S ];

  let A = 1;                                          // current amplitude
  const zF   = (x, y)    => 0.5 * A * (x*x - y*y);
  const dzdx = (x, y)    => A * x;
  const dzdy = (x, y)    => -A * y;

  const mk = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };
  const toPath = pts => pts.map((p,i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

  // -------- ISO AXES (static) --------
  const axes = document.getElementById('iso-axes');
  const O = proj(0,0,0);
  [['+X', proj(1.45,0,0), 0],
   ['+Y', proj(0,1.45,0), 1],
   ['+Z', proj(0,0,1.05), 2]].forEach(([lbl, p, kind]) => {
    axes.appendChild(mk('line', {
      x1:O[0], y1:O[1], x2:p[0], y2:p[1],
      stroke:'var(--dim)', 'stroke-width':'0.8',
      'stroke-dasharray':'4 4', fill:'none'
    }));
    const t = mk('text', {
      x: p[0] + (kind===1 ? -8 : 6),
      y: p[1] + (kind===2 ? 0 : 12),
      fill:'var(--dim)', 'font-family':'JetBrains Mono', 'font-size':'10',
      'letter-spacing':'1', 'text-anchor': kind===1?'end':'start'
    });
    t.textContent = lbl;
    axes.appendChild(t);
  });

  // -------- TANGENT PLANE at origin (always xy-plane, ∇z(0)=0) --------
  const tangent = document.getElementById('iso-tangent');
  const tpR = 0.55;
  const tpCorners = [proj(-tpR,-tpR,0), proj(tpR,-tpR,0), proj(tpR,tpR,0), proj(-tpR,tpR,0)];
  tangent.appendChild(mk('polygon', {
    points: tpCorners.map(p => p.join(',')).join(' '),
    fill:'var(--white)', 'fill-opacity':'0.04',
    stroke:'var(--white)', 'stroke-width':'0.6',
    'stroke-dasharray':'3 3'
  }));

  // -------- ORIGIN MARKER (static; gradient is always zero at origin) --------
  const origin = document.getElementById('iso-origin');
  origin.appendChild(mk('circle', { cx:O[0], cy:O[1], r:5, stroke:'var(--white)', 'stroke-width':1.2, fill:'var(--bg)' }));
  origin.appendChild(mk('line',   { x1:O[0]-7, y1:O[1], x2:O[0]+7, y2:O[1], stroke:'var(--white)', 'stroke-width':1 }));
  origin.appendChild(mk('line',   { x1:O[0], y1:O[1]-7, x2:O[0], y2:O[1]+7, stroke:'var(--white)', 'stroke-width':1 }));
  const pLbl = mk('text', { x:O[0]+10, y:O[1]+14, fill:'var(--white)', 'font-family':'JetBrains Mono', 'font-size':'10' });
  pLbl.textContent = 'p₀';
  origin.appendChild(pLbl);

  // -------- MANIFOLD WIREFRAME --------
  const N = 16;
  const mesh = document.getElementById('iso-mesh');
  const uPaths = [], vPaths = [];
  for (let i = 0; i <= N; i++) {
    const heavy = (i % 4 === 0);
    const p = mk('path', {
      stroke:'var(--cyan)', fill:'none',
      'stroke-width': heavy ? '1.2' : '0.55',
      opacity: heavy ? '0.95' : '0.45'
    });
    mesh.appendChild(p); uPaths.push(p);
  }
  for (let j = 0; j <= N; j++) {
    const heavy = (j % 4 === 0);
    const p = mk('path', {
      stroke:'var(--cyan)', fill:'none',
      'stroke-width': heavy ? '1.2' : '0.55',
      opacity: heavy ? '0.95' : '0.45'
    });
    mesh.appendChild(p); vPaths.push(p);
  }

  // -------- PRINCIPAL CURVES through origin --------
  const accents = document.getElementById('iso-accents');
  const ridge1 = mk('path', { stroke:'var(--magenta)', fill:'none', 'stroke-width':'1.8' });
  const ridge2 = mk('path', { stroke:'var(--magenta)', fill:'none', 'stroke-width':'1.8' });
  accents.appendChild(ridge1); accents.appendChild(ridge2);

  // -------- TENSOR GLYPHS at sample points --------
  const glyphs = document.getElementById('iso-glyphs');
  const step = 2, halfL = 0.075;
  const glyphRefs = [];   // each: { x, y, uLine, vLine, dot }
  for (let i = step; i <= N - step; i += step) {
    for (let j = step; j <= N - step; j += step) {
      const x = -1 + 2*i/N, y = -1 + 2*j/N;
      const u = mk('line', { stroke:'var(--red)',    'stroke-width':'1.1', 'stroke-linecap':'round' });
      const v = mk('line', { stroke:'var(--yellow)', 'stroke-width':'1.1', 'stroke-linecap':'round' });
      const d = mk('circle', { r:'1.1', fill:'var(--white)' });
      glyphs.appendChild(u); glyphs.appendChild(v); glyphs.appendChild(d);
      glyphRefs.push({ x, y, u, v, d });
    }
  }

  // -------- UPDATE: recompute geometry from current A --------
  function setLine(el, p0, p1) {
    el.setAttribute('x1', p0[0].toFixed(1)); el.setAttribute('y1', p0[1].toFixed(1));
    el.setAttribute('x2', p1[0].toFixed(1)); el.setAttribute('y2', p1[1].toFixed(1));
  }
  function update() {
    // mesh
    const P = [];
    for (let i = 0; i <= N; i++) {
      const row = [];
      for (let j = 0; j <= N; j++) {
        const x = -1 + 2*i/N, y = -1 + 2*j/N;
        row.push(proj(x, y, zF(x,y)));
      }
      P.push(row);
    }
    for (let i = 0; i <= N; i++) uPaths[i].setAttribute('d', toPath(P[i]));
    for (let j = 0; j <= N; j++) vPaths[j].setAttribute('d', toPath(P.map(r => r[j])));

    // principal curves (through origin)
    const r1 = [], r2 = [];
    const M = 80;
    for (let k = 0; k <= M; k++) {
      const t = -1 + 2*k/M;
      r1.push(proj(t, 0, zF(t, 0)));    // y = 0 (valley/ridge along x)
      r2.push(proj(0, t, zF(0, t)));    // x = 0 (ridge/valley along y)
    }
    ridge1.setAttribute('d', toPath(r1));
    ridge2.setAttribute('d', toPath(r2));

    // glyphs (tangent vectors on surface, normalized)
    for (const g of glyphRefs) {
      const { x, y, u, v, d } = g;
      const zc = zF(x,y);
      // u-direction: (1, 0, dz/dx)
      const dux = dzdx(x,y);
      const nu = Math.hypot(1, 0, dux);
      const ux = halfL / nu, uy = 0, uz = halfL * dux / nu;
      const u0 = proj(x-ux, y-uy, zc-uz);
      const u1 = proj(x+ux, y+uy, zc+uz);
      setLine(u, u0, u1);

      // v-direction: (0, 1, dz/dy)
      const dvy = dzdy(x,y);
      const nv = Math.hypot(0, 1, dvy);
      const vx = 0, vy = halfL / nv, vz = halfL * dvy / nv;
      const v0 = proj(x-vx, y-vy, zc-vz);
      const v1 = proj(x+vx, y+vy, zc+vz);
      setLine(v, v0, v1);

      const [px, py] = proj(x, y, zc);
      d.setAttribute('cx', px.toFixed(1));
      d.setAttribute('cy', py.toFixed(1));
    }
  }

  // -------- ANIMATION LOOP --------
  // Period 14s.  Soft easing on the cosine wave keeps the surface lingering
  // at the extremes; observers register the "saddle" frames longer than the
  // flat frames.
  const W = 2 * Math.PI / 14;
  const t0 = performance.now();
  let running = true;

  function frame() {
    if (!running) return;
    const t = (performance.now() - t0) / 1000;
    A = Math.cos(t * W);
    update();
    requestAnimationFrame(frame);
  }

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else if (!running) { running = true; requestAnimationFrame(frame); }
  });

  update();              // first frame immediately
  requestAnimationFrame(frame);
})();
